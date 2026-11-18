
Climbing Insertion Sort

*Randomized pre-swap insertion sort:* before inserting `x`, repeatedly swap it with a randomly chosen unsorted element while that element is larger.

Name: "Climbing" is a working name invented for discussion, not an established name.

Question: Is this a known variant? Discussion welcome.
https://cs.stackexchange.com/questions/177713/insertion-sort-that-swaps-the-next-element-with-random-larger-elements-before-in

1. Algorithm

Ascending order, scanning from the end. Sorted part is suffix a[i+1..n-1].

    for (let i = n - 2; i >= 0; i--) {
      let x = a[i];
      while (i > 0) {
        const j = Math.floor(Math.random() _ i);
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

1. Take x = a[i].
2. Climb: pick random a[j], j < i. If larger than x, swap. Repeat.
3. Stop at first pick <= x.
4. Insert x into sorted suffix.

We stop on <= x, not < x. With strict <, duplicates could loop forever.

2. Intuition

First guess was wrong: climb does NOT make x close to max.

Correct intuition: climb pushes x from median (50th percentile) to ∼72nd percentile. So it shifts past fewer elements. Constant-factor saving, not asymptotic.

3. Termination

i never changes inside while. Only x moves, strictly increasing, bounded by max(a[0..i]), so loop must stop.

Tested on sorted, reversed, all-equal, few-distinct (n=8000): always finishes and sorts.

4. Expected analysis (random input)

Let m = i+1, r = rank of x (1 = smallest, m = largest), uniform at start.

Pick j uniform from other m-1:

- Prob (r-1)/(m-1): pick smaller, stop at r.
- Prob (m-r)/(m-1): pick larger, jump to uniform rank in {r+1..m}, repeat.

Let E[r] = expected final rank, P[r] = expected picks, S[r] = expected swaps. E[m]=m, P[m]=1, S[m]=0:

    E[r] = ((r-1)/(m-1))_r + (1/(m-1)) _ sum_{k=r+1..m} E[k]
    P[r] = 1 + (1/(m-1)) _ sum_{k=r+1..m} P[k]
    S[r] = (m-r)/(m-1) + (1/(m-1)) * sum_{k=r+1..m} S[k]

Limit for large m:
Quantity	Value
Picks per element	~1.718
Swaps per element	~0.718
Final rank	~0.718 * m
Still larger than x	~28%
Matches empirical 1.7 picks, 0.7 swaps, 28%.

Consequence: classic inserts at median, ∼0.25n2 shifts. This inserts at 71.8th percentile, ∼0.14n2 shifts. Constant-factor win, still O(n2).

5. Complexity
Case	Comparisons	Moves
Best (sorted)	O(n)	O(n)
Average (random)	~0.14n2 + O(n)	~0.14n2 + O(n)
Worst (reversed)	O(n2)	O(n2)
Not stable: random swap can reorder equal keys.

6. Empirical results

6.1 Operations, n=8000, avg 5 runs

Moves = array writes. Swap = 2.
Input	Algorithm	Comparisons	Moves
sorted	classic	7,999	7,999
sorted	climbing	15,997	7,999
reversed	classic	31,996,000	32,003,999
reversed	climbing	10,835,994	10,835,695
random	classic	15,982,513	15,982,523
random	climbing	9,039,221	9,036,990
On sorted, 15,997 = 2*(n-1)-1: n-1 failed picks + n-1 insertion checks, minus edge case i=0.

∼3x less on reversed, ∼1.8x less on random, slightly worse on sorted. Still quadratic: n=2000 -> 8000 multiplies work by ∼16.

6.2 Small arrays: loses below n ~ 100

Hypothesis: RNG cost. Needs ∼1.7 randoms per element. http://Math.random costs far more than compare/write. For small n, saving is tiny.

Test: replace http://Math.random with xorshift32. Node 22, Int32Array, time vs classic, <1 = faster.
n	http://Math.random	xorshift32
4	5.3x	1.9x
16	9.2x	1.5x
32	4.4x	1.04x
64	2.5x	0.79x
256	1.02x	0.63x
512	0.73x	0.56x
1024	0.72x	0.65x
Break-even: ∼256 with http://Math.random, ∼32-64 with xorshift32. Still 1.5-1.9x slower at n<=16, probably extra compares/swaps.

xorshift32: Marsaglia, JSS 8(14), 2003. https://doi.org/10.18637/jss.v008.i14

    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;

Period 2^32-1, not crypto-secure. V8 http://Math.random uses xorshift128+, relative of same family.

6.3 Memory hierarchy

Climb: ∼1.7n random accesses vs ∼0.14n2 sequential shifts.
Full sorts to n=200,000 (800 KB) take ∼0.55x time of classic (9.2s vs 5.5s).
Random read: ∼0.3-0.6 ns extra in cache, ∼5-8 ns extra for 4-64 MB arrays (throughput, independent reads). Even at 100 ns/miss, 1.7n misses negligible vs 0.14n2 shifts. Not verified for full sorts far beyond cache.

7. Why not selection sort?

Not goal to minimize writes. Selection: <= n-1 swaps, but ∼0.5n2 compares. This: ∼0.14n2 compares, many more writes.

8. Reproduce

    npm run bench
    npm run bench:small
    npm run bench:big
    node bench/bench.js --cache

Node >= 20.

Counting: Comparisons = every a[j] > x and a[k+1] < x. Moves = every write. Swap = 2. Final a[k]=x = 1. Picks = every random j. Swaps = every successful climb.

9. Limitations

- No proof yet it is new. Searched Wikipedia, Biernacki & Jacques, web. No match.
- Analysis assumes random permutation, distinct keys.
- No compiled language benchmark yet (C/Rust). All http://Node.js / Int32Array.
- Break-even n depends strongly on RNG.
- Cache for n far beyond cache extrapolated, not measured with full sorts.

If you know a reference or name, open an issue or comment on http://CS.SE link at top.

10. References

- Wikipedia, Insertion sort.
- Biernacki & Jacques, Fast-Insertion-Sort.
- Marsaglia (2003). Xorshift RNGs. JSS 8(14). https://doi.org/10.18637/jss.v008.i14
- http://CS.SE: https://cs.stackexchange.com/questions/177713/insertion-sort-that-swaps-the-next-element-with-random-larger-elements-before-in

Disclosure

Benchmarks run with help of AI assistant, which also suggested name "climbing".

License

MIT
~~~