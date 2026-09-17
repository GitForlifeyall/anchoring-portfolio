import { Footer } from '../components/Footer.js';

export class About {
  constructor(glCanvas) {
    this.glCanvas = glCanvas;
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'page';
    this.element.innerHTML = `
      <div class="page__wrapper">
        <div class="page__content">
          <div class="about">
            <!-- Section 1 -->
            <section class="about__section about__section--1">
              <div class="about__wrapper">
                <figure class="about__media" data-parallax>
                  <img
                    alt="Matt Jinn Portrait"
                    class="about__media__image loaded"
                    src="/assets/images/about-1.jpg"
                  />
                </figure>
                <div class="about__content">
                  <h2 class="about__title">
                    <span>Matt</span><span>Jinn</span>
                  </h2>
                  <div class="about__description">
                    <p>is an emerging Asian-American artist based in New York City</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Section 2 -->
            <section class="about__section about__section--2">
              <div class="about__wrapper">
                <figure class="about__media" data-parallax>
                  <img
                    alt="Matt Jinn Music"
                    class="about__media__image loaded"
                    src="/assets/images/about-2.jpg"
                  />
                </figure>
                <div class="about__content">
                  <h2 class="about__title">
                    <span>Music</span>
                  </h2>
                  <div class="about__description">
                    <p>Matt Jinn is known for blending a captivating mix of genres, from bedroom pop and soul to R&amp;B and indie rock. He has a passion for songwriting and collaborates with artists across genres, including his recent feature on FION's track "delusion(al)."</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Section 3 -->
            <section class="about__section about__section--3">
              <div class="about__wrapper">
                <figure class="about__media" data-parallax>
                  <img
                    alt="Matt Jinn Inspiration"
                    class="about__media__image loaded"
                    src="/assets/images/about-3.jpg"
                  />
                </figure>
                <div class="about__content">
                  <h2 class="about__title">
                    <span>Inspiration</span>
                  </h2>
                  <div class="about__description">
                    <p>Focusing on toplining and vocals, he crafts infectious melodies that capture his journey through love, heartbreak, and self-discovery as shown in his debut EP "Icarus."</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Section 4 -->
            <section class="about__section about__section--4">
              <div class="about__wrapper">
                <figure class="about__media" data-parallax>
                  <img
                    alt="Matt Jinn Quote"
                    class="about__media__image loaded"
                    src="/assets/images/about-4.jpg"
                  />
                </figure>
                <div class="about__content">
                  <h2 class="about__title">
                    <span>Quote</span>
                  </h2>
                  <div class="about__description">
                    <p>“I write music to make sense of the noise inside my head and hopefully bring some calm to yours.”</p>
                    <blockquote>— Matt Jinn</blockquote>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    `;

    this.footer = new Footer();
    this.element.querySelector('.page__wrapper').appendChild(this.footer.element);

    this.bindParallax();
  }

  bindParallax() {
    const sections = this.element.querySelectorAll('.about__section');
    this.element.addEventListener('scroll', () => {
      const scrollY = this.element.scrollTop;
      const vh = window.innerHeight;
      sections.forEach((sec, idx) => {
        const img = sec.querySelector('.about__media__image');
        if (img) {
          const offset = (scrollY - idx * vh) * 0.15;
          img.style.transform = `translateY(${offset}px)`;
        }
      });
    });
  }

  mount() {
    if (this.glCanvas) {
      this.glCanvas.setVisible(false);
    }
  }

  destroy() {}
}
