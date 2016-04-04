export function average (a) {
  var r = {mean: 0, variance: 0, stdev: 0}, t = a.length;
  for(var m, s = 0, l = t; l--; s += a[l]);
  for(m = r.mean = s / t, l = t, s = 0; l--; s += Math.pow(a[l] - m, 2));
  return r.stdev = Math.sqrt(r.variance = s / t), r;
}

/*
export function withinStd (average, val, stdev) {
   var low = average.mean - (stdev * average.stdev);
   var hi = average.mean + (stdev * average.stdev);
   return (val > low) && (val < hi);
}
*/

export function withinStdevs (value, collection, stdevs) {
  const avg = average(collection);
  var low = avg.mean - (stdevs * avg.stdev);
  var hi = avg.mean + (stdevs * avg.stdev);
  return (value > low) && (value < hi);
}