// Number of posts to load initially.
INITIAL_POSTS = 10;
// Number of posts to load each time we reach the end.
LOAD_MORE_POSTS = 5;
// Number of comments to show initially for any post.
INITIAL_COMMENTS = 10;
// Number of updates to load initially (both for new and old).
INITIAL_UPDATES = 10;
// Number of updates to load when user wants to load more.
LOAD_MORE_UPDATES = 10;
// How often we save the post draft when the user is editing it.
SAVE_POST_DRAFT_PERIOD = 5000;  // in milliseconds
// Percent scroll necessary to load more posts.
SCROLL_TRIGGER = 0.95;
// Number used to make all animations slower.
ANIMATION_FACTOR = 1;
// Constants for page names.
PAGES = {
	WELCOME: "welcome",
	LOGIN: "login",
	REGISTER: "register",
	HOME: "home",
	WAY: "way",
	QUOTE: "quote",
	INVITE: "invite",
};

// Collections.
var posts = new Mongo.Collection(null);
var comments = new Mongo.Collection(null);
var updates = new Mongo.Collection(null);

// Call init when we open the website and also when we login.
function init() {
	console.log("init");
	Session.set("loginError", "");
	Session.set("registerError", "");
	Session.set("loadingMorePosts", false);  // True iff we already asked the server for more posts
	Session.set("noMorePosts", false);  // True iff there are no more posts to load
	Session.set("showUpdates", false);  // True iff we are showing updates section
	Session.set("oldUpdatesCount", 0);  // Number of old updates available on the server
	Session.set("showingPostPopup", false);  // True iff we are showing the post popup modal
	Session.set("selectedPost", undefined);  // Id of the post we have selected on the right
	Session.set("selectedUpdate", undefined);  // Id of the update we have selected
	Session.set("currentPage", Meteor.userId() ? PAGES.HOME : PAGES.WELCOME);
	Session.set("quoteText", "");  // Quote text displayed on the quote page
	Session.set("codeError", "");  // Error during invite code submission
	Session.set("showRegistration", false);  // True iff we are showing registration section in register.html
	Session.set("prefillFirstName", "");  // Value to put into the first name textbox when registering
	Session.set("prefillLastName", "");

	if (!Session.equals("currentPage", PAGES.QUOTE)) {
		Meteor.call("shouldShowQuote", function(err, result) {
			if (err == undefined) {
				if (result) {
					goToLoftPage(PAGES.QUOTE);
				}
			} else {
				console.log("shouldShowQuote: " + err);
			}
		});
	}
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
	Meteor.call("getPostDraftText", function(err, result) {
		if (err == undefined) {
			Session.set("postDraftText", result);
		} else {
			console.log("getPostDraftText: " + err);
		}
	});
	Meteor.call("getTodaysQuote", function(err, result){
		if (err == undefined) {
			Session.set("quoteText", result);
		} else {
			console.log("getTodaysQuote" + err);
		}
	});

	Meteor.subscribe("userProfiles");
	loadMorePosts(INITIAL_POSTS);
	loadMoreUpdates(true, 0);
	loadMoreUpdates(false, INITIAL_UPDATES);
}

// Load "limit" more posts.
function loadMorePosts(limit) {
	if (Session.equals("loadingMorePosts", true)) return;
	if (Session.equals("noMorePosts", true)) return;

	Session.set("loadingMorePosts", true);
	var cutoffTime = Date.now();
	if (posts.find({}).count() > 0) {
		posts.find({}).forEach(function (post){
			cutoffTime = Math.min(cutoffTime, post.createdAt);
		});
	}
	console.log("Loading more posts with cutoffTime=" + cutoffTime);

	Meteor.call("loadPosts", cutoffTime, limit, function(err, result) {
		Session.set("loadingMorePosts", false);
		if (err == undefined) {
			if (result.length < limit) {
				Session.set("noMorePosts", true);
			}
			var length = result.length;
			for (var i = 0; i < length; i++) {
				result[i].commentLimit = INITIAL_COMMENTS;
				posts.insert(result[i]);
			}
			var postIds = $.map(result, function(post) { return post._id; });
			loadComments(postIds);
		} else {
			console.log("loadPosts: " + err);
		}
	});
}

