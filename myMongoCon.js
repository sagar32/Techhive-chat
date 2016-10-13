var mongoClient = require('mongodb').MongoClient;
var _db;
var URL = 'mongodb://localhost:27017/facebookChatDB';
//var URL = 'mongodb://techhive:techhive@ds145405.mlab.com:45405/techhive';
module.exports = {
    connectToServer: function (callback) {
        mongoClient.connect(URL, function (err, db) {
            _db = db;
        return callback(err);
        });
    },
    getDB: function () {
        return _db;
    }
}