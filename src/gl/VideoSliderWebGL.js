import * as THREE from 'three';
import gsap from 'gsap';

export class VideoSliderWebGL {
  constructor(options) {
    this.container = options.container;
    this.videosData = options.videosData;
    this.onSelectIndex = options.onSelectIndex;
    this.onClickActive = options.onClickActive;
    this.onProgress = options.onProgress;

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.currentIndex = 0;
    this.numSlides = this.videosData.length;

    // Physics & Drag state
    this.currentX = 0;
    this.targetX = 0;
    this.prevX = 0;
    this.velocity = 0;
    this.distortion = 0;
    this.isDragging = false;
    this.startX = 0;
    this.dragStartX = 0;
    this.dragStartTime = 0;
    this.isSettled = false;
    this.animationFrameId = null;

    this.initScene();
    this.initPlanes();
    this.bindEvents();
    this.startLoop();
  }

  initScene() {
    this.scene = new THREE.Scene();

    // 1 unit = 1 pixel camera setup
    this.fov = 45;
    this.camera = new THREE.PerspectiveCamera(this.fov, this.width / this.height, 1, 3000);
    this.updateCameraDistance();

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.domElement = this.renderer.domElement;
    this.domElement.className = 'videos__webgl-canvas';
    this.domElement.style.position = 'absolute';
    this.domElement.style.top = '0';
    this.domElement.style.left = '0';
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';
    this.domElement.style.zIndex = '1';
    this.domElement.style.cursor = 'grab';

    this.container.appendChild(this.domElement);
    this.clock = new THREE.Clock();
  }

  updateCameraDistance() {
    this.cameraDistance = this.height / (2 * Math.tan((this.fov * Math.PI) / 360));
    this.camera.position.set(0, 0, this.cameraDistance);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  calculatePlaneDimensions() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      const planeWidth = window.innerWidth * 0.9;
      const planeHeight = planeWidth * (350 / 571);
      const gap = window.innerWidth * 0.12;
      return { planeWidth, planeHeight, gap, stride: planeWidth + gap };
    }
    // Desktop: aspect-ratio 571/350
    const rem = window.innerWidth / 144;
    const planeWidth = Math.min(67.1 * rem, window.innerWidth * 0.52);
    const planeHeight = planeWidth * (350 / 571);
    const gap = 31 * rem;
    return { planeWidth, planeHeight, gap, stride: planeWidth + gap };
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

  initPlanes() {
    const { planeWidth, planeHeight, stride } = this.calculatePlaneDimensions();
    this.stride = stride;
    this.planeWidth = planeWidth;
    this.planeHeight = planeHeight;

    // High resolution grid segments for buttery-smooth vertex bulge curve
    this.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 64, 32);

    this.vertexShader = `
      precision highp float;
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform float uDistortion; // Velocity-driven 3D bulge intensity
      uniform float uTime;
      varying vec2 vUv;
      varying float vCurve;

      void main() {
        vUv = uv;
        vec3 p = position;
        
        // 3D Convex Bulge / Barrel Distortion
        // Pushes center forward (+Z) while pulling left and right edges backward (-Z)
        float edgeFactor = sin(uv.x * 3.14159265);
        float verticalArch = sin(uv.y * 3.14159265) * 0.25 + 0.75;
        
        // Dynamic bulge displacement
        float bulge = edgeFactor * verticalArch * uDistortion * 180.0;
        p.z += bulge;
        
        // Subtle horizontal barrel expansion
        p.x += (uv.x - 0.5) * abs(uDistortion) * 28.0;
        
        vCurve = bulge;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `;

