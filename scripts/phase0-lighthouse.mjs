#!/usr/bin/env node
/**
 * Phase 0 performance baseline: Lighthouse (mobile) on the four pages the
 * master plan requires. Uses the already-running production server on
 * http://localhost:3210.
 *
 *   node scripts/phase0-lighthouse.mjs
 *
 * Reads nothing from the network except the npm-installed lighthouse binary
 * and localhost. Writes nothing to the repo (results go to /tmp).
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, mkdirSync } from 'node:fs';

const run = promisify(execFile);
const BASE = process.env.BASE_URL || 'http://localhost:3210';
const OUT = '/tmp/lh-safartour';
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['home', '/'],
  ['package', '/packages/sikkim/sikkim-gangtok-getaway-3n4d'],
  ['car-rental', '/car-rentals/suv'],
  ['guide', '/guides/darjeeling-travel-guide'],
];

const results = [];

for (const [name, path] of PAGES) {
  const url = BASE + path;
  process.stdout.write(`\n=== Lighthouse (mobile): ${name} ${path} ===\n`);
  try {
    const { stdout } = await run(
      'npx',
      [
        '--yes', 'lighthouse', url,
        '--quiet',
        '--output=json',
        '--output-path', `${OUT}/${name}.json`,
        '--chrome-flags=--headless --no-sandbox --disable-gpu',
        '--only-categories=performance,accessibility,best-practices,seo',
        '--form-factor=mobile',
        '--screenEmulation.mobile=true',
        '--screenEmulation.width=360',
        '--screenEmulation.height=640',
        '--screenEmulation.deviceScaleFactor=2',
        '--throttling-method=simulate',
      ],
      { maxBuffer: 64 * 1024 * 1024, timeout: 300000 }
    );
    console.log(stdout?.trim() || '(ran)');
  } catch (err) {
    console.log(`LIGHTHOUSE FAILED for ${name}: ${String(err.message).slice(0, 400)}`);
    results.push({ name, path, error: String(err.message).slice(0, 300) });
    continue;
  }
  try {
    const json = JSON.parse(
      (await import('node:fs')).readFileSync(`${OUT}/${name}.json`, 'utf8')
    );
    const a = json.audits;
    const cat = (k) => json.categories[k]?.score ?? null;
    results.push({
      name, path,
      perf: cat('performance'),
      a11y: cat('accessibility'),
      bp: cat('best-practices'),
      seo: cat('seo'),
      lcp: a['largest-contentful-paint']?.displayValue,
      inp: a['interaction-to-next-paint']?.displayValue
        ?? a['experimental-interaction-to-next-paint']?.displayValue ?? 'n/a',
      cls: a['cumulative-layout-shift']?.displayValue,
      tbt: a['total-blocking-time']?.displayValue,
      fcp: a['first-contentful-paint']?.displayValue,
      si: a['speed-index']?.displayValue,
      ttfb: a['server-response-time']?.displayValue,
      totalBytes: a['total-byte-weight']?.displayValue,
      jsBytes: json.aggregates?.['script-treemap-data']?.total?.byteCount ?? null,
      unusedJs: a['unused-javascript']?.displayValue,
      imgWeight: a['modern-image-formats']?.displayValue,
    });
  } catch (e) {
    results.push({ name, path, error: 'parse: ' + e.message });
  }
}

console.log('\n\n================ PHASE 0 PERF BASELINE (mobile, 360px, simulated) ================');
console.log(JSON.stringify(results, null, 2));
writeFileSync(`${OUT}/summary.json`, JSON.stringify(results, null, 2));
console.log(`\nRaw reports: ${OUT}`);