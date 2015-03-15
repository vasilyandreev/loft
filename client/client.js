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
// Number of messages to load when user wants to load more.
INITIAL_MESSAGES = 10;
// How often we save the post draft when the user is editing it.
SAVE_POST_DRAFT_PERIOD = 5000;  // in milliseconds
// Percent scroll necessary to load more posts.
SCROLL_TRIGGER = 0.95;
// How oftern we save the comment draft when the user is editing it.
SAVE_COMMENT_DRAFT_PERIOD = 5000;
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
	FORGOT: "forgotPassword",
	PROFILECREATION: "profileCreation",
	REQUESTINVITE: "requestInvite",
	INVITES: "invites",
	WAIT: "wait",
	SIGNUPDISCOVER: "signUpDiscover"
};

// Collections.
var posts = new Mongo.Collection(null);
var comments = new Mongo.Collection(null);
var updates = new Mongo.Collection(null);
var messages = new Mongo.Collection(null);
var commentDrafts = new Mongo.Collection(null);
var followers = new Mongo.Collection(null);
var usersInfo = new Mongo.Collection(null);
var invites = new Mongo.Collection(null);
// List of Id's pertaining to loft alpha users 
var loftAlphaUsers = new Mongo.Collection(null);

// Setting up search for collections 

followers.initEasySearch(['followerName'], {
    'limit' : 20,
    'use' : 'mongo-db'
});

Accounts.onResetPasswordLink(function (token, done) {
	goToLoftPage(PAGES.FORGOT);
	Session.set("resetPassword", token);
	doneCallback = done;
	preventDefault();

});

// Call init when we open the website and also when we login.
function init() {

	//LOG-IN
	Session.set("loginError", "");
	Session.set("registerError", "");
	Session.set("loftAlphaUserId", undefined)
	
	//IRON-ROUTER
	Session.set("currentPage", Meteor.userId() ? PAGES.HOME : PAGES.WELCOME);
	// Session.set("currentPage", PAGES.HOME);
	
	//QUOTE
	Session.set("quoteText", "");  // Quote text displayed on the quote page
	
	
	// SIGN-UP
	Session.set("showRegistration", false);  // True iff we are showing registration section in register.html
	Session.set("prefillFirstName", "");  // Value to put into the first name textbox when registering
	Session.set("prefillLastName", "");
	Session.set("codeError", "");  // Error during invite code submission

	// PASSWORD RESET
	Session.set("passwordReset", false);
	Session.set("linkSent", false);
	Session.set("showResetForm", true);
	Session.set("resetPassword", false);

	// POSTS
	Session.set("isEditing", undefined); // True iff the user is editing a post
	Session.set("showingInvitePopup", undefined);  // will be set to post id where pop-up is for 
	Session.set("showingInviteUsersPopup", undefined); // will be set to post id where pop-up is for 
	Session.set("noMorePosts", false);  // True iff there are no more posts to load
	Session.set("loadingMorePosts", false);  // True iff we already asked the server for more posts
	
	// UPDATES

	Session.set("showUpdates", false);  // True iff we are showing updates section
	Session.set("homeUpdates", true); // Whether or not we are looking at "standard" updates 
	Session.set("messageUpdates", false); // Whether or not we are looking at message updates 
	Session.set("followerUpdates", false); // Whether we are looking at follower related updates
	Session.set("selectedMessageId", undefined); // Id of the message we have selected
	Session.set("selectedPostId", undefined);  // Id of the post we have selected on the right
	Session.set("selectedUpdate", undefined);  // Id of the update we have selected
	Session.set("oldUpdatesCount", 0);  // Number of old updates available on the server
	Session.set("oldMessagesCount", 0);
	Session.set("selectedInviteId", undefined) // Id of the invite we have selected

	// FOLLOWER UPDATES 
	Session.set("showingDiscover", false); // Whether or not we are showing the discover section
	Session.set("showingFollowers", false) // True iff we are looking at the following section
	Session.set("currentDiscoverQuestion", "aboutMe") // Used to show what what user info is displayed
	
	// CREATING A POST
	Session.set("showingPostPopup", false);  // True iff we are showing the post popup modal

	Session.set("postDraftText", "");  // Text stored from a drafted post
	Session.set("showingPrivacy", false) // true iff we're in privacy section -- makes it reactive
	Session.set("allowInvites", false) // true iff we're in privacy section -- makes it 
	Session.set("allowPublic", false) // true iff we're in privacy section -- makes it reactive
	Session.set("allowAllFollowers", false)
	Session.set("allowFeatured", false) // true iff we're in privacy section -- makes it reactive

	//NAVIGATION
	Session.set("showingLovedPosts", false)
	Session.set("showingHomePosts", false)
	Session.set("showingGlobalPosts", false)

	// PROFILES
	Session.set("profileFirstName", undefined)
	Session.set("profileLastName", undefined)
	Session.set("profileUserId", undefined)
	Session.set("editProfileId", undefined)
	Session.set("currentQuestion", "") // Used to show what what user info is displayed



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
	Meteor.call("getTodaysQuote", function(err, result){
		if (err == undefined) {
			Session.set("quoteText", result);
		} else {
			console.log("getTodaysQuote" + err);
		}
	});

	// if (Meteor.userId() === null) return;

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

	Meteor.subscribe("userProfiles");
	loadMorePosts(INITIAL_POSTS);
	loadMoreUpdates(true, 0);
	loadMoreUpdates(false, INITIAL_UPDATES);
	loadMoreMessages(true, 0);
	loadMoreMessages(false, INITIAL_MESSAGES);
	loadLoftAlphaUsers()
	loadFollowers();
	loadUsersInfo();
	loadFollowerUpdates();
	loadInvites();

}

// Load "limit" more posts.
var postsCutoffTime = Date.now();
function loadMorePosts(limit) {
	if (Session.equals("loadingMorePosts", true)) return;
	if (Session.equals("noMorePosts", true)) return;

	Session.set("loadingMorePosts", true);
	console.log("Loading more posts with postsCutoffTime=" + postsCutoffTime);

	Meteor.call("loadPosts", postsCutoffTime, limit, function(err, result) {
		Session.set("loadingMorePosts", false);
		if (err == undefined) {
			if (result.length < limit) {
				Session.set("noMorePosts", true);
			}
			var length = result.length;
			for (var i = 0; i < length; i++) {
				result[i].commentLimit = INITIAL_COMMENTS;
				posts.upsert(result[i]._id, result[i]);
				postsCutoffTime = Math.min(postsCutoffTime, result[i].createdAt);
				result[i].messageLimit = INITIAL_MESSAGES;
				posts.upsert(result[i]._id, result[i]);
				postsCutoffTime = Math.min(postsCutoffTime, result[i].createdAt);
			}
			Tracker.flush();
			$('[placeholder]').blur();

			var postIds = $.map(result, function(post) { return post._id; });
			loadComments(postIds);
			loadMessages(postIds);
			loadDrafts(postIds);
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
				//comments is a mongo collection on the client side so mini mongo
				comments.upsert(result[i]._id, result[i]);
			}
			Tracker.flush();
			$('[placeholder]').blur();
		} else {
			console.log("loadComments: " + err);
		}
	});
}

// Load messages for all given post ids
function loadMessages(postIds) {
	if (Session.equals("loadingMessages", true)) return;
	Session.set("loadingMessages", true);
	Meteor.call("loadMessages", postIds, function(err, result) {
		Session.set("loadingMessages", false);
		if (err == undefined) {
			var length = result.length;
			for (var i = 0; i < length; i++) {
				//comments is a mongo collection on the client side so mini mongo
				messages.upsert(result[i]._id, result[i]);
			}
			Tracker.flush();
			$('[placeholder]').blur();
		} else {
			console.log("loadComments: " + err);
		}
	});
}

