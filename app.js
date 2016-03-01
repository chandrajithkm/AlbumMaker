/*var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var sessions = require('client-sessions');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.ObjectId;


//connect to mongoose
mongoose.connect('mongodb://localhost/AlbumMaker');

var User = mongoose.model('User', new Schema({
    id : ObjectId,
    firstName : String,
    lastName : String,
    email : {type : String, index: {unique : true}},
    password : String
}));

var app = express();
app.locals.pretty = true;
app.set('view engine','jade');

//middleware
app.use(bodyParser.urlencoded({extended : true}));
app.use(sessions({
    cookieName : 'session',
    secret : 'terimanusalifsdf328324ujehfjsfsffdscv',
    duration : 30 *60*1000,
    activeDuration : 5*60*1000
}));

app.get('/',function(req,res){
    res.render('index.jade');
});

app.get('/register',function(req,res){
    res.render('register.jade');
});

app.post('/register',function(req,res){
    //res.json(req.body);

    var user = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password
    });

    user.save(function(err){
        if (err)
        {
            //console.log(err);
            var error = "Something bad happened! Try Again";
            //special case, (not unique email)
            if (err.code == 11000)
            {
                error = "Email already taken. Try different Email";
            }
            res.render('register.jade', {error : error});
        }
        else
        {
            res.redirect("/dashboard");
        }
    })
});


app.get('/login',function(req,res){
    res.render('login.jade');
});

app.post('/login',function(req,res){
    User.findOne({email : req.body.email}, function(err,user){

        //if user doesn't exists
        if (!user)
        {
            var error = "Invalid Email or Passoword";
            res.render('login.jade',{error:error})
        }
        else
        {
            if (req.body.password == user.password)
            {
                req.session.user = user; //set-cookie: session={email:'...',password: '.....'}
                res.redirect('/dashboard');
            }
            else
            {
                var error = "Something went wrong while logging in...";
                res.render('login.jade',{error:error})
            }
        }
    });
});

app.get('/dashboard',function(req,res){
    res.render('dashboard.jade');
});

app.get('/logout',function(req,res){
    res.redirect('/');
});

app.listen(3000); */

var utils = require('./utils');

utils.createApp().listen(3000);