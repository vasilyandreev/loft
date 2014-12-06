posts = new Mongo.Collection("posts");

if (Meteor.isServer) {
	Meteor.publish("posts", function () {
		return posts.find({
			userId: { $ne: this.userId }
		});
	});
	Meteor.startup(function () {
		// code to run on server at startup
	});
}

// This code only runs on the client
if (Meteor.isClient) {
	Meteor.subscribe("posts");

	Template.body.helpers({
		posts: function () {
			return posts.find({}, {sort: {createdAt: -1}});
		}
	});

	Template.body.events({
		"submit .new-post": function (event) {
			console.log("submit .new-post");
			console.log(event);

			var text = event.target.text.value;
			Meteor.call("addPost", text);

			// Clear form
			event.target.text.value = "";

			// Prevent default form submit
			return false;
		}
	});

	Template.post.events({
		"click .trophy-button": function () {
			Meteor.call("addTrophy", this._id);
		}
	});

	Template.login.events({
		'submit #login-form' : function(e, t){
			e.preventDefault();
			// retrieve the input field values
			var email = t.find('#login-email').value;
			var password = t.find('#login-password').value;

			// TODO: Trim and validate your fields here.... 
			
			// If validation passes, supply the appropriate fields to the
			// Meteor.loginWithPassword() function.
			Meteor.loginWithPassword(email, password, function(err){
				if (err) {
					// The user might not have been found, or their passwword
					// could be incorrect. Inform the user that their
					// login attempt has failed. 
					Session.set('loginError', String(err));
				} else {
					// The user has been logged in.
					Session.set('registerError', "");
					Session.set('loginError', "");
				}
			});
			return false; 
		},
		'submit #register-form' : function(e, t) {
			e.preventDefault();
			var email = t.find('#account-email').value;
			var password = t.find('#account-password').value;
			var profile = {
				firstName: t.find('#account-first-name').value,
				lastName: t.find('#account-last-name').value
			};

			// TODO: Trim and validate the input

			var options = { email: email, password: password, profile: profile };
			Accounts.createUser(options, function(err) {
				if (err) {
					Session.set('registerError', String(err));
				} else {
					// Success. Account has been created and the user
					// has logged in successfully. 
					Session.set('registerError', "");
					Session.set('loginError', "");
					//Meteor.call("setUserName", Meteor.userId(), firstName, lastName);
				}
			});
			return false;
		}
	});
	Template.login.helpers({
		'loginError' : function() {
			return Session.get('loginError');
		},
		'registerError' : function() {
			return Session.get('registerError');
		}
	});
}

Meteor.methods({
	setUserName: function (userId, firstName, lastName) {
		if (Meteor.userId() != userId) {
			throw new Meteor.Error("Invalid userId.");
		}
		Meteor.users.update(userId, { $set: { profile : { firstName: firstName, lastName: lastName } } });
	},
	addPost: function (text) {
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not authorized.");
		}
		var profile = Meteor.user().profile;
		posts.insert({
			userId: Meteor.userId(),
			name: profile.firstName + " " + profile.lastName,
			text: text,
			createdAt: new Date(),
			trophiesBy: [] // list of userIds who have given this post a trophy
		});
	},
	addTrophy: function (postId) {
		var post = posts.findOne(postId);
		if (Meteor.userId() == post.userId) {
			throw new Meteor.Error("Can't give a trophy to yourself.");
		}
		posts.update(postId, { $addToSet: { trophiesBy: Meteor.userId() } });
	}
});
