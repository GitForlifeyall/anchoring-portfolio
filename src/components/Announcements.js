export class Announcements {
  constructor(onOpenNewsletter) {
    this.onOpenNewsletter = onOpenNewsletter;
    this.currentIndex = 0;
    this.render();
  }

  render() {
    this.element = document.createElement('aside');
    this.element.className = 'announcements';
    this.element.innerHTML = `
      <ul class="announcements__list"></ul>
    `;
  }
}
