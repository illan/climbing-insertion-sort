const { climbingInsertionSort, classicInsertionSort } = require('../src/sort.js');

function makeArray(n, kind) {
  const a = Array.from({ length: n }, (_, i) => i);
  if (kind === 'reversed') return a.reverse();
  if (kind === 'random') {
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }
  return a;
}

function timeIt(fn, a) {
  const t0 = performance.now();
  fn([...a]);
  return performance.now() - t0;
}

for (const kind of ['sorted', 'reversed', 'random']) {
  const a = makeArray(8000, kind);
  const tClassic = timeIt(classicInsertionSort, a);
  const tClimb = timeIt(climbingInsertionSort, a);
  console.log(kind, 'classic:', tClassic.toFixed(1), 'ms', 'climb:', tClimb.toFixed(1), 'ms');
}