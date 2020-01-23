var user_name = "xxxxxxxx";
var user_pwd = "xxxxxxxx";

var Channel = 0;
var teamScenesId = '5dc2206202642143f1c1ff3b';
// 云顶封神塔 => 5dfed126016232536617c5e0
// 密林      => 5dbfd22d4a3e3d2784a6a670
// 密林深处  => 5dbfd30d4a3e3d2784a6a677
// 迷雾森林  => 5dbfd64d136bf0278c32fc9b
// 森林浅滩  => 5dbfd7a41faa012803f535b3
// 郊外海滩  => 5dc06a86ca32072ec8212dc3
// 海边草原  => 5dc0711aca32072ec8212e06
// 梦魂之地  => 5df30383af0ec237e0bfd839
// 孟婆桥边  => 5df3089eb0708370b73f368e
// 孤凉荒漠  => 5dc07656ca32072ec8212e2f
// 荒漠深郊  => 5dc12f06dbd89e3e17f51702
// 望天月洞  => 5df751dabd91436e744c2b60
// 荒漠深渊  => 5dc2206202642143f1c1ff3b
// 巫山禁地  => 5df83ba4a376bd471f9379c3
// 荒漠天坑  => 5dc28f4747919f53d428b845


//=================================================================================================
const request = require('request');
const io = require('socket.io-client');
const async = require('async');


request.post({
    url: 'http://joucks.cn:3344/api/login',
    form: {
        user_name: user_name,
        user_pwd: user_pwd,
    }
}, function(error, response, body) {
    if (!error && response.statusCode == 200) {
        var cookie = response.headers['set-cookie'];
    }
    request({
        url: 'http://joucks.cn:3344/api/getUserInfo',
        headers: {
            Cookie: cookie,
        },
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            var token = info.data.user.token;
            var uid = info.data.user._id;
            console.log("昵称: " + info.data.user.nickname);
            console.log("等级: " + info.data.user.level);
            console.log("修为: " + info.data.user.repair_num);
            console.log("体力: " + info.data.user.health_num);
            console.log("活力: " + info.data.user.vitality_num);
            console.log("精力: " + info.data.user.energy_num);
        }

        let socket;
        var connurl = ["http://joucks.cn:3356", "http://joucks.cn:3358"];
        socket = io.connect(connurl[Channel], {
            'force new connection': true,
            'query': 'uid=' + uid + "&token=" + token
        });
        socket.on('disconnect', function(reason) {
            console.log("你与服务器断开连接");
        });
        socket.on("team", function(res) {
            console.log(res.msg);
            if (res.msg.indexOf('战斗') != -1) {
                setTimeout(function() {
                    socket.emit('startPeril', { type: 2, uid, token });
                }, 5000)
            }
        });
        socket.on("battleEnd", function(res) {
            if (res.data.win == 1) {
                res.data.users[0].goods.forEach(element => console.log(element.name));
            } else {
                console.log("惜败死亡～");
            }
            setTimeout(function() {
                socket.emit('startPeril', { type: 2, uid, token });
            }, 5000)

        });


        async.series(
            [
                function(callback) {
                    socket.emit('leaveTeam', { uid, token });
                    callback();
                },
                function(callback) {
                    setTimeout(function() {
                        socket.emit('createdTeam', { teamScenesId, level: [0, 300], pwd: '', uid, token });
                        callback()
                    }, 2000)
                },
                function(callback) {
                    setTimeout(function() {
                        socket.emit('startPeril', { type: 2, uid, token });
                        callback()
                    }, 2000)
                }
            ],
            function(err, results) {}
        )

        setInterval(function() {
            pill();
        }, 300000)
    });

    function pill() {
        request({
            url: 'http://joucks.cn:3344/api/getUserInfo',
            headers: {
                Cookie: cookie,
            },
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                if (info.data.user.health_num <= 10000) {
                    request.post({
                        url: 'http://joucks.cn:3344/api/byGoodsToMyUser',
                        form: {
                            gid: '5dbfcc8cd9b8c0272471e2bf',
                        },
                        headers: {
                            Cookie: cookie,
                        },
                    }, function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var msg = JSON.parse(body).msg;
                            if (msg == 'success') {
                                request({
                                    url: 'http://joucks.cn:3344/api/getUserGoods?tid=all&page=1',
                                    headers: {
                                        Cookie: cookie,
                                    },
                                }, function(error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        var msg = JSON.parse(body);
                                        var pill_id;
                                        if (msg.msg == 'success') {
                                            msg.data.forEach(element => {
                                                if (element.goods_type == '5db663e94682c55675893091' && element.level == 6) {
                                                    pill_id = element._id;
                                                }
                                            });
                                            request.post({
                                                url: 'http://joucks.cn:3344/api/useGoodsToUser',
                                                form: {
                                                    ugid: pill_id,
                                                },
                                                headers: {
                                                    Cookie: cookie,
                                                },
                                            }, function(error, response, body) {
                                                if (!error && response.statusCode == 200) {
                                                    var msg = JSON.parse(body);
                                                    if (msg.msg == 'success') {
                                                        console.log("体力增加: " + msg.data.arr[0].num);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            }
        });
    }
});