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

	// Called when a user is created.
	Accounts.onCreateUser(function(options, user) {
		// We still want the default hook's 'profile' behavior.
		if (options.profile) {
			user.profile = options.profile;
		}
		user["loft"] = { lastTrophyTime: 0 };
		return user;
	});
}

// This code only runs on the client
if (Meteor.isClient) {
	Meteor.subscribe("posts");
	Session.set('loginError', "");
	Session.set('registerError', "");
	Meteor.call("canTrophy", function(err, result) {
		Session.set('canTrophy', result);
	});
	Meteor.call("getDebugTrophy", function(err, result) {
		console.log(result);
	});

	// BODY
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

	// POST
	Template.post.helpers({
		'canTrophy' : function() {
			return Session.get('canTrophy');
		},
	});
	Template.post.events({
		"click .trophy-button": function () {
			Meteor.call("addTrophy", this._id, function (err, result) {
				if (result) {
					Session.set('canTrophy', false);
				}
			});
		}
	});

	// LOGIN
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
				lastName: t.find('#account-last-name').value,
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
	// Create a new post with the given text.
	addPost: function (text) {
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not authorized.");
		}
		var profile = Meteor.user().profile;
		posts.insert({
			userId: Meteor.userId(),
			name: profile.firstName + " " + profile.lastName,
			text: text,
			createdAt: Date.now(),
			trophiesBy: [] // list of userIds who have given this post a trophy
		});
	},
	// Return true iff this user can give a trophy right now.
	canTrophy: function () {
		if (!Meteor.userId()) {
			return true;
		}
		var startOfToday = new Date(Date.now());
		startOfToday.setUTCMilliseconds(0);
		startOfToday.setUTCSeconds(0);
		startOfToday.setUTCMinutes(0);
		// 09:00:00 UTC is 3am Pacific, which is when we reset trophies.
		if (startOfToday.getUTCHours() < 11) {
			startOfToday.setUTCDate(startOfToday.getUTCDate() - 1);
		}
		startOfToday.setUTCHours(11);
		return Meteor.user().loft.lastTrophyTime < startOfToday.getTime();
	},
	// Get debug trophy info.
	getDebugTrophy: function () {
		var lastTrophyDate = new Date(Meteor.user().loft.lastTrophyTime);
		var startOfToday = new Date(Date.now());
		startOfToday.setUTCMilliseconds(0);
		startOfToday.setUTCSeconds(0);
		startOfToday.setUTCMinutes(0);
		if (startOfToday.getUTCHours() < 11) {
			startOfToday.setUTCDate(startOfToday.getUTCDate() - 1);
		}
		startOfToday.setUTCHours(11);
		return lastTrophyDate.toLocaleString() + " (" + lastTrophyDate.getTime() + ")\n" +
			startOfToday.toLocaleString() + " (" + startOfToday.getTime() + ")\n";
	},
	// Add a trophy for the given post.
	addTrophy: function (postId) {
		var post = posts.findOne(postId);
		if (Meteor.userId() == post.userId) {
			throw new Meteor.Error("Can't give a trophy to yourself.");
		}
		// TODO: check canTrophy()
		posts.update(postId, { $addToSet: { trophiesBy: Meteor.userId() } });
		Meteor.users.update(Meteor.userId(), { $set: { loft: { lastTrophyTime: Date.now() } } });
		return true;
	}
});
