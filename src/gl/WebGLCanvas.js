import * as THREE from 'three';
import gsap from 'gsap';
import {
  vertexWaveShader,
  vertexBasicShader,
  fragmentDisplacementShader,
  fragmentBasicShader,
  fragmentMaskWipeShader
} from './shaders.js';

export class WebGLCanvas {
  constructor(container) {
    this.container = container;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene = new THREE.Scene();

    // 1 unit = 1 pixel camera setup
    this.fov = 45;
    this.camera = new THREE.PerspectiveCamera(this.fov, this.width / this.height, 1, 2000);
    this.updateCameraDistance();

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.domElement = this.renderer.domElement;
    this.domElement.className = 'gl-canvas';
    this.domElement.style.position = 'fixed';
    this.domElement.style.top = '0';
    this.domElement.style.left = '0';
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';
    this.domElement.style.pointerEvents = 'none';
    this.domElement.style.zIndex = '3';

    this.container.appendChild(this.domElement);

    this.clock = new THREE.Clock();
    this.textureLoader = new THREE.TextureLoader();
    this.loadedImages = new Map();

    this.mesh = null;
    this.material = null;
    this.isTransitioning = false;
    this.isVisible = true;
    this.menuTween = null;
    this.menuTexture = this.createMenuTexture();

    // Load transition sprite mask (80 frames: 10 columns x 8 rows)
    this.maskTexture = this.textureLoader.load('/assets/textures/transition-rtl.png', (tex) => {
      tex.generateMipmaps = false;
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
    });

    this.initHeroPlane();
    this.bindEvents();
    this.render();
  }

  createMenuTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(size * 0.25, size * 0.3, 0, size * 0.5, size * 0.5, size * 0.75);
    gradient.addColorStop(0, '#131313');
    gradient.addColorStop(0.55, '#070707');
    gradient.addColorStop(1, '#010101');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    // Fine organic film grain
    for (let y = 0; y < size; y += 2) {
      for (let x = 0; x < size; x += 2) {
        const alpha = Math.random() * 0.04;
        context.fillStyle = `rgba(255,255,255,${alpha})`;
        context.fillRect(x, y, 1, 1);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  updateCameraDistance() {
    this.cameraDistance = this.height / (2 * Math.tan((this.fov * Math.PI) / 360));
    this.camera.position.set(0, 0, this.cameraDistance);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  calculateResolution(imageWidth, imageHeight, containerWidth, containerHeight) {
    const imageAspect = imageWidth / imageHeight;
    const containerAspect = containerWidth / containerHeight;
    let a1 = 1;
    let a2 = 1;

    if (containerAspect > imageAspect) {
      a1 = (containerWidth / containerHeight) * (imageHeight / imageWidth);
      a2 = 1;
    } else {
      a1 = 1;
      a2 = (containerHeight / containerWidth) * (imageWidth / imageHeight);
    }
    return new THREE.Vector4(containerWidth, containerHeight, a1, a2);
  }

  loadTexture(url) {
    if (this.loadedImages.has(url)) {
      return Promise.resolve(this.loadedImages.get(url));
    }
    return new Promise((resolve) => {
      this.textureLoader.load(url, (tex) => {
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        this.loadedImages.set(url, tex);
        resolve(tex);
      }, undefined, () => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 100, 100);
        const fallbackTex = new THREE.CanvasTexture(canvas);
        this.loadedImages.set(url, fallbackTex);
        resolve(fallbackTex);
      });
    });
  }

  async initHeroPlane() {
    const geometry = new THREE.PlaneGeometry(this.width, this.height, 32, 32);

    const initialUrl = '/assets/images/hero-1.jpg';
    const texture = await this.loadTexture(initialUrl);

    // Using RawShaderMaterial to match the live site's exact shader source
    this.material = new THREE.RawShaderMaterial({
      vertexShader: vertexWaveShader,
      fragmentShader: fragmentDisplacementShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: this.calculateResolution(1920, 1167, this.width, this.height) },
        tMap1: { value: texture },
        tMap2: { value: texture },
        tMask: { value: this.maskTexture },
        uIndex: { value: new THREE.Vector2(0, 0) },
        tMenu: { value: this.menuTexture },
        uMenuProgress: { value: 0 }
      },
      transparent: true,
      depthTest: false,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.visible = this.isVisible;
    this.scene.add(this.mesh);
  }

  async transitionTo(nextUrl, imageWidth = 1920, imageHeight = 1080, duration = 1.2) {
    if (!this.material || this.isTransitioning) return;
    this.isTransitioning = true;

    const nextTexture = await this.loadTexture(nextUrl);
    
    // Previous target becomes current from
    const currentActive = this.material.uniforms.tMap2.value;
    this.material.uniforms.tMap1.value = currentActive;
    this.material.uniforms.tMap2.value = nextTexture;
    this.material.uniforms.uResolution.value = this.calculateResolution(imageWidth, imageHeight, this.width, this.height);
    this.material.uniforms.uIndex.value.set(0, 0);

    const anim = { progress: 0 };
    return new Promise((resolve) => {
      gsap.to(anim, {
        progress: 1,
        duration: duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          // 80 frames: 10 columns x 8 rows
          const frame = Math.min(79, Math.floor(anim.progress * 79));
          const col = frame % 10;
          const row = Math.floor(frame / 10);
          this.material.uniforms.uIndex.value.set(col, row);
        },
        onComplete: () => {
          this.material.uniforms.tMap1.value = nextTexture;
          this.material.uniforms.tMap2.value = nextTexture;
          this.material.uniforms.uIndex.value.set(0, 0);
          this.isTransitioning = false;
          resolve();
        }
      });
    });
  }

