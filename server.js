
// Load dependency
var express = require('express'),
        app = express(),
        server = require('http').createServer(app),
        io = require('socket.io').listen(server),
        async = require("async"),
        fs = require("file-system"),
        bodyParser = require("body-parser");
var multer = require('multer');
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
    var users = [];
// start server on 3000 port
    server.listen(process.env.PORT || 3000);

//start connection with mongo db

// Initilize app to dependency
    app.use(express.static(__dirname));
    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({extended: false}));

// parse application/json
    app.use(bodyParser.json());
    var storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, './upload/profilesImg');
        },
        filename: function (req, file, callback) {
            console.log('.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
            var imageName=file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1];
            var data={img:imageName,userId:global.gUserId};
            usersModule.setProfileImage(data);
            callback(null, imageName);
        }
    });
    var upload = multer({storage: storage}).single('file');
// Get Index page defalt.
    app.get("/", function (req, res) {
        res.sendFile(__dirname + '/index.html');
    });

// upload image
    app.post('/uploadImg', function (req, res, next) {
        upload(req, res, function (err) {
            if (err) {
                return res.end("Error uploading file.");
            }else{
                
            }
            res.end("Image is uploaded");
        });
    });
// start socket.io
    io.sockets.on('connection', function (socket) {
//connect to room
        socket.on('openRoom', function (room) {
            socket.join(room);
        });
// Login User Here.
        socket.on('loginUser', function (data, callback) {
            usersModule.loginUser(data, function (response) {
                if (response) {
                    getRegUsers();
                    console.log(response);
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
                    console.log(global.gUserId + " id global");
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
        socket.on("sendMessage", function (data) {
            messageStorage.setMessage(data);
            var time = new Date().getTime();
            io.sockets.in(data.roomId).emit("OneRoomMsg", {roomId: data.roomId, messages: [{msg: data.msg, sender: data.id, time: time}]});
        });

//retirn all room messages
        function allRoomMsg() {
            messageStorage.getMessage(function (responce) {
                if (responce) {
                    socket.emit("allRoomMsg", responce);
                }
            });
        }
        getRegUsers();
        allRoomMsg();
    });
});