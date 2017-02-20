/**
 * Created by zeroForMe on 2017/2/4.
 */
var formidable = require("formidable");
var db = require("../models/db.js");
var md5 = require("../models/md5.js");
var path = require("path");
var fs = require("fs");
var gm = require("gm");


//首页
exports.showIndex = function (req, res, next) {
    //检索数据库，查找此人的头像
    if (req.session.login == "1") {
        //如果登陆了
        var username = req.session.username;
        var login = true;
    } else {
        //没有登陆
        var username = "";  //制定一个空用户名
        var login = false;
    }
    //已经登陆了，那么就要检索数据库，查登陆这个人的头像
    db.find("users", {username: username}, function (err, result) {
        if (result.length == 0) {
            var avatar = "moren.jpg";
        } else {
            var avatar = result[0].avatar;
        }
        res.render("index", {
            "login": login,
            "username": username,
            "active": "首页",
            "avatar": avatar    //登录人的头像
        });
    });
};

//注册页面
exports.showRegist = function(req,res,next){
    res.render("regist",{
        "login" : req.session.login =="1" ? true : false,
        "username" : req.session.login == "1" ? req.session.username : "",
        "active" : "regist"
    });
};

//注册业务
exports.doRegist = function(req,res,next){
    //得到用户填写的信息
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files){
        //得到表单之后做的事情
        var username = fields.username;
        var password = fields.password;

        //查询数据库是否有这个人
        db.find("users",{"username":username},function(err,result){
            if (err){
                res.send("-3");//服务器错误
                return;
            };
            if(result.length !=0){
                res.send("-1"); // 用户名被占用
                return;
            }
            //用户名没有被占用可以插入
            //md5加密
            password = md5(password) + "zero"
            db.insertOne("users",{
                "username":username,
                "password":password,
                "avatar" : "moren.jpg"
            },function(err,result){
                if (err){
                    res.send("-3");//服务器错误
                    return;
                }

                req.session.login = "1";
                req.session.username = username;
                res.send("1");

            }
            )
        })
        //保存这个人
    });

};

//登录页面
exports.showLogin = function(req,res,next){
    res.render("login",{
        "login" : req.session.login =="1" ? true : false,
        "username" : req.session.login == "1" ? req.session.username : "",
        "active" : "login"
    });
};

//登录业务
exports.doLogin = function(req,res,next){
    //得到用户填写的信息
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files){
        //得到表单之后做的事情
        var username = fields.username;
        var password = fields.password;
        var jiamihou = md5(password) + "zero" ;
        //查询用户
        db.find("users",{"username":username},function(err,result){
           if(err){
               res.send("-3");//服务器错误
               return;
           };
            if(result == 0){
               res.send("-1");//用户名不存在
               return;
           };
            if(jiamihou == result[0].password){
                req.session.login = "1";
                req.session.username = username;
                res.send("1"); //登录成功
                return;
            }else{
                res.send("-2"); //用户密码错误
                return;
            }
        });
        //保存这个人
    });
};

//修改头像页面
exports.showSetAvatar = function(req,res,next){
    //保证登录
    if(req.session.login != "1"){
        res.end("请登录");
        return;
    }
    res.render("setavatar",{
        "login" : true,
        "username" : req.session.username ,
        "active" : "修改头像"
    });
};

//设置头像业务
exports.doSetAvatar =function(req,res,next){
    //必须保证登陆
    if (req.session.login != "1") {
        res.send("非法闯入，这个页面要求登陆！");
        return;
    }
    var form = new formidable.IncomingForm();
    form.uploadDir = path.normalize(__dirname + "/../avatar");
    form.parse(req, function(err, fields, files){
        var oldpath = files.touxiang.path;
        var newpath = path.normalize(__dirname + "/../avatar") + "/" + req.session.username + ".jpg";
        fs.rename(oldpath,newpath,function(err){
            if(err){
                res.send("上传失败");
                return;
            }
            req.session.avatar = req.session.username + ".jpg";
            res.redirect("/cut");
        })
    });
}

//剪切头像页面
exports.showCut = function(req,res,next){
    //保证登陆
    if(req.session.login != "1"){
        res.send("请登录");
        return;
    }
    res.render("cut",{
        avatar :req.session.avatar
    });
};

//执行头像剪切
exports.doCut = function (req,res,next){
    //保证登陆
    if(req.session.login != "1"){
        res.send("请登录");
        return;
    }
    //这个页面接受get请求参数
    //文件名 w h x y
    var filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;

    gm("./avatar/" + filename)
        .crop(w, h, x, y)
        .resize(100, 100, "!")
        .write("./avatar/" + filename, function (err) {
            if (err) {
                res.send("-1");
                return;
            }
            //更改数据库中当前用户avatar的值
            db.updateMany("users", {"username": req.session.username}, {
                $set: {"avatar": req.session.avatar}
            }, function (err, results) {
                res.send("1");
            });

        });
}

//发表说说
exports.doPost = function(req,res,next){
    //保证登陆
    if(req.session.login != "1"){
        res.send("非法闯入，请登录");
        return;
    }
    //用户名
    var username = req.session.username;
    //得到用户填写的信息
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files){
        //得到表单之后做的事情
        var content = fields.content;

            //用户名没有被占用可以插入
            db.insertOne("content",{
                    "username":username,
                    "datetime":new Date(),
                    "content":content
                },function(err,result){
                    if (err){
                        res.send("-3");//服务器错误
                        return;
                    }
                    res.send("1");

                }
            )

    });

};

//列出所有说说
exports.getAllshuoshuo = function(req,res,next){
    //这个页面接收一个参数，页面
    var page = req.query.page;
    db.find("content",{},{"pageamount":9,"page":page,"sort":{"datetime":-1}},function(err,result){
        res.json(result);
    });
};

//列出某个用户的信息
exports.getUserinfo = function(req,res,next){
    //这个页面接收一个参数，页面
    var username = req.query.username;
    db.find("users",{"username":username}, function (err,result) {
        if(err || result.length == 0){
            res.json("");
            return;
        }
        var obj = {
            "username" : result[0].username,
            "avatar" : result[0].avatar,
            "_id" : result[0]._id,
        };
        res.json(obj);
    });
};

//全部说说总数
exports.getShuoshuoamount = function(req,res,next){
    db.getAllCount("content",function(count){
       res.send(count.toString());
    });
};

//显示某个用户的主页
exports.showUser = function(req,res,next){
    var user = req.params["user"];
    db.find("content",{"username":user},function(err,result){
       db.find("users",{"username":user},function(err,result2){
           res.render("user",{
               "login" : req.session.login == "1" ? true:false,
               "username" : req.session.login == "1" ? req.session.username : "",
               "user" : user,
               "active" :"我的说说",
               "cirenshuoshuo" : result,
               "cirentouxiang" : result2[0].avatar
           });
       }) ;
    });
}

//显示用户列表
exports.showUserlist = function(req,res,next){
       db.find("users",{},function(err,result){
           res.render("userlist",{
               "login" : req.session.login == "1" ? true:false,
               "username" : req.session.login == "1" ? req.session.username : "",
               "active" :"成员列表",
               "suoyouchengyuan" : result
           });
       }) ;
}