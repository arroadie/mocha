var socket = io('http://' + window.location.hostname + ':3000');
var templates = {};
var subscriptions = ['test'];
var capturingReplyClick = false;

socket.on('connect', function (data) {
  console.log('connected successfull');
});

socket.on('message', function(data) {
  printMessage(data);
});

socket.on('history', function(data) {
  Object.keys(data).forEach(function(key) {
    renderChat(key, data[key]);
  });
  activateThread(Object.keys(data)[0]);
});

socket.on('subscribed-thread', function(data) {
  console.log('subscribed', data);
});

socket.on('empty-thread', function(data) {
  console.log('empty', data);
  renderChat(data.id, data.history);
});

window.addEventListener("load", function() {
  templates['message'] = Handlebars.compile($("#message_template").html());
  templates['thread'] = Handlebars.compile($("#thread_template").html());
  templates['thread_list_item'] = Handlebars.compile($("#thread_list_item_template").html());

  socket.emit('history');
});

  $('#update_user_name').on('click', function(ev) {
    ev.preventDefault();
    Cookies.set("username", $('#user_name').val());
    refreshUserData();
  });

  $('#user_name').keypress(function (e) {
    if(e.which === 13) {
      Cookies.set("username",$('#user_name').val());
      refreshUserData();
    }
  });

  $('#logout').on('click', function(e) {
    e.preventDefault();
    Cookies.remove("username");
    refreshUserData();
  });

  $(window).resize(function() {
    resizeWindow();
  });

  refreshUserData();
  updateEvents();
  //updateChatScroll();
//});

function activateThread(id) {
  $('#chat section.content').removeClass('current');
  $('#chat section.content[data-thread-id="' + id +'"]').addClass('current');
  $('#threads-list ul li').removeClass('active');
  $('#threads-list ul li[data-thread-id="' + id +'"]').addClass('active');
}

function onThreadListClick(ev) {
  var threadId = $(this).attr('data-thread-id');
  activateThread(threadId);
}

function updateEvents() {
  $('#chat section.content section.footer input').keypress(function (e) {
    var key = e.which;
    if(key === 13) sendMessage();
  });
  $('#threads-list ul li').on('click', onThreadListClick);
}

function replyMessage(ev) {
  ev.preventDefault();
  var threadId = $(this).attr('data-thread-id');
  socket.emit('subscribe', threadId);
  return false;
}

function updateChatScroll(parent_id){
  var chat = $('#chat section.content[data-thread-id="' + parent_id + '"] section.body .messages ul');
  chat.scrollTop = chat.scrollHeight;
}

function user() {
  return Cookies.get("username") ? Cookies.get("username") : false;
}

function refreshUserData() {
  if(user()) {
    $("#message_box p").html("@" + user());
    $("#user_name").hide();
    $('#update_user_name').hide();
    $('#logout').show();
  } else {
    $("#message_box p").html("");
    $("#user_welcome").remove();
    $("#user_name").show();
    $('#logout').hide();
    $('#update_user_name').show();
  }
}

function sendMessage() {
  var msg = $('#chat section.content.current section.footer input').val();
  var parentId = $('#chat section.content.current').attr('data-thread-id');
  console.log(msg, parentId);

  if (!user() || msg === '') return false;

  var success = socket.emit('message', {
    user_name: user(),
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

function resizeWindow() {
  var innerHeight = $(window).innerHeight();
  var height = innerHeight - 125;
  $('#chat section.content section.body').css('height', height + 'px');
  $('#threads-list').css('height', innerHeight + 'px');
}

function renderChat(id, history) {
  var listItem = $('#threads-list ul li[data-thread-id="' + id +'"]');
  if (listItem.length > 0) return true;

  var obj = {thread_id: id, name: id};
  $('#threads-list ul').append(templates.thread_list_item(obj));
  $('#chat').append(templates.thread(obj));
  history.forEach(function(msg) {
    printMessage(msg);
  });
  updateChatScroll(id);
  resizeWindow();
  updateEvents();
}
