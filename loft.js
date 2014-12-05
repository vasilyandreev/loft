Posts = new Mongo.Collection("posts");

if (Meteor.isServer) {
	Meteor.publish("posts", function () {
		return Posts.find({
			userId: { $ne: this.userId }
		});
	});
	Meteor.startup(function () {
		// code to run on server at startup
	});
}

// This code only runs on the client
if (Meteor.isClient) {
	Meteor.subscribe("posts");

	Template.body.helpers({
		posts: function () {
			return Posts.find({}, {sort: {createdAt: -1}});
		}
	});

	Template.body.events({
		"submit .new-post": function (event) {
			console.log("submit .new-post");
			console.log(event);

			var text = event.target.text.value;
			Meteor.call("addPost", text);

			// Clear form
			event.target.text.value = "";

			// Prevent default form submit
			return false;
		}
	});

	Template.post.events({
		"click .trophy-button": function () {
			Meteor.call("addTrophy", this._id);
		}
	});

	Accounts.ui.config({
		passwordSignupFields: "EMAIL_ONLY"
	});
}

Meteor.methods({
	addPost: function (text) {
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not authorized.");
		}
		Posts.insert({
			userId: Meteor.userId(),
			text: text,
			createdAt: new Date(),
			trophiesBy: [] // list of userIds who have given this post a trophy
		});
	},
	addTrophy: function (postId) {
		var post = Posts.findOne(postId);
		if (Meteor.userId() == post.userId) {
			throw new Meteor.Error("Can't give a trophy to yourself.");
		}
		Posts.update(postId, {$addToSet: { trophiesBy: Meteor.userId() } });
	}
});
