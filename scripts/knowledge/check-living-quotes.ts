#!/usr/bin/env tsx
/**
 * Every quotation from a living text matches the text as it reads now.
 *
 *   npm run quotes:living
 *
 * Reads every Markdown file in the corpus except the living texts themselves
 * and the wiki's edit log. See living-quotes.ts for what is checked and why.
 * Exits 1 on any finding, so CI fails a PR that quotes a superseded wording, and
 * the daily Tao Te Ching sync fails loudly the day a revision leaves a wiki
 * quotation behind, instead of nobody noticing.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { LIVING, bareCitations, check, quotations, verses, type LivingText } from './living-quotes.js'

const ROOT = join(import.meta.dirname, '..', '..')
const SKIP_DIRS = new Set(['node_modules', '.git', 'data', 'quotes'])
const SKIP_FILES = new Set(['wiki/log.md', 'CURATION_LOG.md', ...LIVING.map((l) => l.file)])

function* markdown(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      if (!SKIP_DIRS.has(name) && !name.startsWith('.')) yield* markdown(path)
    } else if (name.endsWith('.md')) {
      const rel = relative(ROOT, path)
      if (!SKIP_FILES.has(rel)) yield rel
    }
  }
}

const cache = new Map<string, Map<number, string>>()
const versesOf = (l: LivingText) => {
  if (!cache.has(l.file)) cache.set(l.file, verses(readFileSync(join(ROOT, l.file), 'utf-8')))
  return cache.get(l.file)!
}

let quoted = 0
const findings = []
for (const rel of markdown(ROOT)) {
  const text = readFileSync(join(ROOT, rel), 'utf-8')
  const qs = quotations(rel, text)
  quoted += qs.length
  findings.push(...check(qs, versesOf), ...bareCitations(rel, text))
}

for (const f of findings) console.log(`  ✗ ${f.path}:${f.line}  ${f.message}`)
if (findings.length) {
  console.log(`\n${findings.length} quotation(s) out of step with ${LIVING.map((l) => l.label).join(', ')}.`)
  console.log('Re-quote from the generated copy, or name the work in a bare citation.')
  process.exit(1)
}
console.log(`OK — ${quoted} quotation(s) from living texts match them as they read now.`)
