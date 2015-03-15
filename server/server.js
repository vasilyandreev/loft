if (Meteor.isServer) {
	Meteor.publish("userProfiles", function () {
		return Meteor.users.find({});
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
			byUserIds: ["vX7ke7bxg6WuEN9L9"],
			postId: "C8ihxoTF2TKzhZoTy",
			createdAt: Date.now(),
			new: true,
			read: false,
		});
		user.readQuoteTime = getStartOfToday().getTime();
		return user;
	});
}
