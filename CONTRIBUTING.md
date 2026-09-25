# Contributing to the OpenCosmos knowledge corpus

This is a commons. It is more useful with more eyes on it, and most of the useful contributions are small and specific.

By contributing you agree that your contribution is dedicated to the public domain under [CC0 1.0](LICENSE), the same terms as the rest of the corpus.

---

## The rules that actually bite

Before anything else: **this corpus has admission rules, and they are stricter than copyright law requires.** They exist because "the text is ancient, therefore the file is free" has to be true *of the specific file in front of you*, and two things can make it untrue — a host can hold a licence over its own database, and a modern edition really does add protectable material (punctuation, collation, emendation, reconstruction of damaged graphs).

A source file may be added only if **all four** hold:

1. **The work itself is public domain by age** — pre-modern, or its author long dead.
2. **The specific printing or transcription is either pre-1929, or dedicated CC0 / marked public domain, or a faithful transcription of such a printing.** "Found on the open web" is not provenance; the *edition* must be nameable.
3. **Its frontmatter names that source exactly** — work, edition, dates, host, URL, and where the host versions its pages, the revision.
4. **Any modern editorial layer is absent, excluded, or marked.** Punctuation especially.

The long-form reasoning, including which sources are excluded and why, lives in each project's `PROVENANCE.md`. It has been wrong before and says so in public.

---

## What a good contribution looks like

**Correct a transcription against the source.** The most valuable thing anyone can do. If a character, word or line does not match the scan, say which file, which line, and which edition you checked against.

**Contest an attribution.** The quote collection records a verdict and its evidence for every entry — `verified`, `attributed`, `attributed_unverified`, `likely_misattributed`, `apocryphal`. If a verdict is wrong, argue with the evidence rather than the conclusion. A pointer to the earliest print appearance settles more than an assertion.

**Flag an overlay.** A place where a rendering carries an assumption the original does not. These are the hardest to see and the most worth reporting.

**Add a public-domain source text.** Read the four rules above first. Stage it in `incoming/`, name its edition in the frontmatter, and open a pull request explaining where it came from.

**Report a gap as a gap.** If a source is damaged or unreadable, that is a fact about the object and it gets recorded as one. Never fill a lacuna from memory or from a model's knowledge — a reconstruction wearing an old printing's authority is worse than an honest hole.

---

## What does not belong here

- **Copyrighted translations**, however easy to find.
- **Reconstructions of excavated manuscripts** — reading damaged graphs into modern characters is living scholars' work, not transcription. Record the *facts* about the manuscript instead; facts are not copyrightable.
- **Model-generated text presented as a source.** Anywhere. For any reason.
- **Devotional or promotional framing.** The corpus describes what a text says and where it came from.

---

## How to contribute

**Small corrections** — open a pull request directly. One file, one issue, a sentence saying what you checked. The quickest way: every page on [opencosmos.ai/library](https://opencosmos.ai/library) ends with **Suggest an edit**, which opens that page's file here in GitHub's editor, no clone needed. Some corrections are already identified and waiting: see [good first issue](https://github.com/opencosmos-ai/knowledge/labels/good%20first%20issue).

**Anything larger** — open an issue first. New source texts, structural changes, and anything touching the admission rules are worth discussing before the work is done.

**Every claim carries its evidence.** That is the one standard applied everywhere: a rendering, an attribution, a date, or a correction is only as good as the source you can point at. "This is wrong" invites a shrug. "This is wrong, and here is the 1882 printing that shows it" changes the file.

---

## Provenance over confidence

The corpus would rather say *we do not know* than guess well. If your contribution's honest form is an uncertainty — an attribution that cannot be traced, a line whose source is genuinely unclear — contribute the uncertainty. It is worth more than a confident answer nobody can check.
