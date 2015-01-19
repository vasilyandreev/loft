POSTS_PER_WEEK = 3;
UPDATE_TYPE = {
	ADMIN: "admin",  // was created by an admin
	COMMENT: "comment",  // was created by a comment
	LOVE: "love",  // was created by loving post
};
updates = new Mongo.Collection("updates");
posts = new Mongo.Collection("posts");
comments = new Mongo.Collection("comments");
invites = new Mongo.Collection("invites");
quotes = new Mongo.Collection("quotes");

// Returns Date corresponding to the time when "today" started.
// Note: we define end of a day at 3am Pacific (5am Central).
getStartOfToday = function() {
	var startOfToday = new Date(Date.now());
	startOfToday.setUTCMilliseconds(0);
	startOfToday.setUTCSeconds(0);
	startOfToday.setUTCMinutes(0);
	// 11am UTC is 3am Pacific, which is when we reset loves.
	if (startOfToday.getUTCHours() < 11) {
		startOfToday.setUTCDate(startOfToday.getUTCDate() - 1);
	}
	startOfToday.setUTCHours(11);
	return startOfToday;
}

// Returns Date corresponding to the time when the week started.
// Note: we define end of a week at 3am Pacific on a Monday.
getStartOfWeek = function() {
	var startOfWeek = getStartOfToday();
	// Get the day of week where Monday is 0 and Sunday is 6.
	var dayOfWeek = (startOfWeek.getUTCDay() + 6) % 7;
	startOfWeek.setUTCDate(startOfWeek.getUTCDate() - dayOfWeek);
	return startOfWeek;
}

// Return number of posts the user can post this week.
function getPostsLeft() {
	if (!Meteor.userId()) {
		return 0;
	}
	var startOfWeek = getStartOfWeek();
	var postsMade = posts.find({
		userId: Meteor.userId(),
		createdAt: {$gt: startOfWeek.getTime()}
	}).count();
	return POSTS_PER_WEEK - postsMade;
}

// Return true iff the user can love a post today.
function canLove() {
	if (!Meteor.userId()) {
		return false;
	}
	var startOfToday = getStartOfToday();
	return Meteor.user().profile.lastLoveTime < startOfToday.getTime();
}

// Inserts an update if it can't merge with one. 
function insertUpdate(postUserId, postId, recipientId) {
	console.log ("insertComment was called.");
	var commentObject = updates.findOne({
		$and: [
		{forUserId: recipientId},
		{new: true},
		{read: false},
		{postId: postId},
		{type: UPDATE_TYPE.COMMENT}
		]
	});
	// Checking if we can merge with an update
	if (commentObject){ 
		updates.update(
			commentObject._id, 
			{
				$addToSet: {
					byUserIds: Meteor.userId(),
				},
				$set: {
					createdAt: Date.now()
				}
			});
		console.log("Update: success"); 
	}else {
		updates.insert({
			type: UPDATE_TYPE.COMMENT,
			forUserId: recipientId,
			postId: postId,
			postOwnerId: postUserId,
			createdAt: Date.now(),
			new: true,
			read: false,
			byUserIds: [Meteor.userId()],
		});
		console.log("Else: success");
	}
}


