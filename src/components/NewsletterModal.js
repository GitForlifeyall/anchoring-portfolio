export class NewsletterModal {
  constructor() {
    this.render();
  }

  render() {
    this.element = document.createElement('aside');
    this.element.className = 'newsletter';
    this.element.id = 'newsletter';
    this.element.innerHTML = `
      <div class="newsletter__wrapper">
        <button class="newsletter__close" aria-label="Close Newsletter">Close</button>

        <figure class="newsletter__media">
          <img
            alt="Matt Jinn Updates"
            class="newsletter__image loaded"
            src="/assets/images/newsletter.jpg"
          />
        </figure>

        <div class="newsletter__content">
          <h2 class="newsletter__title">Subscribe for Updates</h2>
          <p class="newsletter__description">
            Want to hear the latest news on my upcoming music releases, touring, and merch?
          </p>

          <div class="newsletter__form" data-form>
            <form class="newsletter__form__content">
              <label class="newsletter__form__label" for="email">Email</label>
              <div class="newsletter__form__box">
                <input
                  class="newsletter__form__input"
                  id="email"
                  name="email"
                  placeholder="Your email address"
                  required
                  type="email"
                />
                <button class="newsletter__form__button" type="submit" aria-label="Submit">
                  Submit
                  <svg class="newsletter__form__icon" viewBox="0 0 13 14" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 7H12M12 7L6 1M12 7L6 13" stroke="currentColor" fill="none" />
                  </svg>
                </button>
              </div>
            </form>

            <div class="newsletter__form__feedback newsletter__form__feedback--success">
              Thank you for subscribing!
            </div>
            <div class="newsletter__form__feedback newsletter__form__feedback--error">
              Ops, something went wrong, try again!
            </div>
          </div>
        </div>
      </div>
    `;

    const closeBtn = this.element.querySelector('.newsletter__close');
    closeBtn.addEventListener('click', () => this.close());

    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) this.close();
    });

    const form = this.element.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formBox = this.element.querySelector('.newsletter__form');
      formBox.classList.add('newsletter__form--success');
      setTimeout(() => {
        this.close();
        formBox.classList.remove('newsletter__form--success');
        form.reset();
      }, 2500);
    });
  }

  open() {
    document.documentElement.classList.add('newsletter--active');
  }

  close() {
    document.documentElement.classList.remove('newsletter--active');
  }
}
