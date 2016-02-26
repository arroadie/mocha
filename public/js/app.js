var socket = io('http://' + window.location.hostname + ':3000');
var templates = {};
var capturingReplyClick = false;
var userInfo = {
  loggedIn: false,
  subscribedThreads: [],
  fetchedThreads:[]
};

socket.on('connect', function (data) {
  console.log('connected successfull');
});

socket.on('message', function(data) {
  printMessage(data);
});

socket.on('state', function(data) {
  console.log('data', data);
  data.forEach(function(thread) {
    renderThreadElement(thread.id, thread.message);
  });
});

socket.on('thread-content', function(data) {
  updateThreadContent(data.id, data.children);
});

socket.on('subscribed-thread', function(data) {
  updateThreadContent(data.id, data.children);
  activateThread(data.id);
});

socket.on('unsubscribed-thread', function(data) {
  removeThread(data.id);
  activateThread('home');
});

socket.on('favorite-message', function(data) {
  console.log('fav', data);
  var favs = $('a.favorite[data-message-id="' + data.id + '"]');
  favs.attr('data-is-favorite', data.status);
  if (data.status === true) {
    favs.text('unfav');
  } else {
    favs.text('fav');
  }
});

socket.on('created-room', function(data) {
  renderChat(data.id, data.message, []);
  activateThread(data.id);
});

socket.on('inchat-notification', function(data) {
  printInChatNotification(data);
});

socket.on('notification', function(data) {
  alert([data.title, data.message].join('. '));
});

window.addEventListener("load", function() {
  templates['message'] = Handlebars.compile($("#message_template").html());
  templates['thread'] = Handlebars.compile($("#thread_template").html());
  templates['home'] = Handlebars.compile($("#home_template").html());
  templates['thread_list_item'] = Handlebars.compile($("#thread_list_item_template").html());
  templates['inchat_notification'] = Handlebars.compile($("#inchat_notification_template").html());

  $(window).resize(function() {
    resizeWindow();
  });

  $('.create-room').on('click', function(ev) {
    ev.preventDefault();
    var roomName = prompt('Set the room name:');
    if (roomName !== '') {
      createRoom(roomName);
    }
    closeDropdownMenu();
    return false;
  });

  $('.private-chat').on('click', function(ev) {
    ev.preventDefault();
    closeDropdownMenu();
    return false;
  });

  $('.dropdown-menu .login').on('click', function(ev) {
    login(ev);
    closeDropdownMenu();
    return false;
  });

  $('.dropdown-menu .logout').on('click', function(ev) {
    logout(ev);
    closeDropdownMenu();
    return false;
  });

  joinUser();
  renderHome();
  resizeWindow();
  updateEvents();
  socket.emit('state', {user_name: getUser()});
});

function closeDropdownMenu() {
  $('#threads-list .header .button').removeClass('open');
  $('#threads-list .header .button button').attr('aria-expanded', false);
}

function login(ev) {
  ev.preventDefault();
  var username = prompt('Type your username:');
  if (username === '') {
    alert('Username can not be empty');
    return false;
  }
  Cookies.set("username", username);
  socket.emit('join', username);
  refreshUserData();
}

function logout(ev) {
  ev.preventDefault();
  Cookies.remove("username");
  refreshUserData();
}

function activateThread(id) {
  $('#chat section.content').removeClass('current');
  $('#chat section.content[data-thread-id="' + id +'"]').addClass('current');
  $('#threads-list ul li').removeClass('active');
  $('#threads-list ul li[data-thread-id="' + id +'"]').addClass('active');
}

function onThreadListClick(ev) {
  var id = $(this).attr('data-thread-id');
  var name = $(this).attr('data-thread-name');
  console.log('on click', name);
  if (getFetchedThread(id) < 0 && id !== 'home') {
    renderThreadContent(id, name);
    socket.emit('thread-children', id);
  }
  activateThread(id);
}

function updateEvents() {
  updateChatEvents();
  updateThreadsListEvents();

  var loginButtons = $('button.login');
  loginButtons.off('click');
  loginButtons.on('click', login);

  var logoutButtons = $('button.logout');
  logoutButtons.off('click');
  logoutButtons.on('click', logout);
}

function updateChatEvents() {
  $('#chat section.content section.footer input').keypress(function (e) {
    var key = e.which;
    if(key === 13) sendMessage();
  });

  $('.unsubscribe').on('click', function(ev) {
    ev.preventDefault();
    var threadId = $(this).attr('data-thread-id');
    socket.emit('unsubscribe', {
      parent_id: threadId,
      user_name: getUser()
    });
  });
}

function updateThreadsListEvents() {
  var threadListItems = $('#threads-list ul li');
  threadListItems.off('click');
  threadListItems.on('click', onThreadListClick);
}

function createRoom(name) {
  socket.emit('create-room', {
    user_name: getUser(),
    parent_id: -1,
    message: name
  });
}

