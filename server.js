
// Load dependency
var express = require('express'),
        app = express(),
        server = require('http').createServer(app),
        io = require('socket.io').listen(server),
        async = require("async"),
        fs = require("file-system"),
        bodyParser = require("body-parser");
var multer = require('multer');
var roomIdsOnline = [];
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
            console.log(file);
            callback(null, './upload/profilesImg');
        },
        filename: function (req, file, callback) {
            global.imageName = global.gUserId + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1];
            callback(null, imageName);
        }
    });
    var upload = multer({storage: storage}).single('file');
// Get Index page defalt.
    app.get("/", function (req, res) {
        res.sendFile(__dirname + '/index.html');
    });

// upload image
    app.post('/uploadImg', multer({storage: storage}).single('file'), function (req, res, next) {
//        console.log(req.file);
//        var raw = new Buffer(fs.readFileSync(req.file.path), 'binary').toString("base64");
//        var data = {img: global.imageName, userId: global.gUserId, imgData: raw};
        var data = {img: global.imageName, userId: global.gUserId};
        usersModule.setProfileImage(data);
        res.end();
    });
// start socket.io
    io.sockets.on('connection', function (socket) {
//connect to room
        socket.on('openRoom', function (room) {
            socket.join(room);
        });
//updateOnlineStatus  when page refrash
        socket.on("updateOnlineStatus", function (data) {
            roomIdsOnline.push(data.userId);
            socket.userId = data.userId;
            io.sockets.emit('uopdateStatus', roomIdsOnline);
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
                io.sockets.emit('uopdateStatus', roomIdsOnline);
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
        socket.on('disconnect', function (data) {
            if (!socket.userId)
                return;
            roomIdsOnline.splice(roomIdsOnline.indexOf(socket.userId), 1);
            io.sockets.emit('uopdateStatus', roomIdsOnline);
            getRegUsers();
        });
        getRegUsers();
        allRoomMsg();
    });
});