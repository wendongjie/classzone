var express = require("express");
var app = express();
var router = require("./router/router.js");
var session = require("express-session");

//使用session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

//模版引擎
app.set("view engine","ejs");

//静态页面
app.use(express.static("./public"));
app.use("/avatar",express.static("./avatar"));
//路由表
app.get("/",router.showIndex);                               //显示首页
app.get("/regist",router.showRegist);                       //显示登录
app.post("/doregist",router.doRegist);                     //执行登录  Ajax服务
app.get("/login",router.showLogin);                         //显示登录
app.post("/dologin",router.doLogin);                       //执行登录  Ajax服务
app.get("/setavatar",router.showSetAvatar);                //设置头像
app.post("/dosetavatar",router.doSetAvatar);               //执行设置头像  Ajax服务
app.get("/cut",router.showCut);                             //裁剪头像
app.get("/docut",router.doCut);                             //执行裁剪头像
app.post("/dopost",router.doPost);                          //发表说说
app.get("/getallshuoshuo",router.getAllshuoshuo);          //列出所有说说Ajax服务
app.get("/getuserinfo",router.getUserinfo);                //列出所有说说Ajax服务
app.get("/getshuoshuoamount",router.getShuoshuoamount);   //说说总数
app.get("/user/:user",router.showUser);                //显示用户所有说说
app.get("/userlist",router.showUserlist);                //显示用户列表


app.listen(3000);