function replyMessage(ev) {
  ev.preventDefault();
  var threadId = $(this).attr('data-message-id');
  var message = $('.message-object[data-thread-id="' + threadId + '"] .message').text();
  console.log('reply message', threadId, message);
  if (getSubscribedThread(threadId) >= 0) {
    activateThread(threadId);
  } else {
    renderThreadElement(threadId, message);
    socket.emit('subscribe', {
      parent_id: threadId,
      user_name: getUser()
    });
  }
  return false;
}

function favoriteMessage(ev) {
  ev.preventDefault();
  var messageId = $(this).attr('data-message-id');
  var isFavorite = $(this).attr('data-is-favorite');

  console.log('fav message', messageId);
  socket.emit('favorite-message', {
    id: messageId,
    user_name: getUser(),
    favorite: isFavorite
  });
  return false;
}

function updateChatScroll(parent_id){
  var chat = $('#chat section.content[data-thread-id="' + parent_id + '"] section.body .messages ul');
  chat.scrollTop = chat.scrollHeight;
}

function getUser() {
  return Cookies.get("username") ? Cookies.get("username") : null;
}

function refreshUserData() {
  if(getUser()) {
    $('button.login').hide();
    $('button.logout').show();
  } else {
    $('button.logout').hide();
    $('button.login').show();
  }
}

function sendMessage() {
  var msg = $('#chat section.content.current section.footer input').val();
  var parentId = $('#chat section.content.current').attr('data-thread-id');
  var user = getUser();

  if (!user || msg === '') return false;

  var success = socket.emit('message', {
    user_name: user,
    message: msg,
    parent_id: parentId
  });

  if (success){
    $('#chat section.content.current section.footer input').val("")
  }
}

function printMessage(data) {
  var date = new Date(data.timestamp);
  var chat = $('#chat section.content[data-thread-id="' + data.parent_id + '"] section.body .messages ul');
  chat.append(templates.message(data));
  updateChatScroll(data.parent_id);
  $('a.reply').off('click');
  $('a.reply').on('click', replyMessage);
  $('a.favorite').off('click');
  $('a.favorite').on('click', favoriteMessage);
}

function printInChatNotification(data) {
  var chat = $('#chat section.content[data-thread-id="' + data.parent_id + '"] section.body .messages ul');
  chat.append(templates.inchat_notification(data));
  updateChatScroll(data.parent_id);
}

function resizeWindow() {
  var innerHeight = $(window).innerHeight();
  var height = innerHeight - 125;
  $('#chat section.content section.body').css('height', height + 'px');
  $('#threads-list').css('height', innerHeight + 'px');
}

function joinUser() {
  var username = getUser();
  if (username !== '') {
    socket.emit('join', username);
  }
}

function renderHome() {
  renderThreadElement('home', 'Home');
  if (getFetchedThread('home') < 0) {
    addFetchedThread('home');
    $('#chat').append(templates.home({}));
  }
  resizeWindow();
  activateThread('home');
}

function renderThreadElement(id, name) {
  if (getSubscribedThread(id) < 0) {
    addSubscribedThread(id);

    name = name || id;
    var obj = {thread_id: id, name: name};
    $('#threads-list ul.nav').append(templates.thread_list_item(obj));
    updateThreadsListEvents();
  }
}

function renderThreadContent(id, name) {
  name = name || id;
  if (getFetchedThread(id) < 0) {
    addFetchedThread(id);
    var obj = {thread_id: id, name: name};
    $('#chat').append(templates.thread(obj));
  }
  refreshUserData();
  resizeWindow();
}

function removeThread(id) {
  $('#threads-list ul li[data-thread-id="' + id +'"]').remove();
  $('#chat section.content[data-thread-id="' + id +'"]').remove();
  userInfo.subscribedThreads = userInfo.subscribedThreads.filter(function(e, i, a) {
    return e !== id + '';
  });
  userInfo.fetchedThreads = userInfo.fetchedThreads.filter(function(e, i, a) {
    return e !== id + '';
  });
}

function updateThreadContent(id, children) {
  $('#chat section.content[data-thread-id="' + id + '"] .body .messages .progress').remove();

  children.forEach(function(msg) {
    printMessage(msg);
  });
  updateChatScroll(id);
  updateChatEvents();
}

function renderChat(id, message, children) {
  console.log('render chat', id, message);
  renderThreadElement(id, message);
  renderThreadContent(id, message, children);
  updateThreadContent(id, children);
}

function getSubscribedThread(id) {
  return userInfo.subscribedThreads.indexOf(id + '');
}

function getFetchedThread(id) {
  return userInfo.fetchedThreads.indexOf(id + '');
}

function addSubscribedThread(id) {
  userInfo.subscribedThreads.push(id + '');
}

function addFetchedThread(id) {
  userInfo.fetchedThreads.push(id + '');
}
