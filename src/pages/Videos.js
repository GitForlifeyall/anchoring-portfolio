import gsap from 'gsap';
import { VideoSliderWebGL } from '../gl/VideoSliderWebGL.js';

export class Videos {
  constructor(glCanvas) {
    this.glCanvas = glCanvas;
    this.currentIndex = 0;
    this.isPlayingFull = false;

    this.videosData = [
      {
        title: 'over and over',
        duration: '02:04',
        coverVideo: 'https://matt-jinn.sfo3.cdn.digitaloceanspaces.com/videos/Matt%20Jinn_over%20and%20over_cover.mp4',
        fullVideo: 'https://matt-jinn.sfo3.cdn.digitaloceanspaces.com/videos/Matt%20Jinn%20-%20over%20and%20over.mp4',
        poster: '/assets/images/hero-1.jpg',
        credits: {
          director: 'Matt Jinn',
          dop: 'Julian Vance'
        }
      },
      {
        title: 'Bluebird',
        duration: '02:49',
        coverVideo: 'https://matt-jinn.sfo3.cdn.digitaloceanspaces.com/videos/Matt%20Jinn_Bluebird_Cover.mp4',
        fullVideo: 'https://matt-jinn.sfo3.cdn.digitaloceanspaces.com/videos/Matt%20Jinn%20-%20Bluebird.mp4',
        poster: '/assets/images/hero-2.jpg',
        credits: {
          director: 'Matt Jinn',
          dop: 'Tyler Barks'
        }
      }
    ];

    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'page page--videos';
    this.element.innerHTML = `
      <div class="page__wrapper">
        <div class="page__content">
          <section class="videos">
            <!-- WebGL Canvas Container for 3D barrel bulge distortion slider -->
            <div class="videos__slider-container"></div>

            <!-- Foreground Overlays & Info -->
            <div class="videos__content">
              <div class="videos__informations">
                <div class="videos__information videos__information--0" style="opacity: 1; transform: translateY(0%);">
                  <h2 class="videos__title">over and over</h2>
                  <p class="videos__length">02:04</p>
                </div>
                <div class="videos__information videos__information--1" style="opacity: 0; transform: translateY(20px); position: absolute;">
                  <h2 class="videos__title">Bluebird</h2>
                  <p class="videos__length">02:49</p>
                </div>
              </div>

              <div class="videos__ticker">
                <div class="videos__ticker__number videos__ticker__number--current">01</div>
                <span class="videos__ticker__separator"></span>
                <canvas class="videos__ticker__canvas" width="96" height="12"></canvas>
                <div class="videos__ticker__number">02</div>
                <span class="videos__ticker__scroll">Drag / Scroll</span>
              </div>
            </div>

            <!-- Custom Play/Pause Follower Cursor -->
            <div class="cursor cursor--video" style="opacity: 0; pointer-events: none;">
              <div class="cursor__icons">
                <svg class="cursor__ring" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                  <circle
                    class="cursor__ring__circle"
                    cx="18"
                    cy="18"
                    fill="none"
                    pathLength="1"
                    r="17.5"
                    stroke="currentColor"
                    stroke-width="1"
                  />
                </svg>
                <div class="cursor__icons__mask">
                  <svg class="cursor__icon cursor__icon--play" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="opacity: 1;">
                    <use xlink:href="#player-toggle-play"></use>
                  </svg>
                  <svg class="cursor__icon cursor__icon--pause" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="opacity: 0;">
                    <use xlink:href="#player-toggle-pause"></use>
                  </svg>
                </div>
              </div>
              <div class="cursor__wrapper">
                <div class="cursor__text">Play</div>
              </div>
            </div>

            <!-- Fullscreen Video Player Modal -->
            <div class="players">
              <div class="player">
                <button class="player__close" aria-label="Back">Back</button>
                <div class="player__title">over and over</div>

                <div class="player__media-wrap">
                  <video class="player__video" playsinline></video>
                </div>

                <div class="player__controls">
                  <div class="player__progress">
                    <div class="player__progress__bar"></div>
                  </div>
                  <button class="player__volume" aria-label="Toggle Volume">
                    <svg class="player__volume__icon player__volume__icon--unmute" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="opacity: 1;">
                      <use xlink:href="#player-toggle-unmute"></use>
                    </svg>
                    <svg class="player__volume__icon player__volume__icon--mute" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="opacity: 0;">
                      <use xlink:href="#player-toggle-mute"></use>
                    </svg>
                  </button>
                  <button class="player__expand" aria-label="Fullscreen">
                    <svg class="player__expand__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <use xlink:href="#player-toggle-expand"></use>
                    </svg>
                  </button>
                </div>

                <div class="player__credits">
                  <button class="player__credits__text player__credits__text--open">Credits</button>
                  <button class="player__credits__text player__credits__text--close" style="display: none;">Close</button>
                </div>

                <div class="player__information" style="opacity: 0; pointer-events: none;">
                  <div class="player__information__title">
                    <svg viewBox="0 0 44 21" xmlns="http://www.w3.org/2000/svg">
                      <use xlink:href="#player-credits"></use>
                    </svg>
                  </div>
                  <div class="player__information__description">
                    <p class="player__director">Directed and Edited by Matt Jinn</p>
                    <p class="player__dop">Director of Photography: Julian Vance</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    this.initSliderWebGL();
    this.initCursorFollower();
    this.initPlayer();
  }

  initSliderWebGL() {
    const sliderContainer = this.element.querySelector('.videos__slider-container');

    this.sliderWebGL = new VideoSliderWebGL({
      container: sliderContainer,
      videosData: this.videosData,
      onSelectIndex: (idx) => {
        this.updateActiveInfo(idx);
      },
      onClickActive: (idx) => {
        this.openPlayer(idx);
      },
      onProgress: (progress) => {
        this.drawTicker(progress);
      }
    });

    this.drawTicker(0);
  }

  updateActiveInfo(idx) {
    this.currentIndex = idx;
    const currentNumEl = this.element.querySelector('.videos__ticker__number--current');
    if (currentNumEl) {
      currentNumEl.textContent = `0${idx + 1}`;
    }

    const info0 = this.element.querySelector('.videos__information--0');
    const info1 = this.element.querySelector('.videos__information--1');

    if (info0 && info1) {
      if (idx === 0) {
        gsap.to(info0, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
        gsap.to(info1, { opacity: 0, y: 20, duration: 0.4, ease: 'power2.out' });
      } else {
        gsap.to(info0, { opacity: 0, y: -20, duration: 0.4, ease: 'power2.out' });
        gsap.to(info1, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      }
    }
  }

  drawTicker(progress) {
    const canvas = this.element.querySelector('.videos__ticker__canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;

    const ticks = 12;
    for (let i = 0; i < ticks; i++) {
      const x = (canvas.width / (ticks - 1)) * i;
      const h = i % 3 === 0 ? 10 : 5;
      const y = (canvas.height - h) / 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + h);
      ctx.stroke();
    }

    // Active progress indicator
    const clampedProg = Math.max(0, Math.min(1, progress));
    const activeX = clampedProg * (canvas.width - 2) + 1;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(activeX, 1);
    ctx.lineTo(activeX, 11);
    ctx.stroke();
  }

  initCursorFollower() {
    const cursor = this.element.querySelector('.cursor--video');
    const sliderContainer = this.element.querySelector('.videos__slider-container');
    if (!cursor || !sliderContainer) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;
    let isInside = false;

    this.onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isInside) {
        isInside = true;
        gsap.to(cursor, { opacity: 1, duration: 0.3 });
      }
    };

    this.onMouseLeave = () => {
      isInside = false;
      gsap.to(cursor, { opacity: 0, duration: 0.3 });
    };

    window.addEventListener('mousemove', this.onMouseMove);
    sliderContainer.addEventListener('mouseleave', this.onMouseLeave);

    const updateCursor = () => {
      currentX += (mouseX - currentX) * 0.18;
      currentY += (mouseY - currentY) * 0.18;
      cursor.style.transform = `translate3d(${currentX + 15}px, ${currentY + 15}px, 0)`;
      this.cursorAnimFrame = requestAnimationFrame(updateCursor);
    };

    this.cursorAnimFrame = requestAnimationFrame(updateCursor);
  }

  initPlayer() {
    const playerModal = this.element.querySelector('.player');
    const playerClose = this.element.querySelector('.player__close');
    const playerVideo = this.element.querySelector('.player__video');
    const playerTitle = this.element.querySelector('.player__title');
    const progressBar = this.element.querySelector('.player__progress__bar');
    const progressContainer = this.element.querySelector('.player__progress');
    const volumeBtn = this.element.querySelector('.player__volume');
    const expandBtn = this.element.querySelector('.player__expand');
    const creditsOpen = this.element.querySelector('.player__credits__text--open');
    const creditsClose = this.element.querySelector('.player__credits__text--close');
    const creditsInfo = this.element.querySelector('.player__information');
    const directorEl = this.element.querySelector('.player__director');
    const dopEl = this.element.querySelector('.player__dop');

    let isCreditsOpen = false;

    playerClose.addEventListener('click', () => {
      this.closePlayer();
    });

    // Timeupdate progress bar
    playerVideo.addEventListener('timeupdate', () => {
      if (playerVideo.duration) {
        const pct = (playerVideo.currentTime / playerVideo.duration) * 100;
        progressBar.style.setProperty('--progress', pct / 100);
        progressBar.style.transform = `scaleX(${pct / 100})`;
      }
    });

    // Scrub on progress container
    progressContainer.addEventListener('click', (e) => {
      const rect = progressContainer.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      if (playerVideo.duration) {
        playerVideo.currentTime = pos * playerVideo.duration;
      }
    });

    // Volume toggle
    volumeBtn.addEventListener('click', () => {
      playerVideo.muted = !playerVideo.muted;
      const unmuteIcon = volumeBtn.querySelector('.player__volume__icon--unmute');
      const muteIcon = volumeBtn.querySelector('.player__volume__icon--mute');
      if (playerVideo.muted) {
        unmuteIcon.style.opacity = '0';
        muteIcon.style.opacity = '1';
      } else {
        unmuteIcon.style.opacity = '1';
        muteIcon.style.opacity = '0';
      }
    });

    // Fullscreen toggle
    expandBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        playerVideo.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Credits drawer
    creditsOpen.addEventListener('click', () => {
      isCreditsOpen = true;
      creditsOpen.style.display = 'none';
      creditsClose.style.display = 'inline-block';
      gsap.to(creditsInfo, { opacity: 1, pointerEvents: 'auto', duration: 0.4 });
    });

    creditsClose.addEventListener('click', () => {
      isCreditsOpen = false;
      creditsClose.style.display = 'none';
      creditsOpen.style.display = 'inline-block';
      gsap.to(creditsInfo, { opacity: 0, pointerEvents: 'none', duration: 0.4 });
    });
  }

  openPlayer(index) {
    const item = this.videosData[index];
    if (!item) return;

    this.isPlayingFull = true;
    document.documentElement.classList.add('videos--playing');

    const playerModal = this.element.querySelector('.player');
    const playerVideo = this.element.querySelector('.player__video');
    const playerTitle = this.element.querySelector('.player__title');
    const directorEl = this.element.querySelector('.player__director');
    const dopEl = this.element.querySelector('.player__dop');

    playerTitle.textContent = item.title;
    if (directorEl) directorEl.textContent = `Directed and Edited by ${item.credits.director}`;
    if (dopEl) dopEl.textContent = `Director of Photography: ${item.credits.dop}`;

    playerVideo.poster = item.poster;
    playerVideo.src = item.fullVideo;
    playerVideo.currentTime = 0;
    playerVideo.play().catch(() => {});

    playerModal.classList.add('player--active');
  }

  closePlayer() {
    this.isPlayingFull = false;
    document.documentElement.classList.remove('videos--playing');

    const playerModal = this.element.querySelector('.player');
    const playerVideo = this.element.querySelector('.player__video');

    playerVideo.pause();
    playerModal.classList.remove('player--active');
  }

  mount() {
    if (this.glCanvas) {
      this.glCanvas.setVisible(false);
    }
  }

  destroy() {
    if (this.sliderWebGL) {
      this.sliderWebGL.destroy();
    }
    if (this.cursorAnimFrame) {
      cancelAnimationFrame(this.cursorAnimFrame);
    }
    window.removeEventListener('mousemove', this.onMouseMove);
  }
}
