'use strict';

let fs = require('fs');
let koa = require('koa');
let router = require('koa-router')();
let serve = require('koa-serve');

let server = require('socket.io')(3000);

// Models
let Thread = require('./models/thread');

let pool = [];

server.on('connection', function(socket) {
  console.log(`Connected client: ${socket.id}`);

  // TODO: Join
  socket.on('message', function(data) {
    console.log(`Message ${socket.id}: ${JSON.stringify(data)}`);
    let response = new Thread(data, { parent_id: 'test' });
    pool.push(response);
    console.log('response', response);
    server.emit('message', response);
  });

  socket.emit('history', JSON.stringify(pool));
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
