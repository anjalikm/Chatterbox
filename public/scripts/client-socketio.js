  var socket = io();
  $('form').submit(function(){
      console.log("message sent");
    socket.emit('chat message', $('#message').val());
    $('#message').val('');
    return false;
  });
  socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
  });