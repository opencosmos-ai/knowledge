/**
 * The living-quotes check, against the wordings it was written to catch.
 *
 *   npm run test:living-quotes
 *
 * The fixtures are the real quotations that fell out of step on 2026-10-17. A
 * check that only ever passes proves nothing, so each stale wording is shown to
 * fail before the current one is shown to pass.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LIVING, bareCitations, check, quotations, segments, verses } from './living-quotes.js'

const COPY = `## Chapter 1

*Heshang Gong's title: 體道, "Embodying the Tao".*

The Tao that can be made a way is not the ever-present Tao.
The name that can be named is not the ever-present name.

The Chinese:

道可道，非常道。

### Notes on chapter 1

- ***made into a way*** — the same passive with a spare word.
- The Tao that can be made into a way is not the ever-present Tao.

## Chapter 2

When the world knows beauty as beauty, ugliness arises.
The work is done, and the sage does not stay in it.

The Chinese:

天下皆知美之為美
`

const v = verses(COPY)
const run = (line: string) => check(quotations('wiki/x.md', line), () => v)

test('the current wording passes, in every citation form', () => {
  for (const line of [
    '"The Tao that can be made a way is not the ever-present Tao" (*Tao Te Ching*, Chapter 1).',
    '"The Tao that can be made a way is not the ever-present Tao" (*Tao Te Ching*, ch. 1).',
    '“the Tao that can be made a way is not the ever-present Tao” (Tao Te Ching, chapter 1)',
  ]) {
    assert.equal(quotations('wiki/x.md', line).length, 1, line)
    assert.deepEqual(run(line), [], line)
  }
})

test('a capitalised "Chapter" is read: the form most pages use went unchecked once', () => {
  assert.equal(quotations('wiki/x.md', '"The name that can be named" (*Tao Te Ching*, Chapter 1)').length, 1)
})

test('the superseded wordings fail', () => {
  for (const stale of [
    '"The Tao that can be made into a way is not the ever-present Tao" (*Tao Te Ching*, Chapter 1)',
    '"the Tao that can be named is not the eternal Tao" (*Tao Te Ching*, ch. 1)',
    '"The Tao that can be told is not the eternal Tao" (*Tao Te Ching*, Chapter 1)',
  ]) {
    assert.equal(run(stale).length, 1, stale)
  }
})

test('only the verse counts: the notes quote rejected wordings on purpose', () => {
  assert.ok(!v.get(1)!.includes('made into a way'))
  assert.ok(!v.get(1)!.includes('embodying'))
})

test('segments split at line breaks and ellipses, and each must be in the chapter', () => {
  assert.deepEqual(segments('The work is done, … / Because the sage'), ['the work is done', 'because the sage'])
  assert.deepEqual(run('"When the world knows beauty as beauty, ugliness arises. / The work is done" (*Tao Te Ching*, ch. 2)'), [])
  assert.equal(run('"When the world knows beauty as beauty / Heaven and earth" (*Tao Te Ching*, ch. 2)').length, 1)
})

test('a citation of several chapters passes if each segment is in one of them', () => {
  assert.deepEqual(run('"The name that can be named / ugliness arises" (*Tao Te Ching*, chs. 1, 2)'), [])
})

test('a chapter the text does not have is a finding, not a pass', () => {
  assert.match(run('"anything at all" (*Tao Te Ching*, Chapter 99)')[0].message, /does not have/)
})

test('a quotation from another book is not this check’s business', () => {
  assert.deepEqual(quotations('wiki/x.md', '"I went to the woods" (*Walden*, Chapter 2)'), [])
})

test('a bare chapter citation on a line about the Tao must name the work', () => {
  const line = 'Taoist flux: "Things come to their fullest" (Chapter 16).'
  assert.equal(bareCitations('wiki/x.md', line).length, 1)
  assert.deepEqual(bareCitations('wiki/x.md', '"Things come" (*Tao Te Ching*, Chapter 16) about the Tao'), [])
  assert.deepEqual(bareCitations('wiki/x.md', 'Marcus on duty (Chapter 3).'), [])
})

test('the registry names the generated copy', () => {
  assert.equal(LIVING[0].file, 'sources/taoism-tao-te-ching.md')
})
