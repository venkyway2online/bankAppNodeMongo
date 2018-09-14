var express = require('express');
var app = express();
var router=express.Router();
var exec = require('child_process').exec;
var spawn = require("child_process").spawn;
var MongoClient = require('mongodb').MongoClient
var DB,coll;
var url = 'mongodb://localhost:27017/maildb'
var port    =   process.env.PORT || 8080;


app.use('/', router);
app.set('view engine', 'ejs')

MongoClient.connect(url,function(err,db){
    if(err)
        console.log(err);
    else{
    console.log("connected successfully");
    DB=db;
    coll=DB.collection('users')
    }
    });
var bodyParser = require('body-parser');
router.use(bodyParser.json()); // for parsing application/json
router.use(bodyParser.urlencoded({ extended: true }));

// ROUTES
// ==============================================

// sample route with a route the way we're used to seeing it
// router.get('/sample', function(req, res) {
//     res.render('yourView', {msg: 'Express'});
// });
app.get('/', function(req, res) {
    res.render('signup',{msg:''});  
});
app.post('/myaction', function(req, res) {
coll.findOne({username:req.body.email},function(err,results){
  console.log(results)
  if(results==null){
  coll.insertOne({
  username: req.body.email,
  password: req.body.pass

})
}
  else{
    res.render('signup',{msg: 'user already exits'});
    res.end()
  }
    })
   res.render('signup',{msg:''});
   res.end()
 });

// we'll create our routes here

// START THE SERVER
// ==============================================
app.listen(port);
console.log('Magic happens on port ' + port);