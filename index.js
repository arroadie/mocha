'use strict';

let fs = require('fs');
let koa = require('koa');
let router = require('koa-router')();
let serve = require('koa-serve');
let path = require('path');
let hbs = require('koa-hbs');

let server = require('socket.io')(3000);

// Models
let Log = require('./models/log');
let Thread = require('./models/thread');

let pool = [];
let pinned = [];

server.on('connection', function(socket) {
  Log.srv(`Connected client: ${socket.id}`);

  // TODO: Join
  socket.on('message', function(data) {
    Log.srv(`[Message] ${data.user_name}: ${data.message}`);
    let response = new Thread(data);
    pool.push(response);
    server.emit('message', response);
  });

  socket.emit('history', JSON.stringify(pool));
});

// Web app
let app = koa();

app.use(serve('public'));

app.use(hbs.middleware({
  viewPath: path.join(__dirname, 'views')
}));

app.use(function* (next) {
  const start = new Date();
  yield next;
  const end = new Date();

  Log.web(`${this.method} ${this.url} processed in ${String(end-start)} ms`);
});

router.get('/', function* (next) {
  yield this.render('index', {
    templates: {
      message: fs.readFileSync(path.join(__dirname,'views', 'message.hbs')).toString()
    }
  });
});
app.use(router.routes());

app.listen(8001);
Log.web('Listening on port 8001');
Log.srv('Listening on port 3000');
