// Call init when we open the website and also when we login.
function init() {
	Session.set("loginError", "");
	Session.set("registerError", "");

	Meteor.call("canTrophy", function(err, result) {
		if (err == undefined) {
			Session.set("canTrophy", result);
		} else {
			console.log("canTrophy error: " + err);
		}
	});
	Meteor.call("getPostsLeft", function(err, result) {
		if (err == undefined) {
			Session.set("postsLeft", result);
		} else {
			console.log("getPostsLeft: " + err);
		}
	});
	Meteor.call("getDebugInfo", function(err, result) {
		if (err == undefined) {
			console.log(result);
		} else {
			console.log("getDebugInfo: " + err);
		}
	});
}

// Return cleaned and safe version of the given string.
function escapeHtml(str) {
	var div = document.createElement('div');
	div.appendChild(document.createTextNode(str));
	return div.innerHTML.replace(/\n/g, "<br>");
}

// Router setup.
Router.route('/', function () {
	if (Meteor.userId()) {
		console.log("home");
		this.render('home');
	} else {
	  this.render('login');
	}
});

Meteor.subscribe("posts");
Meteor.subscribe("comments");
init();


// HOME
Template.home.helpers({
	"posts": function () {
		return posts.find({}, {sort: {createdAt: -1}});
	},
	"canPost": function() {
		return Session.get("postsLeft") > 0;
	},
	"postsLeft": function() {
		return Session.get("postsLeft");
	}
});

Template.home.events({
	"submit .new-post": function (event) {
		console.log(event);

		Meteor.call("addPost", event.target.text.value, function(err, result) {
			if (err == undefined) {
				Session.set("postsLeft", Session.get("postsLeft") - 1);
			} else {
				console.log("addPost error: " + err);
			}
		});

		// Clear form
		event.target.text.value = "";

		// Prevent default form submit
		return false;
	},
	"submit .new-comment": function (event) {
		console.log(event);

		Meteor.call("addComment", this._id, event.target.text.value, function(err, result) {
			if (err == undefined) {
			} else {
				console.log("addComment error: " + err);
			}
		});

		// Clear form
		event.target.text.value = "";

		// Prevent default form submit
		return false;
	}
});


// POST
Template.post.helpers({
	"safeText": function() {
		return escapeHtml(this.text);
	},
	"canTrophy": function() {
		return this.userId != Meteor.userId() && Session.get("canTrophy");
	},
	"comments": function() {
		return comments.find({postId: this._id}, {sort: {createdAt: 1}});
	}
});

Template.post.events({
	"click .trophy-button": function () {
		Meteor.call("addTrophy", this._id, function (err, result) {
			if (err == undefined) {
				Session.set("canTrophy", false);
			} else {
				console.log("addTrophy error: " + err);
			}
		});
	}
});


// COMMENT
Template.comment.helpers({
	"safeText": function() {
		return escapeHtml(this.text);
	}
});


// LOGIN
Template.login.helpers({
	"loginError": function() {
		return Session.get("loginError");
	},
	"registerError": function() {
		return Session.get("registerError");
	}
});

Template.login.events({
	"submit #login-form" : function(event, target){
		// retrieve the input field values
		var email = target.find("#login-email").value;
		var password = target.find("#login-password").value;

		// TODO: Trim and validate your fields here.... 
		
		Meteor.loginWithPassword(email, password, function(err){
			if (err == undefined) {
				init();
			} else {
				Session.set("loginError", String(err));
			}
		});
		return false; 
	},
	"submit #register-form" : function(event, target) {
		var email = target.find("#account-email").value;
		var password = target.find("#account-password").value;
		var profile = {
			firstName: target.find("#account-first-name").value,
			lastName: target.find("#account-last-name").value,
		};

		// TODO: Trim and validate the input

		var options = { email: email, password: password, profile: profile };
		Accounts.createUser(options, function(err) {
			if (err == undefined) {
				init();
			} else {
				Session.set("registerError", String(err));
			}
		});
		return false;
	}
});

