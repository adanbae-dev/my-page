/**
 * Structured data.
 *
 * Emitted as a plain script tag rather than through a library: the payloads
 * here are three small objects, and the schema.org vocabulary is the part
 * that needs care, not the serialisation.
 *
 * `JSON.stringify` output is escaped for `</script>` — a title containing
 * that sequence would otherwise close the tag and inject markup.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
