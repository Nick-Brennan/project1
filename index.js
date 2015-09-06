var express = require('express');
var app = express();
var http = require('http').Server(app);
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require('path');
var views = path.join(process.cwd(), "views"); 
var db = require('./models');
var io = require('socket.io')(http);

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

app.get('/chat', function(req, res){
	req.currentUser(function(err, user){
		if(err){
			console.log(err)
		}else if(user === null){
			res.redirect('/login');
		}else{
			console.log("Here's our user found in chat: " + user);
			res.sendFile(views + "/chat.html");
		}
	});
});

app.get('/api/ids', function(req, res){
	req.currentUser(function(err, user){
		res.send(user);
	})
});

app.post(['/api/users', '/signup'], function(req, res){
	var user = req.body.user;
	console.log("Signup - posted user object: "+req.body.user)
	var email = user.email;
	var password = user.password;
	db.User.createSecure(email, password, function(err, newUser){
		if(err){
			console.log(err)
		}else if(user === []){
			res.redirect('/');
		}else{
			req.login(newUser);
			console.log("New user's ID set in session at signup" + req.session.userId);
			res.redirect('/chat');
		}
	});
});

app.post(['/api/sessions', '/login'], function(req, res){
	var user = req.body.user;
	console.log("Login - posted user object: " + user.email)
	var email = user.email;
	var password = user. password;
	db.User.authenticate(email, password, function(err, validatedUser){
		if(err){
			console.log(err)
		}else if(user === []){
			res.redirect('/login');
		}else{
			console.log("Here's the authenticated user: " + validatedUser)
			req.login(validatedUser);
			console.log("Session ID after being set in login: " + req.session.userId);
			res.redirect('/chat');
			
			// res.send(validatedUser);
		}
	});
});

app.post('/logout', function(req, res){
	req.logout();
	res.redirect('/login');
});

io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('chat message', function(msgObj){
		db.User.findOne({_id: msgObj.userId}, function(err, user){
			io.emit('chat message', (user.email + "--" +  msgObj.message));
		})
		console.log('message: ' + msgObj.userId);
		
	});
	socket.on('disconnect', function(){
		console.log('user split');
	});
});

http.listen(3000, function(){
	console.log("Twitter Lounge is listening on port 3000");
});


