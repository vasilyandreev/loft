Meteor.startup(function () {
process.env.MAIL_URL = 'smtp://vasilyandreev:sendgrid@smtp.sendgrid.net:587';
Accounts.emailTemplates.siteName = "Loft";
	Accounts.emailTemplates.from = "Loft <vasily.andreev13@gmail.com>";
	Accounts.emailTemplates.resetPassword.subject = function (user) {
    return "Follow me to reset your password!";
};
	Accounts.emailTemplates.resetPassword.text = function (user, url) {
   return "So you forgot your password, huh? Well if you want to reset it simply click the link below:\n\n"
     + url;
};
});