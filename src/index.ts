interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Text statistics & readability MCP.
 *
 * Keyless, offline: counts (characters, words, sentences, paragraphs, reading
 * time) and readability scores (Flesch Reading Ease + Flesch-Kincaid Grade
 * Level, using a syllable-estimation heuristic). Pure functions — no API, no key.
 */


function wordsOf(t: string): string[] { return t.trim().split(/\s+/).filter(Boolean); }
function sentencesOf(t: string): number { return (t.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || []).filter((s) => s.trim()).length || (t.trim() ? 1 : 0); }
function syllables(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const m = w.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

const tools: McpToolExport['tools'] = [
  {
    name: 'text_stats',
    description: 'Compute text statistics (keyless, offline): character counts (with/without spaces), word/sentence/paragraph counts, estimated reading time (200 wpm), average word length, and the longest word.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'The text to analyze.' } }, required: ['text'] },
  },
  {
    name: 'readability',
    description: 'Compute readability scores (keyless, offline): Flesch Reading Ease (0-100, higher = easier) and Flesch-Kincaid Grade Level, with the underlying word/sentence/syllable counts. Uses a syllable-estimation heuristic.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'The text to score.' } }, required: ['text'] },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const text = str(args, 'text');
  const words = wordsOf(text);
  switch (name) {
    case 'text_stats': {
      const longest = words.reduce((a, b) => (b.replace(/[^\w]/g, '').length > a.length ? b.replace(/[^\w]/g, '') : a), '');
      const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length || (text.trim() ? 1 : 0);
      return {
        characters: text.length,
        characters_no_spaces: text.replace(/\s/g, '').length,
        words: words.length,
        sentences: sentencesOf(text),
        paragraphs,
        reading_time_minutes: +(words.length / 200).toFixed(2),
        avg_word_length: words.length ? +(words.join('').length / words.length).toFixed(2) : 0,
        longest_word: longest || null,
      };
    }
    case 'readability': {
      const nW = words.length, nS = Math.max(1, sentencesOf(text)), nSyl = words.reduce((a, w) => a + syllables(w), 0);
      if (nW === 0) return { error: 'No words to analyze.' };
      const wps = nW / nS, spw = nSyl / nW;
      const flesch = 206.835 - 1.015 * wps - 84.6 * spw;
      const fkGrade = 0.39 * wps + 11.8 * spw - 15.59;
      const ease = Math.round(flesch * 10) / 10;
      const band = ease >= 90 ? 'very easy' : ease >= 70 ? 'easy' : ease >= 60 ? 'standard' : ease >= 50 ? 'fairly difficult' : ease >= 30 ? 'difficult' : 'very difficult';
      return { words: nW, sentences: nS, syllables: nSyl, words_per_sentence: +wps.toFixed(2), syllables_per_word: +spw.toFixed(2), flesch_reading_ease: ease, reading_ease_band: band, flesch_kincaid_grade: Math.round(fkGrade * 10) / 10 };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function str(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== 'string' || v.length === 0) throw new Error(`Required argument "${key}" is missing (a non-empty string).`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
