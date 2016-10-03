

/* global io */

angular.module("chatSystem", ['yaru22.angular-timeago'])
        .controller("myCtrl", ['$scope', 'socket', '$window','$timeout', function ($scope, socket, $window,$timeout) {

//init application
                $scope.techhive = "Welcome To Techhive Chat System.";
                $scope.onlineUsers = [];
                $scope.allRoomMsg = [];
                $scope.isError1 = false;
                $scope.isError = false;

//initilize when login success.
                $scope.onLoginSuccess = function () {
                    $scope.isLogin = true;
                    var index = -1;
                    $scope.activeUsername = JSON.parse($window.localStorage.getItem("isLoginUser"));
//                                console.log($scope.activeUsername);
                    socket.on("allUserRightSideList", function (allUsersList) {
                        $scope.allUserList = allUsersList;
//                        console.log($scope.allUserList);
                        angular.forEach($scope.allUserList, function (value, key) {
                            if (value._id == $scope.activeUsername._id) {
                                return index = key;
                            }
                        });
                        if (index > -1) {
                            $scope.allUserList.splice(index, 1);
                        }

                    });
                }

//check user is login or not
                if ($window.localStorage.getItem("isLoginUser")) {
                    $scope.onLoginSuccess();
                } else {
                    $scope.isLogin = false;
                }
                //login users
                $scope.loginUser = function () {
                    if ((angular.isDefined($scope.userName) && $scope.userName != "") && (angular.isDefined($scope.userPassword) && $scope.userPassword != "")) {
                        $scope.login = {
                            userName: $scope.userName,
                            userPassword: $scope.userPassword
                        };
                        socket.emit('loginUser', $scope.login, function (data) {
                            if (data) {
                                $window.localStorage.setItem("isLoginUser", JSON.stringify(data));
                                $scope.onLoginSuccess();
                            } else {
                                $scope.isError1 = 'You are not registred user, Please Sign up with us.';
                            }
                        });
                    } else {
                        $scope.isError1 = 'Username/Email and password both required.';
                    }
                }

//register user here
                $scope.registerUser = function () {
                    if (angular.isDefined($scope.register.email) && angular.isDefined($scope.register.username) && angular.isDefined($scope.register.password)) {
                        $scope.isError = "";
                        socket.emit("registerUser", $scope.register, function (data) {
                            if (data) {
                                $window.localStorage.setItem("isLoginUser", JSON.stringify(data));
                                $scope.onLoginSuccess();
                            } else {
                                $scope.isError = "your email or username already regitred with us."
                            }
                        });
                    } else {
                        $scope.isError = 'All fields are required.';
                    }
                }
// chat application start..

// logout user
                $scope.logoutUser = function () {
                    console.log("logout call");
                    $window.localStorage.removeItem("isLoginUser");
                    $scope.isLogin = false;
                };
                $scope.connectUserRoom = function (user) {
                    if (angular.isUndefined(user.roomId)) {
                        socket.emit("connectUserRoom", {me: $scope.activeUsername, with : user}, function (data) {
                            var index = -1;
                            if (data) {
                                $scope.switchRoom(data);
                                $scope.openRoom = data;
                                angular.forEach($scope.allUserList, function (value, key) {
                                    if (value._id === user._id) {
                                        return index = key;
                                    }
                                });
                                if (index > -1) {
                                    $scope.allUserList[index].roomId = data;
                                }
                            }
                        });
                    } else {
                        $scope.openRoom = user.roomId;
                        $scope.switchRoom($scope.openRoom);
                    }
                    
                    $scope.chatWith=user.username;
                };
                //update user list.
                socket.on('allRoomMsg', function (data) {
                    $scope.allRoomMsg = data;
                    $scope.switchRoom($scope.openRoom);
                });
                //**********
//switch room on click user
                $scope.switchRoom = function (roomId) {
                    if ($scope.allRoomMsg.length > 0) {
                        var index = -1;
                        angular.forEach($scope.allRoomMsg, function (value, key) {
                            if (value.roomId == roomId) {
                                return index = key;
                            }
                        });
                        if (index > -1) {
                            $scope.activeMsg = $scope.allRoomMsg[index].messages;
//                            console.log($scope.activeMsg ); 
                        } else {
                            $scope.activeMsg = [];
                        }
                        $timeout(function () {
                            var $chat = $('#chatWindow');
                            $chat.animate({scrollTop: $chat.prop("scrollHeight")}, 10);
                        }, 100);
                    }
                }
// send message
                $scope.sendMsg = function () {
                    if (angular.isDefined($scope.message) && angular.isDefined($scope.openRoom) && $scope.message != "" && $scope.openRoom != "") { 
                        socket.emit("sendMessage", {msg: $scope.message, roomId: $scope.openRoom, id: $scope.activeUsername._id}, function (data) {
                            $scope.switchRoom($scope.openRoom);
                        });
                        $scope.message = "";
                    }
                }

            }])
        .factory('socket', function ($rootScope) {
            var socket = io.connect();
            return {
                on: function (eventName, callback) {
                    socket.on(eventName, function () {
                        var args = arguments;
                        $rootScope.$apply(function () {
                            callback.apply(socket, args);
                        });
                    });
                },
                emit: function (eventName, data, callback) {
                    socket.emit(eventName, data, function () {
                        var args = arguments;
                        $rootScope.$apply(function () {
                            if (callback) {
                                callback.apply(socket, args);
                            }
                        });
                    });
                }
            };
        })
        .directive('myEnter', function () {
            return function (scope, element, attrs) {
                element.bind("keydown keypress", function (event) {
                    if (event.which === 13) {
                        scope.sendMsg();
                        scope.$apply(function () {
                            scope.message = "";
                        });
                        event.preventDefault();
                    }
                });
            };
        });