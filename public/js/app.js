var socket = io('http://' + window.location.hostname + ':3000');
var templates = {};
var capturingReplyClick = false;
var userInfo = {
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
  data.forEach(function(key) {
    renderThreadElement(key);
  });
    renderThreadContent(data[0]);
  socket.emit('thread-children', data[0]);
});

socket.on('thread-content', function(data) {
  updateThreadContent(data.id, data.children);
});

socket.on('subscribed-thread', function(data) {
  console.log('subscribed', data);
  activateThread(data.id);
});

socket.on('empty-thread', function(data) {
  console.log('empty', data);
  renderChat(data.id, data.history);
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

  renderHome();
  resizeWindow();
  updateEvents();
  socket.emit('state', {user_name: getUser()});
});

function login(ev) {
  ev.preventDefault();
  var username = prompt('Type your username:');
  Cookies.set("username", username);
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
  if (userInfo.fetchedThreads.indexOf(id) < 0) {
    renderThreadContent(id);
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
}

function updateThreadsListEvents() {
  var threadListItems = $('#threads-list ul li');
  threadListItems.off('click');
  threadListItems.on('click', onThreadListClick);
}

function replyMessage(ev) {
  ev.preventDefault();
  var threadId = $(this).attr('data-thread-id');
  if (userInfo.subscribedThreads.indexOf(threadId) >= 0) {
    activateThread(threadId);
  } else {
    socket.emit('subscribe', threadId);
  }
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
  console.log(msg, parentId);

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

function renderHome() {
  renderThreadElement('home');
  if (userInfo.fetchedThreads.indexOf('home') < 0) {
    userInfo.fetchedThreads.push('home');
    $('#chat').append(templates.home({}));
  }
  resizeWindow();
  activateThread('home');
}

function renderThreadElement(id) {
  if (userInfo.subscribedThreads.indexOf(id) < 0) {
    userInfo.subscribedThreads.push(id);
    //var listItem = $('#threads-list ul li[data-thread-id="' + id +'"]');
    //if (listItem.length > 0) return true;

    var obj = {thread_id: id, name: id};
    $('#threads-list ul').append(templates.thread_list_item(obj));
    updateThreadsListEvents();
  }
}

function renderThreadContent(id) {
  if (userInfo.fetchedThreads.indexOf(id) < 0) {
    userInfo.fetchedThreads.push(id);
    var obj = {thread_id: id, name: id};
    $('#chat').append(templates.thread(obj));
  }
  refreshUserData();
  resizeWindow();
}

function updateThreadContent(id, children) {
  $('#chat section.content[data-thread-id="' + id + '"] .body .messages .progress').remove();

  children.forEach(function(msg) {
    printMessage(msg);
  });
  updateChatScroll(id);
  updateChatEvents();
}

function renderChat(id, children) {
  renderThreadElement(id);
  renderThreadContent(id, children);
}
