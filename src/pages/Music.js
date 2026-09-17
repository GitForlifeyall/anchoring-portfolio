export class Music {
  constructor(glCanvas) {
    this.glCanvas = glCanvas;
    this.currentIndex = 0;
    this.tracks = [
      {
        title: 'diet coke',
        type: 'Single',
        img: '/assets/images/music-1.jpg'
      },
      {
        title: 'rocket to mars',
        type: 'Single',
        img: '/assets/images/music-2.jpg'
      },
      {
        title: 'miss kyoto',
        type: 'Single',
        img: '/assets/images/music-3.jpg'
      },
      {
        title: 'CANON',
        type: 'Single',
        img: '/assets/images/music-4.jpg'
      }
    ];
    this.render();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'page';
    this.element.innerHTML = `
      <div class="page__wrapper">
        <div class="page__content">
          <section class="music">
            <!-- 3D Stack container -->
            <div class="music__stack" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 454px; height: 454px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              
              <!-- Stack layers behind / above -->
              <div class="music__layer layer-3" style="position: absolute; bottom: calc(100% - 20px); width: 220px; height: 80px; overflow: hidden; transform: translateY(-75px) scale(0.65); z-index: 1; border-radius: 4px; box-shadow: 0 -4px 10px rgba(0,0,0,0.1);">
                <img class="loaded" src="${this.tracks[3].img}" style="width: 100%; height: 220px; object-fit: cover; object-position: top;" />
              </div>
              <div class="music__layer layer-2" style="position: absolute; bottom: calc(100% - 15px); width: 300px; height: 80px; overflow: hidden; transform: translateY(-40px) scale(0.8); z-index: 2; border-radius: 4px; box-shadow: 0 -4px 10px rgba(0,0,0,0.15);">
                <img class="loaded" src="${this.tracks[2].img}" style="width: 100%; height: 300px; object-fit: cover; object-position: top;" />
              </div>
              <div class="music__layer layer-1" style="position: absolute; bottom: calc(100% - 10px); width: 380px; height: 80px; overflow: hidden; transform: translateY(-10px) scale(0.92); z-index: 3; border-radius: 4px; box-shadow: 0 -4px 10px rgba(0,0,0,0.2);">
                <img class="loaded" src="${this.tracks[1].img}" style="width: 100%; height: 380px; object-fit: cover; object-position: top;" />
              </div>

              <!-- Main active album card -->
              <figure class="music__media" style="position: relative; width: 454px; height: 454px; visibility: visible; z-index: 4; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
                <img alt="diet coke" class="music__image loaded" src="${this.tracks[0].img}" style="width: 100%; height: 100%; object-fit: cover;" />
              </figure>
            </div>

            <!-- Title & label on bottom-left -->
            <header class="music__header" style="position: absolute; bottom: 24px; left: 24px; z-index: 5;">
              <p class="music__label" style="visibility: visible;">Single</p>
              <h2 class="music__title" style="margin-top: 16px;">diet coke</h2>
            </header>

            <!-- Mini map in top-right -->
            <div class="music__map" style="position: absolute; top: 96px; right: 24px; width: 150px; height: 96px; border: 1px solid rgba(2,2,2,0.1); overflow: hidden; z-index: 5;">
              <div class="music__map__wrapper" style="position: absolute; left: 0; bottom: 16px; width: 100%; display: flex; flex-direction: column-reverse; align-items: center; transition: transform 0.4s ease;">
                ${this.tracks.map((t, idx) => `
                  <div class="music__map__item" data-index="${idx}" style="display: flex; align-items: center; justify-content: center; height: 64px; width: 100%; cursor: pointer;">
                    <img class="music__map__image loaded" src="${t.img}" style="width: 48px; height: 48px; object-fit: cover;" />
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Song Playback Fullscreen Overlay -->
            <div class="song">
              <div class="song__background">
                <img class="song__background__image loaded" src="${this.tracks[0].img}" />
              </div>
              <figure class="song__background__cover">
                <img class="song__media__image loaded" src="${this.tracks[0].img}" style="width: 100%; height: 100%; object-fit: cover;" />
              </figure>

              <button class="song__close" aria-label="Close">Back</button>

              <h2 class="song__title">diet coke</h2>

              <div class="song__controls">
                <button class="song__playback" aria-label="Toggle Playback">
                  <svg class="song__playback__icon song__playback__icon--pause" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <use xlink:href="#player-toggle-pause"></use>
                  </svg>
                </button>
              </div>

              <div class="song__progress"></div>

              <!--
              <div class="song__information">
                <p><a href="https://open.spotify.com/artist/0CYB6ZJaRsM378rSlbTwGB" target="_blank" rel="noopener">Listen on Spotify</a></p>
                <p><a href="https://music.apple.com/us/artist/matt-jinn/1689268159" target="_blank" rel="noopener">Apple Music</a></p>
              </div>
              -->
            </div>
          </section>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const mainMedia = this.element.querySelector('.music__media');
    const mainImg = this.element.querySelector('.music__image');
    const titleEl = this.element.querySelector('.music__title');
    const labelEl = this.element.querySelector('.music__label');
    const mapItems = this.element.querySelectorAll('.music__map__item');
    const mapWrapper = this.element.querySelector('.music__map__wrapper');

    const songOverlay = this.element.querySelector('.song');
    const songClose = this.element.querySelector('.song__close');
    const songTitle = this.element.querySelector('.song__title');
    const songBg = this.element.querySelector('.song__background__image');
    const songCover = this.element.querySelector('.song__media__image');

    const setTrack = (idx) => {
      this.currentIndex = idx;
      const track = this.tracks[idx];
      mainImg.src = track.img;
      titleEl.textContent = track.title;
      labelEl.textContent = track.type;
      songTitle.textContent = track.title;
      songBg.src = track.img;
      songCover.src = track.img;
      mapWrapper.style.transform = `translateY(${idx * 64}px)`;
    };

    mainMedia.style.cursor = 'pointer';
    mainMedia.addEventListener('click', () => {
      document.documentElement.classList.add('music--playing');
      songOverlay.classList.add('song--active');
    });

    songClose.addEventListener('click', () => {
      document.documentElement.classList.remove('music--playing');
      songOverlay.classList.remove('song--active');
    });

    mapItems.forEach((item) => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-index'), 10);
        setTrack(idx);
      });
    });

    this.element.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0 && this.currentIndex < this.tracks.length - 1) {
          setTrack(this.currentIndex + 1);
        } else if (e.deltaY < 0 && this.currentIndex > 0) {
          setTrack(this.currentIndex - 1);
        }
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
