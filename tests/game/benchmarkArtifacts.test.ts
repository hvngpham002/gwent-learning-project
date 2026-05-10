import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

import { buildBenchmarkArtifactBundle, runBenchmarkSuite } from '@/game/benchmark';

const execFileAsync = promisify(execFile);

const hiddenInfoHazards = [
  'cardsById',
  'finalState',
  'commandLog',
  '"hand"',
  '"deck"',
  'ownHand',
  'opponentHand',
  'seat_a:',
  'seat_b:',
  'unsafeDebugResults',
];

const starterMatrixArtifactDir = resolve(
  process.cwd(),
  'docs/research/literature/ai/benchmark-results/benchmark-starter-matrix-v1/latest'
);

const v1SmokeArtifactDir = resolve(
  process.cwd(),
  'docs/research/literature/ai/benchmark-results/benchmark-v1-smoke-v1/latest'
);

const v1StarterMatrixArtifactDir = resolve(
  process.cwd(),
  'docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/latest'
);

describe('benchmark artifacts', () => {
  it('builds parseable artifact outputs from a public benchmark run', () => {
    const result = runBenchmarkSuite({ benchmarkRunId: 'benchmark-smoke-v1:test' });
    const bundle = buildBenchmarkArtifactBundle(result);

    expect(bundle.manifestJson).toBeTruthy();
    expect(bundle.summaryJson).toBeTruthy();
    expect(bundle.recordsJsonl).toBeTruthy();
    expect(bundle.reportMarkdown).toBeTruthy();

    const recordLines = bundle.recordsJsonl.trim().split('\n');
    expect(recordLines).toHaveLength(result.records.length);
    recordLines.forEach((line) => {
      expect(JSON.parse(line)).toEqual(
        expect.objectContaining({ schemaVersion: 'benchmark-match-v1' })
      );
    });
    expect(JSON.parse(bundle.summaryJson)).toEqual(
      expect.objectContaining({ schemaVersion: 'benchmark-summary-v1' })
    );
    expect(JSON.parse(bundle.manifestJson)).toEqual(
      expect.objectContaining({
        schemaVersion: 'benchmark-artifact-v1',
        recordCount: result.records.length,
        summarySchemaVersion: 'benchmark-summary-v1',
        recordSchemaVersion: 'benchmark-match-v1',
      })
    );
  });

  it('is stable across repeated identical benchmark runs', () => {
    const first = buildBenchmarkArtifactBundle(
      runBenchmarkSuite({ benchmarkRunId: 'benchmark-smoke-v1:test' })
    );
    const second = buildBenchmarkArtifactBundle(
      runBenchmarkSuite({ benchmarkRunId: 'benchmark-smoke-v1:test' })
    );

    expect(second).toEqual(first);
  });

  it('does not serialize hidden-info or unsafe debug hazards', () => {
    const result = runBenchmarkSuite({ benchmarkRunId: 'benchmark-smoke-v1:test' });
    const bundle = buildBenchmarkArtifactBundle(result);
    const combined = [
      bundle.manifestJson,
      bundle.summaryJson,
      bundle.recordsJsonl,
      bundle.reportMarkdown,
    ].join('\n');

    hiddenInfoHazards.forEach((hazard) => {
      expect(combined).not.toContain(hazard);
    });
  });

  it('keeps committed starter matrix artifacts parseable and hidden-info safe', async () => {
    const [manifestText, summaryText, recordsText, reportText] = await Promise.all([
      readFile(resolve(starterMatrixArtifactDir, 'manifest.json'), 'utf8'),
      readFile(resolve(starterMatrixArtifactDir, 'summary.json'), 'utf8'),
      readFile(resolve(starterMatrixArtifactDir, 'records.jsonl'), 'utf8'),
      readFile(resolve(starterMatrixArtifactDir, 'report.md'), 'utf8'),
    ]);
    const manifest = JSON.parse(manifestText);
    const summary = JSON.parse(summaryText);
    const recordLines = recordsText.trim().split('\n');

    expect(manifest).toEqual(
      expect.objectContaining({
        schemaVersion: 'benchmark-artifact-v1',
        suiteId: 'benchmark-starter-matrix-v1',
        recordCount: 120,
        summarySchemaVersion: 'benchmark-summary-v1',
        recordSchemaVersion: 'benchmark-match-v1',
      })
    );
    expect(summary).toEqual(
      expect.objectContaining({
        schemaVersion: 'benchmark-summary-v1',
        suiteId: 'benchmark-starter-matrix-v1',
        totalMatches: 120,
        policyIds: ['legal-first-v0', 'legal-heuristic-v0'],
      })
    );
    expect(summary.deckPresetIds).toEqual([
      'official-monsters-starter',
      'official-nilfgaard-starter',
      'official-northern-realms-starter',
      'official-scoiatael-starter',
      'official-skellige-starter',
    ]);
    expect(recordLines).toHaveLength(120);
    recordLines.forEach((line) => {
      expect(JSON.parse(line)).toEqual(
        expect.objectContaining({
          schemaVersion: 'benchmark-match-v1',
          suiteId: 'benchmark-starter-matrix-v1',
        })
      );
    });
    expect(reportText).toContain('total matches: 120');

    const combined = [manifestText, summaryText, recordsText, reportText].join('\n');
    hiddenInfoHazards.forEach((hazard) => {
      expect(combined).not.toContain(hazard);
    });
  });

  it('keeps committed v1 benchmark artifacts parseable and hidden-info safe', async () => {
    const cases = [
      {
        dir: v1SmokeArtifactDir,
        suiteId: 'benchmark-v1-smoke-v1',
        totalMatches: 12,
        policyIds: ['legal-heuristic-v0', 'legal-heuristic-v1'],
      },
      {
        dir: v1StarterMatrixArtifactDir,
        suiteId: 'benchmark-v1-starter-matrix-v1',
        totalMatches: 120,
        policyIds: ['legal-heuristic-v0', 'legal-heuristic-v1'],
      },
    ];

    await Promise.all(
      cases.map(async ({ dir, suiteId, totalMatches, policyIds }) => {
        const [manifestText, summaryText, recordsText, reportText] = await Promise.all([
          readFile(resolve(dir, 'manifest.json'), 'utf8'),
          readFile(resolve(dir, 'summary.json'), 'utf8'),
          readFile(resolve(dir, 'records.jsonl'), 'utf8'),
          readFile(resolve(dir, 'report.md'), 'utf8'),
        ]);
        const manifest = JSON.parse(manifestText);
        const summary = JSON.parse(summaryText);
        const recordLines = recordsText.trim().split('\n');

        expect(manifest).toEqual(
          expect.objectContaining({
            schemaVersion: 'benchmark-artifact-v1',
            suiteId,
            recordCount: totalMatches,
            summarySchemaVersion: 'benchmark-summary-v1',
            recordSchemaVersion: 'benchmark-match-v1',
          })
        );
        expect(summary).toEqual(
          expect.objectContaining({
            schemaVersion: 'benchmark-summary-v1',
            suiteId,
            totalMatches,
            policyIds,
          })
        );
        expect(recordLines).toHaveLength(totalMatches);
        recordLines.forEach((line) => {
          expect(JSON.parse(line)).toEqual(
            expect.objectContaining({
              schemaVersion: 'benchmark-match-v1',
              suiteId,
            })
          );
        });
        expect(reportText).toContain(`total matches: ${totalMatches}`);

        const combined = [manifestText, summaryText, recordsText, reportText].join('\n');
        hiddenInfoHazards.forEach((hazard) => {
          expect(combined).not.toContain(hazard);
        });
      })
    );
  });

  it('summarizes suite, policies, decks, status counts, replay counts, and diagnostics in Markdown', () => {
    const result = runBenchmarkSuite({ benchmarkRunId: 'benchmark-smoke-v1:test' });
    const bundle = buildBenchmarkArtifactBundle(result);

    expect(bundle.reportMarkdown).toContain('suite id: benchmark-smoke-v1');
    expect(bundle.reportMarkdown).toContain('benchmark run id: benchmark-smoke-v1:test');
    expect(bundle.reportMarkdown).toContain('legal-heuristic-v0');
    expect(bundle.reportMarkdown).toContain('legal-first-v0');
    expect(bundle.reportMarkdown).toContain('current-northern-realms');
    expect(bundle.reportMarkdown).toContain('current-nilfgaard');
    expect(bundle.reportMarkdown).toContain('## Status Counts');
    expect(bundle.reportMarkdown).toContain('replay checked');
    expect(bundle.reportMarkdown).toContain('replay failed');
    expect(bundle.reportMarkdown).toContain('## Diagnostics');
  });

  it('writes the four expected files through the headless script', async () => {
    const outDir = await mkdtemp(resolve(tmpdir(), 'gwent-benchmark-artifacts-'));
    const tsxBin = resolve(
      process.cwd(),
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'tsx.cmd' : 'tsx'
    );

    try {
      const result = await execFileAsync(tsxBin, [
        'scripts/run-benchmark-report.ts',
        '--suite',
        'benchmark-smoke-v1',
        '--out',
        outDir,
        '--run-id',
        'benchmark-smoke-v1:script-test',
        '--max-steps',
        '1',
      ]);

      expect(result.stdout).toContain('benchmark report complete: suite=benchmark-smoke-v1');
      expect((await readdir(outDir)).sort()).toEqual([
        'manifest.json',
        'records.jsonl',
        'report.md',
        'summary.json',
      ]);
      await expect(readFile(resolve(outDir, 'manifest.json'), 'utf8')).resolves.toContain(
        'benchmark-artifact-v1'
      );
      await expect(readFile(resolve(outDir, 'records.jsonl'), 'utf8')).resolves.toContain(
        'benchmark-match-v1'
      );
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  }, 30_000);
});
