import { Footer } from '../components/Footer.js';

export class Shows {
  constructor(glCanvas) {
    this.glCanvas = glCanvas;
    this.currentIndex = 0;
    this.showImages = [
      '/assets/images/shows-1.jpg',
      '/assets/images/shows-2.jpg'
    ];
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'page';
    this.element.innerHTML = `
      <div class="page__wrapper">
        <div class="page__content">
          <section class="shows" style="--length: 2;">
            <div class="shows__wrapper">
              <div class="shows__gallery">
                <figure class="shows__media" data-index="0" style="opacity: 1; transition: opacity 0.8s ease;">
                  <img
                    alt="Matt Jinn Live"
                    class="shows__image loaded"
                    src="/assets/images/shows-1.jpg"
                  />
                </figure>
                <figure class="shows__media" data-index="1" style="opacity: 0; transition: opacity 0.8s ease;">
                  <img
                    alt="Matt Jinn Show"
                    class="shows__image loaded"
                    src="/assets/images/shows-2.jpg"
                  />
                </figure>
              </div>

              <ul class="shows__list">
                <li class="shows__item" data-index="0" style="cursor: pointer; opacity: 1;">
                  <span class="shows__item__number">01</span>
                  <span class="shows__item__title">Matt Jinn Live</span>
                </li>
                <li class="shows__item" data-index="1" style="cursor: pointer; opacity: 0.4;">
                  <span class="shows__item__number">02</span>
                  <span class="shows__item__title">Matt Jinn Show</span>
                </li>
              </ul>

              <div class="shows__content">
                <article class="shows__entry shows__entry--active" data-index="0">
                  <div class="shows__entry__column">
                    <h2 class="shows__entry__title">Date</h2>
                    July 26, 2026
                  </div>
                  <div class="shows__entry__column">
                    <h2 class="shows__entry__title">Location</h2>
                    Nublu, New York
                  </div>
                  <a class="shows__entry__link" href="https://posh.vip/e/matt-jinn-eila-ft-lukey-dj-viiq" target="_blank" rel="noopener">
                    <h2 class="shows__entry__title">Link</h2>
                    Get Tickets
                  </a>
                </article>

                <article class="shows__entry" data-index="1" style="display: none;">
                  <div class="shows__entry__column">
                    <h2 class="shows__entry__title">Date</h2>
                    January 17, 2026
                  </div>
                  <div class="shows__entry__column">
                    <h2 class="shows__entry__title">Location</h2>
                    Enoch's
                  </div>
                  <a class="shows__entry__link" href="https://ticketmaster.com/" target="_blank" rel="noopener">
                    <h2 class="shows__entry__title">Link</h2>
                    Get Tickets
                  </a>
                </article>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    this.footer = new Footer();
    this.element.querySelector('.page__wrapper').appendChild(this.footer.element);

    this.bindEvents();
  }

  bindEvents() {
    const items = this.element.querySelectorAll('.shows__item');
    const entries = this.element.querySelectorAll('.shows__entry');
    const media = this.element.querySelectorAll('.shows__media');
    const showsList = this.element.querySelector('.shows__list');

    const selectShow = (idx) => {
      this.currentIndex = idx;
      items.forEach((item, i) => {
        item.style.opacity = i === idx ? '1' : '0.4';
      });
      entries.forEach((entry, i) => {
        if (i === idx) {
          entry.style.display = 'flex';
          entry.classList.add('shows__entry--active');
        } else {
          entry.style.display = 'none';
          entry.classList.remove('shows__entry--active');
        }
      });
      media.forEach((m, i) => {
        m.style.opacity = i === idx ? '1' : '0';
      });

      if (showsList) {
        showsList.style.setProperty('--progress', idx);
      }

      if (this.glCanvas) {
        this.glCanvas.transitionTo(this.showImages[idx], 1920, 1080, 0.8);
      }
    };

    items.forEach((item) => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-index'), 10);
        selectShow(idx);
      });
    });

    // Handle scroll progress
    this.element.addEventListener('scroll', () => {
      const scrollY = this.element.scrollTop;
      const h = window.innerHeight;
      const targetIdx = scrollY > h * 0.4 ? 1 : 0;
      if (targetIdx !== this.currentIndex) {
        selectShow(targetIdx);
      }
    });
  }

  mount() {
    if (this.glCanvas) {
      this.glCanvas.setVisible(false);
    }
  }

  destroy() {}
}
