import fs from 'fs';
import path from 'path';
import https from 'https';

const assets = [
  { url: 'https://mattjinn.com/transition-rtl.png', dest: 'public/assets/textures/transition-rtl.png' },
  { url: 'https://mattjinn.com/transition-center.jpg', dest: 'public/assets/textures/transition-center.jpg' },
  { url: 'https://mattjinn.com/noise.png', dest: 'public/assets/textures/noise.png' },
  { url: 'https://mattjinn.com/bundle.svg', dest: 'public/assets/icons/bundle.svg' }
];

async function downloadFile(url, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        // Redirect
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const item of assets) {
    try {
      await downloadFile(item.url, item.dest);
    } catch (e) {
      console.error(e.message);
    }
  }
}

run();
