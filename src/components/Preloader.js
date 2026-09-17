import * as THREE from 'three';
import gsap from 'gsap';

const preloaderVertexShader = `
precision highp float;
attribute vec2 uv;
attribute vec3 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const preloaderFragmentShader = `
precision highp float;
uniform vec3 uColor;
uniform sampler2D tMask;
uniform vec2 uIndex;
varying vec2 vUv;

vec2 translateUV(vec2 uv, vec2 translate) {
  return uv - translate;
}

vec2 scaleUV(vec2 uv, vec2 scale, vec2 origin) {
  vec2 st = uv - origin;
  st /= scale;
  return st + origin;
}

void main() {
  float x = -(uIndex.x / 10.0);
  float y = -(uIndex.y / 8.0);
  vec2 currentUV = vec2(x, y);
  vec2 scaledUV = scaleUV(vUv, vec2(10.0, 8.0), vec2(0.0));
  vec2 transformedUV = translateUV(scaledUV, currentUV);
  vec4 mask = texture2D(tMask, transformedUV);
  float alpha = mask.r;
  gl_FragColor = vec4(uColor, alpha);
}
`;

export class Preloader {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.render();
    this.createLetters();
    this.initCanvas();
    this.start();
  }

  render() {
    this.element = document.querySelector('.preloader');
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.className = 'preloader';
      this.element.setAttribute('role', 'status');
      this.element.setAttribute('aria-label', 'Loading');
      this.element.innerHTML = `
        <div class="preloader__wordmark" aria-label="Matt Jinn">
          <span class="preloader__letter" aria-hidden="true">m</span><span class="preloader__letter" aria-hidden="true">a</span><span class="preloader__letter" aria-hidden="true">t</span><span class="preloader__letter" aria-hidden="true">t</span><span class="preloader__letter" aria-hidden="true">&nbsp;</span><span class="preloader__letter" aria-hidden="true">j</span><span class="preloader__letter" aria-hidden="true">i</span><span class="preloader__letter" aria-hidden="true">n</span><span class="preloader__letter" aria-hidden="true">n</span>
        </div>
      `;
      document.body.prepend(this.element);
    }
    document.documentElement.classList.add('fonts-ready');
  }

  createLetters() {
    this.letters = Array.from(this.element.querySelectorAll('.preloader__letter'));
    this.wordmark = this.element.querySelector('.preloader__wordmark');
    this.amplitude = 12;
    this.onResizeLetters();
    this.createTimeline();
  }

  createTimeline() {
    if (!this.letters || this.letters.length === 0) return;
    gsap.set(this.letters, { color: '#cbcdd5', y: 0 });
    this.timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.22 });
    this.timeline.to(this.letters, {
      keyframes: [
        { color: '#525873', duration: 0.3, ease: 'sine.out', y: () => -this.amplitude },
        { color: '#cbcdd5', duration: 0.3, ease: 'sine.in', y: 0 }
      ],
      stagger: 0.07
    });
  }

  onResizeLetters() {
    if (this.wordmark) {
      const fontSize = parseFloat(window.getComputedStyle(this.wordmark).fontSize) || 64;
      this.amplitude = 0.14 * fontSize;
    } else {
      this.amplitude = 9;
    }
    if (this.timeline) {
      this.timeline.kill();
      this.createTimeline();
    }
  }

  initCanvas() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.canvas = this.renderer.domElement;
    this.canvas.className = 'preloader__canvas';
    this.element.prepend(this.canvas);

    const loader = new THREE.TextureLoader();
    this.textureLoaded = new Promise((resolve) => {
      this.maskTexture = loader.load('/assets/textures/transition-center.jpg', (tex) => {
        tex.generateMipmaps = false;
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        resolve();
      });
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.RawShaderMaterial({
      vertexShader: preloaderVertexShader,
      fragmentShader: preloaderFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Vector3(1, 1, 1) },
        uIndex: { value: new THREE.Vector2(9, 7) }, // Frame 79: pure solid white
        tMask: { value: this.maskTexture }
      },
      transparent: true,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    this.renderLoop = () => {
      if (!this.renderer) return;
      this.renderer.render(this.scene, this.camera);
      this.rafId = requestAnimationFrame(this.renderLoop);
    };
    this.renderLoop();

    this.onWindowResize = () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
      this.onResizeLetters();
    };
    window.addEventListener('resize', this.onWindowResize);
  }

  async start() {
    // Wait for wave ripple presentation and texture ready
    await Promise.all([
      new Promise((resolve) => setTimeout(resolve, 2400)),
      this.textureLoaded
    ]);
    await this.animateOut();
  }

  async animateOut() {
    // 1. Smoothly fade out the wordmark completely
    if (this.wordmark) {
      await gsap.to(this.wordmark, {
        autoAlpha: 0,
        duration: 0.4,
        ease: 'power2.out'
      });
    }
    if (this.timeline) {
      this.timeline.kill();
    }

    // 2. 150ms pause of solid white stillness
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 3. Set preloader container background to transparent so Three.js vortex shows through
    this.element.classList.add('preloader--dissolving');

    // 4. Spiral vortex wipe: frame from 79 (solid white) down to 0 (fully transparent)
    const t = { value: 79 };
    await new Promise((resolve) => {
      gsap.to(t, {
        duration: 1.5,
        ease: 'linear',
        value: 0,
        onUpdate: () => {
          const e = Math.max(0, Math.min(79, Math.floor(t.value)));
          this.material.uniforms.uIndex.value.x = e % 10;
          this.material.uniforms.uIndex.value.y = Math.floor(e / 10);
        },
        onComplete: resolve
      });
    });

    // 5. Teardown and cleanup
    window.removeEventListener('resize', this.onWindowResize);
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.element.remove();
    document.documentElement.classList.add('preloaded');
    if (this.onComplete) this.onComplete();
  }
}
