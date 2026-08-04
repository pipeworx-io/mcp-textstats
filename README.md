# mcp-textstats

Text statistics & readability MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `text_stats` | Compute text statistics (keyless, offline): character counts (with/without spaces), word/sentence/paragraph counts, estimated reading time (200 wpm), average word length, and the longest word. |
| `readability` | Compute readability scores (keyless, offline): Flesch Reading Ease (0-100, higher = easier) and Flesch-Kincaid Grade Level, with the underlying word/sentence/syllable counts. Uses a syllable-estimation heuristic. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "textstats": {
      "url": "https://gateway.pipeworx.io/textstats/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Textstats data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
