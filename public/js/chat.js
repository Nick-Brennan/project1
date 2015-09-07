$(function(){
	tagPage();

	var socket = io();
	$('#chatButton').submit(function(){
		socket.emit('chat message', {message : $('#m').val(), userId: userID});
		$('#m').val('');
		return false;
	});
	socket.on('chat message', function(msg){
		$('#messages').prepend($('<li>').html(msg));
	});
	getUsers();

	socket.on('tweet', function(tweet){
		$('#tweetPlaceholder').prepend($('<li>').text(tweet));
	})

	setInterval(getUsers, 2000);
});

var userID;

function tagPage(){
	$.get('/api/ids', function(req, res){
		console.log(req._id);
		userID = req._id;
	})
};

function getUsers(){
	$.get('/api/users', function(req, res){
		$('#usernamesPlaceholder').empty();
		console.log(req);
		console.log(req[0].email);
		var template = _.template($('#userListTemplate').html());
		console.log(template);
		req.forEach(function(user){
			$('#usernamesPlaceholder').append(template(user));
		});
	});
};

// function checkIn(){
// 	socket.emit('in chat', {id: userID});
// }