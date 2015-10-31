///***Including Dependencies***//////////////////////////////////////////////
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

require('dotenv').load();

///***Twit Middleware for Twitter Streaming API Setup***/////////////////////

var T = new Twit({
    consumer_key:         process.env.CON_KEY
  , consumer_secret:      process.env.CON_SEC
  , access_token:         process.env.ACC_TOK
  , access_token_secret:  process.env.ACC_TOK_SEC
});

T.setAuth(T.getAuth);

///***Additional Middleware and File Path Setup***///////////////////////////

app.use("/static", express.static("public"));
app.use("/vendor", express.static("bower_components"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(
	session({
		secret: process.env.SEC_KEY,
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

var colors = ['#690410', 
				"#07525A",
				"#B1B038",
				"#D1225F", 
				"#041069", 
				"#692a04", 
				"#385FBB", 
				"#68963A", 
				'#690443', 
				'#04695d'];
var colorIndex = 0;

///***Active Users***/////////////////////////////
var activeChaters = {};


///***Routes***////////////////////////////////////////////////////////////////
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
	res.send(activeChaters);
});

app.post(['/api/users', '/signup'], function(req, res){
	var user = req.body.user;
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
			res.redirect('/chat');
		}
	});
});

app.post(['/api/sessions', '/login'], function(req, res){
	var user = req.body.user;
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
			res.redirect('/chat');		
		}
	});
});

app.post('/logout', function(req, res){
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
				res.sendStatus(200);
			}
		});
	})
});

///***Socket Handlers***///////////////////////////////////////////

io.on('connection', function(socket){
	socket.emit('fetchUser');
	socket.on('sendUser', function(userInfo){
		db.User.findOne({_id: userInfo.userId}, function(err, user){
			activeChaters[socket.id] = user;
		});
	});
	socket.on('chat message', function(msgObj){
		db.User.findOne({_id: msgObj.userId}, function(err, user){
			var handle = user.username ? user.username : user.email;
			io.emit('chat message', ("<img width='50px' src='"+user.imageURL+"'>" + '<b style="color:' 
				+ colorAssignment[user._id] + ';"> ' + handle
				+ " -- </b>" +  msgObj.message));
		})	
	});
	socket.on('disconnect', function(data){
		delete activeChaters[socket.id];
		console.log('user split');
	});
});

///***Twitter Stream***/////////////////////////////////////////////

var stream = T.stream('statuses/filter', { track: ['irunfar','ultrarunning','trailrunning','niketrail','hokaoneone','distancerunning','USL_tv','dylanbo', 'sfrunco','magicquid','gary_robbins','sallymcrae','thegingerrunner','afvarner','milelong_legs','1jorgemaravilla','robkrar','sagecanaday','scottjurek','ultrarunnerpodcast','jasonschlarb','USLtv','aravaiparunning'], language: 'en' })
													

stream.on('tweet', function (tweet) {
  io.emit('tweet', tweet);
})

///***Server Setup***//////////////////////////////////////////////

http.listen(process.env.PORT || 3000, function(){
	console.log("Twitter Lounge is listening on port " + (process.env.PORT || 3000));
});


