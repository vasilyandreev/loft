if (Meteor.isServer) {
	Meteor.publish("userProfiles", function () {
		return Meteor.users.find({});
	});
	Meteor.publish("stories", function () {
		return stories.find({
			userId: this.userId
		});
	});
	Meteor.publish("posts", function () {
		return posts.find({
			//userId: { $ne: this.userId }
		});
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
		// Add initial story.
		stories.insert({
			type: STORY_TYPE.ADMIN,
			userId: user._id,
			// TODO: adminId: 0,
			// TODO: postId: 0,
			createdAt: Date.now(),
		});
		return user;
	});
}
