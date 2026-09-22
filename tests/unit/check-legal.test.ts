import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

/**
 * The build gate, exercised as the build exercises it: by running it.
 *
 * `npm run prebuild` calls this script, so a regression here is a
 * regression in what can reach production. Asserting on its exit code is
 * the only assertion that means anything — the script's whole job is to
 * decide between 0 and 1.
 */
const ROOT = resolve(__dirname, '..', '..')
const SCRIPT = resolve(ROOT, 'scripts', 'check-legal.mjs')

// spawnSync, not execFileSync: the gate reports its failures on stderr,
// and execFileSync only hands back stdout when the exit code is 0. A
// warning would be invisible to this test, which is exactly the case the
// escape-hatch assertion below is about.
function run(env: Record<string, string | undefined>): { code: number; output: string } {
  const result = spawnSync('node', [SCRIPT], {
    cwd: ROOT,
    encoding: 'utf8',
    // A clean slate, so a developer's own shell cannot make this pass.
    env: { PATH: process.env.PATH, ...env } as unknown as NodeJS.ProcessEnv,
  })
  return { code: result.status ?? 1, output: `${result.stdout || ''}${result.stderr || ''}` }
}

describe('check:legal', () => {
  it('passes with the CGV version date set', () => {
    const { code, output } = run({ NEXT_PUBLIC_CGV_VERSION_DATE: '1er octobre 2026' })
    expect(output).toContain('OK')
    expect(code).toBe(0)
  })

  it('fails a production build without it', () => {
    const { code, output } = run({})
    expect(code).toBe(1)
    expect(output).toContain('NEXT_PUBLIC_CGV_VERSION_DATE')
    expect(output).toContain('FAILED')
  })

  it('treats a blank value as missing', () => {
    const { code } = run({ NEXT_PUBLIC_CGV_VERSION_DATE: '   ' })
    expect(code).toBe(1)
  })

  it('downgrades to a warning only behind the explicit escape hatch', () => {
    const { code, output } = run({ LEGAL_ALLOW_INCOMPLETE: '1' })
    expect(code).toBe(0)
    expect(output).toContain('WARNING')
    expect(output).toContain('Never set it on the Vercel project')
  })

  it('does not abort: the parser still agrees with lib/company.ts', () => {
    // Exit code 2 is the self-check, which fires when the regex parser in
    // the script has drifted from the file it reads. It must never be the
    // reason a build passes or fails.
    for (const env of [{}, { NEXT_PUBLIC_CGV_VERSION_DATE: 'x' }, { LEGAL_ALLOW_INCOMPLETE: '1' }]) {
      expect(run(env).code).not.toBe(2)
    }
  })
})
