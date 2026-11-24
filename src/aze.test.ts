import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const htmlPath = path.resolve(process.cwd(), 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const match = html.match(/<script id="aze-core">([\s\S]*?)<\/script>/);
if (!match) {
  throw new Error('Could not find <script id="aze-core"> inside index.html');
}

const sandbox: { globalThis: Record<string, unknown>; module: { exports: unknown } } = {
  globalThis: {},
  module: { exports: {} },
};
vm.runInNewContext(match[1], sandbox);
const AZECore = sandbox.module.exports as {
  STARTERS: Array<{ id: string; name: string; emoji: string }>;
  ELEMENTS: Record<string, { id: string; name: string; emoji: string }>;
  combineElements: (a: string, b: string) => { id: string; name: string; emoji: string } | null;
  getMoonPhaseInfo: (d: Date) => { name: string; emoji: string };
  evaluatePasswordRules: (pw: string, d: Date) => {
    rules: Array<{ id: number; text: string; pass: boolean }>;
    digitSum: number;
    passedCount: number;
    allPassed: boolean;
  };
  scorePerfectCircle: (pts: Array<{ x: number; y: number }>, center: { x: number; y: number }) => {
    score: number;
    valid: boolean;
    feedback: string;
  };
  getCpsRank: (cps: number) => { title: string; emoji: string; note: string };
  calculateLifeStats: (birth: string, now: Date) => Record<string, unknown> | null;
  floodFillGrid: (grid: string[], size: number, x: number, y: number, color: string) => string[];
  computeFortuneTotals: (
    items: Array<{ id: string; price: number }>,
    counts: Record<string, number>,
    budget: number
  ) => { spent: number; remaining: number; pct: number };
  circleRectCollides: (cx: number, cy: number, cr: number, rx: number, ry: number, rw: number, rh: number) => boolean;
  stepSandGrid: (grid: Uint8Array, w: number, h: number, tick: number) => Uint8Array;
};

test('Element Alchemy: all 70+ defined elements including Cyber Cat are reachable', () => {
  const discovered = new Set(AZECore.STARTERS.map((s) => s.id));
  let changed = true;
  while (changed) {
    changed = false;
    const list = Array.from(discovered);
    for (let i = 0; i < list.length; i++) {
      for (let j = i; j < list.length; j++) {
        const res = AZECore.combineElements(list[i], list[j]);
        if (res && !discovered.has(res.id)) {
          discovered.add(res.id);
          changed = true;
        }
      }
    }
  }
  const allIds = Object.keys(AZECore.ELEMENTS);
  const missing = allIds.filter((id) => !discovered.has(id));
  assert.deepEqual(missing, [], `Unreachable elements: ${missing.join(', ')}`);
  assert.ok(allIds.length >= 70, `Expected 70+ elements, got ${allIds.length}`);
  assert.ok(discovered.has('cybercat'));
  assert.equal(AZECore.combineElements('fire', 'water')?.id, 'steam');
  assert.equal(AZECore.combineElements('water', 'fire')?.id, 'steam');
});

test('Impossible Password: validates all 12 rules live', () => {
  const testDate = new Date('2026-11-24T12:00:00Z'); // Tuesday
  const moon = AZECore.getMoonPhaseInfo(testDate);
  const validPw = `A!993TuesdayMars e4 ${moon.name} EZA #ffaaaa`;
  const res = AZECore.evaluatePasswordRules(validPw, testDate);
  assert.equal(res.digitSum, 25);
  assert.equal(res.passedCount, 12);
  assert.equal(res.allPassed, true);

  const weakRes = AZECore.evaluatePasswordRules('abc', testDate);
  assert.equal(weakRes.allPassed, false);
  assert.equal(weakRes.passedCount, 0);
});

test('Draw a Perfect Circle: scores ideal circle >= 95% and rejects tiny lines', () => {
  const center = { x: 200, y: 200 };
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    pts.push({ x: center.x + Math.cos(a) * 100, y: center.y + Math.sin(a) * 100 });
  }
  const good = AZECore.scorePerfectCircle(pts, center);
  assert.equal(good.valid, true);
  assert.ok(good.score >= 95, `Expected >= 95, got ${good.score}`);

  const tiny = AZECore.scorePerfectCircle([{ x: 205, y: 205 }, { x: 206, y: 206 }], center);
  assert.equal(tiny.valid, false);
});

test('CPS Ranker, Fortune Math, Flood Fill, Life Stats, Dodge Collision & Gravity Sand', () => {
  assert.equal(AZECore.getCpsRank(2.5).title, 'Snail');
  assert.equal(AZECore.getCpsRank(6.0).title, 'Fox');
  assert.equal(AZECore.getCpsRank(9.2).title, 'Falcon');
  assert.equal(AZECore.getCpsRank(12.0).title, 'Cyberbot');

  const fort = AZECore.computeFortuneTotals(
    [{ id: 'yacht', price: 650000000 }],
    { yacht: 2 },
    1000000000000
  );
  assert.equal(fort.spent, 1300000000);
  assert.equal(fort.remaining, 998700000000);

  const filled = AZECore.floodFillGrid(
    ['a', 'a', 'b', 'a', 'b', 'b', 'b', 'b', 'b'],
    3,
    0,
    0,
    'z'
  );
  assert.deepEqual(filled, ['z', 'z', 'b', 'z', 'b', 'b', 'b', 'b', 'b']);

  const stats = AZECore.calculateLifeStats('2000-01-01', new Date('2026-01-01T00:00:00Z'));
  assert.ok(stats && stats.future === false);
  assert.ok((stats.heartbeats as number) > 900000000);
  assert.ok(Number(stats.moonRoundTrips) > 1000);

  assert.equal(AZECore.circleRectCollides(50, 50, 10, 45, 45, 20, 20), true);
  assert.equal(AZECore.circleRectCollides(10, 10, 5, 45, 45, 20, 20), false);

  // Gravity Sand: sand at (1,0) falls to (1,1); acid at (1,2) dissolves stone at (1,3)
  const g = new Uint8Array(4 * 4);
  g[0 * 4 + 1] = 1; // sand
  g[2 * 4 + 1] = 5; // acid
  g[3 * 4 + 1] = 3; // stone
  AZECore.stepSandGrid(g, 4, 4, 1);
  assert.equal(g[1 * 4 + 1], 1);
  assert.equal(g[3 * 4 + 1], 0);
});
