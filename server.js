const http = require('http');
const path = require('path');

const socketio = require('socket.io');
const express = require('express');
const mongoose = require('mongoose');

const router = express();
const server = http.createServer(router);
const io = socketio.listen(server);

const sockets = [];

mongoose.connect(`mongodb://${process.env.IP}/place`);
mongoose.connection.once('open', () => {});

const Pixel = mongoose.model('Pixel', new mongoose.Schema({
  x: Number,
  y: Number,
  color: String
}));

router.use(express.static(path.resolve(__dirname, 'client')));

io.on('connection', (socket) => {
  Pixel.find({}, (e, pixels) => {
    if (e) {
      console.error(e);
      return;
    }
    socket.emit('pixels', pixels.map(pixel => ({
      x: pixel.x,
      y: pixel.y,
      color: pixel.color
    })));
    // pixels.forEach(pixel => socket.emit('pixel', { x: pixel.x, y: pixel.y, color: pixel.color }));
  });

  sockets.push(socket);

  socket.on('disconnect', () => sockets.splice(sockets.indexOf(socket), 1));

  socket.on('pixel', (pixel) => {
    socket.broadcast.emit('pixel', pixel);
    (new Pixel(pixel)).save((e) => {
      if (e) {
        console.error(e);
      }
    });
  });
});

server.listen(process.env.PORT || 3000, process.env.IP || '0.0.0.0', function(){
  const addr = server.address();
  console.log(`Open Place server listening at ${addr.address}:${addr.port}`);
});
