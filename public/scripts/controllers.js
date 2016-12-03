angular.module('chatApp')

    .controller('chatController',['$scope',function($scope){
        $scope.messages=[];
        $scope.rooms =[];
        $scope.room = "Lobby";
        var socket = io();
        var notification_class = "notification_message";
        var chat_class = "chat_message";
         $scope.messageType = "notification_message";
        $scope.sendMessage = function(){
            //$scope.messages.push($scope.message);
            msg_array = $scope.message.split(" ");
            if(msg_array[0] == "/join"){
                var new_room = msg_array[1];
                socket.emit('join',new_room);
                
            }
            else if(msg_array[0] == "/nick"){
                var nickname = msg_array[1];
                socket.emit('nick',nickname);
            }
            else {
                socket.emit('chat message', $scope.message);
            }
            $scope.message = "";
           
        };
        
         socket.on('welcome', function(msg){
            
             console.log("received from server:"+msg);
             $scope.messages.push({class:notification_class,str:msg.msg});
             $scope.messages.push({class:notification_class,str:"You are known as " + msg.username});
             $scope.messages.push({class:notification_class,str:"Room is " + msg.room});
             $scope.room = msg.room;
             if(msg.otherUsers != null)
                $scope.messages.push({class:notification_class,str:"Other users in the room are: " + msg.otherUsers});
             console.log(msg.rooms);
             $scope.rooms = msg.rooms;
             $scope.$apply();
        });
        
        socket.on('room update',function(rooms){
            var r = 0;
            $scope.rooms = [];
            for( r = 0 ; r < rooms.length; r++){
                $scope.rooms.push(rooms[r].name);
            }
            $scope.$apply();
        });
        socket.on('room change',function(msg){
           
            $scope.room = msg.room;
            $scope.rooms = msg.rooms;
            $scope.messages = [];
            $scope.messages.push({class:notification_class,str:"Room changed to " + msg.room});
            console.log(msg.otherUsers);
            if(msg.otherUsers !== null && msg.otherUsers != undefined)
                $scope.messages.push({class:notification_class,str:"Other users in the room are-: " + msg.otherUsers});
            $scope.$apply();
            
        });
        socket.on('join ack',function(msg){
            console.log("received from server:"+msg);
             $scope.messages.push({class:notification_class,str:msg});
             $scope.$apply();
        });
        
        socket.on('left ack',function(msg){
            console.log("received from server:"+msg);
             $scope.messages.push({class:notification_class,str:msg});
             $scope.$apply();
        });
        
         socket.on('chat message', function(msg){
             console.log("received from server:"+msg);
             $scope.messages.push({class:chat_class,str:msg});
             $scope.$apply();
        });
        
        socket.on('name change',function(msg){
            $scope.messages.push({class:notification_class,str:msg});
             $scope.$apply();
        });
        socket.on('namechange ack',function(msg){
            $scope.messages.push({class:notification_class,str:msg});
             $scope.$apply();
        });
        socket.on('user logout',function(msg){
            $scope.messages.push({class:notification_class,str:msg});
            $scope.$apply();
        });
        
    
}]);