    this.fragmentShader = `
      precision highp float;
      uniform sampler2D tMap;
      uniform vec4 uResolution;
      uniform float uDistortion;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vCurve;

      void main() {
        vec2 uv = (vUv - vec2(0.5)) * uResolution.zw + vec2(0.5);
        
        // Velocity chromatic aberration (RGB split on high momentum)
        float chroma = uDistortion * 0.025;
        float r = texture2D(tMap, clamp(uv + vec2(chroma, 0.0), 0.001, 0.999)).r;
        float g = texture2D(tMap, uv).g;
        float b = texture2D(tMap, clamp(uv - vec2(chroma, 0.0), 0.001, 0.999)).b;
        vec4 color = vec4(r, g, b, 1.0);
        
        // Subtle depth shading on 3D curved surface
        float depthShade = 1.0 - abs(vUv.x - 0.5) * abs(uDistortion) * 0.35;
        color.rgb *= depthShade;
        
        gl_FragColor = vec4(color.rgb, color.a * uOpacity);
      }
    `;

    this.slides = [];
    this.videoElements = [];

    this.videosData.forEach((item, index) => {
      // Create and start looping HTML5 video for texture stream
      const video = document.createElement('video');
      video.src = item.coverVideo;
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.autoplay = true;

      video.play().catch(() => {
        // Fallback if browser requires user gesture
      });

      this.videoElements.push(video);

      // Three.js VideoTexture
      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.generateMipmaps = false;

      // Fallback poster texture
      const textureLoader = new THREE.TextureLoader();
      const fallbackTexture = textureLoader.load(item.poster || '/assets/images/hero-1.jpg', () => {
        this.wakeLoop();
      });
      fallbackTexture.minFilter = THREE.LinearFilter;
      fallbackTexture.magFilter = THREE.LinearFilter;

      // Start with fallback texture immediately so planes are never empty
      const material = new THREE.RawShaderMaterial({
        vertexShader: this.vertexShader,
        fragmentShader: this.fragmentShader,
        uniforms: {
          tMap: { value: fallbackTexture },
          uResolution: { value: this.calculateResolution(571, 350, planeWidth, planeHeight) },
          uDistortion: { value: 0.0 },
          uOpacity: { value: 1.0 },
          uTime: { value: 0.0 }
        },
        transparent: true,
        depthTest: false,
        depthWrite: false
      });

      // Switch to videoTexture once video successfully streams
      video.addEventListener('playing', () => {
        material.uniforms.tMap.value = videoTexture;
        this.wakeLoop();
      });

      video.addEventListener('error', () => {
        material.uniforms.tMap.value = fallbackTexture;
        this.wakeLoop();
      });

      const mesh = new THREE.Mesh(this.geometry, material);
      // Position plane along horizontal track centered on screen
      const xPos = index * stride;
      mesh.position.set(xPos, 0, 0);
      this.scene.add(mesh);

      this.slides.push({
        mesh,
        material,
        video,
        videoTexture,
        fallbackTexture,
        initialX: xPos
      });
    });

