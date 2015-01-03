if (Meteor.isServer) {
	Meteor.publish("userProfiles", function () {
		return Meteor.users.find({});
	});
	Meteor.publish("newUpdates", function () {
		return updates.find({
			$and: [
				{forUserId: this.userId},
				{new: true},
			],
		}, {
		});
	});
	Meteor.publish("oldUpdates", function (limit) {
		return updates.find({
			$and: [
				{forUserId: this.userId},
				{new: false},
			],
		}, {
			limit: limit,
			sort: {createdAt: -1},
		});
	});
	// Publish a "limit" number of posts to each user.
	Meteor.publish("posts", function (limit) {
		return posts.find({}, {limit: limit, sort: {createdAt: -1}});
	});
	Meteor.publish("comments", function () {
		return comments.find({});
	});
	// Don't allow users to update their profiles.
	Meteor.users.deny({update: function () { return true; }});

	// Called when a user is created.
	Accounts.onCreateUser(function(options, user) {
		// We still want the default hook's 'profile' behavior.
		if (options.profile) {
			user.profile = options.profile;
		}
		user.loft = { };
		// Add initial update.
		updates.insert({
			type: UPDATE_TYPE.ADMIN,
			forUserId: user._id,
			byUserId: "zkyqxvFBCLnhRPPoN",
			postId: "33688fe10f35ff77c9aba9c7",
			createdAt: Date.now(),
			new: true,
			read: false,
		});
		user.readQuoteTime = getStartOfToday().getTime();
		return user;
	});
}
