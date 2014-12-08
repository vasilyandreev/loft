posts = new Mongo.Collection("posts");

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
			return false;
		}
		var startOfToday = new Date(Date.now());
		startOfToday.setUTCMilliseconds(0);
		startOfToday.setUTCSeconds(0);
		startOfToday.setUTCMinutes(0);
		// 11am UTC is 3am Pacific, which is when we reset trophies.
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
