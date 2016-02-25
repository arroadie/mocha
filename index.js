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
let Http = require('./models/http.js');

let pinned = [];
let pool = {'1':[]};

const hostname = 'geekon32.snc1';
const port = 8080;

server.on('connection', function(socket) {
  Log.srv(`Connected client: ${socket.id}`);

  socket.on('state', function(data) {
    var req = Http.get(`/users/${data.user_name}/state`)
    .then(function(res) {
    })
    .catch(function(err) {
      socket.emit('notification', {
        title: 'Error fetching user settings',
        message: err.response
      });
    });
  });

  // TODO: Join
  socket.on('message', function(data) {
    Log.srv(`[Message::${data.parent_id}] – ${data.user_name}: ${data.message}`);
    let response = new Thread(data);

    console.log('resp', JSON.stringify(response));

    var req = Http.put(`/threads/${data.parent_id}`, response)
    .then(function(res) {
      server.emit('message', res.response);
    })
    .catch(function(err) {
      socket.emit('inchat-notification', {
        parent_id: data.parent_id,
        class: 'error',
        message: 'Error sending message: ' + err.response
      });
    });
  });

  socket.on('history', function(data) {
    var req = Http.get(`/threads/${data.parent_id}/children`)
    .then(function(res) {
      var r = {};
      r[data.parent_id] = res.response;
      socket.emit('history', {
      });
    })
    .catch(function(err) {
      socket.emit('inchat-notification', {
        parent_id: data.parent_id,
        class: 'error',
        message: 'Error sending message: ' + err.response
      });
    });
  });

  socket.on('subscribe', function(data) {
    var req = Http.put(`/users/${data.user_id}/threads/${data.parent_id}/subscription`)
    .then(function(res) {
      socket.emit('subscribed-thread', {
        id: data.id,
        history: data.history
      });
    })
    .catch(function(err) {
      socket.emit('notification', {
        title: 'Error subscribing thread',
        message: err.response
      });
    });
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
      inchat_notification: fs.readFileSync(path.join(__dirname,'views', 'inchat_notification.hbs')).toString(),
      thread: fs.readFileSync(path.join(__dirname,'views', 'thread.hbs')).toString(),
      thread_list_item: fs.readFileSync(path.join(__dirname,'views', 'thread_list_item.hbs')).toString(),
    }
  });
});
app.use(router.routes());

app.listen(8001);
Log.web('Listening on port 8001');
Log.srv('Listening on port 3000');
