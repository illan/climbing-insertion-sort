# Climbing Insertion Sort

*Randomized pre-swap insertion sort:* before inserting `x`, repeatedly swap it with a randomly chosen unsorted element while that element is larger.

**Name:** "Climbing" is a working name suggested by an AI assistant (Claude), not an established name. It is only loosely related to hill climbing.

**Question:** Is this a known variant? Discussion welcome: [Computer Science Stack Exchange](https://cs.stackexchange.com/questions/177713/insertion-sort-that-swaps-the-next-element-with-random-larger-elements-before-in)

## 1. Algorithm

Ascending order, scanning from the end. The sorted part is the suffix `a[i+1..n-1]`. Implementation: [`src/sort.js`](src/sort.js).

```js
for (let i = n - 2; i >= 0; i--) {
  let x = a[i];
  while (i > 0) {
    const j = Math.floor(Math.random() * i);
    if (a[j] > x) {
      a[i] = a[j];
      a[j] = x;
      x = a[i];
    } else break;
  }
  let k = i;
  while (k + 1 < n && a[k + 1] < x) {
    a[k] = a[k + 1];
    k++;
  }
  a[k] = x;
}
```

1. Take `x = a[i]`.
2. Climb: pick a random `a[j]` with `j < i`. If it is larger than `x`, swap. Repeat.
3. Stop at the first pick `<= x`.
4. Insert `x` into the sorted suffix.

We stop on `<= x`, not `< x`. With a strict `<`, duplicates could loop forever.

## 2. Intuition

My first guess was wrong: the climb does **not** make `x` close to the maximum. The climb is short (about 1.7 picks and 0.7 swaps per element) and takes `x` from the median to about the 72nd percentile of the unsorted prefix. About 28% of the prefix is still larger than `x`.

Why it saves shifts: every element that is still larger than `x` when `x` is inserted will later be inserted into a suffix that contains `x`, so it will shift past `x`. Therefore:

> total shifts = sum, over all steps, of the number of unsorted elements still larger than `x` (+ an O(n) term for the original last element, which starts as the sorted suffix)

(checked exactly on random inputs, see `bench/analysis.js`).

- Classic insertion sort: half of the prefix is larger, so about n²/4 shifts.
- Climbing: a fraction 3 − e ≈ 0.282 is larger, so about (3 − e)/2 · n² ≈ 0.141n² shifts.

A constant-factor saving, not an asymptotic one.

## 3. Termination

`i` never changes inside the `while`. Only the value of `x` changes, and it strictly increases at every swap, so there are finitely many successful picks. The loop also exits at the first failed pick. Once `x` is the maximum of `a[0..i-1]`, every pick fails.

Tested on sorted, reversed, all-equal and few-distinct-values inputs (n = 8000): it always finishes and sorts.

## 4. Expected analysis (random input)

Let `m = i + 1` and let `r` be the rank of `x` in the unsorted prefix (1 = smallest, `m` = largest), uniform at the start. Distinct keys are assumed.

Pick `j` uniformly from the other `m − 1` elements:

- Probability `(r−1)/(m−1)`: the pick is smaller, stop at rank `r`.
- Probability `(m−r)/(m−1)`: the pick is larger, jump to a uniform rank in `{r+1, …, m}` and repeat.

Let `E[r]` be the expected final rank, `P[r]` the expected picks and `S[r]` the expected swaps, with `E[m] = m`, `P[m] = 1`, `S[m] = 0`:

```
E[r] = ((r-1)/(m-1)) * r + (1/(m-1)) * sum_{k=r+1..m} E[k]
P[r] = 1 + (1/(m-1)) * sum_{k=r+1..m} P[k]
S[r] = (m-r)/(m-1) + (1/(m-1)) * sum_{k=r+1..m} S[k]
```

Limit for large `m` (with `r` uniform):

| Quantity | Value |
|---|---|
| Picks per element | e − 1 ≈ 1.718 |
| Swaps per element | e − 2 ≈ 0.718 |
| Final rank | (e − 2) · m ≈ 0.718m |
| Still larger than `x` | 3 − e ≈ 28% |

This matches the empirical 1.7 picks, 0.7 swaps and 28%. Solving the recurrences numerically for m = 5000 gives 1.7182, 0.7182 and 0.7184.

## 5. Complexity

| Case | Comparisons | Moves |
|---|---|---|
| Sorted input | 2n − 3 | n − 1 |
| Random input | ≈ 0.141n² + O(n) | ≈ 0.141n² + O(n) |
| Reversed input | ≈ 0.17n² (measured) | ≈ 0.17n² (measured) |
| Worst case | O(n²) | O(n²) |

The worst case is O(n²) because each element needs at most `i + 1` picks and `n − i − 1` shifts.

**Not stable.** The swap can move `x` ahead of an equal key that was originally to its left. In a test with 200 random lists of 200 records with 20 distinct keys, classic insertion sort kept equal keys in order every time, while the climbing variant reordered some in all 200.

## 6. Empirical results

### 6.1 Operations, n = 8000, average of 5 runs

Moves = array writes. A swap counts as 2.

| Input | Algorithm | Comparisons | Moves |
|---|---|--:|--:|
| sorted | classic | 7,999 | 7,999 |
| sorted | climbing | 15,997 | 7,999 |
| reversed | classic | 31,996,000 | 32,003,999 |
| reversed | climbing | 10,835,994 | 10,835,695 |
| random | classic | 15,982,513 | 15,982,523 |
| random | climbing | 9,039,221 | 9,036,990 |

On sorted input, 15,997 = 2(n − 1) − 1: n − 1 failed picks + n − 1 insertion checks, minus the edge case `i = 0`.

About 3x less work on reversed input, 1.8x less on random input, slightly worse on sorted input. Still quadratic: going from n = 2000 to n = 8000 multiplies the work by about 16.

### 6.2 Small arrays: it loses below n ≈ 100

Hypothesis: random number generation cost. The variant needs about 1.7 random numbers per element, and `Math.random` costs far more than a comparison or a write. For small `n` the saving in shifts is tiny.

Test: replace `Math.random` with an inlined xorshift32. Node 22, `Int32Array`, time per sort relative to classic (below 1 = faster):

| n | Math.random | xorshift32 |
|--:|--:|--:|
| 4 | 5.3x | 1.9x |
| 16 | 9.2x | 1.5x |
| 32 | 4.4x | 1.04x |
| 64 | 2.5x | 0.79x |
| 256 | 1.02x | 0.63x |
| 512 | 0.73x | 0.56x |
| 1024 | 0.72x | 0.65x |

Break-even is around n ≈ 256 with `Math.random` and around n ≈ 32–64 with xorshift32. It is still 1.5–1.9x slower at n ≤ 16, probably because of the extra comparisons and swaps (not tested). Ratios at n ≤ 16 vary by up to about 2x between runs; the break-even points are the stable part.

xorshift32: Marsaglia, JSS 8(14), 2003 ([doi](https://doi.org/10.18637/jss.v008.i14)).

```js
s ^= s << 13;
s ^= s >>> 17;
s ^= s << 5;
```

Period 2³² − 1; not cryptographically secure. V8's `Math.random` uses xorshift128+, a larger relative of the same family. The inlined xorshift32 also avoids the function call and the conversion to a double, so the comparison is not only the generator algorithm.

### 6.3 Memory hierarchy

The climb makes about 1.7n random accesses, versus about 0.14n² sequential shifts. Full sorts up to n = 200,000 (800 KB, still within cache) take about 0.55x the time of classic (9.2 s vs 5.5 s).

A random read costs about 0.3–0.6 ns extra when the array fits in cache and about 5–8 ns extra for 4–64 MB arrays (throughput of independent reads). Even at 100 ns per miss, 1.7n misses are negligible against 0.14n² shifts. Not verified with full sorts far beyond cache.

## 7. Why not selection sort?

Minimizing writes is not the goal. Selection sort needs at most n − 1 swaps but about 0.5n² comparisons. This variant needs about 0.14n² comparisons and many more writes.

## 8. Reproduce

Node ≥ 18 (tested with Node 22). No dependencies. Each script is self-contained.

```
node bench/operation-counts.js   # 6.1
node bench/timing.js             # 6.2 and 6.3 (1-2 minutes; --quick skips the largest sizes)
node bench/statistics.js         # 2 and 3: picks, swaps, fraction larger than x, termination
node bench/analysis.js           # 2 and 4: recurrences and the shift identity
```

Counting: comparisons = every `a[j] > x` and `a[k+1] < x`. Moves = every write; a swap counts 2 and the final `a[k] = x` counts 1. Picks = every random `j`. Swaps = every successful climb.

Results change from run to run because of the random picks. Operation counts and ratios are stable; timings depend on the machine, the Node version and the JIT.

## 9. Limitations

- No proof that it is new. Searched Wikipedia, Faro et al., and the web: no match.
- The analysis assumes a random permutation and distinct keys.
- No compiled-language benchmark yet (C/Rust). Everything here is Node.js / `Int32Array`.
- The break-even `n` depends strongly on the random number generator.
- The cache behaviour for `n` far beyond cache is extrapolated, not measured with full sorts.

If you know a reference or a name, please comment on the Stack Exchange question linked at the top.

## 10. References

- [Insertion sort (Wikipedia)](https://en.wikipedia.org/wiki/Insertion_sort)
- Faro, Marino and Scafiti (2020). [Fast-Insertion-Sort: a New Family of Efficient Variants of the Insertion-Sort Algorithm](https://ceur-ws.org/Vol-2568/paper4.pdf)
- Marsaglia (2003). *Xorshift RNGs.* Journal of Statistical Software 8(14). [doi:10.18637/jss.v008.i14](https://doi.org/10.18637/jss.v008.i14)
- [There's Math.random(), and then there's Math.random()](https://v8.dev/blog/math-random) (V8 blog)
- [Question on Computer Science Stack Exchange](https://cs.stackexchange.com/questions/177713/insertion-sort-that-swaps-the-next-element-with-random-larger-elements-before-in)

## Disclosure

The benchmarks and the analysis were produced with the help of an AI assistant (Claude), which also suggested the name "climbing".

## License

MIT
