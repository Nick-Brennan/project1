var express = require('express');
var app = express();
var http = require('http').Server(app);
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require('path');
var views = path.join(process.cwd(), "views"); 
var db = require('./models');

app.use("/static", express.static("public"));
app.use("/vendor", express.static("bower_components"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(
	session({
		secret: 'secret-key',
		resave: false,
		saveUninitialized: true
	})
);
app.use(function(req, res, next){
	req.login = function(user){
		req.session.userId = user._id;
	};

	req.currentUser = function(cb){
		db.User.findOne({_id: req.session.userId},
			function(err, user){
				req.user = user;
				cb(null, user);
			});
	};

	req.logout = function(){
		req.session.userId = null;
		req.user = null;
	};

	next();
});

///***Routes***///////////////////////////////////
app.get(['/', '/login'], function(req, res){
	res.sendFile(views + "/login.html");
});

app.post(['/api/users', '/signup'], function(req, res){
	var user = req.body.user;
	var email = user.email;
	var password = user.password;
	db.User.createSecure(email, password, function(err, newUser){
		if(err){
			console.log(err)
		}else if(user === null){
			res.redirect('/');
		}else{
			req.login(newUser);
			res.redirect('/chat');
		}
	});
});

app.post(['/api/sessions', '/login'], function(req, res){
	var user = req.body.user;
	var email = user.email;
	var password = user. password;
	db.User.authenticate(email, password, function(err, user){
		if(err){
			console.log(err)
		}else if(user === null){
			res.redirect('/');
		}else{
			res.sendFile(views + "/chat.html");
		}
	});
});

http.listen(3000, function(){
	console.log("Twitter Lounge is listening on port 3000");
});


