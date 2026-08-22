// One-off generator for placeholder equirectangular panorama JPEGs.
// Not part of the shipped site - just produces test images so the
// virtual tour can be wired up and clicked through before real photos exist.
const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');

const WIDTH = 2048;
const HEIGHT = 1024;

// hue (0-360), used to give each room a distinct, recognisable colour
const SCENES = [
  { id: 'entrance', hue: 38 },
  { id: 'garden-bar', hue: 112 },
  { id: 'sports-bar', hue: 212 },
  { id: 'restaurant', hue: 355 },
  { id: 'side-bar', hue: 280 },
  { id: 'side-terrace', hue: 172 },
];

function hslToRgb(h, s, l) {
  h /= 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function generateScene(hue) {
  const data = Buffer.alloc(WIDTH * HEIGHT * 4);

  // Horizon sits a little above vertical centre, like a real handheld 360 shot.
  const horizonY = Math.round(HEIGHT * 0.52);

  for (let y = 0; y < HEIGHT; y++) {
    let lightness;
    if (y < horizonY) {
      // "ceiling" - lighter near the top, darkening toward the horizon
      const t = y / horizonY;
      lightness = 0.72 - t * 0.22;
    } else {
      // "floor" - darker near the horizon, darkening further toward the bottom
      const t = (y - horizonY) / (HEIGHT - horizonY);
      lightness = 0.5 - t * 0.32;
    }

    for (let x = 0; x < WIDTH; x++) {
      // gentle horizontal hue drift so no two headings look identical
      const localHue = (hue + (x / WIDTH) * 20 - 10 + 360) % 360;
      let [r, g, b] = hslToRgb(localHue, 0.45, lightness);

      // vertical seam lines every 45 degrees - orientation reference points
      const degPerPx = 360 / WIDTH;
      const deg = x * degPerPx;
      const nearSeam = Math.abs(((deg % 45) + 45) % 45) < 0.35;
      if (nearSeam) {
        r = Math.max(0, r - 40);
        g = Math.max(0, g - 40);
        b = Math.max(0, b - 40);
      }

      // horizon line highlight
      if (Math.abs(y - horizonY) < 2) {
        r = Math.min(255, r + 35);
        g = Math.min(255, g + 35);
        b = Math.min(255, b + 35);
      }

      const i = (y * WIDTH + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  return jpeg.encode({ data, width: WIDTH, height: HEIGHT }, 85);
}

const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });

for (const scene of SCENES) {
  const { data } = generateScene(scene.hue);
  const outPath = path.join(outDir, `${scene.id}.jpg`);
  fs.writeFileSync(outPath, data);
  console.log(`wrote ${outPath} (${(data.length / 1024).toFixed(0)} KB)`);
}
