var express = require('express');
var Config = require('config-js');
var config = new Config('./config.js');
var app = express();
var cookieSession = require('cookie-session');
var session = require('express-session');
var router = express.Router();
var exec = require('child_process').exec;
var spawn = require("child_process").spawn;
var MongoClient = require('mongodb').MongoClient
var DB, coll, coll1;
var url = `mongodb://${config.get('server.host')}:${config.get('server.port')}/${config.get('db.db')}`
app.use('/', router);
app.use(session({secret: 'ssshhhhh', saveUninitialized: true, resave: true}));
var sess;

app.set('view engine', 'ejs')
MongoClient.connect(url, function (err, db) {
    if (err)
        console.log(err);
    else {
        console.log("connected successfully");
        DB = db;
        coll = DB.collection('users11')
        coll1 = DB.collection('transactions11')
    }
});
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application/x-www-form-urlencoded
app.listen(3000, function () {
    console.log(`Node server running @ http://${config.get('app.host')}:${config.get('app.port')}`);
});


app.use('/node_modules', express.static(__dirname + '/node_modules'));

app.use('/style', express.static(__dirname + '/style'));


app.get('/', function (req, res) {
    sess = req.session
    if (sess.number) {
        coll.findOne({number: sess.number}, function (err, results) {
            if (err) throw err;
            result = results.username;
            if (sess.number == config.get('app.admin')) {
                admin = true
            }
            else {
                admin = false
            }
            res.render('logout', {user: result, num: sess.number, admin: admin, amount: results.money})
        })
    }
    else {
        res.render('home', {msg: ''})
    }
})

app.post('/login', function (req, res) {
    coll.findOne({number: req.body.number}, function (err, results) {
        if (results == null) {
            res.render('home', {msg: 'invalid credentials'})
        }
        else {
            if (req.body.pass != results.password) {
                res.render('home', {msg: 'invalid credentials'})
            }
            else if ((req.body.pass == results.password) && results.approve == 1) {
                sess = req.session;
                sess.number = req.body.number;
                res.redirect('/')
            }
            else if ((req.body.pass == results.password) && results.approve == 0) {
                res.render('wait')
            }

        }
    })
})
// app.get('/admin',function(req,res){
//   sess=req.session;
//   if(sess.number)  
//   {
//     res.write('<h1>Hello '+sess.email+'</h1><br>');
//     res.end('<a href='+'/logout'+'>Logout</a>');
//   }
//   else
//   {
//     res.redirect('/')
//     // res.render('home',{msg:''});
//   }

// });
app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect('/');
        }
    });

});
app.get('/signup', function (req, res) {
    res.render('signup', {msg: ''});
});

app.post('/myaction', function (req, res) {
    coll.findOne({number: req.body.number}, function (err, results) {
        if (results == null) {
            coll.insertOne({
                username: req.body.username,
                password: req.body.pass,
                secret: req.body.secret,
                number: req.body.number,
                gender: 'Male',
                approve: 0,
                money: 10000

            });
            res.redirect('/')
        }
        else {
            res.render('signup', {msg: 'user already exits'});
        }
    });
});
app.get('/remove', function (req, res) {
    sess = req.session
    if (sess.number == config.get('app.admin')) {
        res.render('remove', {status: ''})
    }
    else {
        res.redirect('/')
    }
})

app.post('/actions', function (req, res) {
    sess = req.session
    if (sess.number == config.get('app.admin')) {
        coll.findOne({number: req.body.number}, function (err, results) {
            if (err) throw err;
            else if (results == null) {
                res.render('remove', {status: 'account not exits'})
            }
            else {
                coll.update({number: req.body.number}, {$set: {approve: 0}}, function (err, results) {
                    if (err) throw err;
                    res.render('remove', {status: 'account blocked successfully'})
                })
            }

        })
    }
    else {
        res.redirect('/')
    }
})

app.get('/approve', function (req, res) {
    sess = req.session
    if (sess.number == config.get('app.admin')) {
        res.render('approve', {status: ''})
    }
    else {
        res.redirect('/')
    }
})

