
var userID;

$(function(){
	tagPage();

	var socket = io();
	

	socket.on('fetchUser', function(){
		socket.emit('sendUser', {userId: userID});
	});

	$('#chatButton').submit(function(){
		socket.emit('chat message', {message : $('#messageInput').val(), userId: userID});
		$('#messageInput').val('');
		return false;
	});
	socket.on('chat message', function(msg){
		$('#messages').prepend($('<li>').html(msg));
		var ding = new Audio('static/tim_tum.mp3');
		ding.volume = 0.75;
		ding.play();
	});
	socket.on('tweet', function(tweet){
	    var str = tweet.text;
	    var regex = /(https?:\/\/([-\w\.]+)+(:\d+)?(\/([\w\/_\.]*(\?\S+)?)?)?)/g
	    var replaced_text = str.replace(regex, "<a target='_blank' href='$1'>$1</a>");
		$('#tweetPlaceholder').prepend('<li><img height="25px" src="' 
										+ tweet.user.profile_image_url
										 + '">' + replaced_text + '</li>');
	});

	setInterval(getUsers, 500);
});



function tagPage(){
	$.get('/api/ids', function(req, res){
		userID = req._id;
	})
};

function getUsers(){	
	$.get('/api/users', function(req, res){	
		$('#usernamesPlaceholder').empty();
		var template = _.template($('#userListTemplate').html());
		var array = $.map(req, function(value, index) {
		    return value;
		});
		array.forEach(function(user){
			$('#usernamesPlaceholder').append(template(user));
		});
	});
};

function updateProfile(){
	$('#updateButton').click(function(e){
		e.preventDefault();
	});

	var userData = {};
	userData.username = $('#username').val();
	userData.imgURL = $('#imgURL').val();

	console.log(userData);

	$.ajax({
		url: "/api/users",
		type: "PUT",
		data: userData,
		success: function(){
			$('#profileModal').modal('hide');
		}
	})
}





