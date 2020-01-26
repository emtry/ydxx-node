//version 1.2.4
var user_name = "xxxxxxxx";
var user_pwd = "xxxxxxxx";

var Channel = 1; //频道
var teamScenesId = '5dc2206202642143f1c1ff3b'; //副本id
var pwd = ''; //房间密码

var daily = 1; //是否自动每日
var teamScenesIds = [ //每日副本id
    '5df83ba4a376bd471f9379c3',
    '5df751dabd91436e744c2b60',
    '5df3089eb0708370b73f368e',
    '5df30383af0ec237e0bfd839',
];

var teamId = ''; //指定用户uid，加入其队伍（此值不为空时，不会自动战斗与自动每日，听队长安排）
var tpwd = ''; //房间密码

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


request.post({ //登录
    url: 'http://joucks.cn:3344/api/login',
    form: {
        user_name: user_name,
        user_pwd: user_pwd,
    }
}, function(error, response, body) {
    if (!error && response.statusCode == 200) {
        var cookie = response.headers['set-cookie']; //获取cookie
    }
    request({ //获取个人信息
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
        var connurl = ["", "http://joucks.cn:3356", "http://joucks.cn:3358"]; //频道地址
        socket = io.connect(connurl[Channel], { //连接频道
            'force new connection': true,
            'query': 'uid=' + uid + "&token=" + token
        });

        socket.on('disconnect', function(reason) { //掉线重连
            console.log("你与服务器断开连接!");
            console.log("尝试重新连接...");
            main();
        });

        var i = 1;
        socket.on("team", function(res) {
            if (res.type == "currentTeamDisband") { //退队后重新开始战斗
                main();
            } else if (res.type == "msg") {
                if (res.msg == "你还没有队伍！") {

                } else if (res.msg.indexOf('战斗') != -1) { //未结束战斗，重新发起战斗
                    console.log(res.msg);
                    setTimeout(function() {
                        socket.emit('startPeril', { type: 2, uid, token });
                    }, 2000)
                } else if (res.msg.indexOf('上限') != -1) { //自动切换每日副本
                    if (i < teamScenesIds.length) {
                        changeteamScenesId(teamScenesIds[i]);
                        i++;
                    } else {
                        changeteamScenesId(teamScenesId); //完成日常继续刷自定义副本
                    }
                } else {
                    console.log(res.msg);
                }
            }
        });

        socket.on("battleEnd", function(res) {
            if (res.data.win == 1) {
                res.data.users[0].goods.forEach(element => console.log(element.name)); //输出掉落物品
            } else {
                console.log("惜败死亡～");
            }
            setTimeout(function() {
                socket.emit('startPeril', { type: 2, uid, token }); //发起战斗
            }, (res.data.end_combatsid_at * 3 + 2) * 1000)

        });

        main();

        setInterval(function() { //每隔5分钟检测是否需要吃药
            pill();
        }, 300000)
    });

    function main() {
        if (teamId == '') {
            if (daily == 0) { //判断是否每日
                autoBattle(teamScenesId);
            } else if (daily == 1) {
                autoBattle(teamScenesIds[0]);
            }
        } else {
            applyTeam();
        }
    }

    function autoBattle(teamScenesId) { //自动战斗
        async.series(
            [
                function(callback) { //离开队伍
                    socket.emit('leaveTeam', { uid, token });
                    callback();
                },
                function(callback) {
                    setTimeout(function() { //创建队伍
                        socket.emit('createdTeam', { teamScenesId, level: [0, 300], pwd: '', uid, token });
                        callback();
                    }, 2000)
                },
                function(callback) {
                    setTimeout(function() { //开始战斗
                        socket.emit('startPeril', { type: 2, uid, token });
                        callback();
                    }, 2000)
                }
            ],
            function(err, results) {}
        )
    }

    function changeteamScenesId(teamScenesId) { //切换副本
        async.series(
            [
                function(callback) { //切换副本
                    socket.emit('updateTeamScenes', { teamScenesId, uid, token });
                    callback()
                },
                function(callback) {
                    setTimeout(function() { //开始战斗
                        socket.emit('startPeril', { type: 2, uid, token });
                        callback()
                    }, 2000)
                }
            ],
            function(err, results) {}
        )
    }

    function applyTeam() { //加入队伍
        async.series(
            [
                function(callback) { //离开队伍
                    socket.emit('leaveTeam', { uid, token });
                    callback();
                },
                function(callback) {
                    setTimeout(function() { //加入队伍
                        socket.emit('applyTeam', { teamId, tpwd, uid, token });
                        callback()
                    }, 2000)
                }
            ],
            function(err, results) {}
        )
    }

    function pill() { //自动吃药
        request({ //查询剩余体力
            url: 'http://joucks.cn:3344/api/getUserInfo',
            headers: {
                Cookie: cookie,
            },
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                if (info.data.user.health_num <= 10000) { //判断体力是否低于10000
                    request.post({ //自动买红药水
                        url: 'http://joucks.cn:3344/api/byGoodsToMyUser',
                        form: {
                            gid: '5dbfcc8cd9b8c0272471e2bf', //红药水商店id
                        },
                        headers: {
                            Cookie: cookie,
                        },
                    }, function(error, response, body) {
                        if (!error && response.statusCode == 200) {
                            var msg = JSON.parse(body).msg;
                            if (msg == 'success') {
                                request({ //查询红药水背包id
                                    url: 'http://joucks.cn:3344/api/getUserGoods?tid=all&page=1',
                                    headers: {
                                        Cookie: cookie,
                                    },
                                }, function(error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        var msg = JSON.parse(body);
                                        var pill_id; //红药水背包id
                                        if (msg.msg == 'success') {
                                            msg.data.forEach(element => {
                                                if (element.goods_type == '5db663e94682c55675893091' && element.level == 6) {
                                                    pill_id = element._id;
                                                }
                                            });
                                            request.post({ //吃红药水
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