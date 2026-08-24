/* ============================================================
   SideRays — vanilla port of the React Bits component.

   This site has no bundler and no npm project (plain <script src>),
   so the React wrapper and its `ogl` dependency could not be used
   as shipped. The wrapper was only lifecycle management, and the
   parts of ogl it used (Renderer / Triangle / Program / Mesh) amount
   to a fullscreen-triangle pass — reproduced here in raw WebGL, with
   ogl's own Renderer defaults (alpha on, premultipliedAlpha off) so
   compositing matches.

   The fragment shader is copied verbatim, so the effect renders
   identically. Zero dependencies, nothing to install.

   Config comes from data-* attributes on the container, so the look
   can be tuned in the HTML without touching this file.
   ============================================================ */
(function () {
  'use strict';

  var VERT = [
    'attribute vec2 position;',
    'void main() {',
    '  gl_Position = vec4(position, 0.0, 1.0);',
    '}'
  ].join('\n');

  /* --- verbatim from the component --- */
  var FRAG = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
    0.0, 1.0) *
    clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

  float tiltRad = iTilt * 3.14159265 / 180.0;
  float cs = cos(tiltRad);
  float sn = sin(tiltRad);
  vec2 rel = coord - rayPos;
  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

  float halfSpread = iSpread * 0.275;
  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);

  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
  float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
  color.rgb *= brightness;

  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);

  color.a = max(color.r, max(color.g, color.b)) * iOpacity;
  gl_FragColor = color;
}`;

  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    return m
      ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255]
      : [1, 1, 1];
  }

  function originToFlip(origin) {
    switch (origin) {
      case 'top-left': return [1, 0];
      case 'bottom-right': return [0, 1];
      case 'bottom-left': return [1, 1];
      default: return [0, 0];          // top-right
    }
  }

  function num(el, name, fallback) {
    var v = parseFloat(el.getAttribute('data-' + name));
    return isNaN(v) ? fallback : v;
  }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      // Shader failure must not take the page down with it.
      console.warn('SideRays: shader failed —', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function mount(container) {
    var opts = {
      speed: num(container, 'speed', 2.5),
      rayColor1: container.getAttribute('data-ray-color1') || '#EAB308',
      rayColor2: container.getAttribute('data-ray-color2') || '#96c8ff',
      intensity: num(container, 'intensity', 2),
      spread: num(container, 'spread', 2),
      origin: container.getAttribute('data-origin') || 'top-right',
      tilt: num(container, 'tilt', 0),
      saturation: num(container, 'saturation', 1.5),
      blend: num(container, 'blend', 0.75),
      falloff: num(container, 'falloff', 1.6),
      opacity: num(container, 'opacity', 1)
    };

    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    // ogl's Renderer defaults, with alpha turned on as the component does.
    var attrs = { alpha: true, premultipliedAlpha: false, antialias: false, depth: true };
    var gl = canvas.getContext('webgl', attrs) || canvas.getContext('experimental-webgl', attrs);

    // No WebGL (old browser, blocklisted GPU, headless): leave the hero as it is.
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('SideRays: link failed —', gl.getProgramInfoLog(prog));
      return null;
    }
    gl.useProgram(prog);

    // Fullscreen triangle — what ogl's Triangle geometry provides.
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['iTime', 'iResolution', 'iSpeed', 'iRayColor1', 'iRayColor2', 'iIntensity',
     'iSpread', 'iFlipX', 'iFlipY', 'iTilt', 'iSaturation', 'iBlend',
     'iFalloff', 'iOpacity'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });

    var flip = originToFlip(opts.origin);
    gl.uniform1f(U.iSpeed, opts.speed);
    gl.uniform3fv(U.iRayColor1, hexToRgb(opts.rayColor1));
    gl.uniform3fv(U.iRayColor2, hexToRgb(opts.rayColor2));
    gl.uniform1f(U.iIntensity, opts.intensity);
    gl.uniform1f(U.iSpread, opts.spread);
    gl.uniform1f(U.iFlipX, flip[0]);
    gl.uniform1f(U.iFlipY, flip[1]);
    gl.uniform1f(U.iTilt, opts.tilt);
    gl.uniform1f(U.iSaturation, opts.saturation);
    gl.uniform1f(U.iBlend, opts.blend);
    gl.uniform1f(U.iFalloff, opts.falloff);
    gl.uniform1f(U.iOpacity, opts.opacity);

    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    var raf = null, running = false, visible = false, w = 0, h = 0;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = container.clientWidth;
      h = container.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.iResolution, canvas.width, canvas.height);
    }

    function draw(t) {
      gl.uniform1f(U.iTime, t * 0.001);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function frame(t) {
      if (!running) return;
      draw(t);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    window.addEventListener('resize', resize);
    resize();

    var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

    function wanted() {
      // Off-screen or hidden tab: nothing to render. Reduced motion gets a
      // single static frame rather than a running animation.
      return visible && !document.hidden && !calm.matches;
    }

    function sync() {
      if (wanted()) start();
      else { stop(); if (visible) draw(0); }
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        sync();
      }, { threshold: 0.01 }).observe(container);
    } else {
      visible = true;
    }

    document.addEventListener('visibilitychange', sync);
    if (calm.addEventListener) calm.addEventListener('change', sync);

    sync();
    return true;
  }

  function boot() {
    var nodes = document.querySelectorAll('.side-rays');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
