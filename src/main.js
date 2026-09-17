import './styles/main.css';
import { WebGLCanvas } from './gl/WebGLCanvas.js';
import { Preloader } from './components/Preloader.js';
import { Navigation } from './components/Navigation.js';
import { Menu } from './components/Menu.js';
import { NewsletterModal } from './components/NewsletterModal.js';
import { Home } from './pages/Home.js';
import { Shows } from './pages/Shows.js';
import { About } from './pages/About.js';
import { Videos } from './pages/Videos.js';
import { Music } from './pages/Music.js';

class App {
  constructor() {
    this.appContainer = document.querySelector('.app');
    this.canvasContainer = document.querySelector('.canvas');

    this.setHeight();
    window.addEventListener('resize', () => this.setHeight());

    this.initWebGL();
    this.initModals();
    this.initNavigation();
    this.initPreloader();
    this.initRouter();
  }

  setHeight() {
    document.documentElement.style.setProperty('--100vh', `${window.innerHeight}px`);
  }

  initWebGL() {
    this.glCanvas = new WebGLCanvas(this.canvasContainer);
  }

  initModals() {
    this.newsletterModal = new NewsletterModal();
    document.body.appendChild(this.newsletterModal.element);
  }

  initNavigation() {
    this.nav = new Navigation((isOpen) => {
      if (this.menu) this.menu.animate(isOpen);
    });
    this.menu = new Menu(
      (route) => {
        this.nav.close();
        this.navigate(route);
      },
      (mediaIdx) => {
        // Optional media hover trigger
      }
    );

    document.body.appendChild(this.nav.element);
    document.body.appendChild(this.menu.element);

    // Intercept internal links and newsletter trigger
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;
      if (href === '#newsletter') {
        e.preventDefault();
        this.newsletterModal.open();
        return;
      }
      if (href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault();
        this.nav.close();
        this.navigate(href);
      }
    });

    // The home screen is a single viewport: a downward scroll opens navigation.
    window.addEventListener('wheel', (e) => {
      if (window.location.pathname !== '/') return;
      if (this.nav.isOpen && e.deltaY < -12) {
        e.preventDefault();
        this.nav.close();
        return;
      }
      if (this.nav.isOpen || e.deltaY <= 12) return;
      e.preventDefault();
      this.nav.toggle(true);
    }, { passive: false });
  }

  initPreloader() {
    new Preloader(() => {
      console.log('Site ready and preloaded');
    });
  }

  initRouter() {
    this.pages = {
      '/': () => new Home(this.glCanvas, () => this.newsletterModal.open()),
      '/shows/': () => new Shows(this.glCanvas),
      '/shows': () => new Shows(this.glCanvas),
      '/events/': () => new Shows(this.glCanvas),
      '/events': () => new Shows(this.glCanvas),
      '/about/': () => new About(this.glCanvas),
      '/about': () => new About(this.glCanvas),
      '/videos/': () => new Videos(this.glCanvas),
      '/videos': () => new Videos(this.glCanvas),
      '/reels/': () => new Videos(this.glCanvas),
      '/reels': () => new Videos(this.glCanvas),
      '/music/': () => new Music(this.glCanvas),
      '/music': () => new Music(this.glCanvas),
      '/hosting/': () => new Music(this.glCanvas),
      '/hosting': () => new Music(this.glCanvas)
    };

    window.addEventListener('popstate', () => {
      this.renderRoute(window.location.pathname);
    });

    const initialRoute = window.location.pathname || '/';
    this.renderRoute(initialRoute);
  }

  navigate(route) {
    if (window.location.pathname === route) return;
    window.history.pushState({}, '', route);
    this.renderRoute(route);
  }

  renderRoute(route) {
    const normalized = route.endsWith('/') ? route : `${route}/`;
    const pageFactory = this.pages[normalized] || this.pages['/'];

    // Destroy current page if any
    if (this.currentPage && this.currentPage.destroy) {
      this.currentPage.destroy();
    }

    this.appContainer.innerHTML = '';

    // Set Theme and WebGL state
    const pageTextures = {
      '/': '/assets/images/hero-1.jpg',
      '/shows/': '/test-images/amir-hanna--S-TG6lhUlo-unsplash.jpg',
      '/events/': '/test-images/amir-hanna--S-TG6lhUlo-unsplash.jpg',
      '/about/': '/assets/images/about-1.jpg',
      '/videos/': '/assets/images/hero-2.jpg',
      '/reels/': '/assets/images/hero-2.jpg',
      '/music/': '/test-images/finn-tranter-6L6xWaeyKDE-unsplash.jpg',
      '/hosting/': '/test-images/finn-tranter-6L6xWaeyKDE-unsplash.jpg'
    };

    if (this.glCanvas && pageTextures[normalized] && normalized !== '/') {
      this.glCanvas.setImage(pageTextures[normalized]);
    }

    if (normalized === '/videos/' || normalized === '/reels/' || normalized === '/shows/' || normalized === '/events/' || normalized === '/about/') {
      this.nav.setTheme('light');
      if (this.glCanvas) this.glCanvas.setVisible(false);
    } else if (normalized === '/music/' || normalized === '/hosting/') {
      this.nav.setTheme('dark');
      if (this.glCanvas) this.glCanvas.setVisible(false);
    } else {
      this.nav.setTheme('light');
      if (this.glCanvas) this.glCanvas.setVisible(true);
    }

    // Create new page
    this.currentPage = pageFactory();
    this.appContainer.appendChild(this.currentPage.element);

    if (this.currentPage.mount) {
      this.currentPage.mount();
    }

    // Update Titles
    const titles = {
      '/': 'Matt Jinn | Home',
      '/shows/': 'Matt Jinn | Events',
      '/events/': 'Matt Jinn | Events',
      '/about/': 'Matt Jinn | About',
      '/videos/': 'Matt Jinn | Reels',
      '/reels/': 'Matt Jinn | Reels',
      '/music/': 'Matt Jinn | Hosting',
      '/hosting/': 'Matt Jinn | Hosting'
    };
    document.title = titles[normalized] || 'Matt Jinn';

    // Update active state in Menu
    this.menu.setActiveRoute(normalized);
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.__app = new App();
});
