var fs = require('fs');
var koa = require('koa');
var router = require('koa-router')();
var serve = require('koa-serve');

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

var users = {};

server.on('connection', function(socket) {
  console.log(`Connected client: ${socket.id}`);

  socket.on('message', function(data) {
    console.log(`Message ${socket.id}: ${data}`);
    server.emit('message', data);
  });
});


// Web app
var app = koa();

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

