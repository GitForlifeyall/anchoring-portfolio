export class Navigation {
  constructor(onToggleMenu) {
    this.onToggleMenu = onToggleMenu;
    this.isOpen = false;
    this.render();
  }

  render() {
    this.element = document.createElement('nav');
    this.element.className = 'navigation';
    this.element.innerHTML = `
      <a class="navigation__logo" href="/" data-route="/">Matt Jinn</a>

      <button class="navigation__button" aria-label="Toggle Navigation" aria-expanded="false">
        <div class="navigation__button__texts" aria-hidden="true">
          <div class="navigation__button__texts__wrapper">
            <div class="navigation__button__text" aria-hidden="true">Menu</div>
            <div class="navigation__button__text" aria-hidden="true">Close</div>
          </div>
        </div>
        <div class="navigation__button__icon"></div>
      </button>
    `;

    this.btn = this.element.querySelector('.navigation__button');
    this.btn.addEventListener('click', () => {
      this.toggle();
    });
  }

  toggle(force) {
    this.isOpen = typeof force === 'boolean' ? force : !this.isOpen;
    if (this.isOpen) {
      document.documentElement.classList.add('navigation--open');
    } else {
      document.documentElement.classList.remove('navigation--open');
    }
    this.btn.setAttribute('aria-expanded', String(this.isOpen));
    if (this.onToggleMenu) {
      this.onToggleMenu(this.isOpen);
    }
  }

  close() {
    this.toggle(false);
  }

  setTheme(theme) {
    if (theme === 'dark') {
      this.element.classList.add('navigation--dark');
      this.element.style.color = 'var(--color-black)';
    } else {
      this.element.classList.remove('navigation--dark');
      this.element.style.color = 'var(--color-white)';
    }
  }
}
