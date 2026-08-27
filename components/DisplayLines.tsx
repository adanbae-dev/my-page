import { Fragment } from 'react'
import type React from 'react'

/**
 * Renders display copy as controlled visual lines without fusing the
 * accessible name. JSX drops the whitespace around a bare <br />, so
 * "How a thing" + <br /> + "is reasoned about" reads to a screen reader as
 * "How a thingis reasoned about". Emitting the space explicitly fixes that;
 * it collapses at the end of the visual line, so nothing moves on screen.
 *
 * Each line is wrapped so it can arrive on its own beat. `--i` carries the
 * line's index and `--n` its character count; styles/interaction.css uses the
 * first to offset a scroll range and the second to step a typed reveal one
 * character at a time. The span is inline and the explicit space stays inside
 * it, so the accessible name is exactly what it was before — the text is
 * never split below the line, which is what would make a screen reader spell
 * a headline out letter by letter.
 */
export function DisplayLines({ lines }: { lines: readonly string[] }) {
  /* Characters before each line, and the total. A typed reveal needs these to
     run at a constant SPEED: with only a per-line duration, a 17-character
     line and an 8-character line finish in the same time and therefore type
     at different speeds. With a per-character duration the delay for line i
     is the sum of the lines before it, which is what `--o` carries. */
  const total = lines.reduce((n, l) => n + l.length, 0)
  /* No running accumulator: React Compiler rejects reassigning a captured
     variable during render, and it is right to. Summing the lines before
     this one is equivalent and there are never more than a handful. */
  const offsets = lines.map((_, i) =>
    lines.slice(0, i).reduce((n, l) => n + l.length, 0),
  )

  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={line}>
          {i > 0 && <br />}
          <span
            className="lineIn"
            style={
              {
                '--i': i,
                // Character count, so a typed reveal takes exactly one step
                // per character instead of an arbitrary number.
                '--n': line.length,
                // Characters before this line, and in the whole headline —
                // together they make the typing speed constant across lines.
                '--o': offsets[i],
                '--total': total,
              } as React.CSSProperties
            }
          >
            {i < lines.length - 1 ? `${line} ` : line}
          </span>
        </Fragment>
      ))}
    </>
  )
}
