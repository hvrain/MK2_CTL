var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require('body-parser');
var compression = require('compression');
var helmet = require('helmet');
var mysql = require('mysql');
var qs = require('querystring');
var http = require('http');
var path = require('path');
var session = require('express-session');
var flash = require('connect-flash');
var bcrypt = require('bcrypt');
var MySQLStore = require('express-mysql-session')(session);
const { PythonShell } = require("python-shell")
// const low = require('lowdb')
// const FileSync = require('lowdb/adapters/FileSync');
// const adapter = new FileSync('db.json')
// const lowdbstore = require('lowdb-session-store')(session);
// const db = low(adapter)
// db.defaults({users:[], sessions:[]}).write();

//app.engine('.html', require('ejs').renderFile);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(compression());

// var options = {
//     host     : '',
//     port     : 3306,
//     user     : 'root',
//     password : '',
//     database : 'login'
// };

var options = {
    host     : '13.124.179.142',
    port     : 3306,
    user     : 'TestMan',
    password : 'a5375309!',
    database : 'TestDB'
};

var db = mysql.createConnection(options);
var sessionStore = new MySQLStore(options);

app.use(session({
    secret: 'agdfsg#@$dg',
    resave: false,
    saveUninitialized: false,
    store: sessionStore
}));

// app.use(session({
//     secret: 'agdfsg#@$dg',
//     resave: false,
//     saveUninitialized: false,
//     store:new lowdbstore(db.get('sessions'), {
//         ttl: 86400
//     })
// }))

app.use(flash());

// db.query("select * from 로그인 where ID = 5469866", function(err, result, fields) {
//     console.log(result[0]);
//     if(err) throw err;
//     if(!result[0]) {
//         var email = '5469866';
//         var pwd = '222222';
//         bcrypt.hash(pwd, 10, function(err, hash) {
//             var user = [
//                 [5, email, hash, 1, 5469866]
//             ]
//             var sql = "insert into 로그인 (로그인ID, ID, 비밀번호, 권한, 학번) values ?"
//             db.query(sql, [user], function(err, result1) {
//                 if(err) throw err;
//                 console.log("insert success");
//             })
//         })
//     }
// })

var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
const shortid = require('shortid');
    
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    if(user){
        console.log('serializeUser', user);
        done(null, user.학번);
    }
});
  
passport.deserializeUser(function(id, done) {
    db.query("select * from 로그인 where ID = ?", [id], function(err, result, fields) {
        console.log(result[0]);
        if(err) throw err;
        if(result[0]) {
            console.log('deserializeUser', id, result[0]);
            done(null, result[0]);
        }
    })
});

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'password'
},
function(email, password, done) {
    console.log('LocalStrategy',email, password);
    db.query("select * from 로그인 where ID = ?", [email], function(err, result, fields) {
        console.log(result[0]);
        if(err) throw err;
        if(result[0]) {
            bcrypt.compare(password, result[0].비밀번호, function(err, result1) {
                console.log("result : ", result);
                if(result1) {
                    return done(null, result[0], { message: 'Welcome.' });
                } else {
                    return done(null, false, { message: 'Incorrect user password.'});
                }
            });
        } else {
            return done(null, false, {message: 'not exist email'})
        }
    })
    // if(user) {
    //     //암호화된 비밀번호 비교하기
    //     bcrypt.compare(password, user.password, function(err, result) {
    //         if(result) {
    //             return done(null, user, { message: 'Welcome.' });
    //         } else {
    //             return done(null, false, { message: 'Incorrect user password.'});
    //         }
    //     });
    // } else {
    //     return done(null, false, {message: 'not exist email'})
    // }    
}
));

app.get('/', function (request, response) {
    var fmsg = request.flash();
    var feedbacks = '';
    if(fmsg.message) {
        feedbacks = fmsg.message[0];
    }
    console.log("feedback",feedbacks);
    console.log("success", __dirname + request.url);
    response.render('login.ejs', {feedback:feedbacks});
});

app.post('/login_process', function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
        console.log("user : ", user);
        if (err) {
            return next(err);
        }
        if (!user) {
            console.log("login failure");
            req.session.save(function () {
                console.log('info', info.message);
                req.flash('message', info.message);
                return req.session.save(function() {
                    res.redirect('/');
                });
            });
        }
        req.logIn(user, function (err) {
            console.log("login success");
            if (err) { return next(err); }
            console.log('login success info', info.message);
            req.session.save(function () {
                res.redirect('/index');
                return;
            });
        });
    })(req, res, next);
});

app.get('/logout_process',function(req,res){
    req.logOut();
    req.session.save(function(){
        res.redirect('/');
    })
});

