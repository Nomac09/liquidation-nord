#!/usr/bin/env node
// Build gate: refuse to ship a placeholder or a retired tax statement to a
// public page.
//
// Two classes of failure, both of which have shipped to production on real
// sites before:
//
//   1. An unfilled [À COMPLÉTER] rendering on mentions légales or CGV.
//      Worse than a missing page, because it looks like a finished legal
//      notice that happens to be wrong.
//   2. "TVA non applicable, art. 293 B du CGI" surviving somewhere after
//      the company became VAT-registered. That is an incorrect tax
//      statement on a commercial page, not a stale marketing line.
//   3. A build with no NEXT_PUBLIC_CGV_VERSION_DATE. Every legal page
//      states "En vigueur au …"; without the variable that date is
//      whatever the fallback happens to be, and undated terms are terms
//      nobody can prove were the ones in force on the day of the order.
//
// This is static analysis, deliberately: it reads the sources rather than
// rendering the app, so it costs nothing and runs before the build. It
// therefore cannot see a value composed at runtime. It catches the shape
// of mistake that actually happens here, which is a literal string or an
// unfilled COMPANY.* field reaching a page.
//
// Escape hatch: LEGAL_ALLOW_INCOMPLETE=1 downgrades failures to warnings.
// It exists so the rest of the branch can be built and tested while the
// values in docs/PHASE1_AUDIT.md §11 are still being gathered. It must
// never be set on the Vercel project.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const ALLOW_INCOMPLETE = process.env.LEGAL_ALLOW_INCOMPLETE === '1'
const MARKER = '[À COMPLÉTER'

// Where the company identity is allowed to hold placeholders.
const COMPANY_FILE = join(ROOT, 'lib', 'company.ts')

// Directories whose output a customer can actually see. Admin and API
// surfaces are excluded: a placeholder in an internal tool is a to-do,
// not a legal statement. lib/ is in scope because the order email is
// composed there, and an email reaches a customer exactly like a page
// does; lib/company.ts itself is skipped, being the one file allowed to
// hold placeholders.
const PUBLIC_ROOTS = ['app', 'components', 'content', 'lib']
const EXCLUDED_SEGMENTS = new Set(['admin', 'ayooshi', 'api', 'node_modules', '.next'])
const SCANNED_EXTENSIONS = ['.tsx', '.ts', '.mdx', '.md']

// Retired tax statements. Anything matching these is a hard failure on a
// public page, whatever the surrounding context.
const RETIRED_PATTERNS = [
  { re: /293\s*B/i, label: 'art. 293 B du CGI (franchise en base, no longer applicable)' },
  { re: /TVA\s+non\s+applicable/i, label: '"TVA non applicable"' },
]

// The CGV draft banner. Task 4 removes it; this keeps it from coming back.
const DRAFT_PATTERN = { re: /Brouillon de travail/i, label: '"Brouillon de travail" banner' }

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out // directory does not exist yet (e.g. content/ before Task 5)
  }
  for (const entry of entries) {
    if (EXCLUDED_SEGMENTS.has(entry) || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walk(full, out)
    } else if (SCANNED_EXTENSIONS.some((ext) => entry.endsWith(ext)) && full !== COMPANY_FILE) {
      out.push(full)
    }
  }
  return out
}

/**
 * Pull the dotted paths of every placeholder value out of lib/company.ts.
 * Tracks brace depth to build "mediator.name" rather than just "name",
 * which is what the reference scan below has to match against.
 */
