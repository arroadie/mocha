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

let pinned = [];
let pool = {'test-room':[]};

server.on('connection', function(socket) {
  Log.srv(`Connected client: ${socket.id}`);

  // TODO: Join
  socket.on('message', function(data) {
    Log.srv(`[Message] ${data.user_name}: ${data.message}`);
    let response = new Thread(data);

    if (!pool.hasOwnProperty(data.parent_id)) {
      // TODO: Subscribe
      pool[data.parent_id] = [];
    }
    pool[data.parent_id].push(response);
    server.emit('message', response);
  });

  socket.on('history', function(data) {
    socket.emit('history', pool);
  });

  socket.on('subscribe', function(data) {
    Log.srv(`Trying to subscribe to ${data}`);
    if (pool.hasOwnProperty(data)) {
      Log.srv(` -> Already subscribed to thread`);
      socket.emit('subscribed-thread', {
        id: data,
      });
    } else {
      Log.srv(` -> Thread empty`);
      socket.emit('empty-thread', {
        id: data,
        history: []
      });
    }
  });
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
      message: fs.readFileSync(path.join(__dirname,'views', 'message.hbs')).toString(),
      thread: fs.readFileSync(path.join(__dirname,'views', 'thread.hbs')).toString(),
      thread_list_item: fs.readFileSync(path.join(__dirname,'views', 'thread_list_item.hbs')).toString(),
    }
  });
});
app.use(router.routes());

app.listen(8001);
Log.web('Listening on port 8001');
Log.srv('Listening on port 3000');
