POSTS_PER_WEEK = 3
STORY_TYPE = {
	ADMIN: "admin",  // was created by an admin
	COMMENT: "comment",  // was created by a comment
};
stories = new Mongo.Collection("stories");
posts = new Mongo.Collection("posts");
comments = new Mongo.Collection("comments");

// Returns Date corresponding to the time when "today" started.
// Note: we define end of a day at 3am Pacific (5am Central).
function getStartOfToday() {
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
function getStartOfWeek() {
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


Meteor.methods({
	canLove: canLove,
	getPostsLeft: getPostsLeft,
	// Create a new comment for the given post with the given text.
	addComment: function (postId, text) {
		var post = posts.findOne(postId);
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not logged in.");
		}
		if (!post) {
			throw new Meteor.Error("No post with this id.");
		}
		
		comments.insert({
			postId: postId,
			userId: Meteor.userId(),
			text: text,
			createdAt: Date.now()
		});
		posts.update(postId, {$addToSet: {commenters: Meteor.userId()}});

		post.commenters.forEach(function(commenterId) {
			if (commenterId != Meteor.userId()) {
				stories.insert({
					type: STORY_TYPE.COMMENT,
					forUserId: commenterId,
					byUserId: Meteor.userId(),
					postId: postId,
					postOwnerId: post.userId,
					createdAt: Date.now(),
					new: true,
					read: false,
				});
			}
		});
	},
	// Create a new post with the given text.
	addPost: function (text) {
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not logged in.");
		}
		if (getPostsLeft() <= 0) {
			throw new Meteor.Error("Can't make any more posts this week.");
		}

		posts.insert({
			userId: Meteor.userId(),
			text: text,
			createdAt: Date.now(),
			lovedBy: [],  // list of userIds who have loved this post
			// Immediately add the post owner to commenters, so they get a notification
			// when someone comments on their post.
			commenters: [Meteor.userId()]  // list of userIds who have commented on this post
		});
	},
	// Love the given post.
	lovePost: function (postId) {
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
	},
	// Mark all stories as old.
	markAllStoriesOld: function () {
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not logged in.");
		}
		stories.update({forUserId: Meteor.userId()}, {$set: {new: false}}, {multi: true});
	},
	// Mark the story as read.
	markStoryRead: function(storyId) {
		var story = stories.findOne(storyId);
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not logged in.");
		}
		if (!story) {
			throw new Meteor.Error("No story with this id.");
		}
		if (story.forUserId != Meteor.userId()) {
			throw new Meteor.Error("Not your story to change.");
		}
		stories.update(storyId, {$set: {read: true}});
	},
	// Get debug info.
	getDebugInfo: function () {
		var lastLoveTime = new Date(Meteor.user().profile.lastLoveTime);
		var startOfToday = getStartOfToday();
		var startOfWeek = getStartOfWeek();
		return "LastLoveTime: " + lastLoveTime.toUTCString() + " (" + lastLoveTime.getTime() + ")\n " +
			"StartOfToday: " + startOfToday.toUTCString() + " (" + startOfToday.getTime() + ")\n " +
			"StartOfWeek: " + startOfWeek.toUTCString() + " (" + startOfWeek.getTime() + ")\n ";
	}
});
