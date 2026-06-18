import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/lib/useReducedMotion'

const VERT = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`

// Fully procedural candlelit nebula + twinkling stars. No textures/images — the
// whole field is computed per-pixel from value-noise fbm and time, so it fills
// any viewport seamlessly and "infinitely". A tiny hash dither kills banding.
const FRAG = `precision highp float;
uniform vec2 u_res;
uniform float u_time;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.,0.)), c = hash(i + vec2(0.,1.)), d = hash(i + vec2(1.,1.));
  vec2 u = f * f * (3. - 2. * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p){
  float v = 0., a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * noise(p); p = p * 2.02 + vec2(7.1, 3.7); a *= 0.5; }
  return v;
}
float starLayer(vec2 uv, float density, float thr){
  vec2 g = uv * density;
  vec2 id = floor(g), f = fract(g) - 0.5;
  float h = hash(id);
  float present = step(thr, h);
  float tw = 0.72 + 0.28 * sin(u_time * 0.6 + h * 62.0);
  return present * smoothstep(0.07, 0.0, length(f)) * tw;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time * 0.025;
  // domain-warped flowing nebula
  vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, t)), fbm(p * 1.4 + vec2(5.2, -t)));
  float n = fbm(p * 1.8 + q * 1.4 + vec2(t * 0.4, 0.0));
  float g = fbm(p * 1.1 + q * 0.8 - vec2(t * 0.6, t * 0.2));
  vec3 ink = vec3(0.050, 0.037, 0.072);
  vec3 plum = vec3(0.20, 0.09, 0.17);
  vec3 amethyst = vec3(0.34, 0.27, 0.52);
  vec3 gold = vec3(0.78, 0.57, 0.22);
  vec3 col = ink;
  col = mix(col, plum, smoothstep(0.35, 0.75, n));
  col = mix(col, amethyst, smoothstep(0.55, 0.95, n) * 0.45);
  col += gold * pow(smoothstep(0.55, 1.0, g), 1.5) * 0.45;
  // stars (two layers, different scale)
  float s = starLayer(uv, 60.0, 0.965) + starLayer(uv * 1.7 + 11.0, 40.0, 0.97) * 0.7;
  col += vec3(1.0, 0.96, 0.85) * s * 0.9;
  // vignette
  col *= smoothstep(1.2, 0.30, distance(uv, vec2(0.5, 0.40)));
  // dither — break up 8-bit banding
  col += (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`

function detectWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

/**
 * Site background: a procedural WebGL nebula (no image assets) that drifts and
 * twinkles. Rendered at a capped, downscaled resolution and ~30fps to stay
 * cheap; pauses when the tab is hidden; renders a single static frame under
 * prefers-reduced-motion. Falls back to a pure-CSS aurora if WebGL is absent.
 */
export function Backdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  const [supported] = useState(detectWebGL)

  useEffect(() => {
    if (!supported) return
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    }) as WebGLRenderingContext | null
    if (!gl) return

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      return sh
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)

    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    // one big triangle covering the clip space
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(prog, 'u_res')
    const uTime = gl.getUniformLocation(prog, 'u_time')

    const MAX = 1000 // cap the longest buffer edge; CSS upscales (nebula is soft)
    let w = 1
    let h = 1
    const resize = () => {
      const cssW = canvas.clientWidth || window.innerWidth
      const cssH = canvas.clientHeight || window.innerHeight
      const scale = Math.min(1, MAX / Math.max(cssW, cssH))
      w = Math.max(1, Math.round(cssW * scale))
      h = Math.max(1, Math.round(cssH * scale))
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
    }
    resize()
    window.addEventListener('resize', resize)

    const start = performance.now()
    let raf = 0
    let last = 0
    const draw = (now: number) => {
      gl.uniform2f(uRes, w, h)
      gl.uniform1f(uTime, (now - start) / 1000)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (now - last < 33) return // ~30fps
      last = now
      draw(now)
    }
    if (reduced) {
      draw(start + 8000) // a pleasant static frame
    } else {
      draw(performance.now()) // immediate first frame, don't wait for rAF
      raf = requestAnimationFrame(loop)
    }
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!reduced && !raf) {
        last = 0
        raf = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
      // NB: don't loseContext() here — getContext() returns the same context on
      // re-mount (e.g. StrictMode double-invoke), and a lost one can't be redrawn.
    }
  }, [supported, reduced])

  // Pure-CSS fallback (no images) when WebGL is unavailable.
  if (!supported) {
    return (
      <div className="backdrop" aria-hidden>
        <div className="aurora aurora-a" />
        <div className="aurora aurora-b" />
        <div className="aurora aurora-c" />
        <div className="backdrop-vignette" />
      </div>
    )
  }
  return <canvas ref={canvasRef} className="backdrop" aria-hidden />
}
