/**
 * WebGL capability detection.
 *
 * The brief asks for "WebGL 실패 대비" — and failure here is not hypothetical.
 * A context is refused on hardware blocklists, under some remote-desktop and
 * VM setups, in low-power modes, and when a browser has already handed out
 * its maximum number of contexts. Assuming support and catching the error
 * later means the visitor watches 100 KB download to render nothing.
 *
 * The probe creates a throwaway context and disposes of it immediately: a
 * leaked context counts against that ceiling and can make the real one fail.
 */
export type WebGLSupport = 'yes' | 'no' | 'unknown'

export function detectWebGL(): WebGLSupport {
  if (typeof window === 'undefined') return 'unknown'
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ??
      (canvas.getContext('webgl') as WebGLRenderingContext | null)
    if (!gl) return 'no'
    // Release it before the real renderer asks for one.
    const lose = gl.getExtension('WEBGL_lose_context')
    lose?.loseContext()
    return 'yes'
  } catch {
    return 'no'
  }
}
