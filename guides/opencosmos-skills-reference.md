---
title: "OpenCosmos Claude Code Skills — Reference"
role: guide
format: manual
domain: opencosmos
corpus_tier: source
tags: [skills, claude-code, tooling, workflow, knowledge-base, ui, wiki]
audience: [creator, engineer]
complexity: foundational
summary: >-
  Complete reference for the eleven Claude Code skills in the OpenCosmos
  applications repository. Covers the git workflow skills (/pr, /clean,
  /git-sync), the building skills (/create, /inference-cost), and the six that
  operate on the knowledge corpus (/groom, /new-quote, /knowledge-compile,
  /knowledge-review, /knowledge-lookup, /standardize-knowledge).
curated_at: 2026-04-10
updated_at: 2026-09-18
curator: shalom
source: original
related_docs:
  - guides/opencosmos-knowledge-tooling-overview.md
  - guides/opencosmos-knowledge-wiki-workflow.md
  - guides/opencosmos-knowledge-formatting-guide.md
---

# OpenCosmos Claude Code Skills — Reference

Skills are invocable AI workflows defined in `.claude/skills/`. Each is a directory containing a `SKILL.md` that gives Claude a focused set of instructions for one task. Invoke any of them with `/skill-name [args]` in a Claude Code session.

That directory path is not a filing preference — it is where Claude Code *discovers* skills. A skill moved elsewhere stops being invocable.