app.get('/index', function(req, res){
    console.log("----------------------------------");
    console.log(req.session.passport.user);
    var user_id = req.session.passport.user;

    var subcode = [];
    var gradeid = [];
    
    const lecture = new Promise(function(resolve){
        db.query("Select * From 성적 where 학번 = ?", [user_id] , function(err, result, fields) {  //?부분이 [user_id]값과 같은 것을 찾음
            console.log("성적result: ", result);
            var lecture = '';
            

            for(var i = 0; i < result.length; i++) {
                subcode[i] = result[i].과목코드;
            }
            console.log(subcode);

            db.query("Select * from 과목 where 과목코드 in (?) order by 시간", [subcode] , function(err, result1, fields1){
                console.log("result111", result1);
                db.query("SELECT * FROM 교수 WHERE 교수코드 in (?) ",  [result1[0].교수코드], function(err,result2,fields2){
                    console.log("교수result2", result2);
                    
                    if(result2[0]){
                        lecture = [result1[0].과목명, result2[0].이름, result1[0].시간];
                        console.log('here',lecture);
                        resolve(lecture);
                        console.log("Promise lecture: ", lecture);
                    }
                });
            });
        });
    })
    

    const notice = new Promise(function(resolve) {
        db.query("Select * From 성적 where 학번 = ?", [user_id] , function(err, result, fields){
            db.query("Select * from 공지사항 where 과목코드 in (?) order by 날짜 DESC", [subcode] , function(err, result1, fields1){
                console.log("result1", result1);
                var notice = new Array();
                if(result1[0]){
                    for(var i=0; i<result1.length && i<4; i++){
                        notice[i] = result1[i].제목;
                    }
                    console.log('공지', notice);
                    resolve(notice);
                    //res.render('index.ejs', {notice:notice,lecture:lecture});
                } else{
                    console.log("fail: load notice");
                }
            })
        })
        
    })

    const schedule_1 = new Promise(function(resolve){
        db.query("Select * From 성적 where 학번 = ?", [user_id] , function(err, result, fields) {  //?부분이 [user_id]값과 같은 것을 찾음
            for(var i = 0; i < result.length; i++) {
                gradeid[0] = result[i].성적ID;
            }
            db.query("Select * from 과제 where 성적ID in (?) order by 날짜", [gradeid] , function(err, result1, fields1){
                // console.log("과제table: ", result1);
                // db.query("SELECT * FROM 과목 WHERE 과목코드 in (?) ",  [result[0].과목코드], function(err,result2,fields2){
                //     console.log("교수result2", result2);
                    
                var schedule = new Array();
                if(result1[0]){
                    for(var i=0; i<result1.length && i<5; i++){
                        schedule[i] = result1[i].날짜;
                    }
                    console.log('schedule', schedule);
                    resolve(schedule);
                    //res.render('index.ejs', {notice:notice,lecture:lecture});
                } else{
                    console.log("fail: load notice");
                }
                });
            });
        
    })

    const schedule_2 = new Promise(function(resolve){
        db.query("Select * From 성적 where 학번 = ?", [user_id] , function(err, result, fields) {  //?부분이 [user_id]값과 같은 것을 찾음
            
            for(var i = 0; i < result.length; i++) {
                gradeid[0] = result[i].성적ID;
            }

            db.query("Select * from 과제, 과목 where 성적ID in (?) order by 날짜", [gradeid] , function(err, result1, fields1){
                // console.log("과제table: ", result1);
                // db.query("SELECT * FROM 과목 WHERE 과목코드 in (?) ",  [result[0].과목코드], function(err,result2,fields2){
                //     console.log("교수result2", result2);
                    
                var schedule = new Array();
                if(result1[0]){
                    for(var i=0; i<result1.length && i<5; i++){
                        schedule[i] = result1[i].과목명;
                    }
                    console.log('schedule', schedule);
                    resolve(schedule);
                    //res.render('index.ejs', {notice:notice,lecture:lecture});
                } else{
                    console.log("fail: load notice");
                }
                });
            });
        
    })
    
    
    const schedule_3 = new Promise(function(resolve){
        db.query("Select * From 성적 where 학번 = ?", [user_id] , function(err, result, fields) {  //?부분이 [user_id]값과 같은 것을 찾음
            
            for(var i = 0; i < result.length; i++) {
                gradeid[0] = result[i].성적ID;
            }

            db.query("Select * from 과제 where 성적ID in (?) order by 날짜", [gradeid] , function(err, result1, fields1){
                // console.log("과제table: ", result1);
                // db.query("SELECT * FROM 과목 WHERE 과목코드 in (?) ",  [result[0].과목코드], function(err,result2,fields2){
                //     console.log("교수result2", result2);
                    
                var schedule = new Array();
                if(result1[0]){
                    for(var i=0; i<result1.length && i<5; i++){
                        schedule[i] = result1[i].과제명;
                    }
                    console.log('schedule', schedule);
                    resolve(schedule);
                    //res.render('index.ejs', {notice:notice,lecture:lecture});
                } else{
                    console.log("fail: load notice");
                }
                });
            });
        
    })
   
    Promise.all([notice,lecture,schedule_1,schedule_2,schedule_3]).then(function(notice){
        //const new_notice = notice[0];
        console.log("lecture, notice :", notice);
        res.render('index.ejs', {notice:notice});
    })
})