Meteor.methods({
	 insertUpdate: insertUpdate,
	canLove: canLove,
	getPostsLeft: getPostsLeft,
	// Create a new comment for the given post with the given text.
	addComment: function (postId, text) {
		if (Meteor.isClient) return;
		var post = posts.findOne(postId);
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not logged in.");
		}
		if (!post) {
			throw new Meteor.Error("No post with this id.");
		}

		var comment = {
			postId: postId,
			userId: Meteor.userId(),
			text: text,
			createdAt: Date.now(),
			forUserId: post.userId,

		};
		comment._id = comments.insert(comment);
		posts.update(postId, {$addToSet: {commenters: Meteor.userId()}});

		post.commenters.forEach(function(commenterId) {
			if (commenterId != Meteor.userId()) {
				insertUpdate(post.userId, postId, commenterId);
			}
		});
			
			
		console.log("Before return comment: success")
		return comment;
	 
},

	// Create a new post with the given text.
	// Returns the created post.
	addPost: function (text) {
		if (Meteor.isClient) return null;
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not logged in.");
		}
		if (!Meteor.userId()) {
			throw new Meteor.Error("Can't make any more posts this week.");
		}

		var post = {
			userId: Meteor.userId(),
			text: text,
			createdAt: Date.now(),
			lovedBy: [],  // list of userIds who have loved this post
			// Immediately add the post owner to commenters, so they get a notification
			// when someone comments on their post.
			commenters: [Meteor.userId()]  // list of userIds who have commented on this post
		};
		post._id = posts.insert(post);
		return post;
	},
	// Check if the given code can be redeemed, and return the whole code object if it can.
	checkCode: function(code){
		if (Meteor.isClient) return;
		var codeObject = invites.findOne({"code": code});
		if(codeObject === undefined){
			throw new Meteor.Error("This invite code doesn't exist.");
		}
		if(codeObject.redeemed){
			throw new Meteor.Error("Your code has already been used.");
		}
		invites.update(codeObject._id, {$set: {"redeemed": true}});
		return codeObject;
	},
	// Return the number of all updates.
	countAllUpdates: function(areNew) {
		if (Meteor.isClient) return 0;
		return updates.find({
			$and: [
				{forUserId: Meteor.userId()},
				{new: areNew},
			],
		}).count(); 
	},
	// Return today's quote string.
	getTodaysQuote: function() {
		if (Meteor.isClient) return "";
		var today = getStartOfToday();
		var todayStr = (today.getUTCMonth() + 1) + "/" + today.getUTCDate() + "/" + today.getUTCFullYear();
		var quoteObject = quotes.findOne({"date": todayStr});
		if (quoteObject === undefined) return "";
		return quoteObject.quote;
	},
	// Love the given post.
	lovePost: function (postId) {
		if (Meteor.isClient) return;
		var post = posts.findOne(postId);
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not logged in.");
		}
		if (!post) {
			throw new Meteor.Error("No post with this id.");
		}
		if (Meteor.userId() == post.userId) {
			throw new Meteor.Error("Can't love your own post.");
		}
		if (!canLove()) {
			throw new Meteor.Error("Can't love another post today.");
		}
		if (post.lovedBy.indexOf(Meteor.userId()) >= 0) {
			throw new Meteor.Error("Can't love a post more than once.");
		}

		posts.update(postId, {$addToSet: {lovedBy: Meteor.userId()}});
		posts.update(postId, {$addToSet: {commenters: Meteor.userId()}});
		Meteor.users.update(Meteor.userId(), {$set: {"profile.lastLoveTime": Date.now()}});

		updates.insert({
			type: UPDATE_TYPE.LOVE,
			forUserId: post.userId,
			postId: postId,
			postOwnerId: post.userId,
			createdAt: Date.now(),
			new: true,
			read: false,
			byUserIds: [Meteor.userId()],
		});
	},
	// Mark all updates as old.
	markAllUpdatesOld: function () {
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not logged in.");
		}
		updates.update({forUserId: Meteor.userId()}, {$set: {new: false}}, {multi: true});
	},
	// Mark the update as read.
	markUpdateRead: function(updateId) {
		if (Meteor.isClient) return;
		var update = updates.findOne(updateId);
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not logged in.");
		}
		if (!update) {
			throw new Meteor.Error("No update with this id.");
		}
		if (update.forUserId != Meteor.userId()) {
			throw new Meteor.Error("Not your update to change.");
		}
		updates.update(updateId, {$set: {read: true}});
	},
	// Get debug info.
	getDebugInfo: function () {
		if (!Meteor.userId()) return "";
		var lastLoveTime = new Date(Meteor.user().profile.lastLoveTime);
		var startOfToday = getStartOfToday();
		var startOfWeek = getStartOfWeek();
		return "LastLoveTime: " + lastLoveTime.toUTCString() + " (" + lastLoveTime.getTime() + ")\n " +
			"StartOfToday: " + startOfToday.toUTCString() + " (" + startOfToday.getTime() + ")\n " +
			"StartOfWeek: " + startOfWeek.toUTCString() + " (" + startOfWeek.getTime() + ")\n ";
	},
	// Return post with the given id. Used to fetch the selected post if it's not
	// already loaded on the client.
	getPost: function (postId) {
		if (Meteor.isClient) return null;
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not logged in.");
		}
		var result = posts.findOne(postId);
		if (result === undefined) {
			throw new Meteor.Error("No such post.");
		}
		return result;
	},
	// Get the text of the post draft.
	getPostDraftText: function() {
		if (!Meteor.userId()) return "";
		return Meteor.user().postDraftText;
	},
	// Return comments for the corresponding posts.
	loadComments: function(postIds) {
		if (Meteor.isClient) return null;
		var result = comments.find({postId: {$in: postIds}}).fetch();
		return result;
	},
	// Returns posts.
	loadPosts: function(startTime, limit) {
		if (Meteor.isClient) return null;
		var result = posts.find({createdAt: {$lt: startTime}}, {sort: {createdAt: -1}, limit: limit}).fetch();
		return result;
	},
	// Return updates.
	loadUpdates: function(areNew, startTime, limit) {
		if (Meteor.isClient) return null;
		var result = updates.find({
			$and: [
				{forUserId: Meteor.userId()},
				{new: areNew},
				{createdAt: {$lt: startTime}},
			],
		}, {
			limit: limit,
			sort: {createdAt: -1},
		}).fetch(); 
		return result;
	},
	// Called after the user read the quote.
	readQuote: function() {
		if (!Meteor.userId()) return "";
		Meteor.users.update(Meteor.userId(), {$set: {readQuoteTime: getStartOfToday().getTime()}});
	},
	// Set the text of the post draft.
	setPostDraftText: function(text) {
		if (!Meteor.userId()) return "";
		Meteor.users.update(Meteor.userId(), {$set: {postDraftText: text}});
	},
	/*sendEmail: function (to, subject, text) {
	    // Let other method calls from the same client start running,
	    // without waiting for the email sending to complete.
	    this.unblock();

	    // don’t allow sending email unless the user is logged in
	    if (!Meteor.user())
	    	throw new Meteor.Error(403, “not logged in”);

	    // and here is where you can throttle the number of emails this user
	    // is allowed to send per day

	    Email.send({
	    	to: to,
	    	from: Meteor.user().emails[0].address,
	    	subject: subject,
	    	text: text
	    });
	},*/
	// Return true iff we should show the quote to this user.
	shouldShowQuote: function() {
		if (!Meteor.userId()) return false;
		if (Meteor.call("getTodaysQuote").length <= 0) return false;
		var readQuoteTime = Meteor.user().readQuoteTime;
		if (readQuoteTime === undefined) return true;
		return readQuoteTime < getStartOfToday().getTime();
	},
});
