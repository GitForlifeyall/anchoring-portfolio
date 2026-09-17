import gsap from 'gsap';

export class Home {
  constructor(glCanvas, onOpenNewsletter) {
    this.glCanvas = glCanvas;
    this.onOpenNewsletter = onOpenNewsletter;
    this.heroImages = [
      '/assets/images/hero-1.jpg',
      '/assets/images/hero-2.jpg',
      '/assets/images/hero-3.jpg'
    ];
    this.currentHeroIdx = 0;
    this.isHolding = false;
    this.holdTimer = null;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'page page--home';
    this.element.innerHTML = `
      <div class="page__wrapper">
        <div class="page__content">
          <header class="intro">
            <div class="intro__content">
              <h1 class="intro__title">
                Matt Jinn
                <svg viewBox="0 0 505 374" xmlns="http://www.w3.org/2000/svg">
                  <use xlink:href="#matt-jinn"></use>
                </svg>
              </h1>

            </div>

            <div class="intro__cursor">
              <svg class="intro__cursor__element" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.5 24.5">
                <path
                  class="intro__cursor__progress"
                  d="M12.25.25c6.63,0,12,5.37,12,12s-5.37,12-12,12S.25,18.87.25,12.25,5.62.25,12.25.25Z"
                />
                <path
                  class="intro__cursor__circle"
                  d="M12.25.25c6.63,0,12,5.37,12,12s-5.37,12-12,12S.25,18.88.25,12.25,5.62.25,12.25.25Z"
                />
                <path class="intro__cursor__dot" d="M12.25,10.25c1.1,0,2,.9,2,2s-.9,2-2,2-2-.9-2-2,.9-2,2-2Z" />
              </svg>

              <span class="intro__cursor__text">
                <span class="intro__cursor__text__wrapper">
                  <span>Hold to Switch</span>
                  <span>Switching...</span>
                  <span>Switched!</span>
                </span>
              </span>
            </div>
          </header>
        </div>
      </div>
    `;

    this.bindCursor();
  }

  bindCursor() {
    const cursor = this.element.querySelector('.intro__cursor');
    const intro = this.element.querySelector('.intro');
    const textWrapper = this.element.querySelector('.intro__cursor__text__wrapper');

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;

    this.onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', this.onMouseMove);

    // Smooth cursor follow loop
    const updateCursor = () => {
      if (!cursor) return;
      currentX += (mouseX - currentX) * 0.15;
      currentY += (mouseY - currentY) * 0.15;
      cursor.style.setProperty('--pointer-x', `${currentX}px`);
      cursor.style.setProperty('--pointer-y', `${currentY}px`);
      this.cursorAnimFrame = requestAnimationFrame(updateCursor);
    };
    this.cursorAnimFrame = requestAnimationFrame(updateCursor);

    // Hold to switch mechanics
    let progressVal = { val: 0 };
    let holdTween = null;

    const startHold = (e) => {
      // Don't trigger if clicked on a link or button
      if (e.target.closest('a') || e.target.closest('button')) return;

      this.isHolding = true;
      gsap.to(textWrapper, { y: '-33.33%', duration: 0.3, ease: 'power2.out' });

      holdTween = gsap.to(progressVal, {
        val: 1,
        duration: 0.6,
        ease: 'power1.inOut',
        onUpdate: () => {
          cursor.style.setProperty('--stroke', 1 - progressVal.val);
        },
        onComplete: () => {
          gsap.to(textWrapper, { y: '-66.66%', duration: 0.3, ease: 'power2.out' });
          this.switchHero();
        }
      });
    };

    const endHold = () => {
      if (!this.isHolding) return;
      this.isHolding = false;
      if (holdTween) holdTween.kill();
      gsap.to(progressVal, {
        val: 0,
        duration: 0.3,
        ease: 'power2.out',
        onUpdate: () => {
          cursor.style.setProperty('--stroke', 1 - progressVal.val);
        }
      });
      gsap.to(textWrapper, { y: '0%', duration: 0.3, ease: 'power2.out', delay: 0.4 });
    };

    intro.addEventListener('mousedown', startHold);
    window.addEventListener('mouseup', endHold);
  }

  switchHero() {
    this.currentHeroIdx = (this.currentHeroIdx + 1) % this.heroImages.length;
    const nextUrl = this.heroImages[this.currentHeroIdx];
    if (this.glCanvas) {
      this.glCanvas.transitionTo(nextUrl, 1920, 1167, 1.2);
    }
  }

  mount() {
    if (this.glCanvas) {
      this.glCanvas.setVisible(true);
      this.glCanvas.setImage(this.heroImages[this.currentHeroIdx], 1920, 1167);
    }
  }

  destroy() {
    window.removeEventListener('mousemove', this.onMouseMove);
    if (this.cursorAnimFrame) cancelAnimationFrame(this.cursorAnimFrame);
  }
}