function placeholderPaths(source) {
  const paths = []
  const stack = []

  // A long value is often wrapped onto its own line by the formatter
  // ("key:\n  'value'"). Rejoin those before matching, or the key reads as
  // having no value and its placeholder goes unnoticed, which is the one
  // failure mode this whole script exists to prevent.
  const joined = source.replace(/^(\s*\w+:)\s*\n\s*/gm, '$1 ')

  for (const rawLine of joined.split('\n')) {
    const line = rawLine.trim()
    if (line.startsWith('//')) continue

    const openNested = line.match(/^(\w+)\s*:\s*\{$/)
    if (openNested) {
      stack.push(openNested[1])
      continue
    }
    if (line.startsWith('}')) {
      stack.pop()
      continue
    }

    const pair = line.match(/^(\w+)\s*:\s*(["'`])(.*?)\2/)
    if (pair && pair[3].includes(MARKER)) {
      paths.push([...stack, pair[1]].join('.'))
    }
  }
  return paths
}

const companySource = readFileSync(COMPANY_FILE, 'utf8')
const pending = placeholderPaths(companySource)

// Self-check: the parser is a regex over a TypeScript literal, so it can
// drift from the file it reads. Count the markers directly (ignoring
// comments, which explain the placeholders rather than being them) and
// insist the parser found the same number. A gate that silently stops
// seeing a value is indistinguishable from one that passes.
const markerCount = companySource
  .split('\n')
  .filter((l) => {
    const t = l.trim()
    // Comments explain the placeholders rather than being them, and the
    // PLACEHOLDER_MARKER constant is the definition of the marker itself.
    return !t.startsWith('//') && !t.startsWith('*') && !/PLACEHOLDER_MARKER\s*=/.test(t)
  })
  .join('\n')
  .split(MARKER).length - 1

if (markerCount !== pending.length) {
  console.error(
    `\ncheck:legal ABORTED — parser found ${pending.length} placeholder key(s) in ` +
      `lib/company.ts but the file contains ${markerCount} marker(s).\n` +
      'The parser in scripts/check-legal.mjs is out of step with the file it reads;\n' +
      'fix it rather than trusting this run.\n'
  )
  process.exit(2)
}

const files = PUBLIC_ROOTS.flatMap((d) => walk(join(ROOT, d)))
const problems = []

// The CGV version date is the one legal value that is not in the file
// above: it is a fact about a deployment, not about the company, so it
// comes from the environment. Which puts it outside the reach of the
// static scan below, and makes this explicit check the only thing
// standing between production and a set of terms with no date on them.
const cgvVersionDate = process.env.NEXT_PUBLIC_CGV_VERSION_DATE
if (!cgvVersionDate || !cgvVersionDate.trim()) {
  problems.push({
    at: 'env:NEXT_PUBLIC_CGV_VERSION_DATE',
    why:
      'not set — every legal page would state a fallback instead of the date ' +
      'these terms came into force. Set it on the Vercel project, once, at the ' +
      'first production deploy, and never change it without publishing new terms.',
  })
}

for (const file of files) {
  const source = readFileSync(file, 'utf8')
  const rel = relative(ROOT, file).split(sep).join('/')
  const lines = source.split('\n')

  lines.forEach((line, i) => {
    const at = `${rel}:${i + 1}`

    // Comment lines are not rendered, so a placeholder or a retired
    // phrase quoted in one is documentation, not a statement to a
    // customer. Skipping them keeps the gate's failures actionable;
    // a gate that cries wolf gets the escape hatch switched on
    // permanently, which is the only way it can actually fail.
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return

    // A placeholder written out as a literal, bypassing COMPANY entirely.
    if (line.includes(MARKER)) {
      problems.push({ at, why: `literal ${MARKER}…] in a public source file` })
    }

    for (const { re, label } of RETIRED_PATTERNS) {
      if (re.test(line)) problems.push({ at, why: `retired tax statement: ${label}` })
    }
    if (DRAFT_PATTERN.re.test(line)) {
      problems.push({ at, why: `retired ${DRAFT_PATTERN.label}` })
    }

    // An unfilled COMPANY.* field being rendered.
    for (const path of pending) {
      if (line.includes(`COMPANY.${path}`)) {
        problems.push({ at, why: `renders COMPANY.${path}, still ${MARKER}…]` })
      }
    }
  })
}

if (problems.length === 0) {
  console.log('check:legal — OK, no placeholder or retired tax statement on a public page.')
  process.exit(0)
}

const verb = ALLOW_INCOMPLETE ? 'WARNING' : 'FAILED'
console.error(`\ncheck:legal ${verb} — ${problems.length} problem${problems.length > 1 ? 's' : ''}:\n`)
for (const { at, why } of problems) {
  console.error(`  ${at}\n    ${why}`)
}

if (pending.length > 0) {
  console.error(`\nStill unfilled in lib/company.ts (${pending.length}):`)
  for (const path of pending) console.error(`  COMPANY.${path}`)
  console.error('\nSee docs/PHASE1_AUDIT.md §11 for what each one needs.')
}

if (ALLOW_INCOMPLETE) {
  console.error('\nLEGAL_ALLOW_INCOMPLETE=1 is set, so this is not fatal.')
  console.error('Never set it on the Vercel project: it is the only thing standing')
  console.error('between an unfilled placeholder and a published legal page.\n')
  process.exit(0)
}

console.error('\nFill the values above, or set LEGAL_ALLOW_INCOMPLETE=1 for a local build.\n')
process.exit(1)