function loadDrafts(postIds) {
	if (Session.equals("loadingDrafts", true)) return;
	Session.set("loadingDrafts", true);
	Meteor.call("loadDrafts", postIds, function(err, result) {
		Session.set("loadingDrafts", false);
		if (err == undefined) {
			var length = result.length;
			for (var i = 0; i < length; i++) {
				//comments is a mongo collection on the client side so mini mongo
				commentDrafts.upsert(result[i]._id, result[i]);
			}
			Tracker.flush();
			$('[placeholder]').blur();
		} else {
			console.log("loadDrafts: " + err);
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

function loadMoreMessages(areNew, limit){
	var mutexName = "loadingMoreMessages-" + areNew;
	if (Session.equals(mutexName, true)) return;

	Session.set(mutexName, true);
	var cutoffTime = Date.now();
	if (updates.find({new: areNew}).count() > 0) {
		updates.find({new: areNew}).forEach(function (update){
			cutoffTime = Math.min(cutoffTime, update.createdAt);
		});
	}
	console.log("Loading more updates with cutoffTime=" + cutoffTime);

	Meteor.call("loadMessageUpdates", areNew, cutoffTime, limit, function(err, result) {
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

function loadFollowers (){
	if (Session.equals("loadingFollowers", true)) return;
	Session.set("loadingFollowers", true);
	console.log("loading followers" + Meteor.userId())
	Meteor.call("loadFollowers", function(err, result) {
		Session.set("loadingFolllowers", false);
		if (err == undefined) {
			console.log("load followers result" + result)
			var length = result.length;
			console.log("load followers length" + length)
			for (var i = 0; i < length; i++) {
				//comments is a mongo collection on the client side so mini mongo
				followers.upsert(result[i]._id, result[i]);
				// followers.insert(result[i]);
			}
			console.log("tracker flsuhing in load followers")
			console.log("followers collection")
			// console.log("followers collection" + JSON.stringify(followers.find()))
			Tracker.flush();

			
			
		} else {
			console.log("loadFollowers : " + err);
		}
	});
}

function loadLoftAlphaUsers (){
	if (Session.equals("loadingLoftAlphaUsers", true)) return;
	Session.set("loadingLoftAlphaUsers", true);
	Meteor.call("loadLoftAlphaUsers", function(err, result) {
		Session.set("loadingLoftAlphaUsers", false);
		if (err == undefined) {
			
			var length = result.length;
			
			for (var i = 0; i < length; i++) {
				//comments is a mongo collection on the client side so mini mongo
				loftAlphaUsers.upsert(result[i]._id, result[i]);
				// followers.insert(result[i]);
			}
			// console.log("followers collection" + JSON.stringify(followers.find()))
			Tracker.flush();

			
			
		} else {
			console.log("loadFollowers : " + err);
		}
	});
}

// So we can properly display if the user sent someone a follow request or not

function loadFollowerUpdates (){
	if (Session.equals("loadingFollowerUpdates", true)) return;
	Session.set("loadingFollowerUpdates", true);
	console.log("loading follower updates" + Meteor.userId())
	Meteor.call("loadFollowerUpdates", function(err, result) {
		Session.set("loadingFolllowers", false);
		if (err == undefined) {
			console.log("load follower updates result" + result)
			var length = result.length;
			console.log("load follower updates length" + length)
			for (var i = 0; i < length; i++) {
				//comments is a mongo collection on the client side so mini mongo
				updates.upsert(result[i]._id, result[i]);
				// followers.insert(result[i]);
			}
			// console.log("followers collection" + JSON.stringify(followers.find()))
			Tracker.flush();

			
			
		} else {
			console.log("loadFollowerUpdates  : " + err);
		}
	});
}

function loadInvites (){
	if (Session.equals("loadingInvites", true)) return;
	Session.set("loadingInvites", true);
	console.log("loading inivtes" + Meteor.userId())
	Meteor.call("loadInvites", function(err, result) {
		Session.set("loadingInvites", false);
		if (err == undefined) {
			var length = result.length;
			for (var i = 0; i < length; i++) {
				//comments is a mongo collection on the client side so mini mongo
				invites.upsert(result[i]._id, result[i]);
				// followers.insert(result[i]);
			}
			// console.log("followers collection" + JSON.stringify(followers.find()))
			Tracker.flush();

			
			
		} else {
			console.log("loadInvites : " + err);
		}
	});
}

function loadUsersInfo (){
	if (Session.equals("loadingUsersInfo", true)) return;
	Session.set("loadingUsersInfo", true);
	Meteor.call("loadUsersInfo", function(err, result) {
		Session.set("loadingUsersInfo", false);
		if (err == undefined) {
			var length = result.length;
			for (var i = 0; i < length; i++) {
				//comments is a mongo collection on the client side so mini mongo
				usersInfo.upsert(result[i]._id, result[i]);
				// followers.insert(result[i]);
			}
			// console.log("tracker flsuhing in load followers")
			// console.log("followers collection")
			// console.log("followers collection" + JSON.stringify(followers.find()))
			Tracker.flush();

			
			
		} else {
			console.log("loadUsersInfos : " + err);
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

function getLastName(userId) {
	var user = Meteor.users.findOne(userId);
	return user.profile.lastName;
}

// Change currentPage to the given value and perform a history.pushState to
// support browser back/forward.
function goToLoftPage(page) {
	var obj = {currentPage: page};
	history.pushState(obj, "", window.location.href);
	Session.set("currentPage", page); 
}

// Return all user's updates that are new (or not).
function findUpdates(areNew) {
	// Filter out updates that are created by this user as a workaround the
	// Meteor bug where the update flashes for a second when the user comments/loves.
	return updates.find({$and: [
		{new: areNew}, 
		{$or:[
			{type: "comment"}, 
			{type: "love"}, 
			{type: "admin"},
			{type: "invite"},
			{type: "invitedNotification"}
			]}
		]}, 
		{sort: {createdAt: -1}}
	);
}

function findUpdatesCount(areNew){
	return updates.find({$and: [
		{new: areNew}, {forUserId: Meteor.userId()}, 
		{$or:[
			{type: "comment"}, 
			{type: "love"}, 
			{type: "admin"},
			{type:"message"}, 
			{type: "followRequest"},
			{type: "invite"},
			{type: "invitedNotification"}
		]
	}
	]}, {sort: {createdAt: -1}});
}

function findMessages(areNew){
	return updates.find({$and:[{new: areNew}, {type: "message"},{forUserId: Meteor.userId()}]}, {sort: {createdAt: -1}});
	// return updates.find({$and:[{read : areNew}, {type: "message"},{forUserId: Meteor.userId()}]}, {sort: {createdAt: -1}});
	// messages.find({$and:[{postId: postId},{targetUserId: this.name}]}, {sort:{createdAt: -1}}).fetch().reverse();
}

function findFollowerUpdates (areNew){
	 // console.log("find follow requests" + updates.find({$and:[{new: areNew}, {type: "followRequest"},{accepted: accepted},{forUserId: Meteor.userId()}]}, {sort: {createdAt: -1}}))
	return updates.find({$and:[{new: areNew}, {type: "followRequest"}, {forUserId: Meteor.userId()}]}, {sort: {createdAt: -1}});
}


function findFollowRequests (accepted){
	 // console.log("find follow requests" + updates.find({$and:[{new: areNew}, {type: "followRequest"},{accepted: accepted},{forUserId: Meteor.userId()}]}, {sort: {createdAt: -1}}))
	return updates.find({$and:[{type: "followRequest"},{accepted: accepted},{forUserId: Meteor.userId()}]}, {sort: {createdAt: -1}});
}

// Returning all the followers of a user

function findFollowers (userId, invited) {

	// console.log("find followers user id " + userId)
	// console.log("find followers" + followers.findOne({ownerId: userId}))
	// console.log("finding followers " + followers.find({$and:[{ownerId: userId}, {invited: invited}]}).fetch())
	if(invited === true){
	return followers.find({$and:[{ownerId: userId}, {invited: invited}]})
	} else {
		return followers.find({$and:[{ownerId: userId}, {invited: invited}]},  {sort: { "followerName": -1}})
	}
}



function findBestFriends (userId, invited) {
	return followers.find({$and:[{ownerId: userId}, {relationshipScore: {gt: 2}}, {invited: invited}]},  {limit: 10, sort: { "relationshipScore": 1}})
}

function findNewFollowers (userId, invited) {
	return followers.find({$and:[{ownerId: userId}, {invited: invited}]},  {limit: 3, sort: { createdAt: -1}})
}


function findInvited (postId){
	var invitedArray = posts.findOne({"_id": postId}).invited
	return invitedArray
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

function saveCommentDraft(postId){
	var textarea = $("#comment-input-"+postId)
	var text = textarea.val()
	Meteor.call("setCommentDraftText", text, postId, function(err, result){
		if (err === undefined) {
			console.log("error is undefined")
		
		}
		else {
		console.log("inside else")
	}
	})

}

function switchAboutMeTab(tabName){
	var question = Session.get("currentQuestion")
	if(question == tabName){
		return 
	}
	
	var fadeIn = function(){
		Session.set("currentQuestion", tabName)
		$("#"+tabName+"-question").fadeIn(1000)
		$("#"+tabName+"-answer").fadeIn(2000)
	}
	if(question == ""){
		$("#thinking-question").fadeOut()
		$("#thinking-answer").fadeOut(400, function (){
			fadeIn()
		})
	
	} else {
		$("#"+question+"-question").fadeOut()
		$("#"+question+"-answer").fadeOut(400, function (){
			fadeIn()
		})
	}
	
}

function saveMessageDraft (postId, postOwnerId, targetUserId) {
	if(postOwnerId === Meteor.userId ()){
	var textarea = $("#message-input-"+targetUserId)
	var text = textarea.val()
	Meteor.call("setMessageDraftText", text, postId, targetUserId, function(err, result){
		if (err === undefined) {
		// 	var id = postId
		// 	commentDrafts.update({
		// 	$and: [
		// 	{userId: Meteor.userId()},
		// 	{postId: id},
		// 	{targetUserId: targetUserId},
		// 	{type: "message"}
		// 	]},
		// 	{$set: 
		// 	{
		// 		userId: Meteor.userId(),
		// 		text: text,
		// 		postId: postId,
		// 		type: "message"

		// 	}
		// },
		// 	{upsert: true})
		}
		else {
		console.log("inside else")
	}
	})



	} else {
			console.log("INSIDE OF ELSE ")
	var textarea = $("#message-input-"+postId)
	var text = textarea.val()
	Meteor.call("setMessageDraftText", text, postId, function(err, result){
		if (err === undefined) {
		// 	var id = postId
		// 	commentDrafts.update({
		// 	$and: [
		// 	{userId: Meteor.userId()},
		// 	{postId: id},
		// 	{type: "message"}
		// 	]},
		// 	{$set: 
		// 	{
		// 		userId: Meteor.userId(),
		// 		text: text,
		// 		postId: postId,
		// 		type: "message"

		// 	}
		// },
		// 	{upsert: true})
		// }
	} else {
		console.log("inside else")
	}
	})
}

}

function arrayify (obj){
	result = [];
	for (var key in obj) result.push({name:key,value:obj[key]});
	return result;
}

// Router setup.
Router.route('/', function () {
	this.render(Session.get("currentPage"));
});

// Router.route('/invite-code/', function () {
// 	Session.set("currentPage", PAGES.REGISTER)
// 	this.render(Session.get("currentPage"));
// });

Router.map(function(){
    this.route('userLoft', {
 		 path: /^\/([^_]+)_(.+)$/,
 		 notFoundTemplate: 'userNotFound',
		 data: function() {
		 	Session.set("profileFirstName", this.params[0]) 
		 	Session.set("profileLastName", this.params[1])
		 	window.scrollTo(0, 0);

  		}
	});
	

Router.map(function() { 
	this.route('editProfile', {
		path: '/profile/edit/:someValue',
		notFoundTemplate: 'userNotFound',
		date: function (){
			var permalinkVar = this.params.someValue
		}
	})

});

Router.map(function() { 
	this.route('register', {
		path: '/invite-code/',
		notFoundTemplate: 'userNotFound',
		date: function (){
			var permalinkVar = this.params.someValue
		}
	})

});

})	

// Router.route('/_firstName_lastName', function () {

//    this.render("userLoft")
// });

$(window).load(function() {
	window.savePostDraftHandle = undefined;
	window.popupGone = false;
	window.newPost = undefined;
	window.saveCommentDraftHandle = undefined;
	window.saveMessageDraftHandle = undefined; 

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
	$(window).scrollTop(0);
	$(window).on("scroll", function(e) {
		var winTop = $(window).scrollTop(), docHeight = $(document).height(), winHeight = $(window).height();
		if (winTop / (docHeight - winHeight) > SCROLL_TRIGGER) {
			loadMorePosts(LOAD_MORE_POSTS);
		}
	});
});

init();

//FORGOT


Template.forgotPassword.events({
	"submit #forgot-form": function (event, target) {
		var email = target.find("#forgot-password-email").value;
		Accounts.forgotPassword({email: email}, function(err) {
			if (err === undefined) {
				console.log(email);
			} else {
				console.log("resetting password error" + err )
			}
		})
		Session.set("linkSent", true);
		Session.set("showResetForm", false)
		return false;
	},
	"submit #login-new-password" : function(event, target) {
		var email = target.find("#new-password-email").value;
		var pw = target.find("#new-password-login").value;
		Accounts.resetPassword(Session.get('resetPassword'), pw, function(err){
			if (err === undefined){
				init();
				goToLoftPage(PAGES.HOME);
			}
			else {
				console.log("resetting password error" + err )
			}
			Session.set('loading', false);
		});
		return false; 
	}
});




Template.forgotPassword.helpers({
	resetPassword : function(t) {
		return Session.get("resetPassword");
	},
	loginNewPassword : function (){
		return Session.get("passwordReset")
	},
	forgotPassword: function (){
		return  (Sesion.get("resetPassword") === false && Session.get("passwordReset") === false)
	},
	linkSent: function (){
		return Session.get("linkSent")
	},
	showForm: function (){
		if(Session.get("resetPassword") === false && Session.get("showResetForm") === true){
			return Session.get("showResetForm")
		}else {
			return false;
		}
	}
});

// WELCOME

Template.welcome.helpers({
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

Template.welcome.events({
	"click #login": function (event) {
		// goToLoftPage(PAGES.LOGIN)
		goToLoftPage(PAGES.LOGIN );
	},
	"click #join-us-button": function (event) {
		goToLoftPage(PAGES.REQUESTINVITE);
	},
	"click .welcome-login-invite-link": function (event){
		$(".welcome-login-invite-link").fadeOut()
		$(".welcome-login-email-link").fadeOut(400, function () {
			$("#login").fadeOut()
			$(".main-body-text").fadeOut(400, function () {
				$(".enter-invite-code").fadeIn(400, function(){
					$("#invite-code").focus()
				})
				})
			})
	},
	"click .welcome-login-email-link": function (event){
		$(".welcome-login-invite-link").fadeOut()
		$(".welcome-login-email-link").fadeOut(400, function () {
			$("#login").fadeOut()
			$(".main-body-text").fadeOut(400, function () {
				$("#welcome-sign-up-email-div").fadeIn(800, function (){
					$("#welcome-enter-email").focus()   
					})
				})
			})
	
		
	},
	"keypress #welcome-enter-email": function(event) {
		if (event.which == 13) {
			var $target = $(event.currentTarget)
			var email = $target.val()
			Session.set("signUpEmail", email)
			event.preventDefault();
			// $("#invite-form").submit();
			$("#welcome-sign-up-email-div").fadeOut(400, function (){
				$("#welcome-sign-up-first-name-div").fadeIn(400, function (){
					$("#welcome-enter-first-name").focus()
				})
			})
		}
	},
	"keypress #welcome-enter-first-name": function(event) {
		if (event.which == 13) {
			var $target = $(event.currentTarget)
			var firstName = $target.val()
			Session.set("signUpFirstName", firstName)
			event.preventDefault();
			// $("#invite-form").submit();
			$("#welcome-sign-up-first-name-div").fadeOut(400, function (){
				$("#welcome-sign-up-last-name-div").fadeIn(400, function (){
					$("#welcome-enter-last-name").focus()
				})
			})
		}
	},
	"keypress #welcome-enter-last-name": function(event) {
		if (event.which == 13) {
			var $target = $(event.currentTarget)
			var lastName = $target.val()
			Session.set("signUpLastName", lastName)
			event.preventDefault();
			// $("#invite-form").submit();
			$("#welcome-sign-up-last-name-div").fadeOut(400, function (){
				$("#welcome-sign-up-why-div").fadeIn(400, function (){
					$("#welcome-enter-why").focus()
				})
			})
		}
	},
	"keypress #welcome-enter-why": function(event) {
		if (event.which == 13) {
			var $target = $(event.currentTarget)
			var why = $target.val()
			event.preventDefault();
			var email = String(Session.get("signUpEmail"))
			var firstName = Session.get("signUpFirstName")
			var lastName = Session.get("signUpLastName")
			 Meteor.call("sendSignUpEmail", email, firstName, lastName, why)
			 Meteor.call("addToWaitList", email, firstName, lastName, why, function (err, result) {

			 })
			$("#invite-form").submit();
			$("#welcome-sign-up-why-div").fadeOut(400, function (){

				$("#welcome-sign-up-thanks-div").fadeIn(400, function (){
					// $(".main-body-text").fadeIn()
					$(".facebook-share").css("margin-top", "2em")
					$(".twitter-share").css("margin-top", "2em")
				})
			})
		// var user =	Meteor.users.findOne({ emails: { $elemMatch: { address: email } } })
		// console.log("user" + user)
		// Meteor.call("findEmail", email, function (err, result){
		// 	if (err == undefined) {
		// 		Session.set("loftAlphaUserId", result)
		// 		console.log("Session get loft alpha" + Session.get("loftAlphaUserId"))
		// 		goToLoftPage(PAGES.PROFILECREATION)
		// 	}
		// }

			// )
		
		}
	},
	"focus #welcome-enter-why": function (event){
	var $target = $(event.currentTarget);
		if ($target.val().length <= 0 /*|| $target.val() == $target.attr("placeholder")*/) {
			$target.autosize({append: ""}).trigger("autosize.resize");
			// $target.next(".comment-link").fadeIn();
		} else {
			$target.autosize({append: ""}).trigger("autosize.resize");
			// $target.next(".comment-link").fadeIn();
		}
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
				
				console.log("this is actually getting called correctly")
				// will also update waitList here 
				Meteor.call("sendRegistrationCompleteEmail", email, "vasily.andreev13@gmail.com", profile.firstName)
				 goToLoftPage(PAGES.PROFILECREATION);
				// goToLoftPage(PAGES.FORGOT);
				// init();
				
			} else {
				Session.set("registerError", String(err));
			}
		});
			// goToLoftPage(PAGES.HOME)
		return false;
	},
	// REGISTER SECTION 
	"submit #invite-form": function(event, target) {
		var code = target.find("#invite-code").value;
		Meteor.call("checkCode", code, function(err, result) {
			if (err == undefined) {
				if (result.firstName !== undefined) {
					Session.set("prefillFirstName", result.firstName);
					Session.set("prefillLastName", result.lastName);
				}
				if (result.loftAlphaUser == true) {
					goToLoftPage(PAGES.SIGNUPDISCOVER);

				}
				Session.set("showRegistration", true);
				$("#account-first-name").focus()
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


// WAY 
Template.way.events({
	"click #way-button": function (event) {
		goToLoftPage(PAGES.HOME);
	},
})

Template.signUpDiscover.events({
	"click .send-request-link": function (event){
		var $target = $(event.currentTarget)
		var id = $target.attr("userId")
		var $message = $(event.currentTarget).prev(".discover-message-input-textarea");
		var messageText = $message.val()
		var name = getFullName(Meteor.userId())
		console.log ("this is the messageText" + messageText)
		Meteor.call("followUserRequest", id, messageText, function(err, result) {
			if (err == undefined) {
				// Meteor.call("sendFollowRequestEmail", id, "loft@tryloft.com", name, messageText)
					console.log("request sent" + result)
					updates.insert(result)
					$("#sign-up-send-user-follower-request-"+id).fadeOut()
					// $("#sign-up-follow-user-"+id).fadeOut(400, function (){
					// 	$("#sign-up-profile-request-sent-"+id).fadeIn(400, function (){
					// 		$("#sign-up-profile-request-sent-"+id).css("display", "inline-block")

					// 	}

					// 		)
					// })	
					
			} else {
				console.log("Error followUser: " + err);
			}
		})
	},
	"click .follow-user": function (event){
		var $target = $(event.currentTarget)
		var id = $target.attr("userId")
		if($("#sign-up-send-user-message-"+id).css("display") === "none"){
		$("#sign-up-send-user-message-"+id).toggle()
		$("#sign-up-send-request-link-"+id).toggle()
			} else {
			var $message = $(event.currentTarget).prev(".discover-message-input-textarea");
			var messageText = $message.val()
			Meteor.call("followUserRequest", id, messageText, function(err, result) {
			if (err == undefined) {
					console.log("request sent" + result)
					updates.insert(result)
				} else {
					console.log("Error followUser: " + err);
				}
			})
		$("#sign-up-send-user-message-"+id).toggle()
		$("#sign-up-send-request-link-"+id).toggle()
		}
	},
	"mouseenter .discover-follower-name": function (event){
		var $target = $(event.currentTarget)
		var id = $target.attr("id")
		$("#discover-about-user-icons-"+id).css("visibility", "visible")
		
	},
	"mouseleave .discover-follower-name": function (event){
		var $target = $(event.currentTarget)
		var id = $target.attr("id")
		$("#discover-about-user-icons-"+id).css("visibility", "hidden")
	},
	"click .discover-about-me-link": function (event, target) {
		// Checking to see if this is the first question we're looking at
		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		

		
		if($("#discover-aboutMe-answer-"+val).css("display") === "none"){
			// cosole.log("getting into if statment")
			$("#discover-working-question-"+val).toggle(false)
			$("#discover-working-answer-"+val).toggle(false)
			

			$("#discover-thinking-question-"+val).toggle(false)
			$("#discover-thinking-answer-"+val).toggle(false)
			
			$("#discover-reading-question-"+val).toggle(false)
			$("#discover-reading-answer-"+val).toggle(false)

			$("#discover-listening-question-"+val).toggle(false)
			$("#discover-listening-answer-"+val).toggle(false)
			
			$("#discover-aboutMe-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#discover-aboutMe-answer-"+val).fadeIn(2000, function (){
			// animation complete
		})
		
		}
		
	},
	"click .discover-listening-to-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		
		if ($("#discover-listening-answer-"+val).css('display') === "none"){

			
			
			$("#discover-working-question-"+val).toggle(false)
			$("#discover-working-answer-"+val).toggle(false)
			

			$("#discover-thinking-question-"+val).toggle(false)
			$("#discover-thinking-answer-"+val).toggle(false)
			
			$("#discover-reading-question-"+val).toggle(false)
			$("#discover-reading-answer-"+val).toggle(false)

			$("#discover-aboutMe-question-"+val).toggle(false)
			$("#discover-aboutMe-answer-"+val).toggle(false)
			
			$("#discover-listening-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#discover-listening-answer-"+val).fadeIn(2000, function (){
			// animation complete
		})
		
		}
		
	},
	"click .discover-reading-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		

		
		if($("#discover-reading-answer-"+val).css('display') === "none"){

			
			

			$("#discover-working-question-"+val).toggle(false)
			$("#discover-working-answer-"+val).toggle(false)
			

			$("#discover-thinking-question-"+val).toggle(false)
			$("#discover-thinking-answer-"+val).toggle(false)
			
			$("#discover-aboutMe-question-"+val).toggle(false)
			$("#discover-aboutMe-answer-"+val).toggle(false)

			$("#discover-listening-question-"+val).toggle(false)
			$("#discover-listening-answer-"+val).toggle(false)
			
			$("#discover-reading-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#discover-reading-answer-"+val).fadeIn(2000, function (){
			// animation complete
			})
		
		}
	},
	"click .discover-thinking-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		

		
		if($("#discover-thinking-answer-"+val).css('display') === "none"){

			$("#discover-working-question-"+val).toggle(false)
			$("#discover-working-answer-"+val).toggle(false)
			

			$("#discover-aboutMe-question-"+val).toggle(false)
			$("#discover-aboutMe-answer-"+val).toggle(false)
			
			$("#discover-reading-question-"+val).toggle(false)
			$("#discover-reading-answer-"+val).toggle(false)

			$("#discover-listening-question-"+val).toggle(false)
			$("#discover-listening-answer-"+val).toggle(false)
			
			$("#discover-thinking-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#discover-thinking-answer-"+val).fadeIn(2000, function (){
			// animation complete
			})
		
		}
	},
	"click .discover-working-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		
		if($("#discover-working-answer-"+val).css('display') === "none"){

			$("#discover-aboutMe-question-"+val).toggle(false)
			$("#discover-aboutMe-answer-"+val).toggle(false)
			

			$("#discover-thinking-question-"+val).toggle(false)
			$("#discover-thinking-answer-"+val).toggle(false)
			
			$("#discover-reading-question-"+val).toggle(false)
			$("#discover-reading-answer-"+val).toggle(false)

			$("#discover-listening-question-"+val).toggle(false)
			$("#discover-listening-answer-"+val).toggle(false)
			
			$("#discover-working-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#discover-working-answer-"+val).fadeIn(2000, function (){
			// animation complete
			})
		
		}
	},
	"click .sign-up-discover-next" : function (event){
		var alphaUser = loftAlphaUsers.findOne({"userId": Meteor.userId()})
		// var alphaUserId = alphaUser.userId
		if(alphaUser) {
			Meteor.call("updateLoftAlphaLogin",  function (err, result) {
				if( err == undefined){
					console.log("it worked")
					goToLoftPage(PAGES.WAY)
					return false
				}
				else {
					console.log(" didn't work.")
				}
			})
		}
		goToLoftPage(PAGES.WAY)
		return false 
	},
})

Template.signUpDiscover.helpers({
	"loftUsers": function (){
		return Meteor.users.find({"_id": {$ne: Meteor.userId()}}, {sort: {"profile.firstName": 1}}); 
		
	},
	getUserIdContext: function (){
		return usersInfo.findOne({userId: this._id})
	},
	"name": function (){
		if(Session.get("showingFollowers") === true) {
	return getFullName(this.fromUserId);
	} else {
		return getFullName(this._id)
	}
	},
	"firstName": function (){
		if(Session.get("showingFollowers") === true) {
	return getFirstName(this.fromUserId);
	} else {
		return getFirstName(this._id)
	}
	},
	"message": function (){
		// Go get the message the user sent when they followed the user.
	// var updateObject = updates.findOne({$and:[
	// 		{type: "followRequest"},
	// 		{forUserId: Meteor.userId()},
	// 		{fromUserId: this._id}
	// 		]
	// 	})
	var updateObject = updates.findOne({$and:[
		{forUserId: Meteor.userId()},
		{type: "followRequest"},
		{fromId: this.followerId}
	]})
	
	if(updateObject.message){
		return updateObject.message
	} else {
		return
	}
	
	},
	"followingSection": function (){
		 return Session.get("showingFollowers")
	},
	"discoverSection": function (){
		 return Session.get("showingDiscover")
	},
	"listName": function (){
		if(Session.get("showingInvitePopup") === undefined){
		var followerObject = followers.findOne({"_id": this._id})
		var followerId = followerObject.followerId
		return getFullName(followerId)
	} else {
		// console.log("this is follower object" + followerObject)
		// console.log("this is the ownerID"  + followerObject.followerId)
		// var followerId = followerObject.followerId
		return getFullName(""+this)
	}
	},
	"privacySection": function (){
		return Session.get("showingPrivacy")
	},
	"userId": function (){
		var followerObject = followers.findOne({"_id": this._id})
		return followerObject.followerId
	},
	"inviteList": function (){
	return Session.get("showingInvitePopup");
	},
	"getId": function (){
		return this.userId
	},
	"getUserId": function (){

		return this._id
	},
	"getAboutMe": function (){
		// console.log("get about me this" + this)
		// Session.get("profileUserId")
		// var id = String(this)
		// console.log("getting id " + id)
		// var aboutMeObject = usersInfo.findOne({userId: id})
		// console.log("this is the aboutmeobject" + aboutMeObject)
		// console.log("about me" + aboutMeObject.aboutMe)
		// return aboutMeObject.aboutMe
		if(this.aboutMe == ""){
			return (getFullName(this.userId) +" hasn't filled out their about me yet. Art takes time.")
		}
		return this.aboutMe
	},
	"ifAboutMeExists": function (){
		if(this.aboutMe == ""){
			return ("display: none")
		} else {
			return ("display: inline-block")
		}
	},
	"getListeningTo": function (){
		// console.log(usersInfo.find({}))
		// var aboutMeObject = usersInfo.findOne({userId: Session.get("profileUserId")})
		// console.log("about me" + aboutMeObject.aboutMe)
		// return aboutMeObject.listening
		return this.listening
	},
	"getReading": function (){
		return this.reading
	},
	"getWorking": function (){
		return this.working
	},
	"getThinking": function (){
		return this.thinking 
	},
	"requestSent": function(){
		var updatesObject = updates.findOne({$and:[
			{type: "followRequest"},
			{forUserId: this.userId},
			{fromUserId: Meteor.userId()},
			{accepted: false}
				]
			})
		if(updatesObject != undefined) {
			return true
		} else {
			return false 
		}
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
		return findUpdatesCount(true);
	},
	"showUpdates": function () {
		return Session.get("showUpdates");
	},
	"followersCount": function (){
		var count = findFollowers(Meteor.userId(), false).count()
		if(count > 0){
			return true 
		} else{
			return false
		}
	},
	"posts": function () {
		// Let's do OR here
		// ADD OR "postId" which corresponds to admin posts 
		 return posts.find({$or: [
		 	{invited: {$in: [Meteor.userId()]}},
		 	{userId: Meteor.userId()},
		 	{"_id": "C8ihxoTF2TKzhZoTy"},
		 	]},
		 	 {sort: {createdAt: -1}});

		// return posts.find({}, {sort: {createdAt: -1}});
	},
	"profile": function (){
		if(Session.get("profileUserId") === undefined){
			return true
		} else {
			return false
		}
		
	},
	"checkLovedPostsCount": function (){
	var count = posts.find({lovedBy: {$in: [Meteor.userId()]}}, {sort: {createdAt: -1}}).count()
	if(count > 0){
		return true
	} else {
		return false
	}
	},

	"lovedPosts": function(){
		return posts.find({lovedBy: {$in: [Meteor.userId()]}}, {sort: {createdAt: -1}});
	},
	"globalPosts": function (){
		return posts.find({$or:[{isPublic: true}, {allowFeatured: true}]})
	},
	"noMorePosts": function () {
		return Session.get("noMorePosts");
	},
	"selectedPost": function () {
		return posts.findOne({"_id": Session.get("selectedPostId")});

	//return Session.get("selectedPostId");
	},
	"userId": function (){
		return getFirstName(Meteor.userId()) + "_" + getLastName(Meteor.userId())
	},
	"inviteSenderName": function (){
		var updateId = Session.get("selectedUpdate")
		var updateObject = updates.findOne({"_id": updateId})
		return getFullName(updateObject.fromUserId)
	},
	"imageSource": function (){
		if(Session.get("showingLovedPosts") === true) {
			return "/images/heart-3x.png"
		} else {
			 return "/images/glyphicons-20-heart-empty.png"
		}
	},

	"globeImageSource": function (){

		if(Session.get("showingGlobalPosts") === true ){
			return "images/home-3x.png"
		} else {
			return "images/globe-3x.png"
		}
	},


	"filtered": function (){
		if (Session.get("showingGlobalPosts") === true || Session.get("showingLovedPosts") === true){
			return true 
		}
		else {
			return false
		}

	},

	"showingLovedPosts": function (){
		return Session.get("showingLovedPosts")

	},

	"showingGlobalPosts": function (){
		return Session.get("showingGlobalPosts")

	},
	"showUpdateButton": function (){
	if (findUpdatesCount(true).count() > 0){
		return true 
	} else {
		return false
	}
	},
	"invitedFollowers": function (){
		 return findFollowers(Meteor.userId(), true)
	},
	"bestFriends": function (){
		return findBestFriends(Meteor.userId(), false)
	},
	"newFollowers": function (){
		return findNewFollowers(Meteor.userId(), false)
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

	"getName": function (){
		return getFullName(""+this.name);
	},
	"count": function (){
		return this.value;
	},
	"selectedMessageId": function (){
		return Session.get("selectedMessageId")
	},
	"followersSelected": function (){
		return Session.get("followerUpdates")
	},
	"userFollowers": function (){
		return findFollowers(Meteor.userId(), false)
	},
	"getId": function (){
		return Meteor.userId()
	},
	"getInviteMessage": function (){
		var inviteId = Session.get("selectedUpdate");
		var inviteObject = updates.findOne({_id: inviteId});
		var message = inviteObject.invitemessage;
		return message 
	},
	"inviteMessageExists": function (){
		if(Session.get("selectedUpdate") != undefined) {
		var inviteId = Session.get("selectedUpdate");
		var inviteObject = updates.findOne({_id: inviteId});
		var message = inviteObject.invitemessage;
		if(message){
			return true
		} else {
			return false
		}
	}

	},
	"getSelectedPostId": function (){
		if (Session.get("selectedUpdate") != undefined) {
		var inviteId = Session.get("selectedUpdate");
		var inviteObject = updates.findOne({_id: inviteId});
		var postId = inviteObject.postId
		return postId
	}
	},
	"getUpdateId": function (){
		var updateId = Session.get("selectedUpdate");
		return updateId
	}

	});


Template.invites.helpers({

})

Template.invites.events({
	"click .invite-link": function (event){
		var $target = $(event.currentTarget)
		var id = $target.attr("divId")
		// var $firstName = $(event.currentTarget).prev(".profile-message-input-textarea");
		var $firstName = $("#invite-first-name-input-"+id).val()
		var $lastName = $("#invite-last-name-input-"+id).val()
		var lcCode = $firstName.charAt(0) + $lastName
		var code = lcCode.toUpperCase();
		var findCode = invites.findOne({code: code})
		var i = 0 
		if(findCode === undefined) {
			var code =  lcCode.toUpperCase();
		} else {
			while (findCode) {
			i++ 
   			var code = lcCode.toUpperCase() + i
   			var findCode = invites.findOne({code: code})
		}	
		}
		
		console.log("border" + $("#generate-invite-code-"+id).css("border"))
		if($("#generate-invite-code-"+id).css("border-style") === "none"){
			console.log(" inside generate invite code if")
			return 
		}
		else {
			console.log("inside generate invite code else")
		$("#generate-invite-code-"+id).fadeOut(400, function (){
			$("#generate-invite-code-"+id).css("border", "none")
			$("#generate-invite-code-"+id).css("padding-top", "0px")
			$("#generate-invite-code-"+id).css("font-size", "1.5em")
			
			
			$("#generate-invite-code-"+id).text(code)
		})
		$("#generate-invite-code-"+id).fadeIn()
		Meteor.call("generateInviteCode", $firstName, $lastName, code, function (err, result){
			if (err == undefined) {
				invites.insert(result);
			} else {
				console.log("generate invite code" + err)
			}
		})
 	}
		// create an attribute for the id # we can get 
		// then go and get the first name and last name 
		// then do javascript stuff to generate a string which will become code
		// change the link text from generate code to the code 
		 
	},
	"click .invite-exit-link": function (){
		console.log("clicked")
		goToLoftPage(PAGES.HOME)
	},
})

Template.userLoft.helpers({
	"initialize": function (){
		return false
	},
	"newUpdates": function () {
		return findUpdatesCount(true);
	},
	"showUpdates": function () {
		return Session.get("showUpdates");
	},
	"getId": function (){
		return Meteor.userId()
	},
	"following": function (){
		var followerObject = followers.findOne({$and: [
			{ownerId: this.userId},
			{followerId: Meteor.userId()}
			]})
		if(followerObject) {
			return false 
		} else {
			return true
		}
	},
	// "posts": function () {
	// 	console.log("getting session variable" + Session.get("profileUserId"))
	// 	var ownerId = Session.get("profileUserId")
	// 	return posts.find({userId: ownerId})
	// },

	"posts": function () {
		// Let's do OR here
		var ownerId = Session.get("profileUserId")
		// console.log("getting session variable" + Session.get("profileUserId"))
		//  return posts.find({$or: [
		//  	{invited: {$in: [Meteor.userId()]}},
		//  	{userId: Meteor.userId()},
		//  	{$and:[
		//  		{userId: ownerId},
		//  		{isPublic: true}
		//  		]}
		//  	]},
		//  	 {sort: {createdAt: -1}});
		// return posts.find({}, {sort: {createdAt: -1}});
		if(Meteor.userId()){
		return posts.find({$and: [
			{userId: ownerId},
			{$or:[
				{invited: {$in: [Meteor.userId()]}},
				{userId: Meteor.userId()},
				{isPublic: true}
				]}
			]},
			 {sort: {createdAt: -1}})
		} else {
			return posts.find({$and: [
			{userId: ownerId},
			{isPublic: true}
				]},
			 {sort: {createdAt: -1}})
		}
	},

	"lovedPosts": function(){
		return posts.find({lovedBy: {$in: [Meteor.userId()]}}, {sort: {createdAt: -1}});
	},
	"aboutMeTabIs": function (tabName){
		if((Session.get("currentQuestion") == "") && (this.aboutMe == "") && (tabName == "thinking")){
			$("#")
			return true
		}
		return (Session.get("currentQuestion") === tabName)
	},
	"globalPosts": function (){
		return posts.find({$or:[{isPublic: true}, {allowFeatured: true}]})
	},
	"noMorePosts": function () {
		return Session.get("noMorePosts");
	},
	"selectedPost": function () {
		return posts.findOne({"_id": Session.get("selectedPostId")});

	//return Session.get("selectedPostId");
	},

	"imageSource": function (){
		if(Session.get("showingLovedPosts") === true) {
			return "images/heart-3x.png"
		} else {
			 return "images/heart-3x-cleared-9.png"
		}
	},

	"globeImageSource": function (){

		if(Session.get("showingGlobalPosts") === true ){
			return "images/home-3x.png"
		} else {
			return "images/globe-3x.png"
		}
	},


	"filtered": function (){
		if (Session.get("showingGlobalPosts") === true || Session.get("showingLovedPosts") === true){
			return true 
		}
		else {
			return false
		}

	},

	"showingLovedPosts": function (){
		return Session.get("showingLovedPosts")

	},

	"showingGlobalPosts": function (){
		return Session.get("showingGlobalPosts")

	},
	"showUpdateButton": function (){
	if (findUpdatesCount(true).count() > 0){
		return true 
	} else {
		return false
	}
	},
	"invitedFollowers": function (){
		 return findFollowers(Meteor.userId(), true)
	},
	"getFirstName": function(){
		return getFirstName(""+this.userId);
	},
	"getListeningTo": function (){
		// console.log(usersInfo.find({}))
		// var aboutMeObject = usersInfo.findOne({userId: Session.get("profileUserId")})
		// console.log("about me" + aboutMeObject.aboutMe)
		// return aboutMeObject.listening
		return this.listening
	},
	"getReading": function (){
		return this.reading
	},
	"getWorking": function (){
		return this.working
	},
	"getThinking": function (){
		return this.thinking 
	},
	"getOwnerId": function(){
		return this.userId
	},
	"requestSent": function (){
		console.log("this is user id in request" + this.userId)
		// console.log("this is user id in request" +)
		// var id = ""+this.userId
		var updatesObject = updates.findOne({$and:[
			{type: "followRequest"},
			{forUserId: this.userId},
			{fromUserId: Meteor.userId()},
			{accepted: false}
				]
			})

		console.log("this is updatesObject" + updatesObject)
		if(updatesObject) {
			return true
		} else {
			return false 
		}
	},
	"count": function (){
		return this.value;
	},
	"selectedMessageId": function (){
		return Session.get("selectedMessageId")
	},
	"followersSelected": function (){
		return Session.get("followerUpdates")
	},
	"userFollowers": function (){
		return findFollowers(Meteor.userId(), false)
	},
	"getFullName": function (){
		console.log("THIS IS THIS " + this.userId)
		
		console.log("getFullName" + getFullName(''+this.userId))
		return getFullName(""+this.userId)
		
		
	},
	"getUserId": function (firstName, lastName){
		console.log("getting user id context is being called")
		console.log('getting profile user id' + Session.get("profileUserId"))
		// if(Session.get("profileUserId") === undefined){
			console.log("checcking first name" + Session.get("profileFirstName"))
			console.log("checcking first name" + Session.get("profileLastName"))
			var first = Session.get("profileFirstName")
			var last = Session.get("profileLastName")
			Meteor.call("getUserId", first, last, function(err, result) {
				if (err == undefined) {
					console.log("err is undefined here is the id " + result)
					Session.set("profileUserId", result);
					console.log("geting session user id" + Session.get("profileUserId"))
				} else {
					console.log("get userId error: " + err);
				}

			});
		
		// console.log("checking user object id " + userObject._id)
		var id = Session.get("profileUserId")
		console.log("CHECKING id " +id )
		console.log("find users " + usersInfo.find().count())
		console.log('trying to find one from users' + usersInfo.findOne({"userId": id}))
		return usersInfo.findOne({"userId": id})
		// } else {
		// console.log("profileUserId" + getFullName(Session.get("profileUserId")) )
		// return usersInfo.findOne({userId: Session.get("profileUserId")})
		// }
	},
	"owner": function (){
		if(this.userId == Meteor.userId()){
			return false
		} else {
			return true
		}
	}



})

Template.userLoft.events({

	//NAVIGATION
	"click #show-loved-posts": function (event){
		if(Meteor.userId() == undefined){
			return
		}
		if(Session.get("showingLovedPosts") === false){
		Session.set("showingLovedPosts", true)
		Session.set("showingGlobalPosts", false)
		} else {
		Session.set("showingLovedPosts", false)
		Session.set("showingGlobalPosts", false)
		}
	},
	"click .sub-menu-link-invites": function (event){
		console.log("event")
		goToLoftPage(PAGES.INVITES)
	},
	"click #show-global-posts": function (event){
		if(Meteor.userId() == undefined){
			return
		}
		if (Session.get("showingGlobalPosts") === false) {
		Session.set("showingLovedPosts", false)
		Session.set("showingGlobalPosts", true)
	} else {
		Session.set("showingGlobalPosts", false)
	}
	},
	 "click .profile-send-request-link": function (event){
	 	if(Meteor.userId() == undefined){
			return
		}
	 	var $target = $(event.currentTarget)
		var id = $target.attr("userId")
		var $message = $(event.currentTarget).prev(".profile-message-input-textarea");
		console.log("grabbing the id " + id)
		var messageText = $message.val()
		console.log ("this is the messageText" + messageText)
		Meteor.call("followUserRequest", id, messageText, function(err, result) {
			if (err == undefined) {
				console.log("this is the result" + result)
					updates.insert(result)
			} else {
				console.log("Error followUser: " + err);
			}
		})
	 },
	 "click .profile-follow-user": function (event){
	 	if(Meteor.userId() == undefined){
			return
		}
	 	var $target = $(event.currentTarget)
		var id = $target.attr("userId")
		$("#profile-send-user-message-"+id).show()
		$("#profile-send-request-link-"+id).show()
	 },

	// },
	//HEADER 
	"click #loft-logout": function (event) {
		if(Meteor.userId() == undefined){
			return
		}
		Meteor.logout();
		goToLoftPage(PAGES.WELCOME);
	},
	"click #listening-to-link": function (event) {
		switchAboutMeTab("listening")
		// Checking to see if this is the first question we're looking at
		// if(Session.get("currentQuestion") === undefined){
		// 	Session.set("currentQuestion", "listening")
		// 	$("#listening-question").fadeIn(1000, function (){
		// 	// animation complete
		// 	})
		// 	$("#listening-answer").fadeIn(2000, function (){
		// 	// animation complete
		// })
		// }

		// if(Session.get("currentQuestion") !== "listening"){

			
		// 	var question = Session.get("currentQuestion")


		// 	$("#"+question+"-question").toggle(false)
		// 	$("#"+question+"-answer").toggle(false)
		// 	$("#listening-question").fadeIn(1000, function (){
		// 	// animation complete
		// 	})
		// 	$("#listening-answer").fadeIn(2000, function (){
		// 	// animation complete
		// })
			// Session.set("currentQuestion", "listening")
		// }
		// $("#question").css('visibility','visible');
		// $("#answer").css('visibility','visible');
		
	},
	"click #reading-link": function (event) {
		switchAboutMeTab("reading")
		// Checking to see if this is the first question we're looking at
		// if(Session.get("currentQuestion") === undefined){
		// 	Session.set("currentQuestion", "reading")
		// 	$("#reading-question").fadeIn(1000, function (){
		// 	// animation complete
		// 	})
		// 	$("#reading-answer").fadeIn(2000, function (){
		// 	// animation complete
			
		// })
		// }
		// if(Session.get("currentQuestion") != "reading"){

			
		// 	var question = Session.get("currentQuestion")
			
		// 	$("#"+question+"-question").toggle(false)
		// 	$("#"+question+"-answer").toggle(false)
			
		// 	// $("#"+question+"-answer").fadeOut()

		// 	$("#reading-question").fadeIn(1000, function (){
		// 	// animation complete
		// 	})
		// 	$("#reading-answer").fadeIn(2000, function (){
		// 	// animation complete
			
		// })
			// Session.set("currentQuestion", "reading")
		// }
	},
	"click #thinking-link": function (event) {
		switchAboutMeTab("thinking")
		// Checking to see if this is the first question we're looking at
		// if(Session.get("currentQuestion") === undefined){
		// 	Session.set("currentQuestion", "thinking")
		// 	$("#thinking-question").fadeIn(1000, function (){
		// 	// animation complete
		// 	})
		// 	$("#thinking-answer").fadeIn(2000, function (){
		// 	// animation complete
		// })
		// }
		// if(Session.get("currentQuestion") != "thinking"){

			
		// 	var question = Session.get("currentQuestion")
		// 	$("#"+question+"-question").toggle(false)
		// 	$("#"+question+"-answer").toggle(false)
		// 	$("#thinking-question").fadeIn(1000, function (){
		// 	// animation complete
		// 	})
		// 	$("#thinking-answer").fadeIn(2000, function (){
		// 	// animation complete
		// })
			// Session.set("currentQuestion", "thinking")
		// }
	},
	"click #working-link": function (event) {
		switchAboutMeTab("working")
		// Checking to see if this is the first question we're looking at
		// if(Session.get("currentQuestion") === undefined){
		// 	Session.set("currentQuestion", "working")
		// 	$("#working-question").fadeIn(1000, function (){
		// 	// animation complete
		// 	})
		// 	$("#working-answer").fadeIn(2000, function (){
		// 	// animation complete
		// })
		// }
		// if(Session.get("currentQuestion") != "working"){

			
		// 	var question = Session.get("currentQuestion")
		// 	$("#"+question+"-question").toggle(false)
		// 	$("#"+question+"-answer").toggle(false)
		// 	$("#working-question").fadeIn(1000, function (){
		// 	// animation complete
		// 	})
		// 	$("#working-answer").fadeIn(2000, function (){
		// 	// animation complete
		// })
			// Session.set("currentQuestion", "working")
		// }
	},
	
	"click #loft-settings": function (event){
		if(Meteor.userId() == undefined){
			return
		}
		 // Checking if element is hidden
		if ( $(".sub-menu").css('display') === "none" ){
			console.log("if")
			$(".sub-menu").fadeIn()
   
		} else {
			$(".sub-menu").fadeOut()
		}
 
	},
	"click #sub-menu-link-edit": function (event){
		if(Meteor.userId() == undefined){
			return
		}
		console.log("event-triggered")
		Session.set("editProfileId", Meteor.userId())
		// goToLoftPage(PAGES.EDIT);
		
	},

	"click #loft-logo": function (event) {
		if(Meteor.userId() == undefined){
			return
		}
		
		console.log("recievign event")
		goToLoftPage(PAGES.HOME)
	},

	"click .invitedCount": function (event, target){
		if(Meteor.userId() == undefined){
			return
		}
		showInvitePopup(this._id)
	},
	"click #darken": function (event) {
		if(Meteor.userId() == undefined){
			return
		}
		$(".post-input-textarea").toggle(true)
		hideInvitePopup()
		hidePostPopup();
	},
	"focus .profile-message-input-textarea": function (event) {
		if(Meteor.userId() == undefined){
			return
		}
		var $target = $(event.currentTarget);
		if ($target.val().length <= 0 /*|| $target.val() == $target.attr("placeholder")*/) {
			$target.autosize({append: ""}).trigger("autosize.resize");
			// $target.next(".comment-link").fadeIn();
		} else {
			$target.autosize({append: ""}).trigger("autosize.resize");
			// $target.next(".comment-link").fadeIn();
		}
	}

	
	
	// Placeholder jQuery implementation, since we can't get it to show up in Firefox.
	// "focus .placeholder": function(event) {
	// 	var input = $(event.currentTarget);
	// 	if (input.val() == input.attr('placeholder')) {
	// 		input.val('');
	// 	}
	// 	input.removeClass('placeholder');
	// },
	// "blur .placeholder": function(event) {
	// 	var input = $(event.currentTarget);
	// 	if (input.val() == '' || input.val() == input.attr('placeholder')) {
	// 		input.addClass('placeholder');
	// 		input.val(input.attr('placeholder'));
	// 	}
	// },
});

Template.editProfile.helpers({
	"getReading": function (){
		var user = usersInfo.findOne({userId: Meteor.userId()});
		if(user){
			// console.log("is user a thing?")
			// $("#edit-user-reading-answer").val(user.reading);
			 return user.reading
			}

	},
	"getListening": function (){
		var user = usersInfo.findOne({userId: Meteor.userId()});
		if(user){
			// $("#edit-user-listening-answer").val(user.listening);
			 return user.listening
		} else {
			return ""
		}
	},
	"getThinking": function (){
		var user = usersInfo.findOne({userId: Meteor.userId()});
		if(user){
			// $("#edit-user-thinking-answer").val(user.thinking);
			 return user.thinking
		} else {
			return ""
		}
	},
	"getWorking": function (){
		var user = usersInfo.findOne({userId: Meteor.userId()});
		if(user){
			// $("#edit-user-working-answer").val(user.working);
			return user.working
		} else {
			return ""
		}
	},
	"getAboutMe": function (){
		var user = usersInfo.findOne({userId: Meteor.userId()});
		if(user){
			// $("#edit-user-about-me-answer").val(user.aboutMe);
			return user.aboutMe
		} else {
			return ""
		}
	},
	// Checking if we are NOT the owner
	"notOwner": function (){
		if(Meteor.userId() === Session.get("editProfileId")){
			return false 
		} else {
			return true
		}
	},
	"getFirstName": function (){
		var user = Meteor.users.findOne({"_id": Session.get("editProfileId")})
		return user.profile.firstName
	},
	"getLastName": function (){
		var user = Meteor.users.findOne({"_id": Session.get("editProfileId")})
		return user.profile.lastName
	},
})

Template.editProfile.events({
	"click #edit-profile-save-link": function (){
		var newReadingAnswer = $("#edit-user-reading-answer").val()
		var newListeningAnswer = $("#edit-user-listening-answer").val()
		var newThinkingAnswer = $("#edit-user-thinking-answer").val()
		var newWorkingAnswer = $("#edit-user-working-answer").val()
		var newAboutMeAnswer = $("#edit-user-about-me-answer").val()

		Meteor.call("updateProfile", Meteor.userId(), newReadingAnswer, newListeningAnswer, newThinkingAnswer, newWorkingAnswer, newAboutMeAnswer, function(err, result) {
				if (err == undefined) {
					console.log("newReadingAnswer" + newReadingAnswer)
					usersInfo.update({userId: Meteor.userId()}, {$set: 
						{
						reading: newReadingAnswer, 
						listening: newListeningAnswer, 
						thinking: newThinkingAnswer, 
						working: newWorkingAnswer, 
						aboutMe: newAboutMeAnswer
						}
					},
					{upsert: true});
					console.log("info find" + usersInfo.find().fetch())
				} else {
					console.log("countAllUpdates error: " + err);
				}
			});
	}
})


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
	// come back and fix
	$("#submit-post").toggle(false)

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
	textarea.setCursorPosition(0);
	textarea.focus();
	textarea.animate(textareaFinalParams, {duration: duration, queue: false, done: function() {
		// Reset height to smallest value, since it'll be automatically handled by autoresize.
		textarea.css("height", promptTextarea.css("height"));
		// Set max-height so that it's set in pixels. Workaround for this bug:
		// https://github.com/jackmoore/autosize/issues/191
		if (finalMaxHeight.indexOf("px") >= 0) {
			textarea.css("max-height", finalMaxHeight);
		} else if (finalMaxHeight.indexOf("%") >= 0) {
			textarea.css("max-height", div.height() * parseFloat(finalMaxHeight) / 100.0);
		}
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
	// Make sure this changes back to normal  when cicking #darken 
	$("#darken").fadeTo(duration, 0.75);
	$(".b-posts").css("position", "fixed")
	$(".b-posts").css("padding-left", "17%")
	div.find(".post-popup-footer").fadeTo(duration, 1);
	promptDiv.css("visibility", "hidden");
}

function showInvitePopup(postId) {
	if (Session.get("showingInvitePopup") === true) return;
	Session.set("showingInvitePopup", postId);

	var duration = 1000 * ANIMATION_FACTOR;
	var div = $("#invite-popup-"+postId);

	// Animate div.
	var divFinalParams = {
		left: div.position().left,
		top: div.position().top,
		width: div.css("width"),
		height: div.css("height"),
	};
	div.animate(divFinalParams, {duration: duration, queue: false});
	div.css("visibility", "visible");
	div.css("max-height", "10000px");  
	$("#darken").fadeTo(duration, 0.75, function () {
		// $(".b-posts").css("position", "fixed")
		// $(".b-posts").css("padding-left", "17%")
		//  div.css("position", "absolute")
		//  div.css("z-index", "2")
		//  div.css("opacity", ".99")

	});
	
	
}
	
function hideInvitePopup() {
	if (!Session.get("showingInvitePopup")) return;

	var duration = 1000 * ANIMATION_FACTOR;
	var postId = Session.get("showingInvitePopup")
	var div = $("#invite-popup-"+postId);

	// Animate textarea.
	// var scrollDuration = 500 * ANIMATION_FACTOR;
		// Animate div.
		
			div.removeAttr("style");
		 	Session.set("showingInvitePopup", undefined);
		


		// div.animate({}, 
		// 	{duration: duration, queue: false, done: function() {
		// 	// if (textarea.val() == textarea.attr('placeholder')) {
		// 	// 	textarea.val("");
		// 
		// }});

		// Animate other stuff.
		$("#darken").fadeTo(duration, 0, function() {
			$(".b-posts").css("position", "initial")
			$(".b-posts").css("padding-left", "0")
			$("#darken").hide();
		});
		
		// div.find(".post-popup-footer").fadeTo(duration, 0);
	
}

function showInviteUsersPopup(postId) {
	if (Session.get("showingInviteUsersPopup") === true) return;
	Session.set("showingInviteUsersPopup", postId);

	var duration = 1000 * ANIMATION_FACTOR;
	var div = $("#invite-users-popup-"+postId);

	// Animate div.
	var divFinalParams = {
		left: div.position().left,
		top: div.position().top,
		width: div.css("width"),
		height: div.css("height"),
	};
	div.animate(divFinalParams, {duration: duration, queue: false});
	div.css("visibility", "visible");
	div.css("max-height", "10000px");  
	// $(".b-posts").css("position", "fixed")
	// $(".b-posts").css("padding-left", "17%")
	
	$("#darken").fadeTo(duration, 0.75);
}
	
function hideInviteUsersPopup(postId) {
	if (!Session.get("showingInviteUsersPopup")) return;

	var duration = 1000 * ANIMATION_FACTOR;
	var postId = Session.get("showingInviteUsersPopup")
	var div = $("#invite-users-popup-"+postId);

	// Animate textarea.
	// var scrollDuration = 500 * ANIMATION_FACTOR;
		// Animate div.
		
			div.removeAttr("style");
		 	Session.set("showingInviteUsersPopup", undefined);
		


		// div.animate({}, 
		// 	{duration: duration, queue: false, done: function() {
		// 	// if (textarea.val() == textarea.attr('placeholder')) {
		// 	// 	textarea.val("");
		// 
		// }});

		// Animate other stuff.
		$("#darken").fadeTo(duration, 0, function() {
			$(".b-posts").css("position", "initial")
			$(".b-posts").css("padding-left", "0")
			$("#darken").hide();
		});
		// div.find(".post-popup-footer").fadeTo(duration, 0);
	
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
			// if (textarea.val() == textarea.attr('placeholder')) {
			// 	textarea.val("");
			// }
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
			$(".b-posts").css("position", "initial")
			$(".b-posts").css("padding-left", "0")
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
		postDiv.fadeIn({queue: false, duration: 1500 * ANIMATION_FACTOR});
	}, 300 * ANIMATION_FACTOR);
	window.newPost = undefined;
	window.popupGone = false;
}

Template.home.events({

	//NAVIGATION
	"click #show-loved-posts": function (event){
		if(Session.get("showingLovedPosts") === false){
		Session.set("showingLovedPosts", true)
		Session.set("showingGlobalPosts", false)
		} else {
		Session.set("showingLovedPosts", false)
		Session.set("showingGlobalPosts", false)
		}
	},
	"click #show-global-posts": function (event){
		if (Session.get("showingGlobalPosts") === false) {
		Session.set("showingLovedPosts", false)
		Session.set("showingGlobalPosts", true)
		// loadMorePosts(INITIAL_POSTS);
	} else {
		Session.set("showingGlobalPosts", false)
	}
	},
	"click #loft-logout": function (event) {
		Meteor.logout();
		goToLoftPage(PAGES.WELCOME);
	},
	"click #loft-settings": function (event){
		 // Checking if element is hidden
		if ( $(".sub-menu").css('display') === "none" ){
			console.log("if")
			$(".sub-menu").fadeIn()
   
		} else {
			$(".sub-menu").fadeOut()
		}
 
	},
	"click #sub-menu-link-settings": function (event){
		Session.set("editProfileId", Meteor.userId())
	},
	"click #sub-menu-link-profile": function (event){
		Session.set("profileUserId", Meteor.userId())
	},
	"click #sub-menu-link-invites": function (event){
		goToLoftPage(PAGES.INVITES)
	},
	"click #loft-logo": function (event) {
		var $updates = $(".b-updates");
		var $spacers = $(".b-posts-spacer");
		var $posts = $(".b-posts");
		var $vLine = $("#vertical-line");
		var updatesWidth = $updates.width();
		console.log("updatesWidth	" + updatesWidth)
		if (!Session.get("showUpdates")) {
			Session.set("showUpdates", true);
			Tracker.flush();
			$updates.animate({"left": "0%"}, {queue: false});
			$updates.animate({"margin-right": "0%"}, {queue: false});
			$spacers.animate({width: "0%"}, {queue: false});
			$vLine.fadeIn({queue: false});
			$vLine.animate({"left": updatesWidth}, {queue: false});

			if (findUpdates(true).count() === 1 ) {
				$(".new-updates").css("font-size",".95em");
			} else if (findUpdates(true).count() === 2) {
				$(".new-updates").css("font-size",".95em");
			} else if (findUpdates(true).count() === 3) {
				$(".new-updates").css("font-size",".95em");
			} else if (findUpdates(true).count() > 3) {
				$(".new-updates").css("font-size",".95em");
			} else if (findMessages(true).count() !== 0) {
				$(".new-updates").css("font-size",".95em");
			} else if (1 === 1){
				$(".new-updates").css("font-size",".95em");
			}
			// add messages 
			Meteor.call("countAllUpdates", false, function(err, result) {
				if (err == undefined) {
					Session.set("oldUpdatesCount", result);
				} else {
					console.log("countAllUpdates error: " + err);
				}
			});
			Meteor.call("countAllMessages", false, function(err, result) {
				if (err == undefined) {
					Session.set("oldMessagesCount", result);
				} else {
					console.log("countAllUpdates error: " + err);
				}
			});
		}	else {
			if(Session.get("followerUpdates") == true){
			Session.set("followerUpdates", false)
			Session.set("homeUpdates", true)
			Session.set("messageUpdates", false)
		}
			if (Session.get("selectedPostId") !== undefined) {
				$posts.animate({"opacity": "0"}, {queue: false, done: function() {
					Session.set("selectedPostId", undefined);
					Session.set("selectedUpdate", undefined);
					$posts.animate({"opacity": "1"}, {queue: false});
					Tracker.flush();
					$('[placeholder]').blur();
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
			$spacers.animate({width: "17%"}, {queue: false});
			$vLine.fadeOut({queue: false});
			$vLine.animate({"left": "-=" + updatesWidth}, {queue: false});
			$(".b-posts-invite-message").hide()
		}
		$("#show-loved-posts").show()
		$("#show-global-posts").show()
		
	},
	"click .message-go-to-link": function (event){
		console.log("selected post id" + Session.get("selectedPostId"))
		var postId = Session.get("selectedPostId")
		var updateId = Session.get("selectedUpdate")
		$("#"+postId).show()

		// var updateId = Session.get("selectedPostId")
	},
	"focus #post-prompt .post-input-textarea": function (event) {
		$(".post-privacy").toggle(false)
		Session.set("showingPrivacy", false)
		showPostPopup();
	},
	"click .invitedCount": function (event, target){
		showInvitePopup(this._id)
	},
	"click #darken": function (event) {
		$(".post-public-question").toggle(false)
		$(".post-input-textarea").toggle(true)
		$("#submit-prev").toggle(false)
		if($("#submit-next").css("display") == "none"){
		$("#submit-next").toggle(true)
	}
		$("#submit-next-2").toggle(false)
		hideInvitePopup()
		hidePostPopup();
		hideInviteUsersPopup();

	},
	"scroll #post-popup .post-input-textarea": function (event) {
		var originalOffset = Math.floor(parseFloat($("#post-prompt .post-input-textarea").css("background-position").split(" ")[1]));
		$(event.currentTarget).css("background-position", "100% " + (originalOffset - $(event.currentTarget).scrollTop()) + "px");
	},
	"click #submit-post": function (event) {
		var textarea = $("#post-popup .post-input-textarea");
		var text = textarea.val();
		
		// Checking selected properties of the post
		var canInvite = Session.get("allowInvites")
		var isPublic = Session.get("allowPublic")
		var allowFeatured = Session.get("allowFeatured")
		var allowAllFollowers = Session.get("allowAllFollowers")
		if(allowAllFollowers === false) {
			console.log("invited users if")
			var invitedUsers = followers.find({$and:[{ownerId: Meteor.userId()}, {invited: true}]}).fetch()
		}
		else {
			console.log("invited users else")
			var invitedUsers = followers.find({ownerId: Meteor.userId()}).fetch()
			console.log(invitedUsers)
		}

		Meteor.call("addPost", textarea.val(), invitedUsers, canInvite, isPublic, allowFeatured, allowAllFollowers, function(err, result) {
			if (err == undefined) {
				Session.set("postsLeft", Session.get("postsLeft") - 1);
				flashNewPost(false, result);
			} else {
				console.log("addPost error: " + err);
			}
		});

		$(".post-privacy").fadeOut()
		$(".post-public-question").fadeOut()
		// textarea.fadeIn().val(text)
		textarea.val("");
		hidePostPopup();
		
		return false;
	},
	"click #public-yes": function (event) {
		$("#public-yes").css("opacity", "1")
		if($("#public-no").css("opacity") === "1"){
			$("#public-no").css("opacity", ".25")
		}
		// $(".invite-question").toggle(true)
		// $(".invite-yes-and-no").toggle(true)
		$(".invite-question").fadeOut()
		$(".invite-yes-and-no").fadeOut()
		
		$("#submit-next-2").fadeOut(400, function (){
			$("#submit-post").fadeIn();
		})
		
		Session.set("allowPublic", true);
	},
	"click #public-no": function (event) {
		$("#public-no").css("opacity", "1")
		if($("#public-yes").css("opacity") === "1"){
			$("#public-yes").css("opacity", ".25")
		}
		$(".post-public-question").css("margin-top", "0")
		// $(".post-public-question").fadeOut(400,function(){
			
		// 	$(".post-public-question").fadeIn()
		// })
		
		$(".invite-question").fadeIn()
		$(".invite-yes-and-no").fadeIn()
		$("#submit-post").fadeOut(400, function (){
			$("#submit-next-2").fadeIn()
		});
		
		Session.set("allowPublic", false);
	},
	"click #invite-yes": function (event) {
		$("#invite-yes").css("opacity", "1")
		if($("#invite-no").css("opacity") === "1"){
			$("#invite-no").css("opacity", ".25")
		}
		Session.set("allowInvites", true);
	},
	"click #invite-no": function (event) {
		$("#invite-no").css("opacity", "1")
		if($("#invite-yes").css("opacity") === "1"){
			$("#invite-yes").css("opacity", ".25")
		}
		Session.set("allowInvites", false);
	},
	"click #all-followers-yes": function (event) {
		console.log("#all-followers-yes triggered")
		$("#all-followers-yes").css("opacity", "1")
		if($("#all-followers-no").css("opacity") === "1"){
			$("#all-followers-no").css("opacity", ".25")
		}
		$("#submit-next-2").fadeOut(400, function (){
			$("#submit-post").fadeIn();
		})

		Session.set("allowAllFollowers", true);
	},
	"click #all-followers-no": function (event) {
		console.log("#all-followers-no triggered")
		$("#all-followers-no").css("opacity", "1")
		if($("#all-followers-yes").css("opacity") === "1"){
			$("#all-followers-yes").css("opacity", ".25")
		}

		$("#submit-post").fadeOut(400, function (){
			$("#submit-next-2").fadeIn()
		});

		Session.set("allowAllFollowers", false);
	},
	"click #submit-next": function (event, target){
		console.log("clicked submit-next")
		$('.post-input-textarea').toggle(false);
		// $('.post-privacy').toggle(true);
		$('.post-public-question').toggle(true);
		$("#submit-next").toggle(false);
		$("#submit-prev").toggle(true);
		// $("#submit-next-2").toggle(true);
		$("#post-popup").css("height", "80%")
		$(".posts-left").toggle(false)
		if($("#public-yes").css("opacity") === "1"){
			$("#submit-post").toggle(true)
		}
		if($("#public-no").css("opacity") === "1"){
			$("#submit-next-2").toggle(true)
		}

		// Session.set("showingPrivacy", true);

	},
	"click #submit-prev": function (event, target){
		console.log("clicked submit-prev")
		$('.post-public-question').toggle(false);
		$('.post-input-textarea').toggle(true);
		$('.post-privacy').toggle(false);
		$("#submit-next").toggle(true);
		$("#submit-prev").toggle(false);
		$("#submit-next-2").toggle(false);
		$(".posts-left").toggle(true)
		$("#submit-post").toggle(false);
		$("#post-popup").css("height", "45%")
		Session.set("showingPrivacy", false);

	},
	"click #submit-next-2": function (event, target){
		console.log("clicked next-2")
		$('.post-public-question').toggle(false);
		$('.post-privacy').toggle(true);
		$("#submit-prev").toggle(false);
		$("#submit-post").toggle(true);
		$("#submit-next-2").toggle(false);
		$("#submit-prev-2").toggle(true);
		Session.set("showingPrivacy", true);


	},
	"click #submit-prev-2": function (event, target){
		$('.post-privacy').toggle(false);
		$('.post-public-question').toggle(true);			
		$("#submit-post").toggle(false);
		if($("#public-yes").css("opacity") === "1"){
			$("#submit-post").toggle(true)
		}
		if($("#public-no").css("opacity") === "1"){
			$("#submit-next-2").toggle(true)
		}
	
		// $("#submit-prev").toggle(true);
		
		// $("#submit-next-2").toggle(true);
		// $("#submit-prev-2").toggle(false);
		// $(".post-privacy-settings").toggle(false);
		
		
		Session.set("showingPrivacy", false);
	},
	// Toggling allow public on and off
	"click #allow-public-yes": function(){
		Session.set("allowPublic", true);
	},
	"click #allow-public-no": function(){
		Session.set("allowPublic", false);
	},
	// Toggling allow invites on and off
	"click #allow-invites-yes": function(){
		Session.set("allowInvites", true);
	},
	"click #allow-invites-no": function(){
		Session.set("allowInvites", false);
	},
	// Toggling allow featured on and off
	"click #allow-featured-yes": function(){
		Session.set("allowFeatured", true);
	},
	"click #allow-featured-no": function(){
		Session.set("allowFeatured", false);
	},
	// "click #sub-menu-link-profile" : function (){
	// 	if ( $(".sub-menu").css('display') === "none" ){
	// 		console.log("if")
	// 		$(".sub-menu").fadeIn()
   
	// 	} else {
	// 		$(".sub-menu").fadeOut()
	// 	}
	// }
	
	// Placeholder jQuery implementation, since we can't get it to show up in Firefox.
	// "focus .placeholder": function(event) {
	// 	var input = $(event.currentTarget);
	// 	if (input.val() == input.attr('placeholder')) {
	// 		input.val('');
	// 	}
	// 	input.removeClass('placeholder');
	// },
	// "blur .placeholder": function(event) {
	// 	var input = $(event.currentTarget);
	// 	if (input.val() == '' || input.val() == input.attr('placeholder')) {
	// 		input.addClass('placeholder');
	// 		input.val(input.attr('placeholder'));
	// 	}
	// },
});

// FOLLOWERS

Template.followerRequest.helpers({
	"name": function (){
		console.log("this is gettign name" + this._id)
		console.log("this is gettign name from id" + this.fromUserId)
		return getFullName(this.fromUserId)
	},
	"message": function (){
		console.log("this is inside follower requests message" + this._id)
		console.log("this is message" + this.message)
		return this.message
	},
	"getUserIdContext": function (){
		// console.log("this is inside follower requests message" + this._id)
		console.log("this is user context" + usersInfo.findOne({userId: this.fromUserId}))
		return usersInfo.findOne({userId: this.fromUserId})
	},
	"getFirstName": function (){
		return getFirstName(this.fromUserId)
	},
	"getLastName": function (){
		return getLastName(this.fromUserId)
	},
	"getId": function (){
		return this.userId
	},
	"getAboutMe": function (){
		// console.log("get about me this" + this)
		// Session.get("profileUserId")
		// var id = String(this)
		// console.log("getting id " + id)
		// var aboutMeObject = usersInfo.findOne({userId: id})
		// console.log("this is the aboutmeobject" + aboutMeObject)
		// console.log("about me" + aboutMeObject.aboutMe)
		// return aboutMeObject.aboutMe
		console.log("this is the about me in follower" + this.aboutMe)
		if(this.aboutMe == ""){
			return (getFullName(this.userId) +" hasn't filled out their about me yet. Art takes time.")
		}
		return this.aboutMe
	},
	"getListeningTo": function (){
		// console.log(usersInfo.find({}))
		// var aboutMeObject = usersInfo.findOne({userId: Session.get("profileUserId")})
		// console.log("about me" + aboutMeObject.aboutMe)
		// return aboutMeObject.listening
		return this.listening
	},
	"getReading": function (){
		return this.reading
	},
	"getWorking": function (){
		return this.working
	},
	"getThinking": function (){
		return this.thinking 
	},
})

Template.followerRequest.events ({
	
	"click .request-about-me-link": function (event, target) {
		// Checking to see if this is the first question we're looking at
		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		console.log($("#discover-aboutMe-answer"+val))
		console.log($("#discover-aboutMe-answer"+val).css("display"))
		

		
		if($("#request-aboutMe-answer-"+val).css("display") === "none"){
			// cosole.log("getting into if statment")
			$("#request-working-question-"+val).toggle(false)
			$("#request-working-answer-"+val).toggle(false)
			

			$("#request-thinking-question-"+val).toggle(false)
			$("#request-thinking-answer-"+val).toggle(false)
			
			$("#request-reading-question-"+val).toggle(false)
			$("#request-reading-answer-"+val).toggle(false)

			$("#request-listening-question-"+val).toggle(false)
			$("#request-listening-answer-"+val).toggle(false)
			
			$("#request-aboutMe-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#request-aboutMe-answer-"+val).fadeIn(2000, function (){
			// animation complete
		})
		
		}
		
	},
	"click .request-listening-to-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		
		if ($("#request-listening-answer-"+val).css('display') === "none"){

			
			
			$("#request-working-question-"+val).toggle(false)
			$("#request-working-answer-"+val).toggle(false)
			

			$("#request-thinking-question-"+val).toggle(false)
			$("#request-thinking-answer-"+val).toggle(false)
			
			$("#request-reading-question-"+val).toggle(false)
			$("#request-reading-answer-"+val).toggle(false)

			$("#request-aboutMe-question-"+val).toggle(false)
			$("#request-aboutMe-answer-"+val).toggle(false)
			
			$("#request-listening-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#request-listening-answer-"+val).fadeIn(2000, function (){
			// animation complete
		})
		
		}
		
	},
	"click .request-reading-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		

		
		if($("#request-reading-answer-"+val).css('display') === "none"){

			
			

			$("#request-working-question-"+val).toggle(false)
			$("#request-working-answer-"+val).toggle(false)
			

			$("#request-thinking-question-"+val).toggle(false)
			$("#request-thinking-answer-"+val).toggle(false)
			
			$("#request-aboutMe-question-"+val).toggle(false)
			$("#request-aboutMe-answer-"+val).toggle(false)

			$("#request-listening-question-"+val).toggle(false)
			$("#request-listening-answer-"+val).toggle(false)
			
			$("#request-reading-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#request-reading-answer-"+val).fadeIn(2000, function (){
			// animation complete
			})
		
		}
	},
	"click .request-thinking-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		

		
		if($("#request-thinking-answer-"+val).css('display') === "none"){

			$("#request-working-question-"+val).toggle(false)
			$("#request-working-answer-"+val).toggle(false)
			

			$("#request-aboutMe-question-"+val).toggle(false)
			$("#request-aboutMe-answer-"+val).toggle(false)
			
			$("#request-reading-question-"+val).toggle(false)
			$("#request-reading-answer-"+val).toggle(false)

			$("#request-listening-question-"+val).toggle(false)
			$("#request-listening-answer-"+val).toggle(false)
			
			$("#request-thinking-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#request-thinking-answer-"+val).fadeIn(2000, function (){
			// animation complete
			})
		
		}
	},
	"click .request-working-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		
		if($("#request-working-answer-"+val).css('display') === "none"){

			$("#request-aboutMe-question-"+val).toggle(false)
			$("#request-aboutMe-answer-"+val).toggle(false)
			

			$("#request-thinking-question-"+val).toggle(false)
			$("#request-thinking-answer-"+val).toggle(false)
			
			$("#request-reading-question-"+val).toggle(false)
			$("#request-reading-answer-"+val).toggle(false)

			$("#request-listening-question-"+val).toggle(false)
			$("#request-listening-answer-"+val).toggle(false)
			
			$("#request-working-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#request-working-answer-"+val).fadeIn(2000, function (){
			// animation complete
			})
		
		}
	},
	"click .accept-link": function (event){
		// var $target = $(event.currentTarget)
		// var userId = $target.attr("userId")
		
		var updateId = this._id
		console.log("this is the updateId " + updateId)
		var userId = this.fromUserId
		console.log("this is the user " + userId)
		var followerName = getFullName(userId)
		console.log("this is followre name" + followerName)
		var ownerName = getFullName(Meteor.userId())
		console.log("this is owner name" + ownerName)
		Meteor.call("acceptUserRequest", userId, updateId, followerName, ownerName, function(err, result) {
			console.log('xyz')
			if (err == undefined) {
				console.log("this is user id" + userId)
					$("#accept-link"+userId).fadeOut(400, function (){
					
				})
					updates.update(updateId, {$set: {accepted: true, new: false, read: true}})
					followers.insert(result)
			} else {
				console.log("Error acceptUser: " + err);
			}
		})
	},
	"click .maybe-later-link": function (event){
		// var $target = $(event.currentTarget)
		// var userId = $target.attr("userId")
		
		var updateId = this._id
		console.log("this is the updateId " + updateId)
		var userId = this.fromUserId
		console.log("this is the user " + userId)
		var followerName = getFullName(userId)
		console.log("this is followre name" + followerName)
		var ownerName = getFullName(Meteor.userId())
		console.log("this is owner name" + ownerName)
		Meteor.call("maybeLater", userId, updateId, function(err, result) {
			console.log('xyz')
			if (err == undefined) {
					updates.update(updateId, {$set: {accepted: "later", new: false, read: true}})
			} else {
				console.log("Error acceptUser: " + err);
			}
		})
	},


})

Template.followerList.helpers({
	"name": function (){
		console.log("this is gettign name" + this._id)
		console.log("this is gettign name from id" + this.fromUserId)
		return getFullName(this.fromUserId)
	},
	"message": function (){
		console.log("this is inside follower requests message" + this._id)
		console.log("this is message" + this.message)
		return this.message
	},
	"getUserIdContext": function (){
		// console.log("this is inside follower requests message" + this._id)
		console.log("this is user context" + usersInfo.findOne({userId: this.fromUserId}))
		return usersInfo.findOne({userId: this.fromUserId})
	},
	"getFirstName": function (){
		return getFirstName(this.fromUserId)
	},
	"getLastName": function (){
		return getLastName(this.fromUserId)
	},
	"getId": function (){
		console.log("getting id in follower list")
		console.log(this)
		console.log(this.userId)
		return this.userId
	},
	"getUserId": function (){
		return this._id
	},
	"getAboutMe": function (){
		// console.log("get about me this" + this)
		// Session.get("profileUserId")
		// var id = String(this)
		// console.log("getting id " + id)
		// var aboutMeObject = usersInfo.findOne({userId: id})
		// console.log("this is the aboutmeobject" + aboutMeObject)
		// console.log("about me" + aboutMeObject.aboutMe)
		// return aboutMeObject.aboutMe
		console.log("this is the about me in follower" + this.aboutMe)
		return this.aboutMe
	},
	"getListeningTo": function (){
		// console.log(usersInfo.find({}))
		// var aboutMeObject = usersInfo.findOne({userId: Session.get("profileUserId")})
		// console.log("about me" + aboutMeObject.aboutMe)
		// return aboutMeObject.listening
		return this.listening
	},
	"getReading": function (){
		return this.reading
	},
	"getWorking": function (){
		return this.working
	},
	"getThinking": function (){
		return this.thinking 
	},
})

Template.followerList.events ({

	"mouseenter .follower-list-follower-name": function (event){
		var $target = $(event.currentTarget)
		var id = $target.attr("userId")
		console.log("this is id on mouse enter " +id )
		console.log($target)
		// $("#discover-about-user-icons-"+id).css("visibility", "hidden")
		$("#follower-about-user-icons-"+id).css("visibility", "visible")
		
	},
	"mouseleave .follower-list-follower-name": function (event){
		var $target = $(event.currentTarget)
		var id = $target.attr("userId")
		console.log($target)
		console.log("this is id on mouse leave " +id )
		// $("#discover-about-user-icons-"+id).css("visibility", "hidden")
		$("#follow-about-user-icons-"+id).css("visibility", "hidden")
	},
		

	"click .follower-list-about-me-link": function () {		
		if($("#follower-list-aboutMe-answer-"+val).css("display") === "none"){
			// cosole.log("getting into if statment")
			$("#follower-list-working-question-"+val).toggle(false)
			$("#follower-list-working-answer-"+val).toggle(false)
			

			$("#follower-list-thinking-question-"+val).toggle(false)
			$("#follower-list-thinking-answer-"+val).toggle(false)
			
			$("#follower-list-reading-question-"+val).toggle(false)
			$("#follower-list-reading-answer-"+val).toggle(false)

			$("#follower-list-listening-question-"+val).toggle(false)
			$("#follower-list-listening-answer-"+val).toggle(false)
			
			$("#follower-list-aboutMe-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#follower-list-aboutMe-answer-"+val).fadeIn(2000, function (){
			// animation complete
		})
		
		}
		
	},
	"click .follower-list-listening-to-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		
		if ($("#follower-list-listening-answer-"+val).css('display') === "none"){

			
			
			$("#follower-list-working-question-"+val).toggle(false)
			$("#follower-list-working-answer-"+val).toggle(false)
			

			$("#follower-list-thinking-question-"+val).toggle(false)
			$("#follower-list-thinking-answer-"+val).toggle(false)
			
			$("#follower-list-reading-question-"+val).toggle(false)
			$("#follower-list-reading-answer-"+val).toggle(false)

			$("#follower-list-aboutMe-question-"+val).toggle(false)
			$("#follower-list-aboutMe-answer-"+val).toggle(false)
			
			$("#follower-list-listening-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#follower-list-listening-answer-"+val).fadeIn(2000, function (){
			// animation complete
		})
		
		}
		
	},
	"click .follower-list-reading-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		

		
		if($("#follower-list-reading-answer-"+val).css('display') === "none"){

			
			

			$("#follower-list-working-question-"+val).toggle(false)
			$("#follower-list-working-answer-"+val).toggle(false)
			

			$("#follower-list-thinking-question-"+val).toggle(false)
			$("#follower-list-thinking-answer-"+val).toggle(false)
			
			$("#follower-list-aboutMe-question-"+val).toggle(false)
			$("#follower-list-aboutMe-answer-"+val).toggle(false)

			$("#follower-list-listening-question-"+val).toggle(false)
			$("#follower-list-listening-answer-"+val).toggle(false)
			
			$("#follower-list-reading-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#follower-list-reading-answer-"+val).fadeIn(2000, function (){
			// animation complete
			})
		
		}
	},
	"click .follower-list-thinking-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		

		
		if($("#follower-list-thinking-answer-"+val).css('display') === "none"){

			$("#follower-list-working-question-"+val).toggle(false)
			$("#follower-list-working-answer-"+val).toggle(false)
			

			$("#follower-list-aboutMe-question-"+val).toggle(false)
			$("#follower-list-aboutMe-answer-"+val).toggle(false)
			
			$("#follower-list-reading-question-"+val).toggle(false)
			$("#follower-list-reading-answer-"+val).toggle(false)

			$("#follower-list-listening-question-"+val).toggle(false)
			$("#follower-list-listening-answer-"+val).toggle(false)
			
			$("#follower-list-thinking-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#follower-list-thinking-answer-"+val).fadeIn(2000, function (){
			// animation complete
			})
		
		}
	},
	"click .follower-list-working-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		
		if($("#follower-list-working-answer-"+val).css('display') === "none"){

			$("#follower-list-aboutMe-question-"+val).toggle(false)
			$("#follower-list-aboutMe-answer-"+val).toggle(false)
			

			$("#follower-list-thinking-question-"+val).toggle(false)
			$("#follower-list-thinking-answer-"+val).toggle(false)
			
			$("#follower-list-reading-question-"+val).toggle(false)
			$("#follower-list-reading-answer-"+val).toggle(false)

			$("#follower-list-listening-question-"+val).toggle(false)
			$("#follower-list-listening-answer-"+val).toggle(false)
			
			$("#follower-list-working-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#follower-listworking-answer-"+val).fadeIn(2000, function (){
			// animation complete
			})
		
		}
	},


})

Template.followers.helpers({
	"findUsers": function (){
		
		return Meteor.users.find({"_id": {$ne: Meteor.userId()}}, {sort: {"profile.firstName": 1}}).fetch(); 
	},
	"discover": function (){
		return Session.get("showingDiscover")
	},
	"showingFollowers": function (){
		return Session.get("showingFollowers")
	},
	"followerRequests": function (){

		return findFollowRequests(false)
	},
	"followers": function (){
		console.log("console.logging find followers" + findFollowRequests(true, true).count())
		return findFollowRequests(true)
	},
	"requests": function (){
		if (findFollowRequests(false).count() > 0) {
			return true
		} else {
			return false
		}
	},
	"followerCount": function (){
		if (findFollowRequests(true).count() > 0) {
			return true
		} else {
			return false
		}
	},
	"oldRequests": function(){
		return findFollowRequests("later")
	},
	"oldRequestsCount": function (){
		if (findFollowRequests("later").count() > 0) {
			return true
		} else {
			return false
		}
	},
})

Template.followers.events({
	"click #discover" : function (){
		Session.set("showingDiscover", true)
		Session.set("showingFollowers", false)
	},
	"click #following": function (){
		Session.set("showingDiscover", false)
		Session.set("showingFollowers", true)
	}
})


Template.follower.helpers({
	"getUserIdContext" : function (){
		return usersInfo.findOne({userId: this._id})
	},
	"name": function (){
		if(Session.get("showingFollowers") === true) {
	return getFullName(this.fromUserId);
	} else {
		return getFullName(this._id)
	}
	},
	"firstName": function (){
		if(Session.get("showingFollowers") === true) {
	return getFirstName(this.fromUserId);
	} else {
		return getFirstName(this._id)
	}
	},
	"ifAboutMeExists": function (){
		if(this.aboutMe == ""){
			return ("display: none")
		} else {
			return ("display: inline-block")
		}
	},
	"message": function (){
		// Go get the message the user sent when they followed the user.
	// var updateObject = updates.findOne({$and:[
	// 		{type: "followRequest"},
	// 		{forUserId: Meteor.userId()},
	// 		{fromUserId: this._id}
	// 		]
	// 	})
	var updateObject = updates.findOne({$and:[
		{forUserId: Meteor.userId()},
		{type: "followRequest"},
		{fromId: this.followerId}
	]})
	
	if(updateObject.message){
		
		return updateObject.message
	} else {
		return
	}
	
	},
	"followingSection": function (){
		 return Session.get("showingFollowers")
	},
	"discoverSection": function (){
		 return Session.get("showingDiscover")
	},
	"listName": function (){
		if(Session.get("showingInvitePopup") === undefined){
		var followerObject = followers.findOne({"_id": this._id})
		var followerId = followerObject.followerId
		return getFullName(followerId)
	} else {
		// console.log("this is follower object" + followerObject)
		// console.log("this is the ownerID"  + followerObject.followerId)
		// var followerId = followerObject.followerId
		return getFullName(""+this)
	}
	},
	"privacySection": function (){
		return Session.get("showingPrivacy")
	},
	"userId": function (){
		var followerObject = followers.findOne({"_id": this._id})
		return followerObject.followerId
	},
	"inviteList": function (){
	return Session.get("showingInvitePopup");
	},
	"getId": function (){
		return this.userId
	},
	"getUserId": function (){

		return this._id
	},
	"getAboutMe": function (){
		// console.log("get about me this" + this)
		// Session.get("profileUserId")
		// var id = String(this)
		// console.log("getting id " + id)
		// var aboutMeObject = usersInfo.findOne({userId: id})
		// console.log("this is the aboutmeobject" + aboutMeObject)
		// console.log("about me" + aboutMeObject.aboutMe)
		// return aboutMeObject.aboutMe
		return this.aboutMe
	},
	"getListeningTo": function (){
		// console.log(usersInfo.find({}))
		// var aboutMeObject = usersInfo.findOne({userId: Session.get("profileUserId")})
		// console.log("about me" + aboutMeObject.aboutMe)
		// return aboutMeObject.listening
		return this.listening
	},
	"getReading": function (){
		return this.reading
	},
	"getWorking": function (){
		return this.working
	},
	"getThinking": function (){
		return this.thinking 
	},
	"requestSent": function(){
		var updatesObject = updates.findOne({$and:[
			{type: "followRequest"},
			{forUserId: this._id},
			{fromUserId: Meteor.userId()},
				]
			})

		
		if(updatesObject == undefined) {
			return true
		} else {
			return false 
		}
	},


})

Template.follower.events({
	"click .send-request-link": function (event){
		var $target = $(event.currentTarget)
		var id = $target.attr("userId")
		var $message = $(event.currentTarget).prev(".discover-message-input-textarea");
		var messageText = $message.val()
		var name = getFullName(Meteor.userId())
		console.log ("this is the messageText" + messageText)
		Meteor.call("followUserRequest", id, messageText, function(err, result) {
			if (err == undefined) {
				Meteor.call("sendFollowRequestEmail", id, "loft@tryloft.com", name, messageText)
					console.log("request sent" + result)
					
					$("#send-user-follower-request-"+id).fadeOut(400, function () {
					$("#follow-user-"+id).fadeOut(400, function (){
						$("#discover-profile-request-sent-"+id).fadeIn(400, function (){
							
								updates.insert(result) 
						}

							)
						})
					})	
					
			} else {
				console.log("Error followUser: " + err);
			}
		})
	},
	"click .follow-user": function (event){
		var $target = $(event.currentTarget)
		var id = $target.attr("userId")
		if($("#send-user-message-"+id).css("display") === "none"){
		console.log(' INSIDE OF IFfollow user id' + id)
		$("#send-user-message-"+id).toggle()
		$("#send-request-link-"+id).toggle()
			} else {
			console.log(' INSIDE OF ELSE' )
			var $message = $(event.currentTarget).prev(".discover-message-input-textarea");
			console.log("grabbing the id " + id)
			var messageText = $message.val()
			console.log ("this is the messageText" + messageText)
			Meteor.call("followUserRequest", id, messageText, function(err, result) {
			if (err == undefined) {
					console.log("request sent" + result)
					updates.insert(result)
				} else {
					console.log("Error followUser: " + err);
				}
			})
		$("#send-user-message-"+id).toggle()
		$("#send-request-link-"+id).toggle()
		}
	},
	"click .accept-link": function (event){
		// var $target = $(event.currentTarget)
		// var userId = $target.attr("userId")
		
		var updateId = this._id
		console.log("this is the updateId " + updateId)
		var userId = this.fromUserId
		console.log("this is the user " + userId)
		var followerName = getFullName(userId)
		console.log("this is followre name" + followerName)
		var ownerName = getFullName(Meteor.userId())
		console.log("this is owner name" + ownerName)
		Meteor.call("acceptUserRequest", userId, updateId, followerName, ownerName, function(err, result) {
			console.log('xyz')
			if (err == undefined) {
					updates.update(updateId, {$set: {accepted: true, new: false, read: true}})
					followers.insert(result)
			} else {
				console.log("Error acceptUser: " + err);
			}
		})
	},
	"click .standard-link": function (){
		var followerObject = followers.findOne({"_id": this._id})
		var followerId = followerObject.followerId
		if(followerObject.invited === true ){
			followers.update(this._id, {$set: {invited: false}});
			Meteor.call("updateInvited", this._id, false, function(err,result){
				if(err != undefined){
					console.log("Updating who is invited" + err)
				}
			})
		} else {
		followers.update(this._id, {$set: {invited: true}});
		Meteor.call("updateInvited", this._id, true, function(err,result){
				if(err != undefined){
					console.log("Updating who is invited" + err)
				}
			})
	}
	},
	"click .discover-about-me-link": function (event, target) {
		// Checking to see if this is the first question we're looking at
		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		console.log($("#discover-aboutMe-answer"+val))
		console.log($("#discover-aboutMe-answer"+val).css("display"))
		

		
		if($("#discover-aboutMe-answer-"+val).css("display") === "none"){
			// cosole.log("getting into if statment")
			$("#discover-working-question-"+val).toggle(false)
			$("#discover-working-answer-"+val).toggle(false)
			

			$("#discover-thinking-question-"+val).toggle(false)
			$("#discover-thinking-answer-"+val).toggle(false)
			
			$("#discover-reading-question-"+val).toggle(false)
			$("#discover-reading-answer-"+val).toggle(false)

			$("#discover-listening-question-"+val).toggle(false)
			$("#discover-listening-answer-"+val).toggle(false)
			
			$("#discover-aboutMe-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#discover-aboutMe-answer-"+val).fadeIn(2000, function (){
			// animation complete
		})
		
		}
		
	},
	"click .discover-listening-to-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		
		if ($("#discover-listening-answer-"+val).css('display') === "none"){

			
			
			$("#discover-working-question-"+val).toggle(false)
			$("#discover-working-answer-"+val).toggle(false)
			

			$("#discover-thinking-question-"+val).toggle(false)
			$("#discover-thinking-answer-"+val).toggle(false)
			
			$("#discover-reading-question-"+val).toggle(false)
			$("#discover-reading-answer-"+val).toggle(false)

			$("#discover-aboutMe-question-"+val).toggle(false)
			$("#discover-aboutMe-answer-"+val).toggle(false)
			
			$("#discover-listening-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#discover-listening-answer-"+val).fadeIn(2000, function (){
			// animation complete
		})
		
		}
		
	},
	"click .discover-reading-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		

		
		if($("#discover-reading-answer-"+val).css('display') === "none"){

			
			

			$("#discover-working-question-"+val).toggle(false)
			$("#discover-working-answer-"+val).toggle(false)
			

			$("#discover-thinking-question-"+val).toggle(false)
			$("#discover-thinking-answer-"+val).toggle(false)
			
			$("#discover-aboutMe-question-"+val).toggle(false)
			$("#discover-aboutMe-answer-"+val).toggle(false)

			$("#discover-listening-question-"+val).toggle(false)
			$("#discover-listening-answer-"+val).toggle(false)
			
			$("#discover-reading-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#discover-reading-answer-"+val).fadeIn(2000, function (){
			// animation complete
			})
		
		}
	},
	"click .discover-thinking-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		

		
		if($("#discover-thinking-answer-"+val).css('display') === "none"){

			$("#discover-working-question-"+val).toggle(false)
			$("#discover-working-answer-"+val).toggle(false)
			

			$("#discover-aboutMe-question-"+val).toggle(false)
			$("#discover-aboutMe-answer-"+val).toggle(false)
			
			$("#discover-reading-question-"+val).toggle(false)
			$("#discover-reading-answer-"+val).toggle(false)

			$("#discover-listening-question-"+val).toggle(false)
			$("#discover-listening-answer-"+val).toggle(false)
			
			$("#discover-thinking-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#discover-thinking-answer-"+val).fadeIn(2000, function (){
			// animation complete
			})
		
		}
	},
	"click .discover-working-link": function (event) {
		// Checking to see if this is the first question we're looking at

		var $target = $(event.currentTarget)
		var val = $target.attr("userId")
		console.log("this is the $target  attr" + val)
		
		if($("#discover-working-answer-"+val).css('display') === "none"){

			$("#discover-aboutMe-question-"+val).toggle(false)
			$("#discover-aboutMe-answer-"+val).toggle(false)
			

			$("#discover-thinking-question-"+val).toggle(false)
			$("#discover-thinking-answer-"+val).toggle(false)
			
			$("#discover-reading-question-"+val).toggle(false)
			$("#discover-reading-answer-"+val).toggle(false)

			$("#discover-listening-question-"+val).toggle(false)
			$("#discover-listening-answer-"+val).toggle(false)
			
			$("#discover-working-question-"+val).fadeIn(1000, function (){
			// animation complete
			})
			$("#discover-working-answer-"+val).fadeIn(2000, function (){
			// animation complete
			})
		
		}
	},
	"mouseenter .discover-follower-name": function (event){
		var $target = $(event.currentTarget)
		var id = $target.attr("id")
		console.log("this is id on mouse enter " +id )
		// $("#discover-about-user-icons-"+id).fadeIn();
		$("#discover-about-user-icons-"+id).css("visibility", "visible").fadeIn()
		
	},
	"mouseleave .discover-follower-name": function (event){
		var $target = $(event.currentTarget)
		var id = $target.attr("id")
		console.log("this is id on mouse leave " +id )
		$("#discover-about-user-icons-"+id).css("visibility", "hidden")
	},
	"focus .discover-message-input-textarea": function (event) {
		var $target = $(event.currentTarget);
		if ($target.val().length <= 0 /*|| $target.val() == $target.attr("placeholder")*/) {
			$target.autosize({append: ""}).trigger("autosize.resize");
			// $target.next(".comment-link").fadeIn();
		} else {
			$target.autosize({append: ""}).trigger("autosize.resize");
			// $target.next(".comment-link").fadeIn();
		}
	}

})

// UPDATES
Template.updates.helpers({
	"newUpdates": function () {
		return findUpdates(true);
	},
	"oldUpdates": function () {
		return findUpdates(false);
	},
	"newMessages": function (){
		return findMessages(true);
	},
	"oldMessages": function (){
		return findMessages(false)
	},
	"showOldUpdates": function () {
		return findUpdates(false).count() > 0;
	},
	"showLoadMoreNewUpdates": function() {
		return false;
	},
	"showLoadMoreNewMessages": function() {
		return false;
	},
	"showLoadMoreOldUpdates": function() {
		return findUpdates(false).count() < Session.get("oldUpdatesCount");
	},
	"showLoadMoreOldMessages": function() {
		return findMessages(false).count() < Session.get("oldMessagesCount");
	},
	"home": function () {
		return Session.get("homeUpdates");
	},
	"messages": function () {
		return Session.get("messageUpdates");
	},
	"getUpdatesCount": function (){
		if (findUpdates(true).count() > 0 ){
		// $('#standard-update-count').css(true);
		return findUpdates(true).count()
	}
	else {
		return false
	}
},
	"getFollowerUpdatesCount": function (){
		if (findFollowerUpdates(true).count() > 0 ){
		// $('#standard-update-count').css(true);
		return findFollowerUpdates(true).count()
	}
	else {
		return false
	}
},
	"getMessageCount": function (){
		if (findMessages(true).count() > 0){
			return findMessages(true).count()
		} else {
			return false;	
		}
	},
	});

Template.updates.events({
	"click #load-old-updates": function(event) {
		loadMoreUpdates(false, LOAD_MORE_UPDATES);
	},
	"click #standard-updates": function(event){
		Session.set("homeUpdates", true);
		Session.set("messageUpdates", false);
		Session.set("followerUpdates", false);
		Session.set("selectedMessage", false)
		$('#vertical-line').toggle(true);
	},
	"click #messages-updates": function(event){
		Session.set("homeUpdates", false);
		Session.set("messageUpdates", true);
		Session.set("followerUpdates", false);
		$('#vertical-line').toggle(true);
	},
	"click #follower-updates": function(event){
		Session.set("homeUpdates", false);
		Session.set("messageUpdates", false);
		Session.set("followerUpdates", true);
		Session.set("selectedMessage", false)
		Session.set("followerUpdates", true)
		Session.set("showingFollowers", true)
		Session.set("showingDiscover", false)
		$('#vertical-line').toggle(false);
		$("#show-loved-posts").toggle(false);
		$("#show-global-posts").toggle(false);
	}
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
			// Matching text to the appropriate number of commentators.
			if (this.byUserIds.length === 1) {
				if (this.postOwnerId == Meteor.userId()) {
					text = getFullName(this.byUserIds[0]) + " commented on your post.";
				}
				if (this.byUserIds[0] == this.postOwnerId) {
					text = getFullName(this.byUserIds[0]) + " commented on their post.";
				}
				if (this.byUserIds[0] != Meteor.userId() && this.postOwnerId != Meteor.userId() ) {
					text = getFullName(this.byUserIds[0]) + " also commented on " + getFullName(this.postOwnerId) + "’s post."
				}
			} else if (this.byUserIds.length === 2) {
				if (this.postOwnerId == Meteor.userId() && this.byUserIds.indexOf(Meteor.userId()) === -1) {
					text = getFullName(this.byUserIds[0]) + " and " + getFullName(this.byUserIds[1]) + " commented on your post."
				}  else {
					text = getFullName(this.byUserIds[0]) + " and " + getFullName(this.byUserIds[1]) + " also commented on " + getFullName(this.postOwnerId) + "’s post.";
				}
			} else if(this.byUserIds.length > 2) {
				if (this.postOwnerId == Meteor.userId()) {
					if( this.byUserIds.length === 3) {
						text = getFullName(this.byUserIds[0]) + ", " + getFullName(this.byUserIds[1]) + ", and 1 other commented on your post.";
					} else {
						text = getFullName(this.byUserIds[0]) + ", " + getFullName(this.byUserIds[1]) + ", and " + String((this.byUserIds.length - 2)) + " others also commented on your post.";
					}
				} else if (this.byUserIds.length === 3){
					text = getFullName(this.byUserIds[0]) + ", " + getFullName(this.byUserIds[1]) + ", and 1 other also commented on " + getFullName(this.postOwnerId) + "’s post.";
				} else {
					text = getFullName(this.byUserIds[0]) + ", " + getFullName(this.byUserIds[1]) + ", and " + String((this.byUserIds.length - 2)) + " others also commented on " + getFullName(this.postOwnerId) + "’s post.";
				}
			}
			break;
			case UPDATE_TYPE.LOVE:
			text = getFullName(this.byUserIds[0]) + " loved your post.";
			break;
			case UPDATE_TYPE.MESSAGE:
			text = getFullName(this.senderId) + " sent you a message ";
			break;
			case UPDATE_TYPE.INVITE:
			text = getFullName(this.fromUserId) + " invited you to a post. ";
			break;
			case UPDATE_TYPE.INVITEDNOTIFICATION:
			text = getFullName(this.fromUserId) + " invited " + getFullName(this.invitedUserId) + " to see your post.";
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
	"home": function (){
		return Session.get("homeUpdates")
	},
	"messages": function (){
		return Session.get("messageUpdates")
	}
});

Template.update.events({
	"click .update-link": function () {
		// Clicking on the already selected update?
		if(Session.get("homeUpdates")){
				if (this._id === Session.get("selectedUpdate")) {
					return;
				}
				Session.set("selectedUpdate", this._id);

			// Mark as read.
			if (!this.read) {
				// BAD?
				updates.update(this._id, {$set: {read: true, new: false}});
				Meteor.call("markUpdateRead", this._id, function(err, result) {
					if (err != undefined) {
						console.log("Error setPostRead: " + err);
					}
				});
			}
			var invitemessage = this.invitemessage
			var postId = this.postId;
			var invitemessage = this.invitemessage
			var updateId = Session.get("selectedUpdate")
			
			var fadeIn = function() {
				Tracker.flush();
				if((invitemessage != "") && (invitemessage != undefined)) {
				// Tracker.flush()
					console.log("inside invitemessage if statement")
	 				
					console.log("updateId" + updateId)
					
						console.log($("#b-posts-invite-message-"+postId+"-"+updateId))
						$("#b-posts-invite-message-"+postId+"-"+updateId).toggle(true).css("opacity", "1").css("z-index", "2")
						// $("#"+postId).hide()
					
				}
				Meteor.clearInterval(window.saveCommentDraftHandle);
				$(".b-posts").animate({"opacity": "1"}, {queue: false, done: function(){
					Tracker.flush();
					$('[placeholder]').blur();
					$('#messageSection-'+postId).toggle(false);
					$('#commentSection-'+postId).toggle(true);
					$("#"+postId).find(".conversation").toggle(true)
					$("#"+postId).find("#conversation-"+senderId).toggle()
				}});
			}


			// IF we were invited to the post show message 
			
			
				console.log("inside invitemessage else statement")
			// TODO: ideally, if we don't have this post and need to fetch it from the
			// server, we need to do it while we are animating.
			var postId = this.postId;
			// Set selectedPost to a temp stub, so that the update gets highlighted.
			$(".b-posts").animate({"opacity": "0"}, {queue: false, done: function() {
				var post = posts.findOne({"_id": postId});
				$(".comment-input-textarea").val("")
				if (post !== undefined) {
					Session.set("selectedPostId", post._id);
					fadeIn();
				} else {
					Meteor.call("getPost", postId, function(err, result) {
						if (err === undefined) {
							//  BAD?
							posts.insert(result);
							loadComments([result._id]);
							// add load messages + load drafts 
							Session.set("selectedPostId", result._id);
							fadeIn();
						} else {
							console.log("Error getPost: " + err);
						}
					});
				}
			}});
			return false;
		
	}else if (Session.get("messageUpdates")){
		Session.set("selectedUpdate", this._id);

		// Mark as read.
		if (!this.read) {
			// BAD?
			updates.update(this._id, {$set: {read: true, new: false}});
			Meteor.call("markUpdateRead", this._id, function(err, result) {
				if (err != undefined) {
					console.log("Error setPostRead: " + err);
				}
			});
		}

		var postId = this.postId;
		var senderId = this.senderId

		var fadeIn = function() {
			Meteor.clearInterval(window.saveMessageDraftHandle);
			$(".b-posts").animate({"opacity": "1"}, {queue: false, done: function(){
				Tracker.flush();
				
				$('[placeholder]').blur();
				$('#messageSection-'+postId).toggle(true);
				$('#commentSection-'+postId).toggle(false);
				$("#"+postId).find(".conversation").toggle(false)
				$("#"+postId).find("#conversation-"+senderId).toggle()
				var $check = $("#"+postId).find("#conversation-"+senderId)
			}});
		}

		// TODO: ideally, if we don't have this post and need to fetch it from the
		// server, we need to do it while we are animating.
		


		// Set selectedPost to a temp stub, so that the update gets highlighted.
		$(".b-posts").animate({"opacity": "0"}, {queue: false, done: function() {
			var post = posts.findOne({"_id": postId});
			$(".message-input-textarea").val("")
			if (post !== undefined) {
				Session.set("selectedPostId", postId);
				fadeIn();
			} else {
				Meteor.call("getPost", postId, function(err, result) {
					if (err === undefined) {
						//  BAD?
						posts.insert(result);
						loadMessages([result._id]);
						Session.set("selectedPostId", result._id);
						fadeIn();
					} else {
						console.log("Error getPost: " + err);
					}
				});
			}

		}});
		return false;
	}
}
});

//PROFILE

Template.profileCreation.events ({
	"focus .about-input-textarea": function (event){

		var $target = $(event.currentTarget);
		if ($target.val().length <= 0 /*|| $target.val() == $target.attr("placeholder")*/) {
			$target.autosize({append: ""}).trigger("autosize.resize");
			// $target.next(".comment-link").fadeIn();
		} else {
			$target.autosize({append: ""}).trigger("autosize.resize");
			// $target.next(".comment-link").fadeIn();
		};
	},
	"click #profile-next-link": function (event){
		// var $target = $(event.currentTarget).prev(".xyz");

		var readingText = $('#user-reading-answer').val();
		var listeningToText = $('#user-listening-answer').val();
		console.log("profile next link1" + listeningToText)
		console.log("profile next link1" + readingText)
		var thinkingText = $('#user-thinking-answer').val();
		console.log("profile next link1" + thinkingText)
		var workingText = $('#user-working-answer').val();
		console.log("profile next link1" + workingText)
		var aboutMeText = $('#user-about-me-answer').val();
		console.log("profile next link" + aboutMeText)
		// var userId = Session.get("loftAlphaUserId")
		var userId = Meteor.userId()

		// var postId = this._id;
		// var limit = this.commentLimit;

		Meteor.call("addUserInfo", userId, readingText, listeningToText, thinkingText, workingText, aboutMeText, function(err, result) {
			if (err == undefined) {
				console.log("addUser success" + result);
				
				// BAD?
				// Meteor.clearInterval(window.saveCommentDraftHandle);
				usersInfo.insert(result);
				window.scrollTo(0, 0);
				goToLoftPage(PAGES.SIGNUPDISCOVER);

				$(".createAboutMe").fadeOut(400, function(){
					$(".profile-creation-thanks").fadeIn()
				})
				
			} else {
				console.log("addComment error: " + err);
			}
		});
	}
})

// POST
// Template.inviteSearch.created = function () {
// 	console.log("this " + JSON.stringify(this))
//   // set up reactive computation
//   this.autorun(function () {
//     var instance = EasySearch.getComponentInstance(
//         { index : 'followers' }
//     );

//     instance.on('autosuggestSelected', function (values) {
//       // run every time the autosuggest selection changes
//      console.log("instance " + JSON.stringify(instance))
//      console.log("auto suggest selected")
//      // $(autosuggest-hide-fix
//     });
//   });
// };

Template.inviteSearch.helpers({
  'suggestion' : function () {
     return Template.suggestionTemplate;
  },
   "findValue": function (){
  	// console.log("inside of findValue")
  	// var values = $('.value').esAutosuggestData()
  	// console.log("values" + values)
  }
});

Template.suggestionTemplate.helpers({
	
})

Template.post.helpers({
	"targetUserId": function (){
		return this.name 
	},
	"globalPosts": function(){
		return Session.get("showingGlobalPosts")
	},
	"publicPost": function (){
		var post = posts.findOne({"_id": this._id})
		if (post.isPublic === true){
			return true 
		} else {
			return false
		}
	},
	"postOwnerFollower": function (){
		var follower = followers.findOne({$and:[
			{ownerId: this.userId},
			{followerId: Meteor.userId()}
			]
		})
		if(follower) {
			return true 
		} else {
			return false
		}
	},
	"safeText": function() {
		return escapeHtml(this.text);
	},
	"name": function() {
		return getFullName(this.userId);
	},
	"postOwnerFirstName": function (){
		var post = posts.findOne({_id: this._id})
		return getFirstName(post.userId)
	},
	"postOwnerLastName": function (){
		var post = posts.findOne({_id: this._id})
		return getLastName(post.userId)
	},
	"canLove": function() {

		return this.userId != Meteor.userId() &&
		Session.get("canLove") &&
		this.lovedBy.indexOf(Meteor.userId()) == -1;
	},
	"invitedFollowers": function (){
		 return findInvited(this._id)
	},
	"followerName": function (){
		return getFullName(""+this)
	
	},
	"getFirstName": function (){
		return getFirstName(""+this)
	},
	"getLastName": function (){
		return getLastName(""+this)
	},
	"showingPopup": function (){
		if(Session.get("showingInvitePopup") === this._id){
		return Session.get("showingInvitePopup")
		}else {
			return false 
		}
	},
	"showLoadMoreComments": function() {
		var commentCount = comments.find({postId: this._id}).count();
		return this.commentLimit < commentCount;
	},
	"getCommentDraftText": function (){
		 var objectId = this._id
		 var draftObject = commentDrafts.findOne({$and: [{postId: objectId}, {userId: Meteor.userId()}, {type:"comment"}]})

		if(draftObject) {
			return draftObject.text
		} else {
		return ""
	}

	},
	"getOwnerDraftText": function (postId){
		var targetUserId = this.name
		var objectId = String(postId)
		var draftObject = commentDrafts.findOne({$and: [{postId: objectId}, {userId: Meteor.userId()}, {type:"message"}, {targetUserId: targetUserId}]})


		if(draftObject) {
			return draftObject.text
		} else {
		return ""
	}
	},
	"getMessageDraftText": function (){
		var objectId = String(this._id)
		 var draftObject = commentDrafts.findOne({$and: [{postId: objectId}, {userId: Meteor.userId()},{type:"message"}]})
		 if(draftObject) {
			return draftObject.text
		} else {
		return ""
	}

	},
	"showLoadMoreOwnerMessages": function (postId){
		var messageCount = messages.find({$and:[{postId: postId},{targetUserId: this.name}]}).count()
		var post = posts.findOne({"_id": postId})
		// return this.messageLimit < messageCount
		return post.messageLimit < messageCount
	},
	"showLoadMoreMessages": function (){
		var postId = this._id 
		var messageCount = messages.find({$and:[{postId: postId},{targetUserId: Meteor.userId()}]}).count()
		var post = posts.findOne({"_id": postId})
		return post.messageLimit < messageCount
	},
	"comments": function() {
		// for this post returns all its comments; here we're gonna say that post id and this not a reply to anything
		return comments.find({postId: this._id}, {limit: this.commentLimit, sort: {createdAt: -1}}).fetch().reverse();
	},
	"commentCount": function (){
		return comments.find({postId: this._id}).count();
	},
	"invitedCount": function (){
		var post = posts.findOne({"_id": this._id})
		return post.invited.length
	},
	"messages": function(postId) {
		var post = posts.findOne({"_id": postId})
		return messages.find({$and:[{postId: postId},{targetUserId: this.name}]}, {limit: post.messageLimit, sort:{createdAt: -1}}).fetch().reverse();
		
	},	
	"nonOwnerMessages": function () {	
		var post = posts.findOne({"_id": this._id})
		return messages.find({$and:[{postId: this._id},{targetUserId: Meteor.userId()}]}, {limit: post.messageLimit, sort:{createdAt: -1}}).fetch().reverse();	
		
	},
	"noMessages": function (){
		if (this.userId === Meteor.userId)
		{
			return false 
		} else {
			return true 
		}

	},
	"postId": function (){
		var id = $("#conversation-"+this.name).closest("div").attr("post-id");
		return id 
	},
	"imageSource": function () {
		if (this.lovedBy.indexOf(Meteor.userId()) >= 0)	{
			return "/images/heart-2x.png";
		}
		if (Session.get("canLove")) {
			return "/images/heart-2x-cleared.png";

		} 
		return "/images/heart-2x-grey.png";
	},
	"showCommentInput": function (commentId) {
		return true;
	},
	"showComments": function () {

	},
	"firstName": function () {
			return getFirstName(this.userId);

		
		
	},
	"ownerFirstName": function (postId) {
			return getFirstName(""+this.name);

		
		
	},
	"owner": function () {
		if(Meteor.userId() === this.userId) {
			return true;
		}
	},
	"messager": function () {
		var messageMap = {
		};
		messages.find({postId: this._id}).map(function(message) {
			// checking if message exists already
			if (message.targetUserId in messageMap) {
				// checking if message is read or sent by us 
				if(message.read || message.userId === Meteor.userId() ){
					messageMap[message.targetUserId] = 0;
				} 
				else {
					messageMap[message.targetUserId] ++;
				}
			} 
			else {
				if(message.read || message.userId === Meteor.userId()) {
					messageMap[message.targetUserId] = 0;
				}
				else { 
					messageMap[message.targetUserId] = 1;
				}
			}
		});
		return arrayify(messageMap); 


	},
	"count": function () {
		return this.value;
	},
	"currentUser": function () {
		return Meteor.userId();
	},

	"getName": function () {
		return getFullName(""+this.name);
	},
	"userId": function () {
		return Meteor.userId();
	},
	"isEditing": function () {
		if(Meteor.userId() === this.userId) {
			return Session.get("isEditing");
		}
		else {
			return false;
		}
	},
	"uniquePost": function (){
		return messages.find()
	},
	"conversationWith": function (){
		return getFullName(this.userId)
	},
	"yourConversation": function (){
		if(messages.find({$and:[{postId: this._id},{targetUserId: Meteor.userId()}]}, {sort:{createdAt: -1}}).count() > 0){
			return true 
		}
		else{
			return false 
		}
	}

});

// Flash the background color of the new comment.
function flashNewComment(commentId) {
	Tracker.flush();

	var commentDiv = $("#" + commentId);
	var originalHeight = commentDiv.css("height");
	commentDiv.hide().fadeIn({queue: false, duration: 400 * ANIMATION_FACTOR});
}

function flashNewMessage(messageId) {
	Tracker.flush();
	var messageDiv = $("#" + messageId);
	var originalHeight = messageDiv.css("height");
	messageDiv.hide().fadeIn({queue: false, duration: 400 * ANIMATION_FACTOR});
}

Template.post.events({
	"click .love-button": function () {
		var postId = this._id;
		var post = posts.findOne(postId);
		var ownerName = getFullName(post.userId)
		var lovedByName = getFullName(Meteor.userId())

		Meteor.call("lovePost", this._id, ownerName, lovedByName, function (err, result) {
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
	"click .load-more-messages": function(event){
		// TODO: fix this hack
		var postId = $(event.currentTarget).closest(".post").attr("id")
		posts.update(postId, {$inc: {messageLimit: 10}});
	},
	"click .commentCount": function(event){
		$('#commentSection-'+this._id).toggle();
	},
	"click .comment-link": function (event) {
		var $target = $(event.currentTarget).prev(".comment-input-textarea");
		var postId = this._id;
		var post = posts.findOne(postId);
		var limit = this.commentLimit;
		var ownerName = getFullName(post.userId)
		var commenterName = getFullName(Meteor.userId())
		var text = $target.val()
		Meteor.call("addComment", this._id, $target.val(), ownerName, commenterName, function(err, result) {
			if (err == undefined) {
				// BAD?
				Meteor.call("sendCommentEmail", post.userId, "Loft@tryloft.com", commenterName, text)
				Meteor.clearInterval(window.saveCommentDraftHandle);
				comments.insert(result);
				posts.update(postId, {$inc: {commentLimit: 1}});
				flashNewComment(result._id);
				// saveCommentDraft(postId)
			} else {
				console.log("addComment error: " + err);
			}
		});
		$target.val("");
		saveCommentDraft(post._id)
		$target.blur();
	},

	"focus .comment-input-textarea": function (event) {
		Meteor.clearInterval(window.saveCommentDraftHandle);
		var $target = $(event.currentTarget);
		if ($target.val().length <= 0 /*|| $target.val() == $target.attr("placeholder")*/) {
			$target.autosize({append: ""}).trigger("autosize.resize");
			$target.next(".comment-link").fadeIn();
		} else {
			$target.autosize({append: ""}).trigger("autosize.resize");
			$target.next(".comment-link").fadeIn();
		}
		var postId = this._id
		window.saveCommentDraftHandle = Meteor.setInterval(function (){saveCommentDraft(postId)}, SAVE_COMMENT_DRAFT_PERIOD);
	},
	"blur .comment-input-textarea": function (event) {
		var $target = $(event.currentTarget);
		if ($target.val().length <= 0 /*|| $target.val() == $target.attr("placeholder")*/) {
			$target.trigger("autosize.destroy");
			$target.next(".comment-link").fadeOut();
		} else {
			// $target.trigger("autosize.destroy");
			$target.next(".comment-link").fadeOut();
		}
		

		var text = $target.val()
		var postId = this._id
		if($target.val().length > 0) {
		console.log ("postId" + postId)
			commentDrafts.update({
			$and: [
			{userId: Meteor.userId()},
			{postId: postId},
			{type: "comment"}
			]},
			{$set: 
			{
				userId: Meteor.userId(),
				text: text,
				postId: postId,
				type: "comment"

			}
		},
			{upsert: true})
			Meteor.clearInterval(window.saveCommentDraftHandle);
		}
	},
	"click .message-button": function (event, target) {
		var postId = this._id;
		var getImage = $("#open-message-"+postId).attr("src")
		if(getImage === "/images/envelope-closed-2x.png" ){
			$("#open-message-"+postId).attr("src", "/images/envelope-open-2x.png" )
			console.log("getting inside of message button if")
			$('#commentSection-'+postId).toggle(false);
			$('#messageSection-'+postId).toggle(true);
		}
		if (getImage === "/images/envelope-open-2x.png") {
			$("#open-message-"+postId).attr("src", "/images/envelope-closed-2x.png" )
			$('#commentSection-'+postId).toggle(true);
			$('#messageSection-'+postId).toggle(false);
		}
		if(Meteor.userId() === this.userId) {
		} else {
			$(".messages-id").attr("target-user-id", Meteor.userId());
		}

	}, 
	// RETURN TO EDIT THIS SECTION  LIKE CHANGE COMMENT LIMITS
	"click .message-link": function (event, target) {
		// checking if owner
		// IF NOT OWNER 
		if(this.userId !== undefined) {
			var targetId = $("#messages-"+Meteor.userId()).attr("target-user-id");
			var postId = this._id;	
			var limit = this.messageLimit;
			var post = posts.findOne(postId);
			var ownerName = getFullName(post.userId)
			var senderName = getFullName(Meteor.userId())
			var targetName = getFullName(targetId)


			var $target = $(event.currentTarget).prev(".message-input-textarea");
			var text = $target.val()
			Meteor.call("addMessage", targetId, postId, $target.val(), ownerName, senderName, function(err, result) {
				if (err == undefined) {
					// BAD?
					console.log("inside meteor call")
					// Meteor.call("sendMessageEmail", postId, "loft@tryloft.com", ownerName, senderName, text)
					messages.insert(result);
					posts.update(postId, {$inc: {messageLimit: 1}});
					flashNewMessage(result._id);
					// saveMessageDraft(postId)
				} else {
					console.log("addMessage error: " + err);
				}
			});
			$target.val("");
			$target.blur();
			// if owner 
		} else {
			var targetId = $("#messages-"+this.name).attr("target-user-id");
			var $target = $(event.currentTarget).prev(".message-input-textarea");
			var limit = this.messageLimit;
			var name = getFullName(Meteor.userId())
			//var postId = $("#messages-"+this.name).attr("postId");
			var postId = $(event.currentTarget).closest(".post").attr("id")
			var text = $target.val()
			Meteor.call("addMessage", targetId, postId, $target.val(), function(err, result) {
				if (err == undefined) {
				// BAD?
				Meteor.call("sendOwnerMessageEmail", targetId, "loft@tryloft.com", name, text)
				messages.insert(result);
				posts.update(postId, {$inc: {messageLimit: 1}});
				flashNewMessage(result._id);
			} else {
				console.log("addMessage error: " + err);
			}
		});
			$target.val("");
			$target.blur();
			Meteor.clearInterval(window.saveCommentDraftHandle);
		}
	},
	"focus .message-input-textarea": function (event, target) {
		Meteor.clearInterval(window.saveMessageDraftHandle);
		var $target = $(event.currentTarget);
		if ($target.val().length <= 0 /*|| $target.val() == $target.attr("placeholder")*/) {
			$target.autosize({append: ""}).trigger("autosize.resize");
			$target.next(".message-link").fadeIn();
		} else {
			$target.autosize({append: ""}).trigger("autosize.resize");
			$target.next(".message-link").fadeIn();
		}

		var post = $target.closest(".post").attr("id")
		var postOwnerId = posts.findOne({"_id": post}).userId
		var targetUserId = $(event.currentTarget).attr("target-user-id")
		window.saveMessageDraftHandle = Meteor.setInterval(function (){saveMessageDraft(post, postOwnerId, targetUserId)}, SAVE_COMMENT_DRAFT_PERIOD);
	},
	"blur .message-input-textarea": function (event, target) {
		var $target = $(event.currentTarget);
		
		if ($target.val().length <= 0 /*|| $target.val() == $target.attr("placeholder")*/) {
			$target.trigger("autosize.destroy");
			$target.next(".message-link").fadeOut();
		} else {
			// $target.trigger("autosize.destroy");
			$target.next(".message-link").fadeOut();
		}

			var postId = $target.closest(".post").attr("id")
			var postOwnerId = posts.findOne({"_id": postId}).userId
			var text = $target.val()
			if(postOwnerId === Meteor.userId()) {
				var targetUserId = $(event.currentTarget).attr("target-user-id")
				if($target.val().length > 0) {
				commentDrafts.update({
				$and: [
					{userId: Meteor.userId()},
					{postId: postId},
					{targetUserId: targetUserId},
					{type: "message"}
					]},
				{$set: 
					{
					userId: Meteor.userId(),
					text: text,
					postId: postId,
					type: "message"
					}
				},
			{upsert: true})
			} else {
				var targetUserId = Meteor.userId()
				commentDrafts.update({
				$and: [
				{userId: Meteor.userId()},
				{postId: postId},
				{type: "message"}
				]},
				{$set: 
				{
					userId: Meteor.userId(),
					text: text,
					postId: postId,
					type: "message"

				}
			},
				{upsert: true})
			}
			}
			Meteor.clearInterval(window.saveMessageDraftHandle);
		
		
	},
	"click .edit-button": function (event, target) {
			var id = this._id
			if ($('#postContent-'+id).attr('contentEditable')) {
				$('#postContent-'+id).removeAttr('contentEditable');
				document.getElementById("postContent-"+id).style.borderStyle = "none";
				document.getElementById("postContent-"+id).style.borderWidth = "thin";
				$('#save-div-link-'+id).toggle(false);
				$("#edit-button-"+id).toggle(true)
				Session.set("isEditing", undefined)
				
			}
			else {$('#postContent-'+id).attr('contentEditable', true);
			document.getElementById("postContent-"+id).style.borderStyle = "dashed";
			document.getElementById("postContent-"+id).style.borderWidth = "thin";
			$('#save-div-link-'+id).toggle(true);
			$('#edit-button-'+id).toggle(false);
			Session.set("isEditing", id)
		}
	},	
	"click .save": function (e, t){
		var postId = this._id;
		var $target = $('#postContent-'+postId);
		var content = t.find('#postContent-'+postId).value;
		Meteor.call("editPost", this._id, $target.text(), function(err, result) {
			if (err === undefined) {
					// BAD?
					$('#postContent-'+postId).removeAttr('contentEditable');
					document.getElementById("postContent-"+postId).style.borderStyle = "none";
					document.getElementById("postContent-"+postId).style.borderWidth = "thin";
					$('#save-div-link-'+postId).toggle(false);
					$("#edit-button-"+postId).toggle(true)
					Session.set("isEditing", postId)


				} else {
					console.log("addComment error: " + err);
				}

			}
			)},
	"click .exit": function (event, target){
		var postId = this._id;
		if ($('#postContent-'+postId).attr('contentEditable')) {
				$('#postContent-'+postId).removeAttr('contentEditable');
				document.getElementById("postContent-"+postId).style.borderStyle = "none";
				document.getElementById("postContent-"+postId).style.borderWidth = "thin";
				$('#save-div-link-'+postId).toggle(false);
				$("#edit-button-"+postId).toggle(true)
				Session.set("isEditing", undefined)
				
			}
	},
	"click .messenger-link": function (event, target){
		var post = $(event.currentTarget).closest(".post").attr("id")
		var postString = String(post)
		var id = this.name
		$("#"+post).find("#conversation-"+id).toggle()
		messages.update({$and:[{postId: post},{targetUserId: id}]}, {$set:{read: true}}, {multi: true})
		Meteor.call("markMessagesRead", post, id, function(err, result){
			if (err === undefined) {
				console.log("yeahhhh")
			}
			else {
				console.log("mark messages read error:" + err)
			}
		})
		//$("[id = 'postId']" ).find("#conversation-"+id).toggle()
	},
	"mouseenter .post": function ( event, target){
		var postId = this._id
		var messageCount = messages.find({postId: postId}).count()
		if(Session.get("isEditing") === postId) {
			return 
		} else if (this.userId === Meteor.userId() && messageCount === 0){
			$("#message-button-"+postId).toggle(false)
			$("#edit-button-"+postId).toggle(true)
			$("#invite-button-"+postId).toggle(true)
		} else {
			$("#edit-button-"+postId).toggle(true)
			$("#message-button-"+postId).toggle(true)
			$("#invite-button-"+postId).toggle(true)
			return true 
		}
			

	},
	"mouseleave .post": function (event, target){
		var postId = this._id
		$("#message-button-"+postId).toggle(false)
		$("#edit-button-"+postId).toggle(false)
		$("#invite-button-"+postId).toggle(false)
		
	},
	"click .name" : function (event){
		console.log("this._id " + this._id)
		var post = posts.findOne({"_id": this._id})
		Session.set("profileUserId", post.userId)
		console.log("getting id" + Session.get("profileUserId"))

	},
	"keypress .invite-list-search": function (event){
		
     },
     "click .invite-users-input": function (event){
     	console.log("event fired")
     	
     	var $target = $(event.currentTarget)
     	var id = $target.attr("postId");
     	showInviteUsersPopup(id)
     	// Create an array of objects:
		// use a for loop to push user name to label and user id to value 
		var followersObject = followers.find({ownerId: Meteor.userId()}).fetch()
		console.log("followers object " + followersObject[0]._id)
		console.log("meteor user id " + Meteor.userId())
		// console.log("followers object " + followersObject[0]._ownerName)
		var length = followersObject.length
		var source = []
		// var source = [{label: "User Name", value: "9101d8a0108a"}, ...]; // use for loop
		for (var i = 0; i < length; i++) {
		 source.push({label: followersObject[i].followerName, value: followersObject[i].followerId });
		}
		
		console.log("source" + JSON.stringify(source))
		 var $input = $("#invite-list-search-1-"+id);
		$input.autocomplete({
	      	source: source, //array from above
	      	focus: function (event, ui) {
		         $input.val(ui.item.label);
		         return false;
	      	 },
	     	 select: function (event, ui) {
		        console.log("user's name is: " + ui.item.label);
		        console.log("user's id is: " + ui.item.value);
		        var name = ui.item.label
		        $("#invite-name-1-"+id).fadeOut(400, function () {
		        		console.log('fade out')
		        		$("#selected-invite-name-text-1-"+id).text(name)
		        	$("#selected-invite-name-1-"+id).fadeIn(400, function (){
		        		$("#selected-invite-name-1-"+id).attr("userId", ui.item.value)
		        		console.log($("#selected-invite-name-text-1-"+id))
						
		        		
		        	})

		        })
		        // The rest of the comments are optional:
		        // hide the input field
		        // find a <a> link you've setup to be empty; set its text to ui.item.value
		        // clicking on that link will set link's text to "" and show the input field again
	        	return false;
    		}
    	})
    	 var $input2 = $("#invite-list-search-2-"+id);
		$input2.autocomplete({
	      	source: source, //array from above
	      	focus: function (event, ui) {
		         $input2.val(ui.item.label);
		         return false;
	      	 },
	     	 select: function (event, ui) {
		        console.log("user's name is: " + ui.item.label);
		        console.log("user's id is: " + ui.item.value);
		        var name = ui.item.label
		        var value = ui.item.value
		        $("#invite-name-2-"+id).fadeOut(400, function () {
		        		console.log('fade out')
		        		$("#selected-invite-name-text-2-"+id).text(name)
		        	$("#selected-invite-name-2-"+id).fadeIn(400, function (){
		        		$("#selected-invite-name-2-"+id).attr("userId", value)
		        		console.log($("#selected-invite-name-text-2-"+id))
						
		        		
		        	})

		        })
		        // The rest of the comments are optional:
		        // hide the input field
		        // find a <a> link you've setup to be empty; set its text to ui.item.value
		        // clicking on that link will set link's text to "" and show the input field again
	        	return false;
    		}
    	})
    	 var $input3 = $("#invite-list-search-3-"+id);
		$input3.autocomplete({
	      	source: source, //array from above
	      	focus: function (event, ui) {
		         $input3.val(ui.item.label);
		         return false;
	      	 },
	     	 select: function (event, ui) {
		        console.log("user's name is: " + ui.item.label);
		        console.log("user's id is: " + ui.item.value);
		        var name = ui.item.label
		        $("#invite-name-3-"+id).fadeOut(400, function () {
		        		console.log('fade out')
		        	$("#selected-invite-name-text-3-"+id).text(name)
		        	$("#selected-invite-name-3-"+id).fadeIn(400, function (){
		        		$("#selected-invite-name-3-"+id).attr("userId", ui.item.value)
		        		console.log($("#selected-invite-name-text-3-"+id))
						
		        		
		        	})

		        })
		        // The rest of the comments are optional:
		        // hide the input field
		        // find a <a> link you've setup to be empty; set its text to ui.item.value
		        // clicking on that link will set link's text to "" and show the input field again
	        	return false;
    		}
    	})
     },
     "click .remove-selected-name": function (event){
     	var $target = $(event.currentTarget)
     	// var id = $target.attr("postId");
     	var id = $target.closest(".post").attr("post-id");
     	var number = $target.attr("number")
     	console.log("id" + id)
     	console.log("number" + number)
     	$("#selected-invite-name-"+number+"-"+id).fadeOut(400, function () {
			$("#invite-list-search-"+number+"-"+id).val("")	
        	$("#selected-invite-name-text-"+number+"-"+id).text("")
        	$("#invite-name-"+number+"-"+id).fadeIn(400, function (){
				// $("#selected-invite-name-text-3-"+id).text(name)
        		
        	})

        })
     },
     "click .invite-users-link": function (event){
     	var $target = $(event.currentTarget)
     	var id = $target.closest(".post").attr("post-id");
     	var message1 = $("#invite-message-input-1-"+id).val()
     	var message2 = $("#invite-message-input-2-"+id).val()
     	var message3 = $("#invite-message-input-3-"+id).val()
     	var userId1 = $("#selected-invite-name-1-"+id).attr("userId")
     	var userId2 = $("#selected-invite-name-2-"+id).attr("userId")
     	var userId3 = $("#selected-invite-name-3-"+id).attr("userId")
     	hideInviteUsersPopup(id)
     	// console.log("message1" + message1)
     	// console.log("userId1" + userId1)
     	// console.log("message2" + message2)
     	// console.log("userId2" + userId2)
     	// console.log("message3" + message3)
     	// console.log("userId3" + userId3)

     	
     	 Meteor.call("addInviteUpdate", id, userId1, message1, userId2, message2, userId3, message3, function(err,result){
     	 	if(err == undefined){
     	 		console.log("no error!")
     	 	}
     	 })
     }

});

	


// COMMENT
// add a new helper called replies which is gonna return (will look similar to what comments does for posts) we will do comments.find and find all 
// the comments that are in reply to this comment, comments.find(inreplytoid: this._id) will have to sort and do fetch just like comments helper
//might have to apply the limit -- pay attention to how comments are done for post
Template.comment.helpers({
	"safeText": function() {
		return escapeHtml(this.text);

	},
	"name": function() {
		return getFullName(this.userId);
	},
	"getFirstName": function (){
		var user = Meteor.users.findOne({"_id":this.userId})
		return user.profile.firstName
	},
	"getLastName": function (){
		var user = Meteor.users.findOne({"_id":this.userId})
		return user.profile.lastName
	},
});

Template.comment.events({
	".click #comment-name-link": function (){
		window.scrollTo(0, 0);
	}
})

// MESSAGE
Template.message.helpers({
	"safeText": function() {
		return escapeHtml(this.text);
	},
	"name": function() {
		return getFullName(this.userId);
	}
});

// MESSAGER LIST
Template.messagerList.helpers({
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
				var alphaUser = loftAlphaUsers.findOne({"userId": Meteor.userId()})
				if(alphaUser != undefined) {
					if(alphaUser.loggedIn === true) {
						console.log("alpha user login true")
						goToLoftPage(PAGES.HOME);
						return false
					} 
					if(alphaUser.loggedIn === false) {
						console.log("alphauser login false")
						goToLoftPage(PAGES.SIGNUPDISCOVER)
						return false
					}
				} else {
				// goToLoftPage(PAGES.SIGNUPDISCOVER)
				goToLoftPage(PAGES.HOME);
				}
				
			} else {
				Session.set("loginError", String(err));
			}
		});
		return false; 
	},
	"click #forgot-password" :function (event) {
		goToLoftPage(PAGES.FORGOT);
	}
});

// REQUESTINVITE

Template.requestInvite.events({
	// Not using request invite anymore -- everything is on welcome.
 "submit #invite-form": function (event, target) {
 	console.log("form submitted")
 	var email = target.find("#invite-email").value;
	var firstName = target.find("#invite-first-name").value;
	var	lastName = target.find("#invite-last-name").value;
	var why = target.find("#invite-why").value;
	Meteor.call("sendEmail", "vasily@tryloft.com", "vasily.andreev13@gmail.com", firstName)
	return false;
 }
})

// REGISTER
Template.register.events({
	"submit #register-form" : function(event, target) {
		console.log("submitted register form")
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
				
				console.log("this is actually getting called correctly")
				Meteor.call("sendRegistrationCompleteEmail", email, "vasily.andreev13@gmail.com", profile.firstName)
				// goToLoftPage(PAGES.PROFILECREATION);
				// goToLoftPage(PAGES.FORGOT);
				// init();
				
			} else {
				Session.set("registerError", String(err));
			}
		});
			goToLoftPage(PAGES.HOME)
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
