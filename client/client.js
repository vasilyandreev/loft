// Call init when we open the website and also when we login.
function init() {
	Session.set("loginError", "");
	Session.set("registerError", "");
	Session.set("postsCount", 4);  // number of posts to show
	Session.set("showStories", false);  // True iff we are showing stories section
	Session.set("currentPost", "");  // Id of the post we have selected on the right

	Meteor.call("canLove", function(err, result) {
		if (err == undefined) {
			Session.set("canLove", result);
		} else {
			console.log("canLove error: " + err);
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

// Return the full name of a user.
function getFullName(userId) {
	var user = Meteor.users.findOne(userId);
	return user.profile.firstName + " " + user.profile.lastName;
}

// Router setup.
Router.route('/', function () {
	if (Meteor.userId()) {
		this.render('home');
	} else {
		this.render('login');
	}
});

Tracker.autorun(function () {
	Meteor.subscribe("userProfiles");
	Meteor.subscribe("stories");
	Meteor.subscribe("posts", Session.get("postsCount"));
	Meteor.subscribe("comments");
});

init();


// HOME
Template.home.helpers({
	"newStories": function () {
		return stories.find({$and: [{byUserId: {$ne : Meteor.userId()}}, {new: true}]}, {sort: {createdAt: -1}});
	},
	"showStories": function () {
		return Session.get("showStories");
	},
	"posts": function () {
		return posts.find({}, {sort: {createdAt: -1}});
	},
	"showLoadMore": function () {
		// TODO
		return true;
	},
	"currentPost": function () {
		return posts.findOne({"_id": Session.get("currentPost")});
	},
	"canPost": function() {
		return Session.get("postsLeft") > 0;
	},
	"postsLeft": function() {
		return Session.get("postsLeft");
	}
});

Template.home.events({
	"click #story-button": function (event) {
		Session.set("showStories", !Session.get("showStories"));
		if (!Session.get("showStories")) {
			Meteor.call("markAllStoriesOld", function (result, err) {
				if (err != undefined) {
					console.log("markAllStoriesOld error: " + err);
				}
			});
			Session.set("currentPost", this.postId);
		}
	},
	"click #load-more": function (event) {
		Session.set("postsCount", Session.get("postsCount") + 4);
		Meteor.subscribe("posts", Session.get("postsCount"));
	},
	"submit .new-post": function (event) {
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


// STORIES
Template.stories.helpers({
	"newStories": function () {
		// Filter out stories that are created by this user as a workaround the
		// Meteor bug where the story flashes for a second when the user comments/loves.
		return stories.find({$and: [{byUserId: {$ne : Meteor.userId()}}, {new: true}]}, {sort: {createdAt: -1}});
	},
	"oldStories": function () {
		return stories.find({$and: [{byUserId: {$ne : Meteor.userId()}}, {new: false}]}, {sort: {createdAt: -1}});
	},
});


// STORY
Template.story.helpers({
	"safeText": function() {
		var text = "";
		switch(this.type) {
			case STORY_TYPE.ADMIN:
				text = "Welcome to Loft.";
				break;
			case STORY_TYPE.COMMENT:
				if (this.postOwnerId == Meteor.userId()) {
					text = getFullName(this.byUserId) + " commented on your post.";
				} else {
					text = getFullName(this.byUserId) + " also commented on " + getFullName(this.postOwnerId) + "’s post.";
				}
				break;
			default:
				text = "Error: unknown story type."
		}
		return escapeHtml(text);
	},
});
Template.story.events({
	"click .story-link": function () {
		Meteor.call("markStoryRead", this._id, function(err, result) {
			if (err != undefined) {
				console.log("Error setPostRead: " + err);
			}
		});
		Session.set("currentPost", this.postId);
		return false;
	}
});

// POST
Template.post.helpers({
	"safeText": function() {
		return escapeHtml(this.text);
	},
	"name": function() {
		return getFullName(this.userId);
	},
	"canLove": function() {
		return this.userId != Meteor.userId() &&
			Session.get("canLove") &&
			this.lovedBy.indexOf(Meteor.userId()) == -1;

	},
	"comments": function() {
		return comments.find({postId: this._id}, {sort: {createdAt: 1}});
	}
});

Template.post.events({
	"click .love-button": function () {
		Meteor.call("lovePost", this._id, function (err, result) {
			if (err == undefined) {
				Session.set("canLove", false);
			} else {
				console.log("lovePost error: " + err);
			}
		});
	}
});


// COMMENT
Template.comment.helpers({
	"safeText": function() {
		return escapeHtml(this.text);
	},
	"name": function() {
		return getFullName(this.userId);
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
			lastLoveTime: 0,
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
