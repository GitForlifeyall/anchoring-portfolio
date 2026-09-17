export class Footer {
  constructor() {
    this.render();
  }

  render() {
    this.element = document.createElement('footer');
    this.element.className = 'footer';
    this.element.innerHTML = `
      <div class="footer__wrapper">
        <div class="footer__content">
          <div class="footer__column">
            <h2 class="footer__title">Contact</h2>
            <ul class="footer__list">
              <li class="footer__list__item">
                <strong class="footer__list__title">Email</strong>
                <a class="footer__list__link" href="mailto:hello@mattjinn.com">hello@mattjinn.com</a>
              </li>
              <!--
              <li class="footer__list__item">
                <strong class="footer__list__title">Socials</strong>
                <a class="footer__list__link" href="https://linktr.ee/mattjinn" target="_blank" rel="noopener">@mattjinn22</a>
              </li>
              -->
            </ul>
          </div>

          <div class="footer__column">
            <div class="footer__newsletter" data-form>
              <h2 class="footer__newsletter__title">Subscribe for Updates — Newsletter</h2>
              <form class="footer__newsletter__box">
                <input
                  class="footer__newsletter__input"
                  name="email"
                  placeholder="Email Address"
                  required
                  type="email"
                />
                <button class="footer__newsletter__button" type="submit" aria-label="Submit">
                  Submit
                  <svg class="footer__newsletter__icon" viewBox="0 0 13 14" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 7H12M12 7L6 1M12 7L6 13" fill="none" stroke="currentColor" />
                  </svg>
                </button>
              </form>
              <div class="footer__newsletter__feedback footer__newsletter__feedback--success">
                Thanks for subscribing!
              </div>
              <div class="footer__newsletter__feedback footer__newsletter__feedback--error">
                Something went wrong. Please try again.
              </div>
            </div>
          </div>
        </div>

        <div class="footer__footer">
          <p class="footer__copyright">© 2025 Matt Jinn, All Rights Reserved.</p>
          <!--
          <ul class="footer__social__list">
            <li class="footer__social__item">
              <a class="footer__social__link" href="https://www.youtube.com/@mattjinn22" target="_blank" rel="noopener">
                YouTube
                <svg class="footer__social__icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <use xlink:href="#youtube"></use>
                </svg>
              </a>
            </li>
            <li class="footer__social__item">
              <a class="footer__social__link" href="https://www.instagram.com/mattjinn22/" target="_blank" rel="noopener">
                Instagram
                <svg class="footer__social__icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <use xlink:href="#instagram"></use>
                </svg>
              </a>
            </li>
          </ul>
          -->
          <div class="footer__credits">
            <p>Design <a href="https://www.willie.design/" target="_blank" rel="noopener">Willie</a>, Dev <a href="https://bizarro.is/" target="_blank" rel="noopener">Bizarro</a></p>
          </div>
        </div>
      </div>
    `;

    const form = this.element.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const wrap = this.element.querySelector('.footer__newsletter');
      wrap.classList.add('footer__newsletter--success');
      setTimeout(() => {
        wrap.classList.remove('footer__newsletter--success');
        form.reset();
      }, 3000);
    });
  }
}
