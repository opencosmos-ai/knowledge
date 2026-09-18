/**
 * The corpus layout, declared once.
 *
 * Three lists used to disagree — `shared.ts` named a `commentary/` that has
 * never existed, `09-resolve-source-works.ts` named a `scriptures/` of one
 * file, and `embed-knowledge.ts` had abandoned lists altogether for a denylist
 * and so was the only one that could see `wiki/` or `specifications/`. Each was
 * edited when a directory was added and none when one was not.
 *
 * Consumers still hold different views — the health report wants the markdown
 * categories, the quote linker wants only directories that contain *works*, the
 * embedder wants everything it should index — but they derive those views from
 * here rather than restating them.
 *
 * Deliberately dependency-free and side-effect-free: importing this must not
 * load a .env or touch a filesystem, so anything can use it.
 */

/** Markdown categories, one file per document, scanned for frontmatter. */
export const CORPUS_DIRS = ['sources', 'references', 'guides', 'collections'] as const

/** Corpus, but with a shape of its own that a plain markdown walk cannot read. */
export const SHAPED_DIRS = ['wiki', 'quotes', 'iching'] as const

/** Present in the repository, never corpus. */
export const NON_CORPUS_DIRS = [
  'scripts', 'data', 'incoming', 'node_modules', '.git', '.github',
] as const

/** Directories that hold *works* a quote can cite. */
export const WORK_DIRS = ['sources', 'collections'] as const

export type CorpusDir = (typeof CORPUS_DIRS)[number]

const KNOWN = new Set<string>([...CORPUS_DIRS, ...SHAPED_DIRS, ...NON_CORPUS_DIRS])

/**
 * Top-level directories this file does not account for.
 *
 * The point is to fail in both directions. A new category that nobody adds here
 * is invisible to the health report and the quote linker; a stray directory
 * nobody notices gets embedded as corpus — which is exactly how 482 chunks of
 * dependency changelog ended up citable. Neither shows up as an error on its
 * own, so the check has to be explicit.
 */
export function unknownTopLevelDirs(entries: string[]): string[] {
  return entries.filter(e => !e.startsWith('.') && !KNOWN.has(e)).sort()
}

/** Throw if the repository has grown a directory the layout does not know. */
export function assertKnownLayout(entries: string[]): void {
  const unknown = unknownTopLevelDirs(entries)
  if (unknown.length > 0) {
    throw new Error(
      `Unrecognised top-level director${unknown.length === 1 ? 'y' : 'ies'}: ${unknown.join(', ')}.\n` +
      `If ${unknown.length === 1 ? 'it is' : 'they are'} corpus, add to CORPUS_DIRS or SHAPED_DIRS in ` +
      `scripts/knowledge/corpus-layout.ts. If not, add to NON_CORPUS_DIRS. ` +
      `Leaving this unresolved means the directory is either silently unindexed or silently indexed.`,
    )
  }
}