  setImage(url, imageWidth = 1920, imageHeight = 1080) {
    if (!this.material) return;
    this.loadTexture(url).then((texture) => {
      this.material.uniforms.tMap1.value = texture;
      this.material.uniforms.tMap2.value = texture;
      this.material.uniforms.uResolution.value = this.calculateResolution(imageWidth, imageHeight, this.width, this.height);
      this.material.uniforms.uIndex.value.set(0, 0);
    });
  }

  setVisible(visible) {
    this.isVisible = visible;
    if (this.mesh) {
      this.mesh.visible = visible;
    }
    if (this.domElement) {
      this.domElement.style.display = visible ? 'block' : 'none';
    }
  }

  transitionMenu(isOpen, duration = 1.15) {
    if (!this.material) return Promise.resolve();

    if (isOpen) {
      if (this.mesh) this.mesh.visible = true;
      if (this.domElement) this.domElement.style.display = 'block';
      this.domElement.style.opacity = '1';
      this.container.classList.add('canvas--menu-transition');
    }

    if (this.menuTween) this.menuTween.kill();

    const uniforms = this.material.uniforms;
    return new Promise((resolve) => {
      this.menuTween = gsap.to(uniforms.uMenuProgress, {
        value: isOpen ? 1 : 0,
        duration: duration,
        ease: 'power2.inOut',
        onComplete: () => {
          if (!isOpen) {
            this.container.classList.remove('canvas--menu-transition');
            if (this.mesh) this.mesh.visible = this.isVisible;
            if (this.domElement) this.domElement.style.display = this.isVisible ? 'block' : 'none';
          }
          this.menuTween = null;
          resolve();
        }
      });
    });
  }

  bindEvents() {
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.updateCameraDistance();

    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = new THREE.PlaneGeometry(this.width, this.height, 32, 32);
      if (this.material && this.material.uniforms.uResolution) {
        this.material.uniforms.uResolution.value = this.calculateResolution(1920, 1167, this.width, this.height);
      }
    }
  }

  render() {
    requestAnimationFrame(this.render.bind(this));

    const elapsedTime = this.clock.getElapsedTime();
    if (this.material && this.material.uniforms.uTime) {
      this.material.uniforms.uTime.value = elapsedTime;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
