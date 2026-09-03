#!/usr/bin/env node
/**
 * Practice invariants.
 *
 * lib/practice.data.ts holds the one page on this site whose claims are
 * about a person rather than about the repository, so it is the one page
 * that cannot derive its own contents. This gate is what replaces that
 * derivation.
 *
 * Three things are checked, and each of them exists because of a specific
 * way the page could lie:
 *
 *   1 A reference to an entry that does not exist. The page's whole argument
 *     is that each capability links to something a reader can open. Rename
 *     an entry and a working page becomes a page of dead claims — with no
 *     error, because the compiler cannot check a slug.
 *
 *   2 An id with no sentence behind it in one of the locales. A missing
 *     dictionary key renders as a blank row rather than an error, and a
 *     blank row on a page about someone's work reads as an omission by them.
 *
 *   3 Disclosure. This file is the one place on the site where a phone
 *     number, a home address or an employer name would plausibly be typed,
 *     because the source it was compiled from has all three. The repository
 *     is public, and an indexed address cannot be recalled — so this is a
 *     blocker, not a warning.
 */

import { readFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = []
const line = (s) => out.push(s)
const problems = []
const notes = []

const src = readFileSync(join(ROOT, 'lib', 'practice.data.ts'), 'utf8')

/* ------------------------------------------------------------------ */
/* 1. Every reference resolves to a real entry                         */
/* ------------------------------------------------------------------ */

/* Read from the source text rather than by importing the module: this is a
   plain node script and the file is TypeScript with a path alias in it.
   The same reason scripts/check-contrast.mjs parses the stylesheet.

   The character class is `[^']*` — deliberately permissive — and the slug
   rule is applied afterwards as its own check. The first version of this
   matched `[a-z0-9-]+` instead, which meant a reference the pattern could
   not parse was not reported as bad but silently NOT COLLECTED, and the
   whole existence check skipped it. A negative test renaming an entry to
   `crm-tab-browser-RENAMED` passed the gate, because the capital letters
   put the string outside the pattern rather than outside the rule.

   That is the exact defect shape `make/crm-tab-browser` is written about:
   if the basis for the decision cannot be obtained, pass. Collect first,
   judge second. */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const refs = [...src.matchAll(/'((?:think|make|live|trace)\/[^']*)'/g)].map((m) => m[1])

if (refs.length === 0) {
  problems.push('lib/practice.data.ts references no entries — the page would be claims with no evidence')
}

const missing = new Set()
const malformed = new Set()
for (const ref of refs) {
  const slug = ref.slice(ref.indexOf('/') + 1)
  if (!SLUG.test(slug)) {
    malformed.add(ref)
    continue
  }
  if (!existsSync(join(ROOT, 'content', `${ref}.mdx`))) missing.add(ref)
}
for (const ref of [...malformed].sort()) {
  problems.push(`evidence reference "${ref}" is not a lowercase-kebab-case slug`)
}
for (const ref of [...missing].sort()) {
  problems.push(`evidence points at content/${ref}.mdx, which does not exist`)
}

/* ------------------------------------------------------------------ */
/* 2. Every id has a sentence, in every locale                         */
/* ------------------------------------------------------------------ */

const ids = {
  era: [...src.matchAll(/id: '([a-z0-9-]+)',\n\s+from:/g)].map((m) => m[1]),
  capability: [...src.matchAll(/id: '([a-z0-9-]+)',\n\s+group:/g)].map((m) => m[1]),
}
/* STUDY entries match the era shape (`id` then `from`), so they arrive in
   the era list above. They are separated here by looking at which array
   literal they sit in rather than by a second regex, which would have to
   repeat the shape and could drift from it. */
const studyBlock = /export const STUDY[\s\S]*?\n\]/.exec(src)?.[0] ?? ''
const studyIds = [...studyBlock.matchAll(/id: '([a-z0-9-]+)'/g)].map((m) => m[1])
ids.era = ids.era.filter((id) => !studyIds.includes(id))
ids.study = studyIds

