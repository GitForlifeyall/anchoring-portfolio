import fs from 'fs';

const svgContent = fs.readFileSync('public/assets/icons/bundle.svg', 'utf-8');
// Clean up XML header from SVG if needed
const cleanSvg = svgContent.replace(/<\?xml.*?\?>/g, '').replace(/<!DOCTYPE.*?>/g, '').trim();

const html = `<!DOCTYPE html>
<html class="desktop" data-template="page" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimal-ui" />
    <title>Matt Jinn | Home</title>
    <meta name="description" content="Matt Jinn - Emerging Asian-American artist based in New York City" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Matt Jinn | Home" />
    
    <!-- Adobe Typekit for Big Caslon FB and Omnes Pro -->
    <link rel="preconnect" href="https://use.typekit.net" />
    <link rel="stylesheet" href="https://use.typekit.net/abm5lzj.css" />
    
    <!-- Local Compiled Stylesheet -->
    <link rel="stylesheet" href="/src/styles/main.css" />

    <style>
      /* Fallback font declarations to ensure 100% typography fidelity */
      @font-face {
        font-family: "big-caslon-fb";
        src: local("Big Caslon"), local("BigCaslon-Medium"), local("Caslon");
      }
      @font-face {
        font-family: "omnes-pro";
        src: local("Omnes"), local("Omnes Pro"), local("Inter"), local("Helvetica Neue"), sans-serif;
      }
      /* SVG Symbol definition container */
      .svg-sprite-defs {
        position: absolute;
        width: 0;
        height: 0;
        overflow: hidden;
        pointer-events: none;
      }
    </style>
  </head>
  <body>
    <!-- Inline SVG Symbol Defs -->
    <div class="svg-sprite-defs">
      ${cleanSvg}
    </div>

    <!-- WebGL Canvas Layer -->
    <div class="canvas"></div>

    <!-- App Shell -->
    <div class="app"></div>

    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`;

fs.writeFileSync('index.html', html, 'utf-8');
console.log('Generated index.html successfully');
