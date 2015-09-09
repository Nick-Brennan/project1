var express = require('express');
var app = express();
var http = require('http').Server(app);
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require('path');
var views = path.join(process.cwd(), "views"); 
var db = require('./models');
var io = require('socket.io')(http);
var Twit = require('twit');

var T = new Twit({
    consumer_key:         '3oB9fLbCqGncbwyxt62DJAPV2'
  , consumer_secret:      'trCQIZLCuqJmt9jZ5FNyh7Zy8xgsdj4UEyTN6GPswtciUv1rNq'
  , access_token:         '17026573-xxzsMD2d6wVYp84UXMCWkCMnfR1uP8wSviN6LvFfT'
  , access_token_secret:  'AwlK0faTRaDp96vbD54yYXvfRxvOTVR9p4HRGFJjRBcWB'
});

T.setAuth(T.getAuth);

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
///***Colors for Chat Text***//////////////////////
var colorAssignment = {};

var colors = ['#690410', "#07525A",  "#B1B038", "#D1225F", "#041069", "#692a04", "#385FBB", "#68963A", '#690443', '#04695d']
var colorIndex = 0;

///***Active Users***/////////////////////////////
var activeUsers = [];
var activeSockets = [];

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
			res.sendFile(views + "/chat.html");
		}
	});
});

app.get('/api/ids', function(req, res){
	req.currentUser(function(err, user){
		res.send(user);
	})
});

app.get('/api/users', function(req, res){
	res.send(activeUsers);
});

app.post(['/api/users', '/signup'], function(req, res){
	var user = req.body.user;
	console.log("Signup - posted user object: "+req.body.user)
	var email = user.email;
	var password = user.password;
	db.User.createSecure(email, password, function(err, newUser){
		if(err){
			console.log(err);
			res.redirect('/');
		}else if(user === []){
			res.redirect('/');
		}else{
			req.login(newUser);
			if(colorIndex === colors.length){
				colorIndex = 0;
			}
			colorAssignment[newUser._id] = colors[colorIndex];
			colorIndex++;
			activeUsers.push(newUser);
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
			res.redirect('/login');
		}else if(user === []){
			res.redirect('/login');
		}else{
			req.login(validatedUser);
			if(colorIndex === colors.length){
				colorIndex = 0;
			}
			colorAssignment[validatedUser._id] = colors[colorIndex];
			colorIndex++;
			activeUsers.push(validatedUser);
			console.log(activeUsers);
			res.redirect('/chat');		
		}
	});
});

app.post('/logout', function(req, res){
	// req.currentUser(function(err, user){
	// 	var userIndex = activeUsers.map(function(activeUser){return activeUser._id;}).indexOf(user._id);
	// 	activeUsers.splice(userIndex, 1);
	// });
	req.logout();
	res.redirect('/login');
});

app.put('/api/users', function(req, res){
	req.currentUser(function(err, user){
		user.username = req.body.username;
		user.imageURL = req.body.imgURL;
		db.User.update({_id: user._id}, user, function(err, updated){
			if(err){
				console.log(err);
			}else{
				console.log(updated);
				res.sendStatus(200);
			}
		});
	})
});

io.on('connection', function(socket){
	console.log('a user connected');
	activeSockets.push(socket);
	socket.on('chat message', function(msgObj){
		db.User.findOne({_id: msgObj.userId}, function(err, user){
			var handle = (user.username) ? user.username : user.email
			io.emit('chat message', ("<img width='50px' src='"+user.imageURL+"'>" + '<b style="color:' 
				+ colorAssignment[user._id] + ';"> ' + handle
				+ " -- </b>" +  msgObj.message));
		})
		console.log('message: ' + msgObj.userId);
		
	});
	socket.on('disconnect', function(data){
		var index = activeSockets.indexOf(socket);
		activeSockets.splice(index, 1);
		activeUsers.splice(index, 1);
		console.log('user split');
	});
});

var stream = T.stream('statuses/filter', { track: ['#running', '#trailrunning', '#ultrarunning', '#5k', "#10k", "#socket.io", "#utmb", "#oswalt"], language: 'en' })

stream.on('tweet', function (tweet) {
  io.emit('tweet', tweet);
})

http.listen(3000, function(){
	console.log("Twitter Lounge is listening on port 3000");
});


