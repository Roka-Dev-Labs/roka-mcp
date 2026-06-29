# roka-mcp

[![Website](https://img.shields.io/badge/Website-roka--prune.com-blue)](https://roka-prune.com)
[![License](https://img.shields.io/badge/License-MIT-green)](https://opensource.org/licenses/MIT)

> **MCP integration for [Roka](https://roka-prune.com) — connect Cursor, Claude Code, Codex, or Copilot to prune logs inside your agent.**

Part of [Roka Dev Labs](https://github.com/Roka-Dev-Labs). Install the [CLI](https://github.com/Roka-Dev-Labs/roka) separately for local pruning.

## Pro required

MCP is a **Pro** feature. Sign up at [roka-prune.com](https://roka-prune.com), create an API key in the [dashboard](https://roka-prune.com/dashboard/api-keys.html), then:

```bash
export ROKA_API_KEY=rk_live_...
npx roka-mcp connect --agent cursor
```

Supported agents: **Claude Code**, **Cursor**, **Codex**, **Copilot**, **Windsurf**, **VS Code**, **Cline**.

## Install

```bash
npm install -g roka-mcp
# or one-shot:
npx roka-mcp connect --agent cursor --api-key rk_live_...
```

> Package source is not published in this repository. Install from npm when released, or contact [support@roka-prune.com](mailto:support@roka-prune.com) for early access.

## What it does

Roka runs as an MCP server next to your dev environment, watching logs in real time. On crash patterns (ERROR, FATAL, panic, …) it runs the same prune pipeline — collapse repetition, preserve the exception, rank, pack to budget — and hands your agent exactly the slice of context needed to debug.

## Tools

| Tool | Description |
|------|-------------|
| `prune_logs` | Prune raw log text |
| `prune_file` | Prune a log file by path |
| `prune_tail` | Prune the last N lines of a live log |

## Watch mode

```bash
npx roka-mcp watch ./logs/dev.log --on-crash
```

On crash, Roka writes pruned context to `.roka/crash-context.txt`.

## API

Pruning runs on the hosted API (`https://api.roka-prune.com`). Override with `ROKA_API_URL` if needed.

## Other Roka projects

| Repo | Description |
|------|-------------|
| [roka](https://github.com/Roka-Dev-Labs/roka) | CLI — prune logs, code, docs locally |
| [roka-mcp](https://github.com/Roka-Dev-Labs/roka-mcp) | MCP server — this repository |
| [Roka Dev Labs](https://github.com/Roka-Dev-Labs) | Org profile — website, dashboard, API |

## Links

- [Website](https://roka-prune.com)
- [Pricing](https://roka-prune.com/#pricing)
- [CLI install](https://github.com/Roka-Dev-Labs/roka#install)
- [Support](mailto:support@roka-prune.com)

## License

MIT — see [LICENSE](LICENSE).