// Load comments for all given post ids.
function loadComments(postIds) {
	if (Session.equals("loadingComments", true)) return;
	Session.set("loadingComments", true);
	Meteor.call("loadComments", postIds, function(err, result) {
		Session.set("loadingComments", false);
		if (err == undefined) {
			var length = result.length;
			for (var i = 0; i < length; i++) {
				comments.insert(result[i]);
			}
		} else {
			console.log("loadComments: " + err);
		}
	});
}

// Load more updates.
function loadMoreUpdates(areNew, limit){
	var mutexName = "loadingMoreUpdates-" + areNew;
	if (Session.equals(mutexName, true)) return;

	Session.set(mutexName, true);
	var cutoffTime = Date.now();
	if (updates.find({new: areNew}).count() > 0) {
		updates.find({new: areNew}).forEach(function (update){
			cutoffTime = Math.min(cutoffTime, update.createdAt);
		});
	}
	console.log("Loading more updates with cutoffTime=" + cutoffTime);

	Meteor.call("loadUpdates", areNew, cutoffTime, limit, function(err, result) {
		Session.set(mutexName, false);
		if (err == undefined) {
			var length = result.length;
			for (var i = 0; i < length; i++) {
				updates.insert(result[i]);
			}
		} else {
			console.log("loadUpdates: " + err);
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
	if (user === undefined) return "";
	return user.profile.firstName + " " + user.profile.lastName;
}

function getFirstName(userId) {
	var user = Meteor.users.findOne(userId);
	return user.profile.firstName;
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

// Save the post draft text.
function savePostDraft() {
	var textarea = $("#post-popup .post-input-textarea");
	Meteor.call("setPostDraftText", textarea.val(), function(result, error) {
		if (error != undefined) {
			console.log("savePostDraft error: " + error);
		}
	});
}

// Router setup.
Router.route('/', function () {
	this.render(Session.get("currentPage"));
});

$(window).load(function() {
	window.savePostDraftHandle = undefined;
	window.popupGone = false;
	window.newPost = undefined;

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
	$(window).on("scroll", function(e) {
		var winTop = $(window).scrollTop(), docHeight = $(document).height(), winHeight = $(window).height();
		if (winTop / (docHeight - winHeight) > SCROLL_TRIGGER) {
			loadMorePosts(LOAD_MORE_POSTS);
		}
	});
	$(window).scrollTop(0);
});

init();


// WELCOME
Template.welcome.events({
	"click #login": function (event) {
		goToLoftPage(PAGES.LOGIN);
	},
	"click #join-us-button": function (event) {
		goToLoftPage(PAGES.REGISTER);
	},
});


// WAY 
Template.way.events({
	"click #way-button": function (event) {
		goToLoftPage(PAGES.HOME);
	},
})


// QUOTE
Template.quote.helpers({
	"firstName": function () {
		return getFirstName(Meteor.userId());
	},
	"quoteText": function(){
		return escapeHtml(Session.get("quoteText"));
	}
})

Template.quote.events({
	"click #quote-enter": function(event){
		Meteor.call("readQuote");
		goToLoftPage(PAGES.HOME);
	}
})


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
	"noMorePosts": function () {
		return Session.get("noMorePosts");
	},
	"selectedPost": function () {
		return Session.get("selectedPost");
	},
	"canPost": function() {
		return Session.get("postsLeft") > 0;
	},
	"postsLeft": function() {
		return Session.get("postsLeft");
	},
	"postDraftText": function() {
		return Session.get("postDraftText");
	},
});

function showPostPopup() {
	if (Session.get("showingPostPopup")) return;
	Session.set("showingPostPopup", true);

	var duration = 1000 * ANIMATION_FACTOR;
	var promptDiv = $("#post-prompt");
	var promptTextarea = promptDiv.find(".post-input-textarea");
	var div = $("#post-popup");
	var textarea = div.find(".post-input-textarea");
	var finalMaxHeight = textarea.css("max-height");

	// Animate div.
	var divFinalParams = {
		left: div.position().left,
		top: div.position().top,
		width: div.css("width"),
		height: div.css("height"),
	};
	div.css({
		left: promptDiv.position().left,
		top: promptDiv.position().top,
		width: promptDiv.css("width"),
		height: promptDiv.css("height"),
	});
	div.animate(divFinalParams, {duration: duration, queue: false});
	div.css("visibility", "visible");

	// Animate textarea.
	// Set unlimited max-height, so that we can compute what the textarea will be autoresized to.
	textarea.css("max-height", "10000px");  
	textarea.val(promptTextarea.val());
	textarea.autosize({append: ""}).trigger("autosize.resize");
	var textareaFinalParams = {
		fontSize: textarea.css("font-size"),
		height: textarea.css("height"),
		maxHeight: finalMaxHeight,
	};
	textarea.trigger("autosize.destroy");
	textarea.scrollTop(0);
	textarea.css({
		fontSize: promptTextarea.css("font-size"),
		height: promptTextarea.css("height"),
		maxHeight: promptTextarea.css("max-height"),
	});
	textarea.animate(textareaFinalParams, {duration: duration, queue: false, done: function() {
		// Reset height to smallest value, since it'll be automatically handled by autoresize.
		textarea.css("height", promptTextarea.css("height"));
		// Set max-height so that it's set in pixels. Workaround for this bug:
		// https://github.com/jackmoore/autosize/issues/191
		textarea.css("max-height", div.height() * parseFloat(finalMaxHeight) / 100.0);
		textarea.autosize({append: ""}).trigger("autosize.resize");

		var scrollDuration = 500 * ANIMATION_FACTOR;
		if (textarea[0].scrollHeight <= textarea[0].clientHeight) scrollDuration = 0;
		// Set cursor here to prevent quick jump to the top after animation if the cursor was at the top.
		textarea.setCursorPosition(textarea.val().length);
		textarea.animate({scrollTop: textarea[0].scrollHeight - textarea[0].clientHeight}, {duration: scrollDuration, queue: false, done: function() {
			textarea.focus();
			textarea.setCursorPosition(textarea.val().length);
		}});
		window.savePostDraftHandle = Meteor.setInterval(savePostDraft, SAVE_POST_DRAFT_PERIOD);
	}});

	// Animate other stuff.
	$("#darken").fadeTo(duration, 1);
	div.find(".post-popup-footer").fadeTo(duration, 1);
	promptDiv.css("visibility", "hidden");
}

function hidePostPopup() {
	if (!Session.get("showingPostPopup")) return;

	var duration = 1000 * ANIMATION_FACTOR;
	var promptDiv = $("#post-prompt");
	var promptTextarea = promptDiv.find(".post-input-textarea");
	var div = $("#post-popup");
	var textarea = div.find(".post-input-textarea");
	var textareaHeight = textarea.css("height");

	// Animate textarea.
	var scrollDuration = 500 * ANIMATION_FACTOR;
	if (textarea.scrollTop() === 0) scrollDuration = 0;
	textarea.blur();
	textarea.trigger("autosize.destroy");
	textarea.css("max-height", textareaHeight);
	textarea.css("height", textareaHeight);
	textarea.animate({scrollTop: 0}, {duration: scrollDuration, queue: false, done: function() {
		// Animate div.
		div.animate({
			left: promptDiv.position().left,
			top: promptDiv.position().top,
			width: promptDiv.width(),
			height: promptDiv.height(),
		}, {duration: duration, queue: false});

		textarea.animate({
			fontSize: promptTextarea.css("font-size"),
			height: promptTextarea.css("height"),
		}, {duration: duration, queue: false, done: function() {
			savePostDraft();
			div.removeAttr("style");
			textarea.removeAttr("style");
			promptDiv.css("visibility", "visible");
			promptTextarea.val(textarea.val());
			Session.set("showingPostPopup", false);
			Meteor.clearInterval(window.savePostDraftHandle);
			flashNewPost(true);
		}});

		// Animate other stuff.
		$("#darken").fadeTo(duration, 0, function() {
			$("#darken").hide();
		});
		div.find(".post-popup-footer").fadeTo(duration, 0);
	}});
};

// Flash the background color of the new post. But we only want to do it once:
// 1) The new post popup is gone, and
// 2) We have the new post object.
function flashNewPost(popupGone, newPost) {
	window.popupGone |= popupGone;
	if (newPost !== undefined) {
		window.newPost = newPost;
	}
	if (window.newPost === undefined || !window.popupGone) return false;

	posts.insert(window.newPost);
	Tracker.flush();

	var postDiv = $("#" + window.newPost._id).hide();
	window.setTimeout(function() {
		postDiv.show(1500 * ANIMATION_FACTOR);
	}, 300);
	window.newPost = undefined;
	window.popupGone = false;
}

Template.home.events({
	"click #loft-logout": function (event) {
		Meteor.logout();
		goToLoftPage(PAGES.WELCOME);
	},
	"click #update-button": function (event) {
		var $updates = $(".b-updates");
		var $spacers = $(".b-posts-spacer");
		var $posts = $(".b-posts");
		var updatesWidth = $(window).width() - $posts.width();
		if (!Session.get("showUpdates")) {
			Session.set("showUpdates", true);
			Tracker.flush();
			$updates.animate({"left": "0%"}, {queue: false});
			$updates.animate({"margin-right": "0%"}, {queue: false});
			$spacers.animate({width: "0%"}, {queue: false});

			if (findUpdates(true).count() === 1 ) {
				$(".new-updates").css("font-size","2em");
			} else if (findUpdates(true).count() === 2) {
				$(".new-updates").css("font-size","1.15em");
			} else if (findUpdates(true).count() === 3) {
				$(".new-updates").css("font-size","1.2em");
			} else if (findUpdates(true).count() > 3) {
				$(".new-updates").css("font-size",".95em");
			}

			Meteor.call("countAllUpdates", false, function(err, result) {
				if (err == undefined) {
					Session.set("oldUpdatesCount", result);
				} else {
					console.log("countAllUpdates error: " + err);
				}
			});
		} else {
			if (Session.get("selectedPost") !== undefined) {
				$posts.animate({"opacity": "0"}, {queue: false, done: function() {
					Session.set("selectedPost", undefined);
					Session.set("selectedUpdate", undefined);
					$posts.animate({"opacity": "1"}, {queue: false});
				}});
			}
			$updates.animate({"left": "-=" + updatesWidth}, {queue: false, done: function() {
				Session.set("showUpdates", false);
				// BAD?
				updates.update({forUserId: Meteor.userId()}, {$set: {new: false}}, {multi: true});
				Meteor.call("markAllUpdatesOld", function (result, err) {
					if (err != undefined) {
						console.log("markAllUpdatesOld error: " + err);
					}
				});
			}});
			$updates.animate({"margin-right": "-=" + updatesWidth}, {queue: false});
			$spacers.animate({width: Math.floor(updatesWidth / 2.0)}, {queue: false});
		}
	},
	"focus #post-prompt .post-input-textarea": function (event) {
		showPostPopup();
	},
	"click #darken": function (event) {
		hidePostPopup();
	},
	"click #submit-post": function (event) {
		var textarea = $("#post-popup .post-input-textarea");
		var text = textarea.val();
		Meteor.call("addPost", textarea.val(), function(err, result) {
			if (err == undefined) {
				Session.set("postsLeft", Session.get("postsLeft") - 1);
				flashNewPost(false, result);
			} else {
				console.log("addPost error: " + err);
			}
		});

		textarea.val("");
		hidePostPopup();
		return false;
	},
});


// UPDATES
Template.updates.helpers({
	"newUpdates": function () {
		return findUpdates(true);
	},
	"oldUpdates": function () {
		return findUpdates(false);
	},
	"showOldUpdates": function () {
		return findUpdates(false).count() > 0;
	},
	"showLoadMoreNewUpdates": function() {
		return false;
	},
	"showLoadMoreOldUpdates": function() {
		return findUpdates(false).count() < Session.get("oldUpdatesCount");
	},
});

Template.updates.events({
	"click #load-old-updates": function(event) {
		loadMoreUpdates(false, LOAD_MORE_UPDATES);
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
	"mixin": function() {
		if (this._id == Session.get("selectedUpdate")) {
			return "selected-update";
		} else if (this.read) {
			return "read-update";
		}
		return "default-update";
	},
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
			// BAD?
			updates.update(this._id, {$set: {read: true}});
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
		$(".b-posts").animate({"opacity": "0"}, {queue: false, done: function() {
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
	"showLoadMoreComments": function() {
		var commentCount = comments.find({postId: this._id}).count();
		return this.commentLimit < commentCount;
	},
	"comments": function() {
		return comments.find({postId: this._id}, {limit: this.commentLimit, sort: {createdAt: -1}}).fetch().reverse();
	},
	"imageSource": function () {
		if (this.lovedBy.indexOf(Meteor.userId()) < 0 && Session.get("canLove") === true) {
			return "images/heart-2x-cleared.png";
		} 
		if (this.lovedBy.indexOf(Meteor.userId()) > 0)	{
			return "images/heart-2x.png";
		}
		if (this.lovedBy.indexOf(Meteor.userId()) < 0 && Session.get("canLove") === false) { 
			return "images/heart-2x-grey-2.png";
		}
	}
});

Template.post.events({
	"click .love-button": function () {
		var postId = this._id;
		Meteor.call("lovePost", this._id, function (err, result) {
			if (err == undefined) {
				Session.set("canLove", false);
				// BAD?
				posts.update({"_id": postId}, {$addToSet: {lovedBy: Meteor.userId()}});
			} else {
				console.log("lovePost error: " + err);
			}
		});
	},
	"click .load-more-comments": function(event){
		// TODO: fix this hack
		posts.update(this._id, {$set: {commentLimit: 10000}});
	},
	"click .comment-link": function (event) {
		var $target = $(event.currentTarget).prev(".comment-input-textarea");
		var postId = this._id;
		var limit = this.commentLimit;
		Meteor.call("addComment", this._id, $target.val(), function(err, result) {
			if (err == undefined) {
				// BAD?
				comments.insert(result);
				posts.update(postId, {$inc: {commentLimit: 1}});
			} else {
				console.log("addComment error: " + err);
			}
		});

		$target.val("");
		$target.blur();
	},
	"focus .comment-input-textarea": function (event) {
		var $target = $(event.currentTarget);
		if ($target.val().length <= 0) {
			$target.autosize({append: ""}).trigger("autosize.resize");
			$target.next(".comment-link").fadeIn();
		}
	},
	"blur .comment-input-textarea": function (event) {
		var $target = $(event.currentTarget);
		if ($target.val().length <= 0) {
			$target.trigger("autosize.destroy");
			$target.next(".comment-link").fadeOut();
		}
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
	"firstName": function() {
	},
	"lastName": function() {
	},
});

Template.login.events({
	"submit #login-form": function(event, target){
		// retrieve the input field values
		var email = target.find("#login-email").value;
		var password = target.find("#login-password").value;

		// TODO: Trim and validate your fields here.... 
		
		Meteor.loginWithPassword(email, password, function(err){
			if (err == undefined) {
				init();
				goToLoftPage(PAGES.QUOTE);
			} else {
				Session.set("loginError", String(err));
			}
		});
		return false; 
	},
});

// REGISTER
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
	},
	"submit #invite-form": function(event, target) {
		var code = target.find("#invite-code").value;
		Meteor.call("checkCode", code, function(err, result) {
			if (err == undefined) {
				if (result.firstName !== undefined) {
					Session.set("prefillFirstName", result.firstName);
					Session.set("prefillLastName", result.lastName);
				}
				Session.set("showRegistration", true);
			} else {
				console.log("checkCode: " + err);
				Session.set("codeError", String(err));
			}
		});
		return false;
	},
	"keypress #invite-code": function(event) {
		if (event.which == 13) {
			event.preventDefault();
			$("#invite-form").submit();
		}
	}
});

Template.register.helpers({
	"codeErr": function() {
		return Session.get("codeError");
	},
	"registerError": function() {
		return Session.get("registerError");
	},
	"showRegistration": function() {
		return Session.get("showRegistration");
	},
	"showInvite": function(){
		return !Session.get("showRegistration");
	},
	"prefillFirstName" :function(){
		return Session.get("prefillFirstName");
	},
	"prefillLastName": function(){
		return Session.get("prefillLastName");
	}
})
