var socket = io('http://' + window.location.hostname + ':3000');

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

//window.addEventListener("load", function() {

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

  $('#message_content').keypress(function (e) {
    var key = e.which;
    if(key === 13) {
      sendMessage();
    }
  });

  $('#send_message').on('click', function(data) {
    data.preventDefault();
    sendMessage();
  });

  $(window).resize(function() {
    resizeWindow();
  });

  refreshUserData();
  resizeWindow();
  updateChatScroll();
//});

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
    var msg = $('#message_content').val();
    var parentId = $('.header').attr('data-thread-id');

    if(!user() || msg === ''){
      return false
    } else {
      var success = socket.emit('message', {
        user_name: user(),
        message: msg,
        parent_id: parentId
      });

      if(success){
        $("#message_content").val("");
      }
    }
  }

function printMessage(data) {
  var date = new Date(data.timestamp );
  var classMessage = (data.username === user()) ? 'leftuser' : 'left';
  $("#test ul").append(`<li class=${classMessage}><span><p class="message-header"><b class="username">${data.user_name}</b> <b class="timestamp">${date.toGMTString()} <a href="#" data-message-id=${data.id}> reply</a></b></p><p class="message">${escapeHtml(data.message)}</p></span></li>`);
  updateChatScroll();
}

function resizeWindow() {
  var height = $(window).innerHeight() - 130;
  $('#chat-box').css('height', height + 'px');
}


function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }
