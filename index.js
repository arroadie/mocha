var koa
var server = require('socket.io')(3000);

var thread = {
  id: 'test',
  parent_id: null,
  type: null,
  has_children: true,
  user_id: 'francis',
  user_name: 'Francis',
  message: '',
  timestamp: 1456154319
};

server.on('connection', function(socket) {
  console.log(`Connected client: ${socket.id}`);

  socket.on('message', function(data) {
    console.log(`Message ${socket.id}: ${data}`);
    server.emit('message', data);
  });
});

console.log('Listening on port 3000');

