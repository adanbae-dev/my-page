import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { memoStatic } from '@/lib/memo'

/**
 * What this site costs, as content.
 *
 * The performance budget was an internal gate: a number in perf.budget.json
 * that failed a build and was never seen by anyone reading the site. This
 * publishes it. Every page can state its own gzip transfer size against the
 * limit this repository holds itself to, and /build states the whole table.
 *
 * That only means anything if the number is the same one the gate uses, so it
 * is: `pnpm sync:perf` writes this file from lib/perf/measure.mjs, which is
 * also what `pnpm check:budget` imports. One measurement, two readers.
 *
 * TWO refusals worth naming, because they are opposite on purpose:
 *
 *   file absent    Returns null and the readouts render nothing. A fresh
 *                  clone has never run `sync:perf`, and a site that will not
 *                  build until someone runs a reporting script is a worse
 *                  problem than a page missing one line.
 *   file malformed  Throws, which fails the build. A hand-edited or
 *                  half-merged snapshot would publish a wrong number with the
 *                  full authority of a measured one. That is the single thing
 *                  this feature must not do.
 */

const SNAPSHOT = join(process.cwd(), 'lib', 'perf.data.json')

export const PERF_KEYS = ['html', 'css', 'js', 'font', 'total'] as const
export type PerfKey = (typeof PERF_KEYS)[number]

export type RouteWeight = Readonly<Record<PerfKey, number>>

export type PerfSnapshot = {
  readonly generatedAt: string
  /** Commit the measured build was made from. Empty when git was unreadable. */
  readonly head: string
  readonly budgets: Readonly<Record<string, number>>
  readonly shared: number
  readonly deferred: number
  readonly routes: Readonly<Record<string, RouteWeight>>
}

export class PerfError extends Error {
  constructor(message: string) {
    super(`lib/perf.data.json: ${message}`)
    this.name = 'PerfError'
  }
}

const isCount = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0

function toRouteWeight(route: string, v: unknown): RouteWeight {
  if (typeof v !== 'object' || v === null) {
    throw new PerfError(`route "${route}" is not an object`)
  }
  const rec = v as Record<string, unknown>
  const out = {} as Record<PerfKey, number>
  for (const k of PERF_KEYS) {
    if (!isCount(rec[k])) {
      throw new PerfError(`route "${route}" has no numeric "${k}"`)
    }
    out[k] = rec[k] as number
  }
  return out
}

export const perf = memoStatic((): PerfSnapshot | null => {
  if (!existsSync(SNAPSHOT)) return null

  const raw: unknown = JSON.parse(readFileSync(SNAPSHOT, 'utf8'))
  if (typeof raw !== 'object' || raw === null) throw new PerfError('not an object')
  const o = raw as Record<string, unknown>

  if (typeof o['generatedAt'] !== 'string') throw new PerfError('no generatedAt')
  if (typeof o['head'] !== 'string') throw new PerfError('no head')
  if (!isCount(o['shared'])) throw new PerfError('no numeric shared')
  if (!isCount(o['deferred'])) throw new PerfError('no numeric deferred')

  const budgetsRaw = o['budgets']
  if (typeof budgetsRaw !== 'object' || budgetsRaw === null) {
    throw new PerfError('no budgets')
  }
  const budgets: Record<string, number> = {}
  for (const [k, v] of Object.entries(budgetsRaw as Record<string, unknown>)) {
    if (!isCount(v)) throw new PerfError(`budget "${k}" is not a number`)
    budgets[k] = v
  }
  if (!isCount(budgets['total'])) throw new PerfError('no total budget')

  const routesRaw = o['routes']
  if (typeof routesRaw !== 'object' || routesRaw === null) {
    throw new PerfError('no routes')
  }
  const routes: Record<string, RouteWeight> = {}
  for (const [route, v] of Object.entries(routesRaw as Record<string, unknown>)) {
    routes[route] = toRouteWeight(route, v)
  }
  if (Object.keys(routes).length === 0) throw new PerfError('routes is empty')

  return {
    generatedAt: o['generatedAt'],
    head: o['head'],
    budgets,
    shared: o['shared'],
    deferred: o['deferred'],
    routes,
  }
})

/** One route's weight, or null when the snapshot predates that route. */
export function weightOf(route: string): RouteWeight | null {
  return perf()?.routes[route] ?? null
}

/** The heaviest route in the record — what the budget actually binds on. */
export function heaviest(): { route: string; weight: RouteWeight } | null {
  const snap = perf()
  if (!snap) return null
  let best: { route: string; weight: RouteWeight } | null = null
  for (const [route, weight] of Object.entries(snap.routes)) {
    if (!best || weight.total > best.weight.total) best = { route, weight }
  }
  return best
}

export const KB = (bytes: number): string => (bytes / 1024).toFixed(1)
export const PCT = (bytes: number, limit: number): number =>
  Math.round((bytes / limit) * 100)
