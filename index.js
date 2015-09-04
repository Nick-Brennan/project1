var express = require('express');
var app = express();
var http = require('http').Server(app);
var bodyParser = require('body-parser');
var db = require('./models');

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res){
	res.send("Work in progress");
});

app.post(['/api/users', '/signup'], function(req, res){
	var user = req.body.user;
	var email = user.email;
	var password = user.password;
	db.User.createSecure(email, password, function(err, user){
		res.send(user + "was created and registered");
	});
});



http.listen(3000, function(){
	console.log("Twitter Lounge is listening on port 3000");
});


