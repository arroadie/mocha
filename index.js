//var app = require('http').createServer(handler);
var server = require('socket.io')(3000);

server.on('connection', function(socket) {
  console.log('soksokdoaksd', socket.id);

  socket.on('message', function(data) {
    console.log(`Message ${socket.id}: ${data}`);
  });
});

console.log('Listening on port 3000');

