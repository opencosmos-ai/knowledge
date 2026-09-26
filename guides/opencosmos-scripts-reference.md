---
title: "OpenCosmos Scripts Reference"
role: guide
format: manual
domain: opencosmos
corpus_tier: source
tags: [scripts, cli, terminal, automation, knowledge-management, publishing, health, byok, cosmo]
audience: [engineer, creator, general]
complexity: foundational
summary: >
  Reference guide for the OpenCosmos automation scripts, which since September 2026 span
  two repositories: the corpus toolchain in opencosmos-ai/knowledge and the application
  scripts in opencosmos-ai/opencosmos. Covers what scripts are, how to run them from
  Terminal, and full usage for each — knowledge publication, corpus health, Cosmo voice
  testing, and BYOK diagnostics.
curated_at: 2026-04-11
updated_at: 2026-09-18
curator: shalom
source: original
related_docs:
  - guides/opencosmos-knowledge-publish-workflow.md
  - guides/opencosmos-knowledge-health-report.md
  - guides/opencosmos-knowledge-formatting-guide.md
  - guides/opencosmos-knowledge-graph.md
---

# OpenCosmos Scripts Reference

Automation scripts live in a `scripts/` directory at a repository root. **Since September 2026 there are two such repositories**, and which you need depends on what you are doing:

| Repository | Holds | Run with |
|---|---|---|
| [opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge) | The corpus toolchain — publication, health, graphs, embedding, the quote pipeline | `npm run …` |
| [opencosmos-ai/opencosmos](https://github.com/opencosmos-ai/opencosmos) | The application scripts — Cosmo voice test, BYOK diagnostic, ADR index | `pnpm …` |

The convention is to check both out as siblings, so `../knowledge` from the applications repository reaches the corpus. This guide explains what the scripts are, how to run them, and what each one does.

---

## What Is a Script?

A script is a program you run from your terminal to automate a task. Instead of clicking through a UI, you type a command and the script does the work — generating metadata, publishing files, checking for broken links, syncing to hardware, or querying a database.

In both repositories, scripts are TypeScript files run by [`tsx`](https://github.com/privatenumber/tsx), a tool that executes TypeScript directly without a separate compilation step. Most have a named shorthand registered in `package.json` — invoked with `npm run` in the corpus repository and `pnpm` in the applications repository. A few are run directly with `pnpm tsx`.

---

## How to Open Terminal and Navigate to the Repo

On macOS, open Terminal with `Cmd + Space`, type "Terminal", and press Enter. Alternatively, open it from Finder: **Applications → Utilities → Terminal**.

Once Terminal is open, navigate to the repo:

```bash
cd ~/Developer/opencosmos
```

Commands in this guide run from the root of whichever repository owns the script — `npm run …` in `knowledge/`, `pnpm …` in `opencosmos/`. If you see an error like "command not found: pnpm", install it with:

```bash
npm install -g pnpm
```

---

## How pnpm Scripts Work

`pnpm` is the package manager for the applications repository; the corpus repository uses plain `npm`. It provides two ways to run scripts:

**Named scripts** — shortcuts defined in `package.json`:

```bash
npm run health
npm run publish-doc
```

**Direct execution** — for scripts without a named shorthand:

```bash
pnpm tsx scripts/test-cosmo-voice.ts "your question here"
pnpm tsx scripts/check-byok-flags.ts
```

`tsx` runs a TypeScript file directly. Think of it as "node, but for TypeScript."

---

## Where Scripts Live

```
knowledge/                          # the corpus and its toolchain
└── scripts/
    ├── knowledge-health.ts         # npm run health
    ├── publish-knowledge.ts        # npm run publish-doc
    ├── knowledge/
    │   ├── embed-knowledge.ts      # npm run embed
    │   ├── generate-wiki-graph.ts  # npm run graph
    │   ├── generate-constellation-graph.ts   # npm run graph:constellation
    │   ├── groom.py                # the /groom processor
    │   ├── shared.ts               # constants, types, corpus scanner
    │   ├── frontmatter.ts          # Claude API frontmatter generation
    │   └── git.ts                  # safe git operations
    └── normalize-quotes/           # the quote pipeline — npm run quotes:*

opencosmos/                         # the applications
└── scripts/
    ├── test-cosmo-voice.ts         # pnpm tsx scripts/test-cosmo-voice.ts
    ├── check-byok-flags.ts         # pnpm tsx scripts/check-byok-flags.ts
    ├── adr-index.ts                # pnpm adr:index
    └── iching-check.ts             # pnpm xenso:check-iching
```

`shared.ts`, `frontmatter.ts` and `git.ts` are library modules used internally by the scripts above; they are not directly runnable. Cosmo's constitutional documents live in a third repository, [opencosmos-ai/cosmo](https://github.com/opencosmos-ai/cosmo), which embeds its own kaizen practice.

---

## Script Reference

### `npm run health` — Corpus Health Report

Prints a full health report of the knowledge corpus. Run this to understand the current state of the corpus at a glance, or to find problems before they accumulate.

**What it checks:**

| Section | What it shows |
|---------|---------------|
| Overview | Document count, active domains, total cross-references, graph density |
| Domain Coverage | How many documents exist per domain (bar chart) |
| Role Coverage | Count per role — flags if any role has zero documents |
| Foundation Collection Progress | Checklist completion % for each AI Triad foundation collection |
| Cross-Reference Integrity | Broken `related_docs` entries in frontmatter |
| Islands | Documents with no incoming or outgoing connections |
| Import Priority | Top texts to add next, scored by collection demand |
| Broken Body Links | Inline markdown links in document bodies that resolve to nothing |

**Usage:**

```bash
npm run health
```

No flags. Run it any time to get the full picture.

**What "Broken Body Links" catches:** Inline markdown links in the body of any knowledge document where the target file does not exist. Handles both site-absolute paths (`/guides/foo`) and relative `.md` links. Skips `incoming/`, external URLs, and anchor-only links. This is the check that caught the broken link in `opencosmos-skills-reference.md` (a bare filename used instead of the correct route).

**Source:** `scripts/knowledge-health.ts`

---

### `npm run publish-doc` — Knowledge Publication CLI

The primary tool for adding new documents to the corpus. It handles frontmatter generation, review, file placement, curation logging, collection auto-linking, and git operations — all in one command.

**Typical workflow:**

```bash
# Drop a raw text file into the staging area
pbpaste > incoming/my-document.md

# Run the CLI — Claude generates all metadata
npm run publish-doc

# Review the proposed frontmatter, accept or edit it, done.
```

If no file is specified, the CLI automatically discovers all `.md` files in `incoming/`.

**What it does, step by step:**

1. Reads the document content
2. Calls the Claude API to generate enriched frontmatter (title, role, format, domain, tags, audience, complexity, summary, author, era, tradition)
3. Presents the frontmatter for your review — accept, open in `$EDITOR`, or cancel
4. Suggests cross-references based on tag and domain overlap with existing corpus
5. Writes the document to `{role}s/{domain}-{slug}.md`
6. Appends to `CURATION_LOG.md`
7. Checks off matching placeholders in foundation collection files
8. Creates a git branch, commits, and pushes (optionally opens a PR)
9. Cleans up the source file from `incoming/`

**Flags:**

| Flag | Effect |
|------|--------|
| `--role <role>` | Pre-set the document role (`source`, `commentary`, `guide`, etc.) |
| `--domain <domain>` | Pre-set the domain (`philosophy`, `buddhism`, `opencosmos`, etc.) |
| `--accept` | Accept Claude's frontmatter without interactive review |
| `--dry-run` | Preview everything without writing, committing, or pushing |
| `--no-push` | Commit locally but do not push to remote |
| `--no-clean` | Keep source files in `incoming/` after publishing |
| `--pr` | Automatically create a GitHub PR after pushing |
| `--branch <name>` | Custom git branch name |

**Examples:**

```bash
npm run publish-doc --accept                          # auto-import from incoming/, no review
npm run publish-doc --dry-run                         # preview without writing anything
npm run publish-doc ~/drafts/dhammapada.md --role source --domain buddhism
npm run publish-doc ~/drafts/*.md --accept --pr       # batch import with auto PR
```

**Requires:** `ANTHROPIC_API_KEY` in `.env` (for frontmatter generation). Without it, the CLI falls back to manual mode.

**Source:** `scripts/publish-knowledge.ts`

---

### `pnpm tsx scripts/test-cosmo-voice.ts` — Cosmo Voice Test

Sends a question to Claude using `COSMO_SYSTEM_PROMPT.md` as the system prompt. Use this to feel Cosmo's voice in response to a specific prompt — to evaluate tone, test a system prompt edit, or sanity-check a response before shipping.

**Usage:**

```bash
pnpm tsx scripts/test-cosmo-voice.ts "What is the meaning of life?"
pnpm tsx scripts/test-cosmo-voice.ts "I'm feeling lost. Where do I start?"
pnpm tsx scripts/test-cosmo-voice.ts "Explain the relationship between impermanence and creativity."
```

**Output:** Cosmo's response, followed by token usage (`N in / N out`).

**What it uses:** `apps/web/.content/cosmo/COSMO_SYSTEM_PROMPT.md` as the system prompt — fetched from [opencosmos-ai/cosmo](https://github.com/opencosmos-ai/cosmo) by `pnpm --filter web content`, so run that first. Prompt caching is enabled for the system prompt.

**Requires:** `ANTHROPIC_API_KEY` in `.env`.

**Source:** `scripts/test-cosmo-voice.ts`

---

### `pnpm tsx scripts/check-byok-flags.ts` — BYOK Flag Diagnostic

Scans Upstash Redis for all `cosmo_byok:v1:*` keys and prints their values and TTLs. A debug tool for diagnosing BYOK (Bring Your Own Key) sync issues — use it when a user reports their API key isn't being recognized across devices.

**Usage:**

```bash
dotenv -e apps/web/.env.local -- pnpm tsx scripts/check-byok-flags.ts
```

Note the `dotenv -e apps/web/.env.local --` prefix — this injects the Redis credentials from the web app's local env. Without it, the script will error.

**Output:** For each BYOK flag found: the Redis key, value, TTL in seconds, and approximate days remaining. If no flags are found, prints a diagnostic message explaining what that means (no write path has ever succeeded for any user).

**Requires:** `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from `apps/web/.env.local`.

**Source:** `scripts/check-byok-flags.ts`

---

## Environment Variables

Most scripts read from a `.env` file at their own repository root. Create one if it doesn't exist:

```
ANTHROPIC_API_KEY=sk-ant-...
```

`check-byok-flags.ts` reads from `apps/web/.env.local` instead (injected via the `dotenv` prefix).

---

## Quick Reference

| Task | Command |
|------|---------|
| Check corpus health and broken links | `npm run health` |
| Publish documents from `incoming/` | `npm run publish-doc --accept` |
| Publish a specific file | `npm run publish-doc path/to/file.md` |
| Preview a publish without writing | `npm run publish-doc --dry-run` |
| Test Cosmo's voice | `pnpm tsx scripts/test-cosmo-voice.ts "question"` |
| Debug BYOK flags in Redis | `dotenv -e apps/web/.env.local -- pnpm tsx scripts/check-byok-flags.ts` |
