var express = require('express');
var app = express();
var http = require('http').Server(app);
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res){
	res.send("Work in progress");
});



http.listen(3042, function(){
	console.log("Twitter Lounge is listening on port 3042");
});


