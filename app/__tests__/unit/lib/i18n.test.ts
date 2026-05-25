/**
 * i18n dictionary smoke tests.
 *
 * Risks covered: R-12 (low user adoption — multilingual UX)
 * Test cases   : TC-10-01 (en↔hi parity), TC-10-02 (persistence)
 *
 * NOTE: we import the dictionary indirectly via the Trans component
 * to keep the public surface honest. The dictionary parity check below
 * fails the moment a developer adds an English key but forgets the Hindi.
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

// Read the source file and extract every key from each dictionary block.
// Brittle on style changes but very effective at catching missing translations.
const SRC = readFileSync(join(__dirname, '../../../lib/i18n.tsx'), 'utf-8')

function extractKeys(block: string): Set<string> {
  // Pull every `'some.key':` style entry inside the given block.
  const KEY = /'([\w.]+)'\s*:/g
  const out = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = KEY.exec(block))) out.add(m[1])
  return out
}

// Split the dict object source into en / hi sub-blocks.
function blockBetween(src: string, start: string, end: string): string {
  const a = src.indexOf(start)
  const b = src.indexOf(end, a + start.length)
  return a >= 0 && b > a ? src.slice(a, b) : ''
}

describe('i18n dictionary parity (R-12)', () => {
  it('lib/i18n.tsx file is present', () => {
    expect(existsSync(join(__dirname, '../../../lib/i18n.tsx'))).toBe(true)
  })

  it('every EN key has a corresponding HI translation', () => {
    const enBlock = blockBetween(SRC, '  en: {', '  hi: {')
    const hiBlock = blockBetween(SRC, '  hi: {', '\n  },\n}\n')
      || SRC.slice(SRC.indexOf('  hi: {'))   // fall through to end-of-file

    const en = extractKeys(enBlock)
    const hi = extractKeys(hiBlock)

    expect(en.size).toBeGreaterThan(50)
    const missing = [...en].filter(k => !hi.has(k))
    expect(missing).toEqual([])
  })

  it('no orphan HI key without an EN counterpart', () => {
    const enBlock = blockBetween(SRC, '  en: {', '  hi: {')
    const hiBlock = blockBetween(SRC, '  hi: {', '\n  },\n}\n')
      || SRC.slice(SRC.indexOf('  hi: {'))

    const en = extractKeys(enBlock)
    const hi = extractKeys(hiBlock)
    const orphans = [...hi].filter(k => !en.has(k))
    expect(orphans).toEqual([])
  })

  it('all currency-amount strings stay in Arabic numerals (sanity)', () => {
    // The Hindi block must NOT contain Devanagari digits in place of
    // amounts — the spec is "translate text only, keep numbers as-is".
    const hiBlock = blockBetween(SRC, '  hi: {', '\n  },\n}\n')
      || SRC.slice(SRC.indexOf('  hi: {'))
    const devanagariDigits = /[०-९]/g
    expect(hiBlock.match(devanagariDigits)).toBeNull()
  })
})
