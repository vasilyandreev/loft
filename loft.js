POSTS_PER_WEEK = 3
posts = new Mongo.Collection("posts");
comments = new Mongo.Collection("comments");

// Returns Date corresponding to the time when "today" started.
// Note: we define end of a day at 3am Pacific (5am Central).
function getStartOfToday() {
	var startOfToday = new Date(Date.now());
	startOfToday.setUTCMilliseconds(0);
	startOfToday.setUTCSeconds(0);
	startOfToday.setUTCMinutes(0);
	// 11am UTC is 3am Pacific, which is when we reset trophies.
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
		createdAt: { $gt: startOfWeek.getTime() }
	}).count();
	return POSTS_PER_WEEK - postsMade;
}

// Return true iff the user can give a trophy today.
function canTrophy() {
	if (!Meteor.userId()) {
		return false;
	}
	var startOfToday = getStartOfToday();
	return Meteor.user().loft.lastTrophyTime < startOfToday.getTime();
}

Meteor.methods({
	canTrophy: canTrophy,
	getPostsLeft: getPostsLeft,
	// Create a new comment for the given post with the given text.
	addComment: function (postId, text) {
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not authorized.");
		}
		
		var profile = Meteor.user().profile;
		comments.insert({
			postId: postId,
			userId: Meteor.userId(),
			name: profile.firstName + " " + profile.lastName,
			text: text,
			createdAt: Date.now()
		});
	},
	// Create a new post with the given text.
	addPost: function (text) {
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not authorized.");
		}
		if (getPostsLeft() <= 0) {
			throw new Meteor.Error("Can't make any more posts this week.");
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
	// Add a trophy for the given post.
	addTrophy: function (postId) {
		var post = posts.findOne(postId);
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not authorized.");
		}
		if (!post) {
			throw new Meteor.Error("No post with this id.");
		}
		if (Meteor.userId() == post.userId) {
			throw new Meteor.Error("Can't give a trophy to yourself.");
		}
		if (!canTrophy()) {
			throw new Meteor.Error("Can't give any more trophies today.");
		}
		posts.update(postId, { $addToSet: { trophiesBy: Meteor.userId() } });
		Meteor.users.update(Meteor.userId(), { $set: { loft: { lastTrophyTime: Date.now() } } });
	},
	// Get debug trophy info.
	getDebugInfo: function () {
		var lastTrophyDate = new Date(Meteor.user().loft.lastTrophyTime);
		var startOfToday = getStartOfToday();
		var startOfWeek = getStartOfWeek();
		return "LastTrophyDate: " + lastTrophyDate.toUTCString() + " (" + lastTrophyDate.getTime() + ")\n " +
			"StartOfToday: " + startOfToday.toUTCString() + " (" + startOfToday.getTime() + ")\n " +
			"StartOfWeek: " + startOfWeek.toUTCString() + " (" + startOfWeek.getTime() + ")\n ";
	}
});