const LOCALES = ['ko', 'en']
for (const loc of LOCALES) {
  const dictPath = join(ROOT, 'lib', 'i18n', 'dictionaries', `${loc}.ts`)
  const dict = readFileSync(dictPath, 'utf8')
  const block = /practice: \{[\s\S]*?\n  \},/.exec(dict)?.[0]
  if (!block) {
    problems.push(`lib/i18n/dictionaries/${loc}.ts has no practice block`)
    continue
  }
  for (const [kind, list] of Object.entries(ids)) {
    for (const id of list) {
      /* A hyphenated id is a quoted key in the dictionary, so a plain
         `id:` substring test misses it. Match the key position instead. */
      if (!new RegExp(`['"]?${id}['"]?\\s*:`).test(block)) {
        problems.push(`${loc}.ts — no sentence for ${kind} "${id}"`)
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* 3. Disclosure                                                       */
/* ------------------------------------------------------------------ */

/* A PATTERN blocklist can be published. A VALUE blocklist cannot.
   
   These five are patterns: they describe the SHAPE of a phone number or an
   address and reveal nothing about this particular author. The first version
   of this gate also carried a sixth rule with eight literal company names in
   it — and none of those names appears anywhere else in this public
   repository. Shipping the rule would have published, for the first time and
   in one line, the list of organisations the author considers sensitive.
   A blocklist that discloses its own blocklist protects nothing. */
const DISCLOSURE = [
  [/01[016-9][-. ]?\d{3,4}[-. ]?\d{4}/, 'a phone number'],
  [/\+82[-. ]?1[016-9]/, 'an international mobile number'],
  [/\d+동\s*\d+호/, 'a street address with a unit number'],
  [/(로|길)\d+길\s*\d+/, 'a street address'],
  [/[\w.+-]+@[\w-]+\.[\w.-]+/, 'an email address'],
]

/**
 * The organisation names, as truncated SHA-256 digests.
 *
 * The property that makes this publishable: a hash confirms a name only to
 * someone who ALREADY HAS that name to hash. It tells a reader of this
 * repository nothing they did not bring with them, while still failing the
 * build the moment one of the names is typed into the page.
 *
 * This is NOT a claim of secrecy — eight short names are guessable by anyone
 * who sets out to guess them, and the digests are truncated, so collisions
 * are possible in principle at 64 bits. It is a claim about DISCLOSURE: the
 * repository no longer volunteers the list.
 *
 * Regenerate with:
 *   node -e 'const{createHash}=require("crypto");process.argv.slice(1).forEach(n=>console.log(createHash("sha256").update(n.normalize("NFC").toLowerCase()).digest("hex").slice(0,16)))' NAME...
 */
const BLOCKED_NAMES = new Set([
  'b783555f3fb620fe',
  'b3b2dfe51c4850cb',
  '4fe52926de05f62b',
  'cbc505339ea88c67',
  '9fdea0e286202d51',
  'ff223c6d39e52d8b',
  '764f00b34a4d0d0e',
  '21e137c5a596966e',
])

const digest = (s) =>
  createHash('sha256').update(s.normalize('NFC').toLowerCase()).digest('hex').slice(0, 16)

/**
 * Tokens to test: each word, and each adjacent pair joined.
 *
 * The pair matters because a name typed with a space in it — the same name,
 * as far as a reader is concerned — tokenises into halves that hash to
 * nothing. Joining neighbours catches that without needing every substring.
 */
function nameTokens(text) {
  /* NFC first. `[가-힣]` matches precomposed syllables only, and Korean text
     arriving from a macOS filename or a paste can be NFD — decomposed jamo
     live in U+1100..U+11FF and would slip past the class entirely, which is
     a real hole and not a theoretical one on this platform. */
  const words = text.normalize('NFC').match(/[가-힣]+|[A-Za-z][A-Za-z0-9]*/g) ?? []
  const out = new Set(words)
  for (let i = 0; i < words.length - 1; i++) out.add(words[i] + words[i + 1])
  return out
}

const targets = [['lib/practice.data.ts', src]]
for (const loc of LOCALES) {
  const dict = readFileSync(join(ROOT, 'lib', 'i18n', 'dictionaries', `${loc}.ts`), 'utf8')
  const block = /practice: \{[\s\S]*?\n  \},/.exec(dict)?.[0]
  if (block) targets.push([`lib/i18n/dictionaries/${loc}.ts (practice)`, block])
}

for (const [where, text] of targets) {
  for (const [re, what] of DISCLOSURE) {
    /* The match itself is never printed. Printing it would put the thing
       this gate exists to keep out of the repository into CI output. */
    if (re.test(text)) problems.push(`${where} contains ${what}`)
  }
  for (const tok of nameTokens(text)) {
    /* Reported without the token, for the same reason. */
    if (BLOCKED_NAMES.has(digest(tok))) {
      problems.push(`${where} contains an organisation name that is withheld from this site`)
      break
    }
  }
}

/* ------------------------------------------------------------------ */
/* 4. A capability has to say something                                */
/* ------------------------------------------------------------------ */

/* Neither claimed nor evidenced is not a modest entry — it is a row with no
   content on either axis, and the page renders it as a name with a zero
   beside it. */
for (const m of src.matchAll(/id: '([a-z0-9-]+)',\n\s+group: '[a-z]+',\n\s+claimed: (true|false),\n\s+evidence: \[([^\]]*)\]/g)) {
  const [, id, claimed, ev] = m
  if (claimed === 'false' && ev.trim() === '') {
    problems.push(`capability "${id}" is neither claimed nor evidenced — nothing to show`)
  }
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

const claimedUnproven = [
  ...src.matchAll(/id: '([a-z0-9-]+)',\n\s+group: '[a-z]+',\n\s+claimed: true,\n\s+evidence: \[\s*\]/g),
].map((m) => m[1])

line('')
line('  PRACTICE GUARD')
line('  ' + '-'.repeat(70))
line(`  ${ids.era.length} eras · ${ids.capability.length} capabilities · ${refs.length} references`)
line(`  ${claimedUnproven.length} claimed with no evidence on this site — shown as such`)
if (claimedUnproven.length) line(`    ${claimedUnproven.join(' · ')}`)

/* Not a problem. An unproven claim rendered as unproven is the page working
   as designed; it is only worth naming so the count cannot drift upward
   unnoticed into a page that is mostly assertion. */
if (claimedUnproven.length > ids.capability.length / 2) {
  notes.push('more than half of the capabilities are unevidenced — the page is closer to a CV than to a record')
}

for (const n of notes) line(`  · ${n}`)
for (const p of problems) line(`  ✗ ${p}`)

line('  ' + '-'.repeat(70))
if (problems.length) {
  line(`  FAIL — ${problems.length} practice problem${problems.length === 1 ? '' : 's'}`)
  line('')
  process.stdout.write(out.join('\n') + '\n')
  process.exit(1)
}
line('  PASS — every claim on the practice page resolves to something.')
line('')
process.stdout.write(out.join('\n') + '\n')
