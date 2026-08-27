import type { Commit } from '@/lib/git/schema'

/**
 * THE SIGIL — this interface's mark, computed from its own history.
 *
 * A logo is a claim about a person. This is a measurement of one: a ring of
 * 64 slots, filled clockwise from twelve o'clock, one slot per commit, each
 * wedge as deep as the work it carries. Nobody else can render it, because
 * nobody else has the record it is drawn from. It is not decoration sitting
 * on top of the build record — it is the build record, at a glance.
 *
 * Three properties were chosen deliberately, because a generated mark that
 * reshapes itself on every commit is noise wearing the costume of identity:
 *
 *   ACCRETES.   A slot's depth comes from ABSOLUTE line thresholds, never
 *               from a share of the current maximum. Slot 3 looks today
 *               exactly as it looked when it was the newest slot, and will
 *               still look that way in five years. A relative scale would
 *               redraw the entire mark every time one large commit landed.
 *   COMPLETES.  There are 64 slots whether or not there are 64 commits, so
 *               an unfinished record looks unfinished: the empty slots stay
 *               visible as ticks. The hero says "in progress" — this is that
 *               sentence as geometry rather than as a word.
 *   NESTS.      Commit 65 does not double the scale and redraw everything.
 *               It opens a second ring INSIDE the first, which is then
 *               closed for good. Growth moves inward; nothing already drawn
 *               ever moves.
 *
 * Straight lines only, no arc commands. At 5.6° a chord is visually
 * indistinguishable from its arc, the path data is roughly half the size,
 * and a faceted result belongs to a surface already built out of rules and
 * type rather than curves.
 *
 * And it is emitted as ONE wedge per shape, rotated into place, rather than
 * as sixty-four sets of coordinates. That is not a micro-optimisation — the
 * first version wrote every wedge out longhand and cost 3.9 KB gzip on
 * /build, which is 17% of that route's entire html budget, spent on a
 * graphic, in a project that caps its own commit rows to stay inside the same
 * number. Coordinates are decimal noise and gzip cannot do much with them.
 * Sixty-four near-identical `<use>` elements are almost pure repetition and
 * it can. The shapes a mark actually needs are few: one per depth, per ring,
 * plus a tick and a nub.
 */

/** Slots in one ring. Fixed — see COMPLETES above. */
export const SIGIL_SLOTS = 64

/**
 * Authored-line thresholds. A commit's depth is how many it passes, so the
 * scale is absolute and a slot's appearance is settled the moment it is
 * drawn. Roughly ×3 apart, because commit sizes in this repository span
 * three orders of magnitude and a linear scale renders every ordinary fix as
 * the same invisible sliver.
 */
const DEPTH_LINES = [12, 36, 108, 324, 972] as const
export const SIGIL_DEPTHS = DEPTH_LINES.length + 1

/**
 * Rings, outermost first. Beyond the last one, slots start aggregating.
 *
 * The bands are THICK — 28 of a 100 radius each — because the first version
 * used 16 and the mark read as a dotted circle rather than as an emblem:
 * depth is encoded as radial length, so a thin band leaves nothing for the
 * silhouette to be jagged with. 28 units is roughly 15px at the size the hero
 * draws it, which is enough for a depth-6 wedge to be visibly four times the
 * depth-1 one.
 *
 * The innermost ring runs to 0, so its wedges meet at the centre. There is no
 * hole to preserve: a mark with an empty middle at this scale reads as a
 * loading spinner.
 */
const RINGS = [
  { outer: 92, inner: 64 },
  { outer: 60, inner: 32 },
  { outer: 28, inner: 0 },
] as const

export const SIGIL_CAPACITY = SIGIL_SLOTS * RINGS.length

const CENTER = 100
export const SIGIL_VIEWBOX = 200
/** Empty slots are marked at the band's outer edge, not filled. */
const TICK = 3
/** A milestone commit pushes past its band, into the gap outside it. */
const NUB = 5
/** Total angular gap between neighbouring wedges, in degrees. */
const GAP = 0.9

const SPAN = 360 / SIGIL_SLOTS

/** One decimal: integers make neighbouring wedges visibly uneven at the rim,
    and the extra byte per number all but disappears under gzip. */
const r1 = (v: number): string => (Math.round(v * 10) / 10).toString()

function point(radius: number, degrees: number): string {
  const a = (degrees * Math.PI) / 180
  return `${r1(CENTER + radius * Math.cos(a))} ${r1(CENTER + radius * Math.sin(a))}`
}

/**
 * A four-cornered wedge, always drawn in slot 0 and rotated into place by the
 * element that uses it. -90° puts slot 0 at twelve o'clock; increasing
 * degrees run clockwise.
 */
