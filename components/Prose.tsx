import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import styles from './Prose.module.css'

/**
 * Long-form body copy.
 *
 * MDX is compiled here, in a Server Component, so none of the compiler and
 * none of the plugins reach the browser — an entry page costs the same
 * client JavaScript as a page with no content at all.
 */
export function Prose({ source }: { source: string }) {
  return (
    <div className={styles.prose}>
      <MDXRemote
        source={source}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug],
          },
        }}
      />
    </div>
  )
}
