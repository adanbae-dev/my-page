import { Fragment } from 'react'
import type React from 'react'

/**
 * Renders display copy as controlled visual lines without fusing the
 * accessible name. JSX drops the whitespace around a bare <br />, so
 * "How a thing" + <br /> + "is reasoned about" reads to a screen reader as
 * "How a thingis reasoned about". Emitting the space explicitly fixes that;
 * it collapses at the end of the visual line, so nothing moves on screen.
 *
 * Each line is wrapped so it can arrive on its own beat — `--i` carries the
 * line's index and styles/interaction.css offsets its scroll range by it.
 * The span is inline and the explicit space stays inside it, so the
 * accessible name is exactly what it was before.
 */
export function DisplayLines({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={line}>
          {i > 0 && <br />}
          <span className="lineIn" style={{ '--i': i } as React.CSSProperties}>
            {i < lines.length - 1 ? `${line} ` : line}
          </span>
        </Fragment>
      ))}
    </>
  )
}
