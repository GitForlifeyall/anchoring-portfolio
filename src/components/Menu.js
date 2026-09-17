import gsap from 'gsap';
import { MenuSmokeTransition } from '../gl/MenuSmokeTransition.js';

export class Menu {
  constructor(onNavigate, onHoverMedia) {
    this.onNavigate = onNavigate;
    this.onHoverMedia = onHoverMedia;
    this.activeRoute = '/';
    this.activeIdx = 0;
    this.isOpen = false;
    this.linkTimelines = [];

    // Continuous curved card wheel state
    this.wheel = {
      currentY: 0,
      targetY: 0,
      lastY: 0,
      speed: 0,
      direction: 'up',
      isDragging: false,
      startY: 0,
      startTargetY: 0,
      rafId: null,
      isRunning: false
    };

    // Continuous floating mouse parallax
    this.parallax = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0
    };

    this.onMouseMove = this.handleMouseMove.bind(this);
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });

    this.onResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.onResize, { passive: true });

    this.render();
    this.updateSpacing();

    const canvas = this.element.querySelector('.menu__canvas');
    if (canvas) {
      this.smokeTransition = new MenuSmokeTransition(canvas);
    }
  }

  updateSpacing() {
    const cardHeight = (this.cards && this.cards[0] && this.cards[0].offsetHeight) || 400;
    // Spacing calibrated so that top card (y = -spacing) and bottom card (y = +spacing)
    // always have their corners peeking into the top-left and bottom-left of the viewport
    this.spacing = Math.max(260, Math.round(cardHeight * 1.15));
    this.totalHeight = 5 * this.spacing;
    this.halfTotal = this.totalHeight / 2;
  }

  handleResize() {
    this.updateSpacing();
    if (this.isOpen) {
      this.wheel.targetY = -this.activeIdx * this.spacing;
    }
  }

  handleMouseMove(e) {
    if (!this.isOpen) return;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const normX = (e.clientX - centerX) / centerX;
    const normY = (e.clientY - centerY) / centerY;

    // Organic floating parallax (max ±16px X, ±12px Y)
    this.parallax.targetX = normX * 16;
    this.parallax.targetY = normY * 12;
  }

  renderWord(word) {
    const charsPrimary = [...word].map((char) => {
      const safeChar = char === ' ' ? '&nbsp;' : char;
      return `<div aria-hidden="true" class="menu__char menu__char--primary" style="position: relative; display: inline-block; transform-origin: 50% 50% -30px; will-change: transform, opacity; transform: translate3d(0px, 0px, 0px) rotateX(0deg); opacity: 1; visibility: visible;">${safeChar}</div>`;
    }).join('');

    const charsSecondary = [...word].map((char) => {
      const safeChar = char === ' ' ? '&nbsp;' : char;
      return `<div aria-hidden="true" class="menu__char menu__char--secondary" style="position: relative; display: inline-block; transform-origin: 50% 50% -30px; will-change: transform, opacity; transform: translate3d(0px, 0px, -30px) rotateX(90deg); opacity: 0; visibility: hidden;">${safeChar}</div>`;
    }).join('');

    return `
      <span class="menu__list__text menu__list__text--primary" aria-hidden="true" aria-label="${word}">${charsPrimary}</span>
      <span class="menu__list__text menu__list__text--secondary" aria-hidden="true" aria-label="${word}">${charsSecondary}</span>
    `;
  }

  render() {
    this.element = document.createElement('nav');
    this.element.className = 'menu';
    this.element.style.visibility = 'hidden';
    this.element.style.pointerEvents = 'none';
    this.element.innerHTML = `
      <canvas class="menu__canvas"></canvas>
      <div class="menu__box">
        <!-- 5-card continuous vertical carousel wheel along curved trajectory -->
        <div class="menu__medias">
          <figure class="menu__medias__media menu__medias__media--active" data-index="0">
            <img alt="Music" class="menu__medias__image loaded" src="/assets/menu/menu-1.jpg" />
          </figure>
          <figure class="menu__medias__media" data-index="1">
            <img alt="Videos" class="menu__medias__image loaded" src="/assets/menu/menu-2.jpg" />
          </figure>
          <figure class="menu__medias__media" data-index="2">
            <img alt="Shows" class="menu__medias__image loaded" src="/assets/menu/menu-3.jpg" />
          </figure>
          <figure class="menu__medias__media" data-index="3">
            <img alt="About" class="menu__medias__image loaded" src="/assets/menu/menu-4.jpg" />
          </figure>
          <figure class="menu__medias__media" data-index="4">
            <img alt="" class="menu__medias__image loaded" src="/assets/menu/menu-5.jpg" />
          </figure>
        </div>

        <!-- Staggered navigation links with 3D character roll -->
        <ul class="menu__list">
          <li class="menu__list__item">
            <a aria-label="music" class="menu__list__link" data-index="0" href="/music/" data-route="/music/">
              ${this.renderWord('music')}
            </a>
          </li>
          <li class="menu__list__item">
            <a aria-label="videos" class="menu__list__link" data-index="1" href="/videos/" data-route="/videos/">
              ${this.renderWord('videos')}
            </a>
          </li>
          <li class="menu__list__item">
            <a aria-label="shows" class="menu__list__link" data-index="2" href="/shows/" data-route="/shows/">
              ${this.renderWord('shows')}
            </a>
          </li>
          <li class="menu__list__item">
            <a aria-label="about" class="menu__list__link" data-index="3" href="/about/" data-route="/about/">
              ${this.renderWord('about')}
            </a>
          </li>
        </ul>

        <!-- Bottom right social links (commented out)
        <div class="menu__social">
          <ul class="menu__social__list">
            <li class="menu__social__item">
              <a class="menu__social__link" href="https://open.spotify.com/artist/0CYB6ZJaRsM378rSlbTwGB" target="_blank" rel="noopener" aria-label="Spotify">
                Spotify
                <svg class="menu__social__icon" viewBox="0 0 24 24">
                  <use xlink:href="#spotify"></use>
                </svg>
              </a>
            </li>
            <li class="menu__social__item">
              <a class="menu__social__link" href="https://music.apple.com/us/artist/matt-jinn/1689268159" target="_blank" rel="noopener" aria-label="Apple Music">
                Apple Music
                <svg class="menu__social__icon" viewBox="0 0 24 24">
                  <use xlink:href="#apple-music"></use>
                </svg>
              </a>
            </li>
            <li class="menu__social__item">
              <a class="menu__social__link" href="https://www.youtube.com/@mattjinn22" target="_blank" rel="noopener" aria-label="YouTube">
                YouTube
                <svg class="menu__social__icon" viewBox="0 0 24 24">
                  <use xlink:href="#youtube"></use>
                </svg>
              </a>
            </li>
            <li class="menu__social__item">
              <a class="menu__social__link" href="https://www.tiktok.com/@mattjinn" target="_blank" rel="noopener" aria-label="TikTok">
                TikTok
                <svg class="menu__social__icon" viewBox="0 0 24 24">
                  <use xlink:href="#tiktok"></use>
                </svg>
              </a>
            </li>
            <li class="menu__social__item">
              <a class="menu__social__link" href="https://www.instagram.com/mattjinn22/" target="_blank" rel="noopener" aria-label="Instagram">
                Instagram
                <svg class="menu__social__icon" viewBox="0 0 24 24">
                  <use xlink:href="#instagram"></use>
                </svg>
              </a>
            </li>
          </ul>
        </div>
        -->
      </div>
    `;

    this.mediaContainer = this.element.querySelector('.menu__medias');
    this.cards = Array.from(this.element.querySelectorAll('.menu__medias__media'));

    this.initLinks();
    this.initDragPhysics();
  }

  initDragPhysics() {
    if (!this.mediaContainer) return;

    const onPointerStart = (e) => {
      this.wheel.isDragging = true;
      this.wheel.startY = (e.touches ? e.touches[0].clientY : e.clientY);
      this.wheel.startTargetY = this.wheel.targetY;
      this.mediaContainer.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!this.wheel.isDragging) return;
      const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
      const delta = clientY - this.wheel.startY;
      this.wheel.targetY = this.wheel.startTargetY + delta * 1.3;
    };

    const onPointerEnd = () => {
      if (!this.wheel.isDragging) return;
      this.wheel.isDragging = false;
      this.mediaContainer.style.cursor = 'grab';

      // Snap wheel smoothly to nearest card
      const nearestIdx = Math.round(-this.wheel.targetY / this.spacing);
      this.wheel.targetY = -nearestIdx * this.spacing;
    };

    this.mediaContainer.addEventListener('mousedown', onPointerStart);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerEnd);

    this.mediaContainer.addEventListener('touchstart', onPointerStart, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerEnd);
  }

  initLinks() {
    const links = this.element.querySelectorAll('.menu__list__link');
    this.linkTimelines = [];

    links.forEach((link) => {
      const idx = parseInt(link.getAttribute('data-index'), 10);
      const primaryChars = link.querySelectorAll('.menu__list__text--primary .menu__char');
      const secondaryChars = link.querySelectorAll('.menu__list__text--secondary .menu__char');

      // Exact 3D character roll timeline (Nb)
      const tl = gsap.timeline({ paused: true });
      tl.to(primaryChars, {
        autoAlpha: 0,
        rotateX: -90,
        transformOrigin: '50% 50% -30px',
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.05
      }, 0);
      tl.fromTo(secondaryChars, {
        autoAlpha: 0,
        rotateX: 90,
        transformOrigin: '50% 50% -30px'
      }, {
        autoAlpha: 1,
        rotateX: 0,
        transformOrigin: '50% 50% -30px',
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.05
      }, 0);

      this.linkTimelines[idx] = tl;

      link.addEventListener('mouseenter', () => {
        tl.play();
        this.setWheelTarget(idx);
      });

      link.addEventListener('mouseleave', () => {
        tl.reverse();
      });

      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        if (this.onNavigate) this.onNavigate(route);
      });
    });
  }

  setWheelTarget(index) {
    this.activeIdx = index;
    if (!this.spacing) this.updateSpacing();
    this.wheel.targetY = -index * this.spacing;

    if (this.onHoverMedia) {
      this.onHoverMedia(String(index + 1));
    }
  }

  startWheelLoop() {
    if (this.wheel.isRunning) return;
    this.wheel.isRunning = true;

    const loop = () => {
      if (!this.wheel.isRunning) return;

      // Lerp wheel position towards target (0.08 matches live mattjinn Ib exactly)
      const lerp = 0.08;
      this.wheel.currentY += (this.wheel.targetY - this.wheel.currentY) * lerp;
      this.wheel.speed = Math.abs(this.wheel.currentY - this.wheel.lastY);
      this.wheel.direction = this.wheel.currentY >= this.wheel.lastY ? 'up' : 'down';
      this.wheel.lastY = this.wheel.currentY;

      // Subtle parallax lerp
      this.parallax.currentX += (this.parallax.targetX - this.parallax.currentX) * lerp;
      this.parallax.currentY += (this.parallax.targetY - this.parallax.currentY) * lerp;

      const count = this.cards.length;
      for (let i = 0; i < count; i++) {
        const card = this.cards[i];
        if (!card) continue;

        // Base relative Y position
        let y = i * this.spacing + this.wheel.currentY;

        // Infinite wrapping around center [-halfTotal, halfTotal]
        while (y < -this.halfTotal) y += this.totalHeight;
        while (y > this.halfTotal) y -= this.totalHeight;

        // Rotational tilt Z along arc:
        // Above center (y < 0): counter-clockwise (-24deg at -spacing)
        // Below center (y > 0): clockwise (+24deg at +spacing)
        // Center (y = 0): 0deg (perfectly upright)
        const rotZ = (y / this.halfTotal) * 60;

        // Curvature X: curves leftwards as it moves up or down from center
        const normDist = Math.abs(y / this.spacing);
        const curveX = -Math.pow(normDist, 1.25) * 55;

        // Scale: slight depth perspective
        const scale = Math.max(0.85, 1.0 - Math.min(normDist * 0.08, 0.15));

        // Opacity: fully visible within range, softly fading outside viewport
        let opacity = 1;
        if (normDist > 1.25) {
          opacity = Math.max(0, 1 - (normDist - 1.25) * 1.6);
        }

        // Z-index: center card always on top
        const zIndex = Math.round(10 - Math.min(normDist * 5, 8));

        const finalX = curveX + this.parallax.currentX;
        const finalY = y + this.parallax.currentY;

        card.style.transform = `translate3d(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px, 0px) rotate(${rotZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.zIndex = zIndex;
        card.style.visibility = opacity > 0.01 ? 'visible' : 'hidden';

        if (normDist < 0.45) {
          card.classList.add('menu__medias__media--active');
        } else {
          card.classList.remove('menu__medias__media--active');
        }
      }

      this.wheel.rafId = requestAnimationFrame(loop);
    };

    this.wheel.rafId = requestAnimationFrame(loop);
  }

  stopWheelLoop() {
    this.wheel.isRunning = false;
    if (this.wheel.rafId) {
      cancelAnimationFrame(this.wheel.rafId);
      this.wheel.rafId = null;
    }
  }

  animate(isOpen) {
    const links = this.element.querySelectorAll('.menu__list__link');
    const socialItems = this.element.querySelectorAll('.menu__social__item');
    const mediaContainer = this.mediaContainer;

    if (this.menuTimeline) this.menuTimeline.kill();

    if (isOpen) {
      this.isOpen = true;
      this.element.classList.add('menu--open');
      this.updateSpacing();
      this.wheel.targetY = -this.activeIdx * this.spacing;
      this.wheel.currentY = this.wheel.targetY;
      this.startWheelLoop();

      // Keep menu elements hidden initially so smoke plume blooms first
      gsap.set(this.element, { display: 'block', autoAlpha: 1, pointerEvents: 'none' });
      gsap.set(links, { yPercent: 110, opacity: 0, rotateX: -14, transformOrigin: '50% 100%' });
      gsap.set(socialItems, { y: 16, opacity: 0 });
      if (mediaContainer) gsap.set(mediaContainer, { autoAlpha: 0, y: 25, scale: 0.97 });

      // Trigger WebGL smoke plume expanding from center outwards immediately
      if (this.smokeTransition) {
        this.smokeTransition.playOpen(0.7);
      }

      this.menuTimeline = gsap.timeline({
        onComplete: () => {
          gsap.set(this.element, { pointerEvents: 'auto' });
          this.element.classList.add('menu--open-settled');
        }
      });

      // Synchronize reveals with the smoke plume sweeping outward:
      // At 0.18s: card wheel reveals as smoke covers the center-left
      // At 0.22s: links roll upward smoothly
      // At 0.32s: social items fade in
      if (mediaContainer) {
        this.menuTimeline.to(mediaContainer, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.52,
          ease: 'power3.out'
        }, 0.18);
      }
      this.menuTimeline
        .to(links, {
          yPercent: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.55,
          stagger: 0.05,
          ease: 'power3.out'
        }, 0.22)
        .to(socialItems, {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.04,
          ease: 'power2.out'
        }, 0.32);

      return;
    }

    this.isOpen = false;
    this.element.classList.remove('menu--open-settled');
    gsap.set(this.element, { pointerEvents: 'none' });

    // Exit content quickly while smoke plume collapses back inward
    this.menuTimeline = gsap.timeline({
      onComplete: () => {
        this.element.classList.remove('menu--open');
        gsap.set(this.element, { display: 'none', autoAlpha: 0 });
        this.stopWheelLoop();
      }
    });
    this.menuTimeline
      .to(links, { yPercent: -90, opacity: 0, rotateX: 12, duration: 0.35, stagger: { each: 0.035, from: 'end' }, ease: 'power3.in' }, 0)
      .to(mediaContainer, { autoAlpha: 0, y: -25, scale: 0.96, duration: 0.3, ease: 'power3.in' }, 0.03)
      .to(socialItems, { y: -12, opacity: 0, duration: 0.25, stagger: { each: 0.02, from: 'end' }, ease: 'power2.in' }, 0);

    if (this.smokeTransition) {
      this.smokeTransition.playClose(0.75);
    }
  }

  setActiveRoute(currentRoute) {
    this.activeRoute = currentRoute;
    const links = this.element.querySelectorAll('.menu__list__link');
    let matchedIdx = 0;

    links.forEach((link) => {
      const route = link.getAttribute('data-route');
      const index = parseInt(link.getAttribute('data-index'), 10);

      let isMatch = (route === currentRoute);
      if (index === 0 && (currentRoute === '/music/' || currentRoute === '/music' || currentRoute === '/hosting/' || currentRoute === '/hosting')) {
        isMatch = true;
      } else if (index === 1 && (currentRoute === '/videos/' || currentRoute === '/videos' || currentRoute === '/reels/' || currentRoute === '/reels')) {
        isMatch = true;
      } else if (index === 2 && (currentRoute === '/shows/' || currentRoute === '/shows' || currentRoute === '/events/' || currentRoute === '/events')) {
        isMatch = true;
      } else if (index === 3 && (currentRoute === '/about/' || currentRoute === '/about')) {
        isMatch = true;
      }

      if (isMatch) {
        link.classList.add('menu__list__link--active');
        matchedIdx = index;
      } else {
        link.classList.remove('menu__list__link--active');
      }
    });

    this.activeIdx = matchedIdx;
    if (this.spacing) {
      this.wheel.targetY = -matchedIdx * this.spacing;
    }
  }

  destroy() {
    this.stopWheelLoop();
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    if (this.smokeTransition) {
      this.smokeTransition.destroy();
    }
  }
}