function wedge(from: number, to: number): string {
  const a0 = -90 + GAP / 2
  const a1 = -90 + SPAN - GAP / 2
  return `M${point(from, a0)}L${point(to, a0)}L${point(to, a1)}L${point(from, a1)}Z`
}

/** A slot's depth, 1..SIGIL_DEPTHS. Any commit at all is worth depth 1. */
function depthOf(lines: number): number {
  let d = 1
  for (const t of DEPTH_LINES) if (lines >= t) d += 1
  return d
}

/** A shape defined once and instantiated by rotation. */
export type SigilShape = {
  /** Stable, derived from what the shape IS, so identical shapes share one id. */
  readonly id: string
  readonly d: string
}

/** One placement of one shape. */
export type SigilUse = {
  readonly id: string
  /** Degrees clockwise from twelve o'clock. */
  readonly angle: number
  readonly kind: 'wedge' | 'tick' | 'nub'
}

export type Sigil = {
  readonly shapes: readonly SigilShape[]
  readonly uses: readonly SigilUse[]
  /** Commits the mark stands for. */
  readonly count: number
  /** Slots occupied. Equals count until the rings are full. */
  readonly used: number
  /** Rings in use, 1..RINGS.length. */
  readonly rings: number
  /** Commits per slot. 1 until the record passes SIGIL_CAPACITY. */
  readonly per: number
  /** Slots left in the ring currently filling. 0 once every ring is closed. */
  readonly remaining: number
  /**
   * Baseline circles to draw, as radii.
   *
   * Empty for the full mark, where the unearned slots are drawn as ticks and
   * the ring is implied by them. A SUBSET mark has no ticks — it lights only
   * its own slots — so it needs the ring stated, or a piece written in one
   * commit renders as a single stroke floating in white space with nothing to
   * say where in the record it sits.
   */
  readonly outlines: readonly number[]
}

const EMPTY: Sigil = {
  shapes: [],
  uses: [],
  count: 0,
  used: 0,
  rings: 1,
  per: 1,
  remaining: SIGIL_SLOTS,
  outlines: [],
}

/** One slot's contents, before any geometry. */
type Slot = {
  readonly lines: number
  readonly milestone: boolean
  readonly shas: readonly string[]
}

/**
 * Assign commits to slots. Shared, so a subset mark lands its wedges on
 * exactly the slots the full mark would — which is the whole point of the
 * subset variant: two entries' marks are comparable because they are cut from
 * the same ring.
 */
function fold(commits: readonly Commit[]): { slots: Slot[]; per: number } {
  // Oldest first: slot 0 is where the work started, and it stays there.
  const oldestFirst = [...commits].reverse()
  const per = Math.max(1, Math.ceil(oldestFirst.length / SIGIL_CAPACITY))
  const slots: Slot[] = []
  for (let i = 0; i < oldestFirst.length; i += per) {
    const group = oldestFirst.slice(i, i + per)
    slots.push({
      lines: group.reduce((n, c) => n + c.insertions + c.deletions, 0),
      milestone: group.some((c) => c.milestone !== null),
      shas: group.map((c) => c.sha),
    })
  }
  return { slots, per }
}

/** Rings the record occupies, as a count. */
const ringsUsed = (slotCount: number): number =>
  Math.min(RINGS.length, Math.floor(Math.max(0, slotCount - 1) / SIGIL_SLOTS) + 1)

/** A collector for wedges, so both emitters share one shape table. */
function emitter() {
  const shapes = new Map<string, string>()
  const uses: SigilUse[] = []
  return {
    shapes,
    uses,
    place(id: string, d: string, slot: number, kind: SigilUse['kind']): void {
      if (!shapes.has(id)) shapes.set(id, d)
      uses.push({ id, angle: Math.round(slot * SPAN * 1000) / 1000, kind })
    },
  }
}

/** Where slot `i` lands: which ring, and which position within it. */
function seat(i: number): { ringIndex: number; ring: (typeof RINGS)[number]; slot: number } | null {
  const ringIndex = Math.floor(i / SIGIL_SLOTS)
  const ring = RINGS[ringIndex]
  if (!ring) return null
  return { ringIndex, ring, slot: i % SIGIL_SLOTS }
}

/**
 * Fold the whole record into a mark.
 *
 * Pure, and pure on purpose: the same commits always produce the same paths,
 * so the mark is reproducible from the committed snapshot alone and nothing
 * about it depends on when the page was built.
 */
