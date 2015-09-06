$(function(){
	tagPage();

	var socket = io();
	socket.id = 123;
	$('#chatButton').submit(function(){
		socket.emit('chat message', {message : $('#m').val(), userId: userID});
		$('#m').val('');
		return false;
	});
	socket.on('chat message', function(msg){
		$('#messages').prepend($('<li>').text(msg));
	});
});

var userID;

function tagPage(){
	$.get('/api/ids', function(req, res){
		console.log(req._id);
		userID = req._id;
	})
};