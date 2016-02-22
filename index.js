'use strict';

let fs = require('fs');
let koa = require('koa');
let router = require('koa-router')();
let serve = require('koa-serve');

let server = require('socket.io')(3000);

let thread = {
  id: 'test',
  parent_id: null,
  type: null,
  has_children: true,
  user_id: 'francis',
  user_name: 'Francis',
  message: '',
  timestamp: 1456154319
};

let users = {};

server.on('connection', function(socket) {
  console.log(`Connected client: ${socket.id}`);

  socket.on('message', function(message) {
    console.log(`Message ${socket.id}: ${JSON.stringify(message)}`);
    let response = {
      timestamp: Date.now(),
      username: message.username,
      data: message.data
    };
    server.emit('message', response);
  });
});

// Web app
let app = koa();

app.use(serve('public'));
app.use(function* (next) {
  const start = new Date();
  yield next;
  const end = new Date();

  console.log(`[WebApp][${start.toISOString()}] :: ${this.method} ${this.url} processed in ${String(end-start)} ms`);
});

router.get('/', function(next) {
  this.body = fs.readFileSync('index.html').toString();
});
app.use(router.routes());

app.listen(8001);
console.log('WebApp listening on port 8001');
console.log('Server listening on port 3000');
