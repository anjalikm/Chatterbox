var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var rooms = [{name: "Lobby",users:[]}];
var guest_count = 0;

//configure path for client request for static files
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function(req, res){
  res.sendfile('index.html');
});
//helper functions
var updateUsername = function(oldname, newname,user_room){
    var roomIndex;
    var i;
    for(i = 0 ; i < rooms.length; i++){
        if(rooms[i].name == user_room){
            roomIndex = i;
            break;
        }
    }
    var userIndex = rooms[roomIndex].users.indexOf(oldname);
    if(userIndex != -1){
        rooms[roomIndex].users[userIndex] = newname;
        //console.log("users in room " + room + rooms[roomIndex].users.join());
    }
};
var getRooms = function(){
    var r = 0 ;
    var roomnames = [];
    for(r = 0 ; r < rooms.length; r++){
        roomnames.push(rooms[r].name);
    }
    return roomnames;
};
var getUsers = function(roomname){
    var i;
    for(i = 0 ;i < rooms.length; i++){
        if(rooms[i].name == roomname)
            return(rooms[i].users);
    }
    return [];
};
var leaveRoom = function(room,username){
    var roomIndex;
    var i;
    for(i = 0 ; i < rooms.length; i++){
        if(rooms[i].name == room){
            roomIndex = i;
            break;
        }
    }
    var userIndex = rooms[roomIndex].users.indexOf(username);
    if(userIndex != -1){
        rooms[roomIndex].users.splice(userIndex,1);
        //console.log("users in room " + room + rooms[roomIndex].users.join());
    }
    //console.log(rooms[roomIndex].users);
        
};

var joinRoom = function(room,username){
    var found = false;
    var roomIndex, i;
    for(i = 0 ; i < rooms.length && !found; i++){
        if(rooms[i].name == room){
            roomIndex = i;
            found = true;
        }
    }
    if(found){
        rooms[roomIndex].users.push(username);
        console.log(username + " joined " + rooms[roomIndex].name);
        console.log("users in room " + room + rooms[roomIndex].users.join());
    }
    else{
        rooms.push({name:room,users:[username]});
        console.log("created new room " + room);
        console.log(username + " joined " + rooms[rooms.length-1].name);
        console.log("users in room " + room + rooms[rooms.length-1].users.join());
        
    }
        
};

io.on('connection', function(socket){
    //handle new connection - join lobby, send welcome message to new user, send new user join ack to lobby
    console.log('a user connected:');
    //new user joins "Lobby" by default with default username "GuestX"
    socket.username = "Guest" + (++guest_count);
   
    //prepare welcome message to the new user
    welcome_msg = {};
    welcome_msg.msg = "Welcome to chatter box!";
    welcome_msg.username = socket.username;
    welcome_msg.room = rooms[0].name;
    welcome_msg.rooms = getRooms();
   
    if(rooms[0].users.length > 0)
        welcome_msg.otherUsers = rooms[0].users.join(",");
    else
        welcome_msg.otherUsers = null;
    
    //add new user to data structure
    rooms[0].users.push(socket.username);
    
    socket.emit('welcome',welcome_msg);
    socket.chatroom = "Lobby";
    socket.join(rooms[0].name);
    socket.broadcast.to(rooms[0].name).emit('join ack', socket.username + " joined " + rooms[0].name);

    //handle a chat message - send it to all the users in the same room
    socket.on('chat message', function(msg){
        console.log("received from client:"+msg + " from room :");
        console.log(socket.rooms[socket.chatroom]);
        io.to(socket.chatroom).emit('chat message', socket.username + ":" + msg);
    });
    
    socket.on('join',function(new_room){
        socket.leave(socket.chatroom);
        leaveRoom(socket.chatroom,socket.username);
        socket.broadcast.to(socket.chatroom).emit('left ack', socket.username + " left " + socket.chatroom);
        var room_change_msg = {};
        room_change_msg.room = new_room;
        room_change_msg.otherUsers = getUsers(new_room);
        console.log("other users"+room_change_msg.otherUsers);
        //send all the rooms to all the users
        io.emit("rooms update",rooms);
        
        socket.broadcast.to(new_room).emit('join ack', socket.username + " joined " + new_room);
        socket.chatroom = new_room;
        socket.join(new_room);
        joinRoom(new_room,socket.username);
         
        room_change_msg.rooms = getRooms();
        console.log(room_change_msg);
        socket.emit('room change',room_change_msg);
    });
    
    socket.on('nick',function(nickname){
        var old_name = socket.username;
        console.log(old_name + " requested new name:"+nickname);
        socket.username = nickname;
        updateUsername(old_name,nickname,socket.chatroom);
        socket.emit('namechange ack',"You are now " + nickname);
        socket.broadcast.to(socket.chatroom).emit('name change', old_name + " changed name to " + socket.username );
    });
    socket.on('disconnect', function () {
        console.log("user disconnected:"+socket.username);
        leaveRoom(socket.chatroom,socket.username);
        socket.broadcast.to(socket.chatroom).emit('user logout',socket.username + " logged out.");
  });
});
var port = 8001;
http.listen(port, function(){
  console.log('listening on *:'+port);
});