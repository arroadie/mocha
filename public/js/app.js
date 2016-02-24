var socket = io('http://' + window.location.hostname + ':3000');
var templates = {};
var subscriptions = ['test'];

socket.on('connect', function (data) {
  console.log('connected successfull');
});

socket.on('message', function(data) {
  printMessage(data);
});

socket.on('history', function(data) {
  JSON.parse(data).forEach(function(item) {
    printMessage(item);
  });
});

socket.on('subscriptions', function(data) {
  JSON.parse(data).forEach(function(item) {
    renderChat(item);
  });
});

window.addEventListener("load", function() {
  templates['message'] = Handlebars.compile($("#message_template").html());
  templates['thread'] = Handlebars.compile($("#thread_template").html());
  templates['thread_list_item'] = Handlebars.compile($("#thread_list_item_template").html());

  socket.emit('subscriptions');
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

function updateEvents() {
  $('#chat section.content section.footer input').keypress(function (e) {
    var key = e.which;
    if(key === 13) sendMessage();
  });
};

function replyMessage(ev) {
  ev.preventDefault();
  var threadId = $(this).attr('data-thread-id');
  console.log('reply', threadId);
  return false;
}

function updateChatScroll(){
    var element = document.getElementById("test");
    element.scrollTop = element.scrollHeight;
}

function user() {
  return Cookies.get("username") ? Cookies.get("username") : false;
}

/*
function refreshUserData() {
  $("#user_data").html("<div>Welcome, " + user() + "</div>");
}
*/

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
  var date = new Date(data.timestamp );
  var classMessage = (data.username === user()) ? 'leftuser' : 'left';
  $("#test ul").append(templates.message(data));
  updateChatScroll();
  $('a.reply').on('click', replyMessage);
}

function resizeWindow() {
  var innerHeight = $(window).innerHeight();
  var height = innerHeight - 125;
  $('#chat section.content section.body').css('height', height + 'px');
  $('#threads-list').css('height', innerHeight + 'px');
}

function renderChat(id) {
  var obj = {thread_id: id, name: id};
  $('#threads-list ul').append(templates.thread_list_item(obj));
  $('#chat').append(templates.thread(obj));
  resizeWindow();
  updateEvents();
}