app.get('/grade_detail',function(req,res){
    var user_id = req.session.passport.user;
    db.query("Select * from 성적 where 학번 in (?) order by 성적ID", [user_id] , function(err, result, fields){
        console.log("시험: ", result[0]);
        var subject_code = result[0].과목코드
        const subject_name1= new Promise(function(resolve){
            db.query("Select * From 과목 where 과목코드 in (?)", [subject_code] , function(err, result1, fields) {  //?부분이 [user_id]값과 같은 것을 찾음
                console.log("과목 : ", result1)
                var name = result1[0].과목명
                resolve(name);
            });
        })
        var score_id = result[0].성적ID
        const test_score= new Promise(function(resolve){
            db.query("Select * From 시험 where 성적ID in (?)", [score_id] , function(err, result1, fields) {  //?부분이 [user_id]값과 같은 것을 찾음
                console.log("시험 : ", result1)
                var data = {
                    과제: result1[0].과제점수,
                    중간점수: result1[0].중간점수
                }
                let options = {
                    scriptPath: path.join(__dirname, "/"),
                    args: [JSON.stringify(data)]
                };
                PythonShell.run("grades.py", options, function(err, result2){
                    if (err) throw err;
                    console.log(JSON.parse(result2[0]), JSON.parse(result2[1]));
                    var predict_score = Math.floor(JSON.parse(result2[0]));
                    var importance = JSON.parse(result2[1]);
                    var arr = JSON.parse(result2[2]);
                    var predict_chart = new Array();
                    
                    importance[0] = Math.floor(importance[0]*100);
                    importance[1] = 100 - importance[0];
                    
                    for (var i = 0; i < 21; i++) {
                        predict_chart[i] = Math.floor(arr[i]);
                    }
                    console.log(predict_chart)
                    var scores_json = {
                        p1: result1[0].과제점수,
                        p2: result1[0].과제점수 * 1.8,
                        m1: result1[0].중간점수,
                        m2: result1[0].중간점수 * 1.8,
                        s1: predict_score,
                        s2: predict_score * 1.8,
                        chart: predict_chart,
                        importance: importance
                    }
                    console.log("scores : ", scores_json);
                    resolve(scores_json);
                })
            });
        })
        Promise.all([subject_name1, test_score]).then(function(notice){
            console.log("subject name : ", notice);
            req.session.save(function(){
                res.render('grade_detail.ejs', {subject_name: notice[0], test_score: notice[1]});
            })
        })
    });
});

app.get('/lecture_room',function(req,res){
    var user_id = req.session.passport.user;
    var subcode = [];
    var profcode = [];
    
    const lecture = new Promise(function(resolve){
        db.query("Select * From 성적 where 학번 = ?", [user_id] , function(err, result, fields) {  //?부분이 [user_id]값과 같은 것을 찾음
            console.log("성적result: ", result);
            var lecture = '';
            

            for(var i = 0; i < result.length; i++) {
                subcode[i] = result[i].과목코드;
            }
            console.log("subcode",subcode);

            db.query("Select * from 과목 where 과목코드 in (?) order by 시간", [subcode] , function(err, result1, fields1){
                console.log("result111", result1);
                for(var i=0;i<result1.length;i++){
                    profcode[i]=result1[i].교수코드;
                }
                console.log("교수코드",profcode);
                db.query("SELECT * FROM 교수 WHERE 교수코드 in (?) ",  [profcode], function(err,result2,fields2){
                    console.log("교수result2", result2);                    
                    if(result2[0]){
                        lecture = [result1[0].과목명, result2[0].이름, result1[0].시간];
                        console.log('here',lecture);
                        resolve(lecture);
                        console.log("Promise lecture: ", lecture);
                    }
                });
            });
        });
    })
    Promise.all([lecture]).then(function(notice){
        req.session.save(function(){
            
            res.render('lectures.ejs',{notice:notice[0]});
    })
})
})

app.get('/lecture_detail',function(req,res){
    req.session.save(function(){
        res.render('lecture_detail.ejs');
    })
})

app.get('/scores',function(req,res){
    req.session.save(function(){
        res.render('scores.ejs');
    })
})

app.use('*', function(req, res, next) {
    console.log("fails", __dirname + req.url);
    res.status(404).send('Sorry cant find that!');
});

app.listen(4000, function(){
    console.log('server is listening on port 4000...');
})