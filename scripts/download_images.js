import fs from 'fs';
import path from 'path';
import https from 'https';

const images = [
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/973fd8bbd343238aa42f0226b1dcf8f60f18e78d-1920x1167.jpg', dest: 'public/assets/images/hero-1.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/46b931eb85008d6f19095111cd48804fb63147c8-1920x1167.jpg', dest: 'public/assets/images/hero-2.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/709e9680716d109bb46579b36745db81799ecdd0-1920x1167.jpg', dest: 'public/assets/images/hero-3.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/9d6f4a52d350579cb14729fd443cbe56aaa086ff-1920x1080.jpg', dest: 'public/assets/images/shows-1.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/e838cc77c8b439ad609bf67810dc868a5a414bbb-2001x3000.jpg', dest: 'public/assets/images/shows-2.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/a028b71040a16c7dd85abd5246c9edf16c49e45c-1920x1080.jpg', dest: 'public/assets/images/about-1.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/38b5d6182ed92061da40ff9caeed64b34b16e161-2001x3000.jpg', dest: 'public/assets/images/about-3.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/2f50f33464c0ac8d28e2d5fe4a79037b3cb03a83-1920x1080.jpg', dest: 'public/assets/images/about-4.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/54ef91679ad0bac80d74c5ddab6cd5c389957579-400x485.jpg', dest: 'public/assets/images/menu-1.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/4f71f2111c18b842e2c54ceed24b017be8d2608f-1920x1080.jpg', dest: 'public/assets/images/menu-4.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/3fce6a1286141b514e1122d16e6ef7ea0c666856-719x719.jpg', dest: 'public/assets/images/music-1.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/6b59e94939c4e04a7ef58e95b8bbd072390dd555-1000x1000.jpg', dest: 'public/assets/images/music-2.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/fea808e234fbc2bb7a64d5695b9a57deaa736774-1000x1000.jpg', dest: 'public/assets/images/music-3.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/c8cd73abd690d460893cd46a5bf07a3a79a3a539-1440x1440.jpg', dest: 'public/assets/images/music-4.jpg' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/74e8b6f0587203c64fdf3721a54fd3940185645f-1024x1024.png', dest: 'public/assets/images/announce-2.png' },
  { url: 'https://cdn.sanity.io/images/sdzemiz8/production/948b58ef388210e59d1bf51242174e14a3b65603-315x434.jpg', dest: 'public/assets/images/newsletter.jpg' }
];

async function downloadFile(url, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Saved: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const item of images) {
    try {
      await downloadFile(item.url, item.dest);
    } catch (e) {
      console.error(e.message);
    }
  }
}

run();