app.post('/action1', function (req, res) {
    sess = req.session
    if (sess.number == config.get('app.admin')) {
        coll.findOne({number: req.body.number}, function (err, results) {
            if (err) throw err;
            else if (results == null) {
                res.render('approve', {status: 'account not exits'})
            }
            else {
                coll.updateOne({number: req.body.number}, {$set: {approve: 1}}, function (err, results) {
                    if (err) throw err;
                    res.render('approve', {status: 'account approved successfully'})
                })
            }

        })
    }
    else {
        res.redirect('/')
    }
})
app.get('/bank', function (req, res) {
    sess = req.session
    if (sess.number == config.get('app.admin')) {
        res.render('bank', {status: ''})
    }
    else {
        res.redirect('/')
    }
})
app.post('/action2', function (req, res) {
    sess = req.session
    if (sess.number == config.get('app.admin')) {
        bal = parseInt(req.body.balance)
        coll.findOne({number: req.body.number}, function (err, results) {
            if (err) throw err;
            else if (results == null) {
                res.render('bank', {status: 'account not exists'})
            }
            else {
                amount1 = results.money
                result = coll1.insertOne({
                    'source': 'BANK',
                    'destination': req.body.number,
                    'amount': bal,
                    'status': 'initial'
                }, function (err, res1) {
                    inserted_id = res1.insertedId
                    coll.update({$and: [{'money': {$gt: 0}}, {'money': {$gte: bal}}, {number: req.body.number}]}, {$inc: {'money': bal}}, function (err, res2) {
                        coll.findOne({number: req.body.number}, function (err, results1) {
                            amount2 = results1.money
                            if (amount1 == amount2) {
                                coll1.updateOne({'_id': inserted_id}, {$set: {'status': 'transaction fails'}})
                                res.render('bank', {status: 'transaction fails'})
                            }
                            else {
                                coll1.updateOne({'_id': inserted_id}, {$set: {'status': 'transaction sucess'}})
                                res.render('bank', {status: 'transaction sucess'})
                            }
                        })
                    })
                })
            }
        })
    }
    else {
        res.redirect('/')
    }
})
app.post('/action5', function (req, res) {
    sess = req.session
    if (sess.number) {
        bal = parseInt(req.body.balance)
        coll.findOne({number: sess.number}, function (err, results) {
            if (err) throw err;
            else if (results == null) {
                res.render('bank', {status: 'account not exists'})
            }
            else {
                amount1 = results.money
                result = coll1.insertOne({
                    'source': sess.number,
                    'destination': 'ATM',
                    'amount': bal,
                    'status': 'initial'
                }, function (err, res1) {
                    inserted_id = res1.insertedId
                    coll.update({$and: [{'money': {$gt: 0}}, {'money': {$gte: bal}}, {number: sess.number}]}, {$inc: {'money': -bal}}, function (err, res2) {
                        coll.findOne({number: sess.number}, function (err, results1) {
                            amount2 = results1.money
                            if (amount1 == amount2) {
                                coll1.updateOne({'_id': inserted_id}, {$set: {'status': 'transaction fails'}})
                                res.render('atm', {status: 'transaction fails'})
                            }
                            else {
                                coll1.updateOne({'_id': inserted_id}, {$set: {'status': 'transaction sucess'}})
                                res.render('atm', {status: 'transaction sucess'})
                            }
                        })
                    })
                })
            }
        })
    }
    else {
        res.redirect('/')
    }
})


