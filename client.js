// This code only runs on the client
if (Meteor.isClient) {
	Meteor.subscribe("posts");
	Session.set('loginError', "");
	Session.set('registerError', "");
	Meteor.call("canTrophy", function(err, result) {
		Session.set('canTrophy', result);
	});
	Meteor.call("getPostsLeft", function(err, result) {
		console.log("Posts left: " + result + " " + err);
		Session.set('postsLeft', result);
	});
	Meteor.call("getDebugInfo", function(err, result) {
		console.log(result);
	});

	// BODY
	Template.body.helpers({
		'posts': function () {
			return posts.find({}, {sort: {createdAt: -1}});
		},
		'canPost': function() {
			return Session.get("postsLeft") > 0;
		},
		'postsLeft': function() {
			return Session.get("postsLeft");
		}
	});
	Template.body.events({
		"submit .new-post": function (event) {
			console.log("submit .new-post");
			console.log(event);

			var text = event.target.text.value;
			Meteor.call("addPost", text, function(err, result) {
				if (!err) {
					// Clear form
					event.target.text.value = "";
					Session.set("postsLeft", Session.get("postsLeft") - 1);
				} else {
					// TODO: show error
				}
			});

			// Prevent default form submit
			return false;
		}
	});

	// POST
	Template.post.helpers({
		'canTrophy': function() {
			return Session.get('canTrophy');
		}
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
}