    this.updatePlanePositions();
  }

  updatePlanePositions() {
    this.slides.forEach((slide, index) => {
      const x = slide.initialX + this.currentX;
      slide.mesh.position.x = x;
      slide.material.uniforms.uDistortion.value = this.distortion;
    });
  }

  bindEvents() {
    this.onMouseDown = this.handleMouseDown.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseUp = this.handleMouseUp.bind(this);
    this.onTouchStart = this.handleTouchStart.bind(this);
    this.onTouchMove = this.handleTouchMove.bind(this);
    this.onTouchEnd = this.handleTouchEnd.bind(this);
    this.onWheel = this.handleWheel.bind(this);
    this.onResize = this.handleResize.bind(this);

    this.domElement.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);

    this.domElement.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);

    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('resize', this.onResize);
  }

  handleMouseDown(e) {
    if (e.button !== 0) return;
    this.isDragging = true;
    this.startX = e.clientX;
    this.dragStartX = this.targetX;
    this.dragStartTime = Date.now();
    this.domElement.style.cursor = 'grabbing';
    this.wakeLoop();
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;
    const deltaX = e.clientX - this.startX;
    
    // Bounds with elastic resistance
    const minTarget = -(this.numSlides - 1) * this.stride;
    const maxTarget = 0;
    let newTarget = this.dragStartX + deltaX * 1.25;

    if (newTarget > maxTarget) {
      newTarget = maxTarget + (newTarget - maxTarget) * 0.25;
    } else if (newTarget < minTarget) {
      newTarget = minTarget + (newTarget - minTarget) * 0.25;
    }

    this.targetX = newTarget;
    this.wakeLoop();
  }

  handleMouseUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.domElement.style.cursor = 'grab';

    const deltaX = e.clientX - this.startX;
    const dragDuration = Date.now() - this.dragStartTime;
    const distanceMoved = Math.abs(deltaX);

    // If pure click without significant drag, trigger click action
    if (distanceMoved < 15 && dragDuration < 600) {
      const mouseX = e.clientX - window.innerWidth / 2;
      const clickedSlide = this.getSlideAtScreenX(mouseX);
      if (clickedSlide === this.currentIndex) {
        if (this.onClickActive) this.onClickActive(this.currentIndex);
      } else if (clickedSlide !== -1) {
        this.goToIndex(clickedSlide);
      }
      return;
    }

    // Determine target slide index based on drag release and velocity
    const releaseVelocity = deltaX / Math.max(dragDuration, 50);
    let targetIndex = this.currentIndex;

    if (releaseVelocity < -0.3 || deltaX < -this.stride * 0.25) {
      targetIndex = Math.min(this.numSlides - 1, this.currentIndex + 1);
    } else if (releaseVelocity > 0.3 || deltaX > this.stride * 0.25) {
      targetIndex = Math.max(0, this.currentIndex - 1);
    }

    this.goToIndex(targetIndex);
  }

  getSlideAtScreenX(screenXFromCenter) {
    for (let i = 0; i < this.slides.length; i++) {
      const planeCenter = this.slides[i].mesh.position.x;
      const halfWidth = this.planeWidth / 2;
      if (screenXFromCenter >= planeCenter - halfWidth && screenXFromCenter <= planeCenter + halfWidth) {
        return i;
      }
    }
    return -1;
  }

  handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    this.isDragging = true;
    this.startX = e.touches[0].clientX;
    this.dragStartX = this.targetX;
    this.dragStartTime = Date.now();
    this.wakeLoop();
  }

  handleTouchMove(e) {
    if (!this.isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - this.startX;

    const minTarget = -(this.numSlides - 1) * this.stride;
    const maxTarget = 0;
    let newTarget = this.dragStartX + deltaX * 1.35;

    if (newTarget > maxTarget) {
      newTarget = maxTarget + (newTarget - maxTarget) * 0.25;
    } else if (newTarget < minTarget) {
      newTarget = minTarget + (newTarget - minTarget) * 0.25;
    }

    this.targetX = newTarget;
    if (Math.abs(deltaX) > 10 && e.cancelable) {
      e.preventDefault();
    }
    this.wakeLoop();
  }

  handleTouchEnd(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    const touch = e.changedTouches[0];
    const deltaX = touch ? touch.clientX - this.startX : 0;
    const dragDuration = Date.now() - this.dragStartTime;

    if (Math.abs(deltaX) < 15 && dragDuration < 600) {
      if (this.onClickActive) this.onClickActive(this.currentIndex);
      return;
    }

    const releaseVelocity = deltaX / Math.max(dragDuration, 50);
    let targetIndex = this.currentIndex;

    if (releaseVelocity < -0.3 || deltaX < -this.stride * 0.25) {
      targetIndex = Math.min(this.numSlides - 1, this.currentIndex + 1);
    } else if (releaseVelocity > 0.3 || deltaX > this.stride * 0.25) {
      targetIndex = Math.max(0, this.currentIndex - 1);
    }

    this.goToIndex(targetIndex);
  }

  handleWheel(e) {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || Math.abs(e.deltaY) > 15) {
      e.preventDefault();
      const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY);
      
      this.targetX -= delta * 0.8;
      const minTarget = -(this.numSlides - 1) * this.stride;
      this.targetX = Math.max(minTarget, Math.min(0, this.targetX));

      if (this.wheelTimeout) clearTimeout(this.wheelTimeout);
      this.wheelTimeout = setTimeout(() => {
        // Snap to closest slide on wheel end
        const closest = Math.round(-this.targetX / this.stride);
        this.goToIndex(Math.max(0, Math.min(this.numSlides - 1, closest)));
      }, 120);

      this.wakeLoop();
    }
  }

  goToIndex(index) {
    this.currentIndex = Math.max(0, Math.min(this.numSlides - 1, index));
    this.targetX = -this.currentIndex * this.stride;

    if (this.onSelectIndex) {
      this.onSelectIndex(this.currentIndex);
    }
    this.wakeLoop();
  }

  handleResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.updateCameraDistance();

    const { planeWidth, planeHeight, stride } = this.calculatePlaneDimensions();
    this.stride = stride;
    this.planeWidth = planeWidth;
    this.planeHeight = planeHeight;

    this.geometry.dispose();
    this.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 64, 32);

    this.slides.forEach((slide, index) => {
      slide.mesh.geometry = this.geometry;
      slide.initialX = index * stride;
      slide.material.uniforms.uResolution.value = this.calculateResolution(571, 350, planeWidth, planeHeight);
    });

    this.targetX = -this.currentIndex * this.stride;
    this.currentX = this.targetX;
    this.updatePlanePositions();
    this.wakeLoop();
  }

  wakeLoop() {
    this.isSettled = false;
    if (!this.animationFrameId) {
      this.startLoop();
    }
  }

  startLoop() {
    const render = () => {
      const elapsedTime = this.clock.getElapsedTime();

      // Smooth damped position lerp
      this.currentX += (this.targetX - this.currentX) * 0.12;

      // Calculate instantaneous horizontal velocity
      const instantVelocity = (this.currentX - this.prevX) * 0.05;
      this.prevX = this.currentX;

      // Target distortion based on velocity (direction-aware convex 3D curve)
      const targetDistortion = Math.max(-1.0, Math.min(1.0, instantVelocity * 1.6));
      this.distortion += (targetDistortion - this.distortion) * 0.18;

      // Update shader uniforms & positions
      this.slides.forEach((slide) => {
        slide.material.uniforms.uTime.value = elapsedTime;
      });
      this.updatePlanePositions();

      // Emit continuous normalized progress for ticker (0.0 to 1.0)
      const totalDistance = (this.numSlides - 1) * this.stride || 1;
      const progress = Math.max(0, Math.min(1, -this.currentX / totalDistance));
      if (this.onProgress) {
        this.onProgress(progress);
      }

      this.renderer.render(this.scene, this.camera);

      // Check if settled to save GPU cycles
      const posDiff = Math.abs(this.targetX - this.currentX);
      const distortionVal = Math.abs(this.distortion);

      if (!this.isDragging && posDiff < 0.08 && distortionVal < 0.001) {
        this.currentX = this.targetX;
        this.distortion = 0;
        this.updatePlanePositions();
        this.renderer.render(this.scene, this.camera);
        this.isSettled = true;
        this.animationFrameId = null;
        return;
      }

      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);

    this.domElement.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);

    this.domElement.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.onResize);

    // Cleanup WebGL resources & video elements
    this.slides.forEach((slide) => {
      slide.video.pause();
      slide.video.src = '';
      slide.video.load();
      slide.videoTexture.dispose();
      slide.fallbackTexture.dispose();
      slide.material.dispose();
      slide.mesh.geometry.dispose();
      this.scene.remove(slide.mesh);
    });

    this.geometry.dispose();
    this.renderer.dispose();

    if (this.domElement.parentNode) {
      this.domElement.parentNode.removeChild(this.domElement);
    }
  }
}
