import * as THREE from 'three';
import gsap from 'gsap';

const vertexShader = `
precision highp float;
attribute vec2 uv;
attribute vec3 position;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform sampler2D tMask;
uniform vec2 uIndex;
uniform vec3 uColor;
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
  // If at the final frame (79 = col 9, row 7), guarantee 100% solid opacity
  if (uIndex.x >= 9.0 && uIndex.y >= 7.0) {
    gl_FragColor = vec4(uColor, 1.0);
    return;
  }

  float x = -(uIndex.x / 10.0);
  float y = -(uIndex.y / 8.0);
  vec2 currentUV = vec2(x, y);
  vec2 scaledUV = scaleUV(vUv, vec2(10.0, 8.0), vec2(0.0));
  vec2 transformedUV = translateUV(scaledUV, currentUV);
  vec4 mask = texture2D(tMask, transformedUV);
  
  // In transition-center.jpg, the closing hole has residual non-255 values up to ~0.90.
  // Re-scale mask.r so values >= 0.88 smoothly saturate to solid 1.0 with no hole.
  float smokeAlpha = clamp(mask.r / 0.88, 0.0, 1.0);
  
  gl_FragColor = vec4(uColor, smokeAlpha);
}
`;

export class MenuSmokeTransition {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.currentFrame = 0;
    this.tween = null;
    this.rafId = null;
    this.isLooping = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const loader = new THREE.TextureLoader();
    this.textureReady = false;
    this.textureLoaded = new Promise((resolve) => {
      this.maskTexture = loader.load(
        '/assets/textures/transition-center.jpg',
        (tex) => {
          tex.generateMipmaps = false;
          tex.magFilter = THREE.LinearFilter;
          tex.minFilter = THREE.LinearFilter;
          tex.wrapS = THREE.ClampToEdgeWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.needsUpdate = true;
          this.textureReady = true;
          this.setFrame(0);
          resolve();
        },
        undefined,
        (err) => {
          console.warn('Could not load transition-center.jpg', err);
          resolve();
        }
      );
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new THREE.Vector3(0.0, 0.0, 0.0) }, // Deep pitch black smoke
        uIndex: { value: new THREE.Vector2(0, 0) },
        tMask: { value: this.maskTexture }
      },
      transparent: true,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    this.onResize = () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      if (this.renderer) {
        this.renderer.setSize(this.width, this.height);
      }
      this.render();
    };
    window.addEventListener('resize', this.onResize);
    this.render();
  }

  setFrame(frameNum) {
    const f = Math.max(0, Math.min(79, Math.floor(frameNum)));
    this.currentFrame = f;
    const col = f % 10;
    const row = Math.floor(f / 10);
    this.material.uniforms.uIndex.value.set(col, row);
    this.render();
  }

  startLoop() {
    if (this.isLooping) return;
    this.isLooping = true;
    const loop = () => {
      if (!this.isLooping) return;
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    loop();
  }

  stopLoop() {
    this.isLooping = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.render();
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  async playOpen(duration = 0.7) {
    if (this.tween) this.tween.kill();
    await this.textureLoaded;

    this.setFrame(0);
    this.startLoop();

    const anim = { frame: 0 };
    return new Promise((resolve) => {
      this.tween = gsap.to(anim, {
        frame: 79,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          this.setFrame(anim.frame);
        },
        onComplete: () => {
          this.setFrame(79);
          this.stopLoop();
          resolve();
        }
      });
    });
  }

  async playClose(duration = 0.85) {
    if (this.tween) this.tween.kill();
    await this.textureLoaded;

    this.startLoop();
    const anim = { frame: this.currentFrame || 79 };

    return new Promise((resolve) => {
      this.tween = gsap.to(anim, {
        frame: 0,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          this.setFrame(anim.frame);
        },
        onComplete: () => {
          this.setFrame(0);
          this.stopLoop();
          resolve();
        }
      });
    });
  }

  destroy() {
    if (this.tween) this.tween.kill();
    this.stopLoop();
    window.removeEventListener('resize', this.onResize);
    if (this.material) this.material.dispose();
    if (this.maskTexture) this.maskTexture.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}
