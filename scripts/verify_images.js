import { chromium } from 'playwright';

async function testSite() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

  // Wait for preloader to finish
  console.log('Waiting for preloader to complete...');
  await page.waitForTimeout(4000);

  // Take screenshot of Home page
  await page.screenshot({ path: 'verify_home.png' });
  console.log('Saved verify_home.png');

  // Click navigation button to open Menu
  console.log('Opening menu...');
  await page.click('.navigation__button');
  await page.waitForTimeout(1000);

  // Take screenshot of menu open (default: Music preview image)
  await page.screenshot({ path: 'verify_menu_music.png' });
  console.log('Saved verify_menu_music.png');

  // Hover over Videos
  console.log('Hovering over Videos...');
  await page.hover('a[data-route="/videos/"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'verify_menu_videos.png' });
  console.log('Saved verify_menu_videos.png');

  // Hover over Shows
  console.log('Hovering over Shows...');
  await page.hover('a[data-route="/shows/"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'verify_menu_shows.png' });
  console.log('Saved verify_menu_shows.png');

  // Hover over About
  console.log('Hovering over About...');
  await page.hover('a[data-route="/about/"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'verify_menu_about.png' });
  console.log('Saved verify_menu_about.png');

  // Click on Shows link
  console.log('Navigating to Shows...');
  await page.click('a[data-route="/shows/"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'verify_shows_01.png' });
  console.log('Saved verify_shows_01.png');

  // Click Show 02
  console.log('Selecting Show 02...');
  const show02Item = await page.$('.shows__item[data-index="1"]');
  if (show02Item) {
    await show02Item.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'verify_shows_02.png' });
    console.log('Saved verify_shows_02.png');
  }

  // Navigate to About
  console.log('Navigating to About...');
  await page.goto('http://localhost:5173/about/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'verify_about_01.png' });

  // Scroll down to Section 2 & 3
  await page.evaluate(() => {
    const pageEl = document.querySelector('.page');
    if (pageEl) pageEl.scrollTop = window.innerHeight;
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'verify_about_section2.png' });
  console.log('Saved verify_about_section2.png');

  await browser.close();
  console.log('Verification complete!');
}

testSite().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
