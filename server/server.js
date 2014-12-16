if (Meteor.isServer) {
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

	// Called when a user is created.
	Accounts.onCreateUser(function(options, user) {
		// We still want the default hook's 'profile' behavior.
		if (options.profile) {
			user.profile = options.profile;
		}
		user.loft = { };
		// Add initial story.
		stories.insert({
			userId: user._id,
			text: "Welcome to Loft.",
			createdAt: Date.now(),
		});
		return user;
	});
}
