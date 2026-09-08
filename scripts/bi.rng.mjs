/**
 * The revenue generator's random source, in its own file so that the gate
 * tests the real thing.
 *
 * scripts/check-bi.mjs measures whether these streams are independent across
 * key prefixes. If it carried its own copy of the algorithm the measurement
 * would be of the copy, and the two would drift apart at the first change —
 * which is the specific way this check would stop working without failing.
 *
 * WHY THE MIXING IS THIS ELABORATE for something seeding invented revenue:
 * the first version was FNV-1a straight into xorshift32, returning the first
 * output. Every stream was uniform on its own — chi-square 7 across ten bins
 * on 36,040 real complex ids, well inside the 5% critical value — and that
 * measurement missed the defect completely, because MARGINAL UNIFORMITY IS
 * NOT INDEPENDENCE. Keys differing only in a short prefix,
 * `pick|11680-0021` against `onboard|11680-0021`, correlated at r = -0.15.
 * Customers are selected with the first stream and given a signing month by
 * the second, so the correlation bent the acquisition curve: signings were
 * meant to rise across the window and instead fell by a third in the final
 * year. Nothing in the output looked wrong.
 *
 * splitmix32's finalizer — two multiply-xorshift rounds — is what actually
 * avalanches a weak seed, and discarding the first four outputs keeps the
 * state's low-order structure out of the first draw. Worst pairwise
 * correlation across the six prefixes the generator uses falls from -0.150 to
 * -0.010, which is under two standard errors at that sample size.
 */

/** FNV-1a. Small and fast; not a hash for anything but seeding. */
export function hash32(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * A stream per key, rather than one stream for the run.
 *
 * With a single sequential generator, inserting one complex shifts every draw
 * after it and the whole dataset changes. Keying the stream means a complex's
 * contracts, churn date and usage history depend on its id and nothing else,
 * so a diff after an upstream change shows what actually changed.
 */
export function makeStream(seed) {
  return (key) => {
    let s = hash32(`${seed}|${key}`)
    s = Math.imul(s ^ (s >>> 16), 0x21f0aaad) >>> 0
    s = Math.imul(s ^ (s >>> 15), 0x735a2d97) >>> 0
    s = (s ^ (s >>> 15)) >>> 0
    if (s === 0) s = 0x9e3779b9
    const next = () => {
      s ^= (s << 13) >>> 0
      s >>>= 0
      s ^= s >>> 17
      s ^= (s << 5) >>> 0
      s >>>= 0
      return s / 4294967296
    }
    for (let i = 0; i < 4; i++) next()
    return next
  }
}

/** The key prefixes build-bi.mjs draws from. The gate checks every pair. */
export const STREAM_KEYS = ['mgmt', 'pick', 'onboard', 'life', 'setup', 'won', 'lost']
