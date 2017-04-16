const http = require('http');
const path = require('path');

const socketio = require('socket.io');
const express = require('express');
const mongoose = require('mongoose');

const router = express();
const server = http.createServer(router);
const io = socketio.listen(server);

const sockets = [];

mongoose.connect('mongodb://localhost/place');
mongoose.connection.once('open', () => {});

const Pixel = mongoose.model('Pixel', new mongoose.Schema({
  x: Number,
  y: Number,
  color: String,
}));

router.use(express.static(path.resolve(__dirname, 'client')));

io.on('connection', (socket) => {
  Pixel.find().sort({ _id: -1 }).exec((error, pixels) => {
    if (error) {
      console.error(error);
      return;
    }
    const uniquePixels = [];
    pixels.forEach((pixel) => {
      if (uniquePixels.every(upixel => upixel.x !== pixel.x || upixel.y !== pixel.y)) {
        uniquePixels.push(pixel);
      }
    });
    socket.emit('pixels', uniquePixels.map(pixel => ({
      x: pixel.x,
      y: pixel.y,
      color: pixel.color,
    })));
  });

  sockets.push(socket);

  socket.on('disconnect', () => sockets.splice(sockets.indexOf(socket), 1));

  socket.on('pixel', (pixel) => {
    if (
      !Number.isInteger(pixel.x) ||
      !Number.isInteger(pixel.y) ||
      !pixel.color.match(/#[a-fA-F0-9]{6}/) ||
      pixel.x < 0 ||
      pixel.x >= 512 ||
      pixel.y < 0 ||
      pixel.y >= 512
    ) {
      console.error('Invalid value');
      return;
    }
    socket.broadcast.emit('pixel', pixel);
    new Pixel(pixel).save((error) => {
      if (error) {
        console.error(error);
      }
    });
  });
});

server.listen(process.env.PORT || 3000, process.env.IP || 'localhost', () => {
  const addr = server.address();
  console.log(`Open Place server listening at ${addr.address}:${addr.port}`);
});
