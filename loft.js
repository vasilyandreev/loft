POSTS_PER_WEEK = 3;
UPDATE_TYPE = {
	ADMIN: "admin",  // was created by an admin
	COMMENT: "comment",  // was created by a comment
	LOVE: "love",  // was created by loving post
	MESSAGE: "message", // was created by sending a message
	FOLLOWREQUEST: "followRequest",
	INVITE: "invite",
	INVITEDNOTIFICATION: "invitedNotification",
};

//Collections
updates = new Mongo.Collection("updates");
posts = new Mongo.Collection("posts");
comments = new Mongo.Collection("comments");
invites = new Mongo.Collection("invites");
quotes = new Mongo.Collection("quotes");
messages = new Mongo.Collection("messages");
commentDrafts = new Mongo.Collection("commentDrafts")
followers = new Mongo.Collection("followers")
usersInfo = new Mongo.Collection("usersInfo")
loftAlphaUsers = new Mongo.Collection("loftAlphaUsers")
waitList = new Mongo.Collection("waitList")


// Setting up serach
followers.initEasySearch(['followerName'], {
    'limit' : 20,
    'use' : 'mongo-db'
});


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

findInvitedIds = function(invitedUsers, length){
	var result = []
	for (var i = 0; i < length; i++) {
	result.push(invitedUsers[i].followerId) 
	}
	result.push(Meteor.userId())
	return result 
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
	// return 1
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
function insertCommentUpdate(postUserId, postId, recipientId) {
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

function insertMessageUpdate(postUserId, postId, targetId) {
	console.log("getting to insert message update")
		// check if there's already a conversation between two people
		var messageObject = updates.findOne({
			$and: [
			{senderId: Meteor.userId()},
			{postId: postId},
			{new: true},
			{read: false},
			{type: UPDATE_TYPE.MESSAGE}
			]
		});
		if(messageObject){
			console.log("insert message update IF")
			updates.update(messageObject._id, {$set:{createdAt: Date.now()}})
		}	else{
			console.log("insert message update else")
				if(Meteor.userId() === postUserId) {
				  updates.insert({
					type: UPDATE_TYPE.MESSAGE,
					senderId: Meteor.userId(),
					forUserId: targetId,
					postId: postId,
					postOwnerId: postUserId,
					createdAt: Date.now(),
					new: true,
					read: false,
				//byUserIds: [Meteor.userId(), postUserId],
			})} else {
					updates.insert({
						type: UPDATE_TYPE.MESSAGE,
						senderId: Meteor.userId(),
						forUserId: postUserId,
						postId: postId,
						postOwnerId: postUserId,
						createdAt: Date.now(),
						new: true,
						read: false,
				//byUserIds: [Meteor.userId(), postUserId],
			}) 
				}
			console.log("Else: success");
		}}



	Meteor.methods({
		insertMessageUpdate: insertMessageUpdate,
		insertCommentUpdate: insertCommentUpdate,
		canLove: canLove,
		getPostsLeft: getPostsLeft,
		findInvitedIds: findInvitedIds,
	// Create a new comment for the given post with the given text.
	acceptUserRequest: function (userId, updateId, followerName, ownerName){
		if (Meteor.isClient) return;
		console.log("inside acceptUserRequest")
		updates.update(updateId, {$set: {accepted: true, new: false, read: true}})
		followers.insert({
					ownerId: Meteor.userId(),
					ownerName: ownerName,
					followerName: followerName,
					followerId: userId,
					createdAt: Date.now(),
					new: true,
					relationshipScore: 0,
					invited: false,
					accepted: true,
				//byUserIds: [Meteor.userId(), postUserId],
			})
		posts.update({$and:[
			{userId: Meteor.userId()},
			{allowAllFollowers: true}
			]},
			{$addToSet: {invited: userId}},
			{multi: true}
			)

		posts.update({$and:[
			{userId: Meteor.userId()},
			{isPublic: true}
			]},
			{$addToSet: {invited: userId}},
			{multi: true}
			)

		var result = {
			ownerId: Meteor.userId(),
			ownerName: ownerName,
			followerName: followerName,
			followerId: userId,
			createdAt: Date.now(),
			new: true,
			relationshipScore: 0,
			invited: false,
			accepted: true
		}
		return result
	},

	addComment: function (postId, text, ownerName, commenterName) {
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
				insertCommentUpdate(post.userId, postId, commenterId);
			}
		});	

		var followerObject = followers.findOne({$and:[
				{ownerId: post.userId},
				{ownerId:{$ne: Meteor.userId()}},
				{followerId: Meteor.userId()}
				]})
		//Checking if a follower relationship exists between this user and the post owner
		if(followerObject){
			console.log("follower object" + followerObject)
			console.log("follower object id" + followerObject._id)
			followers.update(followerObject._id, {$inc: {relationshipScore: .5}})
		} else if (post.userId != Meteor.userId()){
			console.log("inside else of addComment")
			followers.insert({
					ownerId: post.userId,
					ownerName: ownerName,
					followerName: commenterName,
					followerId: Meteor.userId(),
					createdAt: Date.now(),
					new: true,
					relationshipScore: 1,
					invited: false,
					// So they don't have a "relationship" yet outside of our DB
					accepted: false

			})
		}
		console.log("Before return comment: success")
		return comment;

	},
	addMessage: function (targetId, postId, text, ownerName, senderName) {
		if (Meteor.isClient) return;
		var post = posts.findOne(postId);
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not logged in.");
		}
		if (!post) {
			throw new Meteor.Error("No post with this id.");
		}
		var message = {
			postId: postId,
			userId: Meteor.userId(),
			text: text,
			createdAt: Date.now(),
			targetUserId: targetId,
			postOwnerId: post.userId,
			read: false,
		};
		message._id = messages.insert(message);
		messages.update(postId, {$addToSet: {targetUserIds: targetId}});
		posts.update(postId, {$addToSet: {messagesFrom: targetId}});
		insertMessageUpdate(post.userId, postId, targetId);	
		console.log("Before return comment: success");

		var followerObject = followers.findOne({$and:[
				{ownerId: post.userId},
				{ownerId:{$ne: Meteor.userId()}},
				{followerId: Meteor.userId()}
				]})
		//Checking if a follower relationship exists between this user and the post owner
		if(followerObject){
			console.log("follower object" + followerObject)
			console.log("follower object id" + followerObject._id)
			followers.update(followerObject._id, {$inc: {relationshipScore: 1}})
		} else if (post.userId != Meteor.userId()){
			console.log("inside else of addMessage")
			followers.insert({
					ownerId: post.userId,
					ownerName: ownerName,
					followerName: senderName,
					followerId: Meteor.userId(),
					createdAt: Date.now(),
					new: true,
					relationshipScore: 2,
					invited: false,
					// So they don't have a "relationship" yet outside of our DB
					accepted: false

			})
		}

		return message;
	},

	// Create a new post with the given text.
	// Returns the created post. 
	addPost: function (text, invitedUsers, canInvite, isPublic, allowFeatured, allowAllFollowers) {
		console.log("in addPost")		
		if (Meteor.isClient) return null;
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not logged in.");
		}
		if (!Meteor.userId()) {
			throw new Meteor.Error("Can't make any more posts this week.");
		}

		var length = invitedUsers.length;
		console.log("length" + length)
		var invitedIds = findInvitedIds(invitedUsers, length)

				
		console.log("invited Ids" + invitedIds)


		var post = {
			userId: Meteor.userId(),
			text: text,
			createdAt: Date.now(),
			lovedBy: [],  // list of userIds who have loved this post
			// Immediately add the post owner to commenters, so they get a notification
			// when someone comments on their post.
			commenters: [Meteor.userId()],  // list of userIds who have commented on this post
			messagesFrom:[],
			invited: invitedIds,
			canInvite: canInvite,
			isPublic: isPublic,
			allowFeatured: allowFeatured,
			allowAllFollowers: allowAllFollowers
		};

		//	Adding all current followers to see the post 
		if(allowAllFollowers === true){
			var invitedUsers = followers.find({ownerId: Meteor.userId()}).fetch()
			var length = invitedUsers.length;
			var invitedIds = findInvitedIds(invitedUsers, length)
		
			var post = {
			userId: Meteor.userId(),
			text: text,
			createdAt: Date.now(),
			lovedBy: [],  // list of userIds who have loved this post
			// Immediately add the post owner to commenters, so they get a notification
			// when someone comments on their post.
			commenters: [Meteor.userId()],  // list of userIds who have commented on this post
			messagesFrom:[],
			invited: invitedIds,
			canInvite: canInvite,
			isPublic: isPublic,
			allowAllFollowers: allowAllFollowers
		};
		}

		if(isPublic === true){
			var invitedUsers = followers.find({ownerId: Meteor.userId()}).fetch()
			var length = invitedUsers.length;
			var invitedIds = findInvitedIds(invitedUsers, length)
		
			var post = {
			userId: Meteor.userId(),
			text: text,
			createdAt: Date.now(),
			lovedBy: [],  // list of userIds who have loved this post
			// Immediately add the post owner to commenters, so they get a notification
			// when someone comments on their post.
			commenters: [Meteor.userId()],  // list of userIds who have commented on this post
			messagesFrom:[],
			invited: invitedIds,
			canInvite: canInvite,
			isPublic: isPublic,
			allowAllFollowers: allowAllFollowers
		};
		}

		post._id = posts.insert(post);
		return post;
	},
	addToWaitList: function (email, firstName, lastName, why){
		waitList.insert({
			email: email,
			firstName: firstName,
			lastName: lastName,
			why: why,
			createdAt: Date.now(),
			accepted: false,
		})
	},
	addInviteUpdate: function ( postId, userId1, message1, userId2, message2, userId3, message3) {
	if (Meteor.isClient) return;
	var post = posts.findOne({"_id": postId})
	var userId = post.userId
		updates.insert({
			type: UPDATE_TYPE.INVITE,
			postId: postId,
			forUserId: userId1,
			createdAt: Date.now(),
			new: true,
			read: false,
			fromUserId: Meteor.userId(),
			invitemessage: message1
		});
		updates.insert({
			type: UPDATE_TYPE.INVITE,
			postId: postId,
			forUserId: userId2,
			createdAt: Date.now(),
			new: true,
			read: false,
			fromUserId: Meteor.userId(),
			invitemessage: message2
		});
		updates.insert({
			type: UPDATE_TYPE.INVITE,
			postId: postId,
			forUserId: userId3,
			createdAt: Date.now(),
			new: true,
			read: false,
			fromUserId: Meteor.userId(),
			invitemessage: message3
		});

		if(userId1 != ""){
			updates.insert({
				type: UPDATE_TYPE.INVITEDNOTIFICATION,
				postId: postId,
				forUserId: userId,
				createdAt: Date.now(),
				new: true,
				read: false,
				fromUserId: Meteor.userId(),
				invitedUserId: userId1,
			});
			posts.update(postId, {$addToSet: {invited: userId1}});
		}
		if(userId2 != ""){
			updates.insert({
				type: UPDATE_TYPE.INVITEDNOTIFICATION,
				postId: postId,
				forUserId: userId,
				createdAt: Date.now(),
				new: true,
				read: false,
				fromUserId: Meteor.userId(),
				invitedUserId: userId2,
			});
			posts.update(postId, {$addToSet: {invited: userId2}});
		}
		if(userId3 != ""){
			updates.insert({
				type: UPDATE_TYPE.INVITEDNOTIFICATION,
				postId: postId,
				forUserId: userId,
				createdAt: Date.now(),
				new: true,
				read: false,
				fromUserId: Meteor.userId(),
				invitedUserId: userId3,
			});
			posts.update(postId, {$addToSet: {invited: userId3}});
		}

	},
	addUserInfo: function(userId, readingtext, listeningtext, thinkingtext, workingtext, aboutmetext){
		if (Meteor.isClient) return;
		console.log("addUserInfo is called.")
		console.log("userId" + userId)
		console.log("reading" + readingtext)
		console.log("listening" + listeningtext)
		console.log("thinking" + thinkingtext)
		console.log("working" + workingtext)
		console.log("working" + aboutmetext)
		var userInfo = {
			userId: userId,
			reading: readingtext,
			listening: listeningtext,
			thinking: thinkingtext,
			working: workingtext,
			aboutMe: aboutmetext,
			createdAt: Date.now(),
		};

		console.log("checking userinfo" + userInfo)
		userInfo._id = usersInfo.insert(userInfo);
		return userInfo
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
			{type:{$ne: "message"}}
			],
		}).count(); 
	},
	countAllMessages: function(areNew) {
	if (Meteor.isClient) return 0;
	return updates.find({
		$and: [
		{forUserId: Meteor.userId()},
		{new: areNew},
		{type: "message"}
		],
	}).count(); 
	},
	editPost: function (postId, newText){
		console.log("GOT TO EDIT POST");
		console.log("THIS IS THE POST ID" + postId)
		console.log("THIS IS THE NEW TEXT" + newText)
		if (Meteor.isClient) return;
		if (newText === undefined) {
			throw new Meteor.Error("Text is undefined")
		} else {
			posts.update(postId, {$set:{"text": newText}})
		}
	},
	findEmail: function (email){
		if (Meteor.isClient) return;
		console.log("find email" + email)
		var user =	Meteor.users.findOne({ emails: { $elemMatch: { address: email } } })
		console.log("user" + user)
		var user1 = Meteor.users.findOne({"emails.address": email})
		console.log("user1" + user1)
		console.log("user1" + user1._id)
		var result = user1._id 
		return result
		// var user2 = Meteor.users.findOne({"emails[0].address": email})
		// console.log("user1" + user2)
	},
	followUserRequest: function (userId, messageText){
		if (Meteor.isClient) return;
		console.log("inside of follow user message text" + messageText)
		console.log("inside followUser")
		var requestObject = updates.findOne({
			$and: [
			{type: "followRequest"},
			{forUserId: userId},
			{fromUserId: Meteor.userId()}
			]
		})
		console.log("requestObject" + requestObject)
		if(requestObject === undefined) {
			console.log("inside of follow user if")
			updates.insert({
			type: UPDATE_TYPE.FOLLOWREQUEST,
			forUserId: userId,
			createdAt: Date.now(),
			new: true,
			read: false,
			fromUserId: Meteor.userId(),
			accepted: false,
			message: messageText
		});
			
			
		} else {
			console.log("inside of follow user else")
			
		
	}
		var result = {
			type: UPDATE_TYPE.FOLLOWREQUEST,
			forUserId: userId,
			createdAt: Date.now(),
			new: true,
			read: false,
			fromUserId: Meteor.userId(),
			accepted: false,
			message: messageText
			}

		return result
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
	generateInviteCode: function (firstName, lastName, code) {
		if (Meteor.isClient) return null;
		console.log("it got in here")
		var invite = {
			code: code,
			firstName: firstName,
			lastName: lastName,
			redeemed: false,
			createdBy: Meteor.userId()
		}

		invite._id = invites.insert(invite);
			
		var result = {
			code: code,
			firstName: firstName,
			lastName: lastName,
			redeemed: false,
			createdBy: Meteor.userId()
		}

		console.log("it worked ")
		return result
	},
	loadInvites: function () {
		if (Meteor.isClient) return null;
		var result = invites.find({}).fetch()
		return result
	},

	// Love the given post.
	lovePost: function (postId, ownerName, lovedByName) {
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
		var followerObject = followers.findOne({$and:[
				{ownerId: post.userId},
				{ownerId:{$ne: Meteor.userId()}},
				{followerId: Meteor.userId()}
				]})
		//Checking if a follower relationship exists between this user and the post owner
		if(followerObject){
			console.log("follower object" + followerObject)
			console.log("follower object id" + followerObject._id)
			followers.update(followerObject._id, {$inc: {relationshipScore: 2}})
		} else if (post.userId != Meteor.userId()){
			console.log("inside else of addComment")
			followers.insert({
					ownerId: post.userId,
					ownerName: ownerName,
					followerName: lovedByName,
					followerId: Meteor.userId(), 
					createdAt: Date.now(),
					new: true,
					relationshipScore: 2,
					invited: false,
					// So they don't have a "relationship" yet outside of our DB
					accepted: false

			})
		}

	},
	// Mark all updates as old.
	markAllUpdatesOld: function () {
		if (!Meteor.userId()) {
			throw new Meteor.Error("Not logged in.");
		}
		updates.update({$and:[
			{forUserId: Meteor.userId()},
			// {type:{$ne: "message"}},
			{type:{$ne: "followRequest"}},
			]},
			{$set: {new: false}}, {multi: true});
		updates.update({
			forUserId: Meteor.userId()},
			{$set: {new: false}}, {multi: true});
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
	markMessagesRead: function (post, targetId){
		if (Meteor.isClient) return;
		messages.update({$and:[{postId: post},{targetUserId: targetId}]}, {$set:{read: true}}, {multi: true})
	},
	maybeLater: function (userId, updateId){
		updates.update(updateId, {$set: {accepted: "later", new: false, read: true}})
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
	getUserId: function (first, last) {
		if (Meteor.isClient) return null;
		console.log("inside get user id successful")
			var user = Meteor.users.findOne({$and: [
				{"profile.lastName": last},
				{"profile.firstName": first},
			]
		})
			console.log("user id"  + user)
			console.log("user id"  +  user._id)
			var result = user._id
			return result

	},
	// Get the text of the post draft.
	getPostDraftText: function() {
		if (!Meteor.userId()) return "";
		return Meteor.user().postDraftText;
	},
	// Return text of comment drafts.
	 getCommentDraftText: function (postIds){
	 	if (!Meteor.userId()) return "";

	 	var post = postId
	 	console.log(post)
	 	console.log(Meteor.userId())


	 	
	 	var draftObject = commentDrafts.findOne({
			$and: [
			{userId: Meteor.userId()},
			{postId: post}
			]
		})

		// var draftObject = commentDrafts.findOne({
		// 	userId: Meteor.userId()
		// })

		console.log("this is draftObject" + draftObject)
	 	var result = {
	 		userId: Meteor.userId(),
	 		postId: postId,
	 		// text: draftObject.text
	 	}

	 	if (draftObject){
	 		var result = draftObject
	 	} else{
	 		var result = "What do you think?"
	 	}
	
	 	 return draftObject
	 },
	loadDrafts: function (postIds) {
		if (Meteor.isClient) return null;
		var result = commentDrafts.find({postId: {$in: postIds}}).fetch();
		return result;
	},
	// Return comments for the corresponding posts.
	loadComments: function(postIds) {
		if (Meteor.isClient) return null;
		var result = comments.find({postId: {$in: postIds}}).fetch();
		return result;
	},
	loadMessages: function(postIds) {
		if (Meteor.isClient) return null;
		var result = messages.find({postId: {$in: postIds}}).fetch();
		return result;
	},
	// Returns posts.
	loadPosts: function(startTime, limit) {
		if (Meteor.isClient) return null;
		var result = posts.find({createdAt: {$lt: startTime}}, {sort: {createdAt: -1}, limit: limit}).fetch();
		return result;
	},
	loadLoftAlphaUsers: function() {
		if (Meteor.isClient) return null;
		console.log('loading alpha users ')
		 // var result = followers.find({ownerId: Meteor.userId()}).fetch()
		 var result = loftAlphaUsers.find({}).fetch()
		console.log("result" + result)
		return result;
	},
	// Return followers.
	loadFollowers: function() {
		if (Meteor.isClient) return null;
		console.log('loading followers ')
		 // var result = followers.find({ownerId: Meteor.userId()}).fetch()
		  var result = followers.find({}).fetch()
		console.log("result" + result)
		return result;
	},
	loadFollowerUpdates: function (){
			if (Meteor.isClient) return null;
			var result = updates.find({type: "followRequest"}).fetch()
			return result
	},
	// Return updates.
	loadUpdates: function(areNew, startTime, limit) {
		if (Meteor.isClient) return null;
		var result = updates.find({
			$and: [
			{forUserId: Meteor.userId()},
			{new: areNew},
			{createdAt: {$lt: startTime}},
			{type:{$ne: "message"}}
			],
		}, {
			limit: limit,
			sort: {createdAt: -1},
		}).fetch(); 
		return result;
	},
	loadUsersInfo: function (){
		if (Meteor.isClient) return null;
		 var result = usersInfo.find({}).fetch()
		 return result;
	},

	loadMessageUpdates: function(areNew, startTime, limit) {
	if (Meteor.isClient) return null;
	var result = updates.find({
		$and: [
		{forUserId: Meteor.userId()},
		{new: areNew},
		{createdAt: {$lt: startTime}},
		{type: "message"}
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
	sendEmail: function (to, from, firstName){
		if (Meteor.isClient) return null;
		if (!Meteor.userId()) return "";
		console.log("go to meteor call");
		this.unblock();
		Email.send({
      	to: to,
      	from: from,
      	subject: "Welcome to Loft.",
      	text: firstName + " thank you for being interested in Loft. Your support is immesurable."
    });
	},
	sendSignUpEmail: function (email, firstName, lastName, why){
		// Meteor.call("sendSignUpEmail", email, firstName, lastName, why)
		if (Meteor.isClient) return null;
		// if (!Meteor.userId()) return "";
		console.log("go to meteor call correctly");
		this.unblock();
		Email.send({
      	to: "vasily@tryloft.com",
      	from: "vasily.andreev13@gmail.com",
      	subject: "New Sign-Up",
      	text: email + "\n" + firstName + "\n" + lastName + "\n" + why
    });
	},
	sendRegistrationCompleteEmail: function (to, from, firstName){
		if (Meteor.isClient) return null;
		if (!Meteor.userId()) return "";
		console.log("got inside send Registration")
		console.log(to)
		console.log(from)
		console.log(firstName)
		this.unblock();
		// Updating waitList since the user successfully made an account. may cause problems with duplicate e-mail uses???
		waitList.update({email: to}, {$set:{accepted: false}}) 
		var loft = "Welcome to Loft."
		var loftLink = loft.link("http://www.tryloft.com")
		var twitter = "You can do it in 140 characters."
		var twitterLink = "http://bit.ly/1EkM5YZ "
		var facebook = "Or on Facebook."
		var facebooklink = "http://on.fb.me/1b8RxVf"
		Email.send({
      	to: to,
      	from: "vasily@tryloft.com",
      	subject: "Welcome to Loft! Here's three things and a number.",
      	text: "Hey, " + firstName+"!"+ "\n" + "\n" +
		"Thanks for signing up for Loft. there are three things we would love for you to do:"+ "\n" +  "\n" +
		"1. It’s a beautiful spring day (at least here in Chicago), so make sure you go out and enjoy it, and not spend your whole day on Loft because although loft is awesome, outside is pretty awesome too."+ "\n" + 
		"2. Go and make your first post on Loft! You’re the only person in the world that can say what’s on your mind. Isn’t that cool? If you’re not ready, then just go and comment on some posts you find interesting. Don’t be that person at the party who stands in the corner and doesn’t talk to anyone (i’m that person, so there’s no need for two of us)." + "\n" +  "\n" +
		"3. Imagine a place where all of the interesting people you know are all in one place talking about cool stuff. That place can actually exist!! All you have to do is tell your friends about Loft. In 140 characters: " + twitterLink + ". Or with Facebook: " + facebooklink + " ." + "\n" + "\n" +

		"Phew. There’s three things. Finally, as promised, here’s a number:"+ "\n" + "\n" +
		"309-255-6991"+ "\n" + "\n" +

		"It’s my personal #. Feel free to call or text anytime (i’ll be keeping it on loud at night) to tell me that Loft is awesome, or there’s something horribly wrong with it, or if you just feel like chatting. Whatever you want, friend." + "\n" + "\n" +

		"Welcome to Loft." + "\n" +  "\n" +

		"vasily"

		})
		return true
	},
	sendMessageEmail: function (to, from, firstName, senderName, text){
	if (Meteor.isClient) return null;
		if (!Meteor.userId()) return "";
		var post = posts.findOne(to);
		var userId = post.userId
		console.log("got inside send message")
		var user = Meteor.users.findOne({"_id": userId})
		var email = user.emails[0].address
		console.log(to)
		console.log(email)
		console.log(from)
		console.log(firstName)
		console.log(text)
		this.unblock();
		Email.send({
      	to: email,
      	from: "Loft@tryloft.com",
      	subject: senderName + " sent you a message! ",
      	text: firstName + ", " + senderName + " sent you a message: " + "" + text + "" + "\n" +  "\n" +
      	"Go read it on Loft: tryloft.com." + "\n" +  "\n" +
      	"-- Your Friends at Loft"
		})
	},
	sendCommentEmail: function (postOwnerId, from, senderName, text){
		// Meteor.call("sendCommentEmail", post.userId, "Loft@tryloft.com", commenterName, text)
	if (Meteor.isClient) return null;
		if (!Meteor.userId()) return "";
		if(postOwnerId == Meteor.userId()){
			return 
		}
		console.log("got inside send message")
		var user = Meteor.users.findOne({"_id": postOwnerId})
		var email = user.emails[0].address
		console.log(email)
		console.log(from)
		console.log(text)
		this.unblock();
		Email.send({
      	to: email,
      	from: "Loft@tryloft.com",
      	subject: senderName + " commented on your post!",
      	text: senderName + " commented on your post: " + "" + text + "" + "\n" +  "\n" +
      	"Go read it on Loft: tryloft.com." + "\n" +  "\n" +
      	"-- Your Friends at Loft"
//       	text:  senderName + " ,thank you for signing-up for Loft  <br> There are three things we would love for you to do: <br>" + "1) It's March and it's finally beautiful outside, at least here in the Midwest, so make sure you go outside and enjoy
//       the feeling of spring. "  + "\n" + "
//       2)  Imagine a place with all of the most interesting people you know, talking about awesome shit. 
// Help make this happen by inviting your friends. "  + "\n" + "
// 3) Go and make your first post in Loft. Share whatever is on your mind. It'll be awesome. "  + "\n" + "

// Now, as promised, here's a number: "  + "\n" + "
// 309-255-6991
// That's my personal cell-phone number. Call or text anytime, to say Loft is awesome, or that something is horribly wrong. "  + "\n" + "
// Either way, I'll appreciate it." 
		})
	},
	sendOwnerMessageEmail: function (to, from, senderName, text){
		if (Meteor.isClient) return null;
		if (!Meteor.userId()) return "";
		console.log("got inside send  owner message")
		var user = Meteor.users.findOne({"_id": to})
		var email = user.emails[0].address
		console.log(to)
		console.log(email)
		console.log(from)
		console.log(text)
		this.unblock();
		Email.send({
      	to: to,
      	from: from,
      	subject: senderName + " sent you a message!",
      	text: senderName + " sent you a message: " + "" + text + "" + "\n" +  "\n" +
      	"Go read it on Loft: tryloft.com." + "\n" +  "\n" +
      	"-- Your Friends at Loft"
		})
	},
	sendFollowRequestEmail: function (userId, from, name, text){
		if (Meteor.isClient) return null;	
		if (!Meteor.userId()) return "";
		var user = Meteor.users.findOne(userId)
		var email = user.emails[0].address
		console.log("go to meteor call");
		this.unblock();
		Email.send({
      	to: email,
      	from: "Loft@tryloft.com",
      	subject: name + " wants to follow you!",
      	text: name + " wants to follow you!" + "" + text + "" + "\n" +  "\n" +
      	"To accept it go to: tryloft.com." + "\n" +  "\n" +
      	"-- Your Friends at Loft"
    });
	},
	// Set the text of the post draft.
	setPostDraftText: function(text) {
		if (!Meteor.userId()) return "";
		Meteor.users.update(Meteor.userId(), {$set: {postDraftText: text}});
	},
	setCommentDraftText: function (text, postId) {
		console.log("getting inside of server")
		if (!Meteor.userId()) return "";

		var id = postId

		commentDrafts.update({
			$and: [
			{userId: Meteor.userId()},
			{postId: id}
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

		var result = {
			userId: Meteor.userId(),
			text: text,
			postId: postId 
		}
	return result 
	},
	setMessageDraftText: function(text, postId, targetUserId) {
		if (!Meteor.userId()) return "";

		var id = postId

		console.log("set message draft target user id" + targetUserId)

		commentDrafts.update({
			$and: [
			{userId: Meteor.userId()},
			{postId: id},
			{type: "message"},
			{targetUserId: targetUserId}
			]},
			{$set: 
			{
				userId: Meteor.userId(),
				text: text,
				postId: postId,
				type: "message",
				targetUserId: targetUserId

			}
		},
			{upsert: true})

		var result = {
			userId: Meteor.userId(),
			text: text,
			postId: postId,
			type: "message",
			targetUserId: targetUserId
		}
	return result 
	},
	// Return true iff we should show the quote to this user.
	shouldShowQuote: function() {
		if (!Meteor.userId()) return false;
		if (Meteor.call("getTodaysQuote").length <= 0) return false;
		var readQuoteTime = Meteor.user().readQuoteTime;
		if (readQuoteTime === undefined) return true;
		return readQuoteTime < getStartOfToday().getTime();
	},
	updateLoftAlphaLogin: function (id){
		var user = loftAlphaUsers.findOne({"userId": Meteor.userId()})
		loftAlphaUsers.update({userId: Meteor.userId()}, {$set:{loggedIn: true}})
	},
	updateInvited: function (id, invited){
		console.log("id inside invited" + id)
		followers.update(id, {$set: {invited: invited}});
	},
	updateProfile: function (id, reading, listening, thinking, working, aboutMe){
		console.log("id inside invited" + id)
		usersInfo.update({userId: id}, {$set: 
			{
			reading: reading, 
			listening: listening, 
			thinking: thinking, 
			working: working, 
			aboutMe: aboutMe
			}
		},
		{upsert: true});
	}
});
