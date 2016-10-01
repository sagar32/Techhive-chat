var myMongoCon = require('../myMongoCon');

module.exports = {
    setMessage: function (msg) {
        var db = myMongoCon.getDB();
        var userMsg = db.collection("userMsg");
        userMsg.find({roomId: msg.roomId}).toArray(function (err, result) {
            var time=new Date().getTime();
            if (result.length > 0) {
                userMsg.update({roomId: msg.roomId}, {$push: {messages: {msg: msg.msg, sender: msg.id,time:time}}});
                
            } else {
                userMsg.insert({roomId: msg.roomId, messages: [{msg: msg.msg, sender: msg.id,time:time}]});
                
            }
        });

    },
    getMessage: function (callback) {
        var db = myMongoCon.getDB();
        var userMsg = db.collection("userMsg");
        userMsg.find().toArray(function (err, result) {
        if(!err){
            callback(result);
        }else{
            callback(false);
        }
        });
    }
}


