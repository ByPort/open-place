/* global io */
/* global document */

const SCALE = 8;

const socket = io.connect();

const controls = document.getElementById('controls');
const leftColor = document.getElementById('color-left');
const rightColor = document.getElementById('color-right');
const coords = document.getElementById('coords');
const canvas = document.getElementById('place');
const ctx = canvas.getContext('2d');

function setPixel(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function getPixel(x, y) {
  let color = ctx.getImageData(x * SCALE, y * SCALE, 1, 1).data;
  color = ((color[0] * 65536) + (color[1] * 256) + color[2]).toString(16);
  color = '#000000'.substring(0, 7 - color.length) + color;
  return color;
}

const shadow = {
  x: 0,
  y: 0,
  color: '#ffffff',
};
let isControlsVisible = true;

canvas.style.borderWidth = `${SCALE}px`;
canvas.width = 512 * SCALE;
canvas.height = 512 * SCALE;

ctx.scale(SCALE, SCALE);

ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, 512, 512);

canvas.addEventListener('mousedown', (e) => {
  e.preventDefault();
  switch (e.button) {
    case 0:
      setPixel(Math.floor(e.offsetX / SCALE), Math.floor(e.offsetY / SCALE), leftColor.value);
      shadow.color = leftColor.value;
      socket.emit('pixel', { x: Math.floor(e.offsetX / SCALE), y: Math.floor(e.offsetY / SCALE), color: leftColor.value });
      break;
    case 1:
      leftColor.value = shadow.color;
      break;
    default: break;
  }
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  socket.emit('pixel', { x: Math.floor(e.offsetX / SCALE), y: Math.floor(e.offsetY / SCALE), color: rightColor.value });
  setPixel(Math.floor(e.offsetX / SCALE), Math.floor(e.offsetY / SCALE), rightColor.value);
  shadow.color = rightColor.value;
});

canvas.addEventListener('mousemove', (e) => {
  setPixel(shadow.x, shadow.y, shadow.color);
  shadow.x = Math.floor(e.offsetX / SCALE);
  shadow.y = Math.floor(e.offsetY / SCALE);
  shadow.color = getPixel(shadow.x, shadow.y);
  setPixel(shadow.x, shadow.y, '#bbbbbb');
  coords.innerHTML = `(${shadow.x}, ${shadow.y})`;
});

document.addEventListener('keydown', (e) => {
  if (e.keyCode === 72) {
    controls.style.display = isControlsVisible ? 'none' : 'block';
    isControlsVisible = !isControlsVisible;
  }
});

socket.on('pixel', (pixel) => {
  setPixel(pixel.x, pixel.y, pixel.color);
});

socket.on('pixels', (pixels) => {
  pixels.forEach(pixel => setPixel(pixel.x, pixel.y, pixel.color));
});
