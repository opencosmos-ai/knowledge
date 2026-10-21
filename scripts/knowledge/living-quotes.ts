/**
 * Quotations from a living text, checked against the text as it reads now.
 *
 * Some sources in this corpus are not finished books but translations still
 * being revised, generated from their own repositories. The Open Tao Te Ching
 * is the first: `sources/taoism-tao-te-ching.md` is regenerated from
 * opencosmos-ai/taoteching every day. The wiki quotes it, and a quotation keeps
 * the wording of the day it was written. On 2026-10-17 four wiki pages still
 * quoted chapter 1 as "The Tao that can be made into a way…", a day after the
 * translation dropped "into", and one quoted a 1972 translation's "the eternal
 * Tao". Nothing compared them, so only reading found them.
 *
 * So every quotation attributed to a living text is checked against that
 * chapter's verse, as the generated copy holds it now. Each segment of the
 * quotation (split at " / " and at ellipses) must appear in one of the chapters
 * the citation names, ignoring case and punctuation. The check reads only the
 * verse, never the notes, which quote rejected wordings on purpose.
 *
 * A citation must name the work: `(*Tao Te Ching*, Chapter 42)`, `(*Tao Te
 * Ching*, ch. 1)`, `(*Tao Te Ching*, chs. 23, 16)`. A bare `(ch. 2)` cannot be
 * tied to a book, and a page that quotes several books would make a guess
 * wrong, so a bare chapter citation on a line that names the Tao is an error
 * too: name the work.
 */

export interface LivingText {
  /** Matches the work's name inside a citation. */
  work: RegExp
  /** The generated copy, relative to the repository root. */
  file: string
  label: string
}

export const LIVING: LivingText[] = [
  { work: /Tao Te Ching/i, file: 'sources/taoism-tao-te-ching.md', label: 'the Open Tao Te Ching' },
]

export interface Quotation {
  path: string
  line: number
  text: string
  chapters: number[]
  living: LivingText
}

export interface Finding {
  path: string
  line: number
  message: string
}

/** Lowercase, straight quotes, no punctuation, single spaces. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}' ]+/gu, ' ')
    .replace(/'(?!\p{L})|(?<!\p{L})'/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The quotation's segments: split at " / " (a line break) and at ellipses. */
export function segments(quote: string): string[] {
  return quote
    .split(/\s\/\s|…|\.\.\./)
    .map(normalize)
    .filter((s) => s.length > 0)
}

/** Each chapter's English verse, keyed by number: heading to "The Chinese:". */
export function verses(generated: string): Map<number, string> {
  const out = new Map<number, string>()
  const parts = generated.split(/^## Chapter (\d+)\s*$/m)
  for (let i = 1; i < parts.length; i += 2) {
    const body = parts[i + 1].split(/^The Chinese:\s*$/m)[0]
    const verse = body
      .split('\n')
      .filter((l) => !/^\*.*\*$/.test(l.trim())) // the italic title line
      .join(' ')
    out.set(Number(parts[i]), normalize(verse))
  }
  return out
}

const OPEN = `["“]`
const CLOSE = `["”]`
const CITE = String.raw`\(\s*\*?([^*,()]+?)\*?\s*,\s*(?:chapters?|chs?\.)\s*([\d,\s&and]+)\)`
const QUOTED = new RegExp(`${OPEN}([^"“”]{4,600})${CLOSE}[^"“”(]{0,8}${CITE}`, 'gi')
const BARE = /\((?:ch|chs|chapter|chapters)\.?\s*\d[\d,\s]*\)/i
const NAMES_THE_TAO = /\bTao\b|Taois[mt]|Lao[- ]?Tzu|Laozi/

/** Every quotation in a document that cites a living text by name. */
export function quotations(path: string, text: string, living = LIVING): Quotation[] {
  const out: Quotation[] = []
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(QUOTED)) {
      const work = living.find((l) => l.work.test(m[2]))
      if (!work) continue
      const chapters = (m[3].match(/\d+/g) ?? []).map(Number)
      out.push({ path, line: i + 1, text: m[1], chapters, living: work })
    }
  })
  return out
}

/** A bare chapter citation on a line about the Tao: the work must be named. */
export function bareCitations(path: string, text: string): Finding[] {
  const out: Finding[] = []
  text.split('\n').forEach((line, i) => {
    const withoutNamed = line.replace(new RegExp(CITE, 'gi'), '')
    if (BARE.test(withoutNamed) && NAMES_THE_TAO.test(line)) {
      out.push({
        path,
        line: i + 1,
        message: 'a bare chapter citation on a line about the Tao: name the work, as (*Tao Te Ching*, ch. N)',
      })
    }
  })
  return out
}

/** Check quotations against the verses each living text holds now. */
export function check(quotes: Quotation[], versesOf: (l: LivingText) => Map<number, string>): Finding[] {
  const out: Finding[] = []
  for (const q of quotes) {
    const v = versesOf(q.living)
    const missing = q.chapters.filter((n) => !v.has(n))
    if (missing.length) {
      out.push({ path: q.path, line: q.line, message: `cites chapter ${missing.join(', ')}, which ${q.living.label} does not have` })
      continue
    }
    for (const seg of segments(q.text)) {
      if (!q.chapters.some((n) => v.get(n)!.includes(seg))) {
        out.push({
          path: q.path,
          line: q.line,
          message: `"${seg}" is not in ${q.living.label}, ${q.chapters.length > 1 ? 'chapters' : 'chapter'} ${q.chapters.join(', ')}, as it reads now`,
        })
      }
    }
  }
  return out
}
