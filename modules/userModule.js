var myMongoCon = require('../myMongoCon');
var async = require("async");

module.exports = {
    userRegister: function (newUser, callback) {
        var db = myMongoCon.getDB();
        var collection = db.collection('allUsers');
        collection.find({$or: [{email: newUser.email}, {username: newUser.username}]}).toArray(function (err, find) {
            if (find.length > 0) {
                callback(false);
            } else {
                collection.insert(newUser, function (err, success) {
                    if (success.insertedCount == "1") {
                        console.log(success.ops[0]);
                        callback(success.ops[0]);
                    } else {
                        callback(false);
                    }
                });
            }
        });

    },
    loginUser: function (loginCredential, callback) {
        var db = myMongoCon.getDB();
        var collection = db.collection('allUsers');
        collection.find({$and: [{'username': loginCredential.userName}, {'password': loginCredential.userPassword}]}, {'username': 1, 'email': 1}).toArray(function (err, result) {
            if (err)
                callback(false);

            if (result.length == "1") {
                callback(result[0]);
            } else {
                callback(false);
            }
        });
    },
    getUserList: function (callback) {
        var db = myMongoCon.getDB();
        var collection = db.collection('allUsers');
        collection.find({}, {'username': 1, 'email': 1}).toArray(function (err, result) {
            if (err)
                callback(false);

            if (result.length > 0) {
                callback(result);
            } else {
                callback(false);
            }
        });
    },
    connectUserRoom: function (meWith, callback) {
        var db = myMongoCon.getDB();
        var userRoom = db.collection('UserRoom');

        userRoom.find({id: meWith.me._id}).toArray(function (err, result) {
            var returnRoomId = "";
            if (err)
                callback(false);
            if (result.length > 0) {
                console.log(result[0].connectedUser);
                var flag = false;

                async.series([
                    function (callback) {
                        for (var i = 0; i < result[0].connectedUser.length; i++) {
                            if (result[0].connectedUser[i].userId == meWith.with._id) {
                                flag = true;
                                returnRoomId = result[0].connectedUser[i].roomId;
                            }
                        }
                        callback();
                    }
                ], function (err) {
                    console.log(flag);
                    if (flag) {
                        callback(returnRoomId);
                    } else {
                        console.log("else no malyu");
                        var roomId = Math.random().toString(36).substring(7);
                        console.log(roomId);
                        userRoom.find({id: meWith.with._id}).toArray(function (err, result) {
                            if (result.length > 0) {
                                userRoom.update({id: meWith.me._id}, {$push: {connectedUser: {userId: meWith.with._id, roomId: roomId}, index: meWith.with._id}});
                                userRoom.update({id: meWith.with._id}, {$push: {connectedUser: {userId: meWith.me._id, roomId: roomId}, index: meWith.me._id}});
                                callback(roomId);
                            } else {
                                userRoom.update({id: meWith.me._id}, {$push: {connectedUser: {userId: meWith.with._id, roomId: roomId}, index: meWith.with._id}});
                                userRoom.insert({id: meWith.with._id, connectedUser: [{userId: meWith.me._id, roomId: roomId}], index: [meWith.me._id]});
                                callback(roomId);

                            }
                        });
                    }
                });


            } else {
                var roomId = Math.random().toString(36).substring(7);
                console.log(roomId);
                userRoom.find({id: meWith.with._id}).toArray(function (err, result) {
                    if (result.length > 0) {
                        userRoom.insert({id: meWith.me._id, connectedUser: [{userId: meWith.with._id, roomId: roomId}], index: [meWith.with._id]});
                        userRoom.update({id: meWith.with._id}, {$push: {connectedUser: {userId: meWith.me._id, roomId: roomId}, index: meWith.me._id}});
                        callback(roomId);
                    } else {
                        userRoom.insert({id: meWith.me._id, connectedUser: [{userId: meWith.with._id, roomId: roomId}], index: [meWith.with._id]});
                        userRoom.insert({id: meWith.with._id, connectedUser: [{userId: meWith.me._id, roomId: roomId}], index: [meWith.me._id]});
                        callback(roomId);
                    }
                });
            }
        });

    },
    getConnectedUsers: function (id, callback) {
        var db = myMongoCon.getDB();
        var userRoom = db.collection('UserRoom');
        userRoom.find({id: id}).toArray(function (err, result) {
            callback(result[0]);
        });
    }
};

