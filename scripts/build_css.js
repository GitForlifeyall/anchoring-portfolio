import fs from 'fs';
import path from 'path';

const srcFile = 'C:/Users/Shahid/.gemini/antigravity-ide/brain/5a6213d2-b0a8-4334-8e6a-75d48339d944/.system_generated/steps/60/content.md';
const destFile = 'src/styles/main.css';

const content = fs.readFileSync(srcFile, 'utf-8');
// Remove markdown header if present
const cssStart = content.indexOf('.app{');
if (cssStart !== -1) {
  let css = content.slice(cssStart);
  // Ensure destination directory exists
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.writeFileSync(destFile, css, 'utf-8');
  console.log(`Wrote ${css.length} bytes of CSS to ${destFile}`);
} else {
  console.error('Could not find CSS start in source file');
}