> **Two repositories.** All eleven skills live in
> [opencosmos-ai/opencosmos](https://github.com/opencosmos-ai/opencosmos), which
> is where you invoke them. Six of them *operate on* the corpus, which lives in
> [opencosmos-ai/knowledge](https://github.com/opencosmos-ai/knowledge) — the
> repository you are reading this in. Those six expect a sibling checkout at
> `../knowledge` and run its scripts with `npm`, not `pnpm`. The corpus left the
> monorepo in September 2026; anything below describing a single repository is
> describing the past.

## Skill Index

| Skill | Category | What it does |
|-------|----------|-------------|
| [`/pr`](#pr) | Git | Package unmerged work into a branch, changelog entry and pull request |
| [`/clean`](#clean) | Git | Delete provably-merged local branches, flag the rest, sync to default |
| [`/git-sync`](#git-sync) | Git | Fetch, rebuild a merged branch from the default, prune stale refs |
| [`/create`](#create) | Building | Build UI using `@opencosmos/ui` exclusively |
| [`/inference-cost`](#inference-cost) | Building | View and edit which Claude model each Cosmo surface runs on |
| [`/groom`](#groom) | Corpus | Format raw text in `incoming/` for corpus publication |
| [`/new-quote`](#new-quote) | Corpus | Add quotes — parse, dedupe, validate provenance, route to a pool |
| [`/knowledge-compile`](#knowledge-compile) | Corpus · wiki | Compile durable insights to the knowledge wiki |
| [`/knowledge-review`](#knowledge-review) | Corpus · wiki | Run a wiki health check |
| [`/knowledge-lookup`](#knowledge-lookup) | Corpus · wiki | Search the wiki before starting domain work |
| [`/standardize-knowledge`](#standardize-knowledge) | Corpus | Normalise headings so RAG chunking stays reliable |

---

## /pr

**Category:** Git — **Skill file:** `.claude/skills/pr/SKILL.md`

Packages the repository's current unmerged work — uncommitted changes, staged changes, and any commits on the branch not yet in an open PR — into a pushed branch, a `CHANGELOG.md` entry where the repo keeps one, and an open pull request describing the work.

Use it when asked to open a PR or ship something, or at the natural end of a unit of work before starting something unrelated.

```
/pr                  # package everything outstanding
/pr --no-changelog   # skip the CHANGELOG entry
```

---

## /clean

**Category:** Git — **Skill file:** `.claude/skills/clean/SKILL.md`

The follow-up to `/pr` once its pull request has merged. Audits every local branch against the freshly fetched default branch, deletes those whose work is provably merged, and **flags rather than deletes** anything carrying unmerged commits.

It is local-only: it never pushes, force-pushes, or deletes a branch on `origin`. It halts on a dirty working tree rather than stashing, and never uses `git branch -D` without explicit confirmation.

```
/clean             # audit, delete what is safe, report the rest
/clean --dry-run   # print the plan and stop
```

Squash-merges matter here: `git branch --merged` misses them because the original commits never become ancestors of the default branch, so the skill asks GitHub directly rather than trusting ancestry alone.

---

## /git-sync

**Category:** Git — **Skill file:** `.claude/skills/git-sync/SKILL.md`

Syncs a working copy with its remote: fetch, detect whether the current branch's PR has already merged, rebuild the branch from the latest default branch when it has, and prune stale local branches and remote-tracking refs.

Use at the start of work in any repo, after opening a PR that might merge quickly, or when a git command errors on a ref that *should* exist.

```
/git-sync                # full sync
/git-sync --prune-only   # just prune stale refs
```

---

## /create

**Category:** Building — **Skill file:** `.claude/skills/create/SKILL.md`

Builds UI for OpenCosmos applications using `@opencosmos/ui` components. Never writes custom HTML, custom CSS, or bespoke JSX when a library component exists.

### What it does

Reads `$ARGUMENTS` as a description of what to build, selects the appropriate components from the `@opencosmos/ui` component API, and produces correct, token-compliant UI code.

If a required component doesn't exist in `@opencosmos/ui`, the skill stops and asks whether to add it to the design system — it does not build bespoke one-offs without explicit authorization.

### Invocation

```
/create <brief description of what to build>
```

Examples:
```
/create hero section with a centered tagline and two CTA buttons
/create sidebar navigation with collapsible sections
/create a document outline rail that hides below the lg breakpoint
```

### Core rules

- **Design tokens only** — `bg-background text-foreground border-border`, never hardcoded hex or Tailwind palette classes
- **Component-first** — check the library before writing anything custom
- **Motion gated** — all animations use `useMotionPreference()` from `@opencosmos/ui/hooks`
- **`cn()` for conditional classes** — never string-concatenate Tailwind classes

### Key components

| You want... | Component |
|-------------|-----------|
| Sticky navbar | `Header` |
| Scrollable area | `ScrollArea` |
| Text input | `Input` |
| CTA button | `Button` (variants: `default`, `outline`, `ghost`, `link`) |
| Status pill | `Badge` |
| Alert / info box | `Alert` + `AlertTitle` + `AlertDescription` |
| Modal | `Dialog` |
| Side drawer | `Sheet` |
| Content card | `Card` |
| Loading state | `Spinner`, `Skeleton`, `Progress` |
| App root wrapper | `ThemeProvider` |

### Pre-build checklist (always done by `/create`)

1. `globals.css` has `@import "tailwindcss"` → `@import "@opencosmos/ui/theme.css"` → `@import "@opencosmos/ui/globals.css"`
2. `app/_ui-safelist.ts` exists with the full class safelist
3. All colors from tokens, not hardcoded values
4. `asChild` pattern for link buttons (never nest `<a>` inside `<button>`)

---

## /inference-cost

**Category:** Building — **Skill file:** `.claude/skills/inference-cost/SKILL.md`

The single entry point for OpenCosmos's inference-cost knobs: which Claude model each Cosmo and Inception surface runs on. Reads and edits `apps/web/lib/ai-models.ts` so model choices never have to be hunted down across route files.

```
/inference-cost                       # show the current model per surface
/inference-cost <tier> <model-id>     # change one
```

---

## /groom

**Category:** Corpus — **Skill file:** `.claude/skills/groom/SKILL.md` — **runs against:** `../knowledge`

Prepares raw text in `incoming/` for publication. Adds markdown structure (headers, spacing, speaker formatting) while preserving every word of the original text. Also previews which wiki pages the new document will affect after publishing.

**Full pipeline:** drop raw text into `incoming/` in the corpus repo → **`/groom`** → `npm run publish-doc` → `/knowledge-compile log`

### What it does

Runs `scripts/knowledge/groom.py` — a persistent Python script that transforms raw text files through content-type-specific processors. All transformations happen in Python, not via Claude's Write/Edit tools, to bypass content filtering constraints on sacred and philosophical texts.

### Invocation

```
/groom                                  # Process all files in incoming/
/groom incoming/file.md       # Process a specific file
/groom --dry-run                        # Analyze without writing
/groom --report                         # Status of all incoming files
/groom sources/file.md --force  # Reprocess an already-formatted file
```

### Content type processors

| Processor | Used for |
|-----------|----------|
| `dialogue` | Standard Plato/Jowett dialogues |
| `republic` | Plato's Republic (sidenotes, Stephanus numbers) |
| `laws` | Plato's Laws (EXCURSUS, BOOK I-XII) |
| `heart_sutra` | Heart Sutra |
| `tao` | Tao Te Ching (chapter numbers → headings) |
| `poetry` | Leaves of Grass (preserve line breaks) |
| `prophet` | The Prophet |
| `scientific` | Gaia Hypothesis, scientific texts |
| `generic` | Unregistered files |

### Step 0: copyright gate

Before formatting, `/groom` assesses copyright status. Full text enters the corpus only for public domain works. Copyrighted works → `corpus_tier: commentary` (fair-use overview) or `corpus_tier: reference` (pointer only).

### Report output (Step 4)

The `/groom` report includes a **Wiki Impact Preview** section: for each processed file, it scans `wiki/index.md` and identifies which existing wiki pages the new document will affect after publishing — and which new wiki pages it creates opportunity for. Example:

```
### Wiki Impact Preview
- incoming/stoicism-meditations.md → affects: wiki/concepts/impermanence.md
                                   → creates opportunity: wiki/entities/marcus-aurelius.md (not yet written)

Next step: after npm run publish-doc, run /knowledge-compile log
```

### After publishing (Step 5)

Once `npm run publish-doc` completes, run immediately:

```
/knowledge-compile log
```

This updates all wiki pages affected by the newly published document. The trigger is "just published" — not scheduled.

### What it must NOT do

- Rewrite or paraphrase any text
- Add frontmatter (the publication CLI handles that)
- Split or delete files

See the full reference: [Formatting Raw Text for Publication](../guides/opencosmos-knowledge-formatting-guide)

---

## /knowledge-compile

**Category:** Corpus · wiki — **Skill file:** `.claude/skills/knowledge-compile/SKILL.md`

Compiles durable insights into `wiki/`. The trigger is **"I just learned something"** — event-driven, not scheduled.

### What it does

Extracts cross-tradition synthesis from a source, checks whether a relevant wiki page already exists, and writes or updates pages with the standardized article structure: Summary → Key Claims → Connections → Contradictions → Open Questions.

Each run:
1. Writes or updates one or more wiki pages in `wiki/`
2. Updates `wiki/index.md` with new/changed entries
3. Appends to `wiki/log.md`

### Invocation

```
/knowledge-compile convo                    # Extract from current conversation
/knowledge-compile incoming/<file>          # Process a staged external reference
/knowledge-compile log                      # Update wiki from recent CURATION_LOG entries
```

### When to use each mode

| Mode | Use when |
|------|----------|
| `convo` | A conversation just produced a notable cross-tradition synthesis |
| `incoming/<file>` | An article or text was dropped into `incoming/` |
| `log` | New source documents were just published to the corpus |

### Wiki page frontmatter it writes

```yaml
role: wiki
confidence: speculative|medium|high
status: active|superseded|archived
synthesizes:
  - sources/path-to-source.md
last_reviewed: YYYY-MM-DD
open_questions:
  - ...
contradictions:
  - ...
```

**Confidence lifecycle:** `speculative` (initial synthesis) → `medium` (confirmed by 3+ sources) → `high` (4+ sources, contradictions documented) → `superseded` (contradicted by new evidence)

See the full reference: [Knowledge Wiki Workflow](opencosmos-knowledge-wiki-workflow)

---

## /knowledge-review

**Category:** Corpus · wiki — **Skill file:** `.claude/skills/knowledge-review/SKILL.md`

Runs a health check on `wiki/`. Returns a structured report identifying issues and opportunities.

### What it checks

| Check | What it finds |
|-------|--------------|
| Orphan pages | Pages with empty `synthesizes` or no `## Connections` |
| Asymmetric links | A links B but B doesn't link A |
| Missing pages | Pages referenced in `Connections` that don't exist yet |
| Staleness | `status: active` pages not reviewed in >90 days |
| Promotion candidates | `speculative` pages with 3+ sources → ready for `medium` |
| Not indexed | Pages on disk not listed in `wiki/index.md` |
| Open questions | All `open_questions` across all pages in one place |

### Invocation

```
/knowledge-review               # Full health check
/knowledge-review --orphans     # Only orphan and asymmetric link issues
/knowledge-review --staleness   # Only stale pages
/knowledge-review --questions   # Only accumulated open questions
/knowledge-review --fix         # Auto-fix minor issues (staleness dates, missing sections)
```

### When to run

- Monthly, before a major synthesis session
- After adding several new source documents (to catch update opportunities)
- When open questions from wiki pages are guiding decisions about new sources to add

---

## /knowledge-lookup

**Category:** Corpus · wiki — **Skill file:** `.claude/skills/knowledge-lookup/SKILL.md`

Searches the knowledge wiki for existing synthesis before starting domain work. Returns pre-built concept pages and connections.

### What it does

Reads `wiki/index.md`, finds pages relevant to the query, reads their full content, and returns summaries with key claims and connection links. Also reports gaps — topics the query touches that aren't yet in the wiki, with suggestions for which source documents would help.

### Invocation

```
/knowledge-lookup impermanence
/knowledge-lookup what plato says about the good
/knowledge-lookup self identity soul
/knowledge-lookup cosmology origin universe
```

### Output format

For each matching wiki page:
- **Summary** — the article's synthesis paragraph
- **Key Claims** — 2-3 most important claims
- **Connects to** — related wiki pages

Plus a "Not in wiki yet" section listing gaps and suggesting source documents that would fill them.

### When to use

Before asking Cosmo a deep cross-tradition question — check what the wiki already knows first. This prevents re-deriving synthesis that's already been captured, and surfaces contradictions or open questions to keep in mind.

---

## /new-quote

**Category:** Corpus — **Skill file:** `.claude/skills/new-quote/SKILL.md` — **runs against:** `../knowledge`

Adds one or many quotes to the corpus. Parses free-form input, checks for duplicates, infers category and keywords, validates provenance against `VALIDATION_PROMPT.md`, and routes each record into the right pool — embeddable `quotes/*.yaml`, or the pending pool for records that have not cleared the bar.

**Full pipeline:** `/new-quote` → `npm run quotes:add` → `npm run quotes:promote` → `npm run embed` → `npm run graph:constellation`

```
/new-quote <paste a quote, or several>
```

The skill does the judgment a CLI cannot — parsing free-form text, deduping, inferring metadata, and naming the source. The script stays the single enforcement point for ID allocation, key normalisation and routing. `--json` is the primary interface because quotes are full of apostrophes and em-dashes, and shell escaping eventually mangles one.

**Two pools.** A quote is either *embeddable* (verified or attributed, above the promotion bar) or *pending*. Only the embeddable pool reaches Upstash Vector and becomes citable by Cosmo.

---

## /standardize-knowledge

**Category:** Corpus — **Skill file:** `.claude/skills/standardize-knowledge/SKILL.md` — **runs against:** `../knowledge`

Analyses and normalises heading structure across corpus documents to a consistent H2/H3/H4 hierarchy.

This is not cosmetic. The embedder chunks at heading boundaries, so inconsistent or skipped levels produce chunks that are too large to retrieve precisely or too small to carry meaning. Normalising headings is what keeps RAG chunking reliable.

```
/standardize-knowledge sources/some-file.md   # one file
/standardize-knowledge all                    # the whole corpus
```

Re-run `npm run embed` afterwards: changing headings changes chunk IDs and content hashes.

---

## Adding a New Skill

Skills live in `.claude/skills/{skill-name}/SKILL.md`. The SKILL.md format:

```yaml
---
name: skill-name
description: One-sentence description (appears in the skill picker)
argument-hint: "<arg1> [--optional-flag]"
disable-model-invocation: true   # only on request — never chosen autonomously
user-invocable: true             # makes it appear in /skill-name tab completion
---

# /skill-name — Skill Title

[Instructions Claude follows when this skill is invoked]

$ARGUMENTS contains the arguments passed by the user.
```

File: `.claude/skills/{name}/SKILL.md` — the directory name is the invocation name, and the location is what makes it discoverable.

`description` is load-bearing: it is what an agent reads to decide whether a skill applies, so describe the *situation* it belongs to, not just the action. Set `disable-model-invocation: true` on anything that writes, publishes, deletes or costs money — those should be asked for, not inferred.

There is a second index maintained alongside the skills themselves, at [`.claude/skills/README.md`](https://github.com/opencosmos-ai/opencosmos/blob/main/.claude/skills/README.md) in the applications repository, and a summary table in its [AGENTS.md](https://github.com/opencosmos-ai/opencosmos/blob/main/AGENTS.md#skills). When you add a skill, add it to both.
