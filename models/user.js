var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

var UserSchema = new Schema({
	email: {type: String, required: true, unique: true},
	passwordDigest: {type: String, required: true},
	createdAt: {type: Date, default: Date.now()},
	username: String,
	imageURL: {type: String, default: 'http://livestreaming4u.com/wp-content/uploads/2014/10/eintsein-face-technician.jpg'}
});

UserSchema.statics.createSecure = function(email, password, cb){
	var _this = this;
	bcrypt.genSalt(function(err, salt){
		bcrypt.hash(password, salt, function(err, hash){
			var user = {
				email: email,
				passwordDigest: hash
			};
			_this.create(user, cb)
		});
	});
};

UserSchema.statics.authenticate = function(emailOrUsername, password, cb){
	this.findOne({$or:[{email: emailOrUsername}, {username: emailOrUsername}]}, function(err, user){
		if(user === null){
			cb("Sorry, who's that?", null);
		}else if(user.checkPassword(password)){
			cb(null, user);
		}else{
			cb("Sorry, wrong password", user);
		}
	});
};

UserSchema.methods.checkPassword = function(password){
	return bcrypt.compareSync(password, this.passwordDigest);
}

var User = mongoose.model("User", UserSchema);

module.exports = User;