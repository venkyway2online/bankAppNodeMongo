var express = require('express');
var router = express.Router();



router.get('/', function (req, res, next) {
    res.render('someView', {msg: 'Express'});
});
module.exports=router