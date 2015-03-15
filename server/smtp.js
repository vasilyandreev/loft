Meteor.startup(function () {
process.env.MAIL_URL = 'smtp://vasilyandreev:loftvasily13@smtp.sendgrid.net:587';
// process.env.MAIL_URL="smtp://Loft%40tryloft.com:blizzard13vasily@smtp.gmail.com:465/"; 
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