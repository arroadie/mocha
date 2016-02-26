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

let usersPool = {};
let pinned = [];
let pool = {'1':[]};

const hostname = 'geekon32.snc1';
const port = 8080;

server.on('connection', function(socket) {
  Log.srv(`Connected client: ${socket.id}`);

  socket.on('join', function(data) {
    console.log('join', data);
    Log.srv(`Joined user '${data}' with socket id '${socket.id}'`);
    usersPool[data] = socket;
  });

  socket.on('state', function(data) {
    var req = Http.get(`/users/${data.user_name}/state`)
    .then(function(res) {
      socket.emit('state', res);
    })
    .catch(function(err) {
      socket.emit('notification', {
        title: 'Error fetching user settings',
        message: err
      });
    });
  });

  socket.on('thread-children', function(data) {
    var req = Http.get(`/threads/${data}/children`)
    .then(function(res) {
      socket.emit('thread-content', res);
    })
    .catch(function(err) {
      socket.emit('notification', {
        title: 'Error fetching thread content',
        message: err
      });
    });
  });

  socket.on('subscribe', function(data) {
    var req = Http.put(`/users/${data.user_name}/threads/${data.parent_id}/subscribe`)
    .then(function(res) {
      socket.emit('subscribed-thread', res);
    })
    .catch(function(err) {
      socket.emit('notification', {
        title: 'Error subscribing thread',
        message: err
      });
    });
  });

  socket.on('unsubscribe', function(data) {
    var req = Http.delete(`/users/${data.user_name}/threads/${data.parent_id}/subscribe`)
    .then(function(res) {
      socket.emit('unsubscribed-thread', res);
    })
    .catch(function(err) {
      socket.emit('notification', {
        title: 'Error unsubscribing thread',
        message: err
      });
    });
  });

  socket.on('message', function(data) {
    Log.srv(`[Message::${data.parent_id}] – ${data.user_name}: ${data.message}`);
    let thread = new Thread(data);

    var req = Http.put(`/threads/${data.parent_id}`, thread)
    .then(function(res) {
      server.emit('message', res);
    })
    .catch(function(err) {
      socket.emit('inchat-notification', {
        parent_id: data.parent_id,
        class: 'error',
        message: 'Error sending message: ' + err
      });
    });
  });

  socket.on('favorite-message', function(data) {
    Log.srv(`[Favorite::${data.id}] – ${data.user_name}: ${data.message}`);

    var req = Http.put(`/users/${data.user_name}/threads/${data.id}/favorite`)
    .then(function(res) {
      socket.emit('favorite-message', res);
    })
    .catch(function(err) {
      socket.emit('notification', {
        title: 'Error adding message to favorites',
        message: err
      });
    });
  });

  socket.on('create-room', function(data) {
    console.log('data', data);
  });

  socket.on('history', function(data) {
    var req = Http.get(`/threads/${data.parent_id}/children`)
    .then(function(res) {
      socket.emit('history', res);
    })
    .catch(function(err) {
      socket.emit('inchat-notification', {
        parent_id: data.parent_id,
        class: 'error',
        message: 'Error sending message: ' + err
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
      home: fs.readFileSync(path.join(__dirname,'views', 'home.hbs')).toString(),
      inchat_notification: fs.readFileSync(path.join(__dirname,'views', 'inchat_notification.hbs')).toString(),
      thread: fs.readFileSync(path.join(__dirname,'views', 'thread.hbs')).toString(),
      thread_list_item: fs.readFileSync(path.join(__dirname,'views', 'thread_list_item.hbs')).toString(),
    }
  });
});

router.put('/threads/:id/reply', function* (next) {
  this.body = 'ok';
});

router.put('/users/:username/mention', function* (next) {
  console.log('mention', usersPool[this.params.username]);
  console.log(this.body);
  usersPool[this.params.username].emit('mention', this.body);
  this.body = 'ok';
});

app.use(router.routes());

app.listen(8001);
Log.web('Listening on port 8001');
Log.srv('Listening on port 3000');