export function sigilFrom(commits: readonly Commit[]): Sigil {
  if (commits.length === 0) return EMPTY

  const { slots, per } = fold(commits)
  const e = emitter()

  slots.forEach((s, i) => {
    const at = seat(i)
    if (!at) return
    const depth = depthOf(s.lines)
    const to = at.ring.inner + ((at.ring.outer - at.ring.inner) * depth) / SIGIL_DEPTHS
    e.place(`${at.ringIndex}${depth}`, wedge(at.ring.inner, to), at.slot, 'wedge')
    if (s.milestone) {
      e.place(`${at.ringIndex}n`, wedge(at.ring.outer, at.ring.outer + NUB), at.slot, 'nub')
    }
  })

  // Ticks belong only to the ring that is still filling. A closed ring needs
  // no reminder of what it once lacked.
  const openIndex = Math.floor(slots.length / SIGIL_SLOTS)
  const open = RINGS[openIndex]
  const filledInOpen = slots.length % SIGIL_SLOTS
  if (open) {
    for (let slot = filledInOpen; slot < SIGIL_SLOTS; slot += 1) {
      e.place(`${openIndex}t`, wedge(open.outer - TICK, open.outer), slot, 'tick')
    }
  }

  return {
    shapes: [...e.shapes].map(([id, d]) => ({ id, d })),
    uses: e.uses,
    count: commits.length,
    used: slots.length,
    rings: ringsUsed(slots.length),
    per,
    remaining: open ? SIGIL_SLOTS - filledInOpen : 0,
    outlines: [],
  }
}

/**
 * The same ring, with only one piece of work lit.
 *
 * `subset` is expected to be the commits that touched one entry. Its wedges
 * land on the slots the FULL record gave them, so an entry's mark says where
 * in the life of this interface that entry happened — and two entries' marks
 * can be compared, because they are cut from the same ring rather than each
 * being scaled to its own handful of commits.
 *
 * No ticks. Sixty-four of them to light three would spend the page's html
 * budget drawing everything the entry is not. The ring is stated once as a
 * baseline circle instead.
 */
export function sigilOf(
  all: readonly Commit[],
  subset: readonly Commit[],
): Sigil {
  if (all.length === 0 || subset.length === 0) return EMPTY

  const wanted = new Set(subset.map((c) => c.sha))
  const { slots, per } = fold(all)
  const e = emitter()
  const outlines = new Set<number>()
  let lit = 0

  slots.forEach((s, i) => {
    const at = seat(i)
    if (!at) return
    outlines.add(at.ring.inner)
    if (!s.shas.some((sha) => wanted.has(sha))) return
    lit += 1
    const depth = depthOf(s.lines)
    const to = at.ring.inner + ((at.ring.outer - at.ring.inner) * depth) / SIGIL_DEPTHS
    e.place(`${at.ringIndex}${depth}`, wedge(at.ring.inner, to), at.slot, 'wedge')
    if (s.milestone) {
      e.place(`${at.ringIndex}n`, wedge(at.ring.outer, at.ring.outer + NUB), at.slot, 'nub')
    }
  })

  return {
    shapes: [...e.shapes].map(([id, d]) => ({ id, d })),
    uses: e.uses,
    count: subset.length,
    used: lit,
    rings: ringsUsed(slots.length),
    per,
    remaining: 0,
    /* The innermost ring's baseline is 0 — a circle of radius zero is a point,
       and drawing it is noise. */
    outlines: [...outlines].filter((r) => r > 0).sort((a, b) => b - a),
  }
}

/**
 * The same mark as a standalone SVG document.
 *
 * For contexts that cannot host a component — the OG card is rasterised by
 * Satori, which takes an `<img>`, not a React tree of `<use>` elements. Colours
 * are passed in and written out literally, because `currentColor` and CSS
 * custom properties do not resolve inside an image.
 *
 * `<use>` is expanded here rather than referenced: a rasteriser that does not
 * resolve `xlink:href` would silently render an empty square, and an empty
 * square on a social card is worse than a slightly larger string nobody
 * downloads.
 */
export function sigilSvgMarkup(
  sigil: Sigil,
  colors: { readonly wedge: string; readonly tick: string; readonly nub: string },
): string {
  const shapes = new Map(sigil.shapes.map((s) => [s.id, s.d]))
  const groups = (['tick', 'wedge', 'nub'] as const)
    .map((kind) => {
      const paths = sigil.uses
        .filter((u) => u.kind === kind)
        .map((u) => {
          const d = shapes.get(u.id)
          if (!d) return ''
          const rotate = u.angle === 0 ? '' : ` transform="rotate(${u.angle} 100 100)"`
          return `<path d="${d}"${rotate}/>`
        })
        .join('')
      return paths ? `<g fill="${colors[kind]}">${paths}</g>` : ''
    })
    .join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIGIL_VIEWBOX} ${SIGIL_VIEWBOX}">` +
    groups +
    `</svg>`
  )
}
