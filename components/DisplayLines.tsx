import { Fragment } from 'react'

/**
 * Renders display copy as controlled visual lines without fusing the
 * accessible name. JSX drops the whitespace around a bare <br />, so
 * "How a thing" + <br /> + "is reasoned about" reads to a screen reader as
 * "How a thingis reasoned about". Emitting the space explicitly fixes that;
 * it collapses at the end of the visual line, so nothing moves on screen.
 */
export function DisplayLines({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={line}>
          {i > 0 && <br />}
          {i < lines.length - 1 ? `${line} ` : line}
        </Fragment>
      ))}
    </>
  )
}
