PAGES = {
	WELCOME: "welcome",
	LOGIN: "login",
	REGISTER: "register",
	HOME: "home",
	WAY: "way",
};

// Call init when we open the website and also when we login.
function init() {
	Session.set("loginError", "");
	Session.set("registerError", "");
	Session.set("postsCount", 4);  // number of posts to show
	Session.set("showUpdates", false);  // True iff we are showing updates section
	Session.set("selectedPost", undefined);  // Id of the post we have selected on the right
	Session.set("selectedUpdate", undefined);  // Id of the update we have selected
	Session.set("currentPage", Meteor.userId() ? PAGES.HOME : PAGES.WELCOME);

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

// Change currentPage to the given value and perform a history.pushState to
// support browser back/forward.
function goToLoftPage(page) {
	var obj = {currentPage: page};
	console.log("Pushing history: " + JSON.stringify(obj));
	history.pushState(obj, "", window.location.href);
	Session.set("currentPage", page);
}

// Return all user's updates that are new (or not).
function findUpdates(areNew) {
	// Filter out updates that are created by this user as a workaround the
	// Meteor bug where the update flashes for a second when the user comments/loves.
	return updates.find({$and: [{byUserId: {$ne : Meteor.userId()}}, {new: areNew}]}, {sort: {createdAt: -1}});
}

// Router setup.
Router.route('/', function () {
	this.render(Session.get("currentPage"));
});

Tracker.autorun(function () {
	Meteor.subscribe("userProfiles");
	Meteor.subscribe("updates");
	Meteor.subscribe("posts", Session.get("postsCount"));
	Meteor.subscribe("comments");
});

$(document).ready(function() {
	$(window).on("popstate", function(e) {
		var state = e.originalEvent.state;
		console.log("Popstate: " + JSON.stringify(state));
		if (state == null) return;
		if (state.initial) {
			init();
		} else if (state.currentPage) {
			Session.set("currentPage", state.currentPage);
		}
	});
});

init();

// WELCOME
Template.welcome.events({
	"click #login": function (event) {
		goToLoftPage(PAGES.LOGIN);
	},
	"click #join-us-button": function (event) {
		goToLoftPage(PAGES.WAY);
	},
});


// HOME
Template.home.helpers({
	"newUpdates": function () {
		return findUpdates(true);
	},
	"showUpdates": function () {
		return Session.get("showUpdates");
	},
	"posts": function () {
		return posts.find({}, {sort: {createdAt: -1}});
	},
	"showLoadMore": function () {
		// TODO
		return true;
	},
	"selectedPost": function () {
		return Session.get("selectedPost");
	},
	"canPost": function() {
		return Session.get("postsLeft") > 0;
	},
	"postsLeft": function() {
		return Session.get("postsLeft");
	}
});

Template.home.events({
	"click #loft-logout": function (event) {
		Meteor.logout();
		goToLoftPage(PAGES.WELCOME);
	},
	"click #update-button": function (event) {
		if (!Session.get("showUpdates")) {
			Session.set("showUpdates", true);
			$(".b-updates").animate({"left": "0%"}, {queue: false});
			$(".b-updates").animate({"margin-right": "0%"}, {queue: false});
			$(".b-posts-spacer").hide({effect: "scale", direction: "horizontal", queue: false});
		} else {
			if (Session.get("selectedPost") !== undefined) {
				$(".b-posts").animate({"opacity": "0"}, {queue: false, complete: function() {
					Session.set("selectedPost", undefined);
					Session.set("selectedUpdate", undefined);
					$(".b-posts").animate({"opacity": "1"}, {queue: false});
				}});
			}
			$(".b-updates").animate({"left": "-40%"}, {queue: false, complete: function() {
				Session.set("showUpdates", false);
				Meteor.call("markAllUpdatesOld", function (result, err) {
					if (err != undefined) {
						console.log("markAllUpdatesOld error: " + err);
					}
				});
			}});
			$(".b-updates").animate({"margin-right": "-40%"}, {queue: false});
			$(".b-posts-spacer").show({effect: "scale", direction: "horizontal", queue: false});
		}
	},
	"click #load-more": function (event) {
		Session.set("postsCount", Session.get("postsCount") + 4);
	},
	"focus #post-input": function (event) {
		// Set max-height so that it's set in pixels. Workaround for this bug:
		// https://github.com/jackmoore/autosize/issues/191
		var maxHeight = parseFloat($("#post-input").css("max-height")) / 100.0;
		$("#post-input").css("max-height", $("#new-post-form").height() * maxHeight);
		$("#post-input").autosize().trigger("autosize.resize");
	},
	"submit #new-post": function (event) {
		Meteor.call("addPost", event.target.text.value, function(err, result) {
			if (err == undefined) {
				Session.set("postsLeft", Session.get("postsLeft") - 1);
			} else {
				console.log("addPost error: " + err);
			}
		});

		// Clear form
		event.target.text.value = "";
		$("#post-input").trigger("autosize.resize");

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

// UPDATES
Template.updates.helpers({
	"newUpdates": function () {
		return findUpdates(true);
	},
	"oldUpdates": function () {
		return findUpdates(false);
	},
});


// UPDATE
Template.update.helpers({
	"safeText": function() {
		var text = "";
		switch(this.type) {
			case UPDATE_TYPE.ADMIN:
				text = "Welcome to Loft.";
				break;
			case UPDATE_TYPE.COMMENT:
				if (this.postOwnerId == Meteor.userId()) {
					text = getFullName(this.byUserId) + " commented on your post.";
				} if (this.byUserId == this.postOwnerId) {
					text = getFullName(this.byUserId) + " commented on their post.";
				} else {
					text = getFullName(this.byUserId) + " also commented on " + getFullName(this.postOwnerId) + "’s post.";
				}
				break;
			case UPDATE_TYPE.LOVE:
				text = getFullName(this.byUserId) + " loved your post.";
				break;
			default:
				text = "Error: unknown update type.";
		}
		return escapeHtml(text);
	},
	"class": function() {
		if (this._id == Session.get("selectedUpdate")) {
			return "selected-update";
		} else if (this.read) {
			return "read-update";
		}
		return "";
	}
});

Template.update.events({
	"click .update-link": function () {
		// Clicking on the already selected update?
		if (this._id == Session.get("selectedUpdate")) {
			console.log("Selecting same update.");
			return;
		}
		Session.set("selectedUpdate", this._id);

		// Mark as read.
		if (!this.read) {
			Meteor.call("markUpdateRead", this._id, function(err, result) {
				if (err != undefined) {
					console.log("Error setPostRead: " + err);
				}
			});
		}

		var fadeIn = function() {
			$(".b-posts").animate({"opacity": "1"}, {queue: false});
		}

		// TODO: ideally, if we don't have this post and need to fetch it from the
		// server, we need to do it while we are animating.
		var postId = this.postId;
		// Set selectedPost to a temp stub, so that the update gets highlighted.
		$(".b-posts").animate({"opacity": "0"}, {queue: false, complete: function() {
			var post = posts.findOne({"_id": postId});
			if (post != undefined) {
				Session.set("selectedPost", post);
				fadeIn();
			} else {
				Meteor.call("getPost", postId, function(err, result) {
					if (err != undefined) {
						console.log("Error getPost: " + err);
					}
					Session.set("selectedPost", result);
					fadeIn();
				});
			}
		}});
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
				goToLoftPage(PAGES.HOME);
			} else {
				Session.set("loginError", String(err));
			}
		});
		return false; 
			},
		
  })

Template.register.events({
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
				goToLoftPage(PAGES.WAY);
			} else {
				Session.set("registerError", String(err));
			}
		});
		return false;
	}
});