app.get('/requests', function (req, res) {
    sess = req.session
    if (sess.number == config.get('app.admin')) {
        coll.find({'approve': 0}).sort({'_id': -1}).toArray(function (err, results) {
            if (err) throw err;
            res.render('requests', {arr: results})
        })
    }
    else {
        res.redirect('/')
    }
})
app.get('/users', function (req, res) {
    sess = req.session
    if (sess.number == config.get('app.admin')) {
        coll.find({number: {$ne: config.get('app.admin')}}).sort({'_id': 1}).toArray(function (err, results) {
            if (err) throw err;
            res.render('requests', {arr: results})
        })
    }
    else {
        res.redirect('/')
    }
})
app.get('/update', function (req, res) {
    sess = req.session
    if (sess.number) {
        res.render('update', {status: ''})
    }
    else {
        res.redirect('/')
    }
})
app.post('/action3', function (req, res) {
    sess = req.session
    if (sess.number) {
        coll.findOne({number: sess.number}, function (err, results) {
            pass1 = req.body.pass
            pass2 = req.body.passs
            passold = req.body.passold
            if (passold == results.password) {
                if (pass1 == pass2) {
                    if (results.password != pass1) {
                        hashpass1 = pass1
                        coll.update({"number": sess.number}, {$set: {"password": hashpass1}}, multi = true)
                        res.render('update', {status: 'password updated successfully'})
                    }
                    else {
                        res.render('update', {status: 'try a different password'})
                    }
                }
                else {
                    res.render('update', {status: 'password not matches'})
                }
            }
            res.render('update', {status: 'old password wrong'})

        })
    } else {
        res.redirect('/')
    }
})
app.get('/forgot', function (req, res) {

    res.render('forgot', {msg: ''})

})
app.post('/action4', function (req, res) {
    coll.findOne({number: req.body.number, secret: req.body.secret}, function (err, results) {
        if (err) throw err;
        else if (results == null) {
            res.render('forgot', {msg: 'enter correct details'})
        }
        else {
            password1 = results.password
            res.render('forgot', {msg: password1})
        }
    })
})
app.get('/atm', function (req, res) {
    sess = req.session
    if (sess.number) {
        res.render('atm', {status: ''})
    }
    else {
        res.redirect('/')
    }
})
app.get('/dues', function (req, res) {
    sess = req.session
    if (sess.number) {
        coll.findOne({number: sess.number}, function (err, results) {
            coll1.find({$or: [{'source': sess.number}, {$and: [{'destination': sess.number}, {'status': 'transaction sucess'}]}, {$and: [{'source': 'BANK'}, {'status': 'transaction sucess'}, {'destination': sess.number}]}]}).limit(10).sort({"_id": -1}).toArray(function (err, results1) {
                for (i = 0; i < results1.length; i++) {
                    var y = results1[i]._id.getTimestamp().toString()
                    results1[i]._id = y
                }
                res.render('dues', {arr: results1, su: sess.number})
            })
        })
    }
    else {
        res.redirect('/')
    }
})
app.get('/trans', function (req, res) {
    sess = req.session
    if (sess.number) {
        res.render('trans', {status: '', val: false, number: ''})
    }
    else {
        res.redirect('/')
    }
})
app.post('/action6', function (req, res) {
    sess = req.session
    if (sess.number) {
        coll.findOne({number: sess.number}, function (err, results) {
            first = results.money
            sta = results.approve
            source = sess.number
            destination = req.body.destination_account
            amount1 = parseInt(req.body.amount)
            coll.findOne({number: destination}, function (err, results1) {
                var r1=results1.money;
                sta1 = results1.approve;
                val = false
                if (results1 && (sess.number != destination) && (destination != config.get('app.admin')) && sta != 0 && sta1 != 0) {
                    coll1.insertOne({
                        'source': source,
                        'destination': destination,
                        'amount': amount1,
                        'status': 'initial',
                        'reciver':r1,
                        'sender':first
                    }, function (err, results2) {

                        coll.update({$and: [{'money': {$gt: 0}}, {'money': {$gte: amount1}}, {number: source}]}, {$inc: {'money': -amount1}})
                        coll.findOne({number: sess.number}, function (err, results3) {
                            second = results3.money;
                            if (first == second) {
                                coll1.updateOne({'_id': results2.insertedId}, {$set: {'status': 'transaction fails'}}, function (err, results4) {
                                    res.render('trans', {
                                        status: 'last transaction fails',
                                        number: sess.number,
                                        val: false
                                    })
                                    // # return render_template('logout.html',result=login_user['name'],number=login_user['survey']['stat'],bal=login_user['money'],name=login_user['name'],account=login_user['account_number'],trans='transaction fails')
                                })
                            }
                            else {
                                coll.update({number: destination}, {$inc: {'money': amount1}}, function (err, results5) {
                                    // console.log(results5)
                                    coll.findOne({number:destination},function (err,datav) {
                                        coll1.updateOne({'_id': results2.insertedId}, {$set: {'status': 'transaction sucess',"sender":second,"reciver":datav.money}}, function (err, reuslts6) {
                                            res.render('trans', {
                                                status: 'last transaction success',
                                                number: sess.number,
                                                val: false
                                            })
                                        })

                                    })

                                })
                            }

                        })
                    })
                }
                else {
                    res.render('trans', {val: true, number: destination, status: ''})
                }
            })
        })
    }
    else {
        res.redirect('/')
    }
})


