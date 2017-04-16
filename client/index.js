/* global io */

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
  color = (color[0] * 65536 + color[1] * 256 + color[2]).toString(16);
  color = '#000000'.substring(0, 7 - color.length) + color;
  return color;
}

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
      socket.emit('pixel', { x: Math.floor(e.offsetX / SCALE), y: Math.floor(e.offsetY / SCALE), color: leftColor.value });
      setPixel(Math.floor(e.offsetX / SCALE), Math.floor(e.offsetY / SCALE), leftColor.value);
      if (typeof lastC !== 'undefined') lastC = leftColor.value;
      break;
    case 1:
      leftColor.value = lastC;
      break;
  }
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  socket.emit('pixel', { x: Math.floor(e.offsetX / SCALE), y: Math.floor(e.offsetY / SCALE), color: rightColor.value });
  setPixel(Math.floor(e.offsetX / SCALE), Math.floor(e.offsetY / SCALE), rightColor.value);
  if (typeof lastC !== 'undefined') lastC = rightColor.value;
});

let lastX = 0, lastY = 0, lastC = '#ffffff';
canvas.addEventListener('mousemove', (e) => {
  setPixel(lastX, lastY, lastC);
  lastX = Math.floor(e.offsetX / SCALE);
  lastY = Math.floor(e.offsetY / SCALE);
  lastC = getPixel(lastX, lastY);
  setPixel(lastX, lastY, '#bbbbbb');
  coords.innerHTML = `(${lastX}, ${lastY})`;
});

let isControlsVisible = true;
document.addEventListener('keydown', (e) => {
  console.log(e);
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
