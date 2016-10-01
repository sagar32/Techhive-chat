
// Load dependency
var express = require('express'),
        app = express(),
        server = require('http').createServer(app),
        io = require('socket.io').listen(server),
        async = require("async");
//Load Modules
async.series([
    function (callback) {
        var myMongoCon = require('./myMongoCon'); // MongoDb Connection
        myMongoCon.connectToServer(function (err) {
            if (err) {
                console.log("Connection failed");
            }
        });
        callback();
    }
], function (err) {
    var usersModule = require('./modules/userModule');
    var messageStorage = require('./modules/messageStorage');

    var allRoomViseMsg = [];
// start server on 3000 port
    server.listen(process.env.PORT || 3000);

//start connection with mongo db

// Initilize app to dependency
    app.use(express.static(__dirname));

// Get Index page defalt.
    app.get("/", function (req, res) {
        res.sendFile(__dirname + '/index.html');
    });

// start socket.io
    io.sockets.on('connection', function (socket) {

// Login User Here.
        socket.on('loginUser', function (data, callback) {
            usersModule.loginUser(data, function (response) {
                if (response) {
                    socket.loginUser = response;
                    getRegUsers();
                    callback(response);
                } else {
                    callback(false);
                }
            });
        });

// Registration here.
        socket.on('registerUser', function (data, callback) {
            usersModule.userRegister(data, function (response) {
                if (response) {
                    getRegUsers();
                    callback(response);
                } else {
                    callback(false);
                }
            });
        });

// Connect with user
        socket.on("connectUserRoom", function (data, callback) {
            usersModule.connectUserRoom(data, function (responce) {
                if (responce) {
                    callback(responce);
                } else {
                    callback(false);
                }
            });
        });
// get all registred users.
        function getRegUsers() {
            usersModule.getUserList(function (allUsers) {
                if (allUsers)
                    io.sockets.emit("allUserRightSideList", allUsers);
            });
        }
// send message store
        socket.on("sendMessage", function (data, callback) {
            messageStorage.setMessage(data);
            var time = new Date().getTime();
            var roomIndex = "";
            async.series([
                function (callback) {
                    for (var key in allRoomViseMsg) {
                        if (allRoomViseMsg[key].roomId == data.roomId) {
                            roomIndex = key;
                        }
                    }
                    callback();
                }
            ], function (err) {
                if (roomIndex) {
                    allRoomViseMsg[roomIndex].messages.push({msg: data.msg, sender: data.id, time: time});
                    io.sockets.emit("allRoomMsg", allRoomViseMsg);
                } else {
                    allRoomViseMsg.push({roomId: data.roomId, messages: [{msg: data.msg, sender: data.id, time: time}]});
                    io.sockets.emit("allRoomMsg", allRoomViseMsg);
                }
            });
        });

//retirn all room messages
        function allRoomMsg() {
            messageStorage.getMessage(function (responce) {
                if (responce) {
                    allRoomViseMsg = responce;
                    socket.emit("allRoomMsg", allRoomViseMsg);

                }

            });
        }
        getRegUsers();
        allRoomMsg();
    });
});