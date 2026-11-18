function climbingInsertionSort(a) {
  const n = a.length;
  for (let i = n - 2; i >= 0; i--) {
    let x = a[i];
    while (i > 0) {
      const j = Math.floor(Math.random() * i);
      if (a[j] > x) {
        a[i] = a[j];
        a[j] = x;
        x = a[i];
      } else {
        break;
      }
    }
    let k = i;
    while (k + 1 < n && a[k + 1] < x) {
      a[k] = a[k + 1];
      k++;
    }
    a[k] = x;
  }
  return a;
}

function classicInsertionSort(a) {
  const n = a.length;
  for (let i = 1; i < n; i++) {
    const x = a[i];
    let k = i - 1;
    while (k >= 0 && a[k] > x) {
      a[k + 1] = a[k];
      k--;
    }
    a[k + 1] = x;
  }
  return a;
}

module.exports = { climbingInsertionSort, classicInsertionSort };