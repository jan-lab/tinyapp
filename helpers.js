//returns a user of an email if in the users database
const getUserByEmail = (email, usersDatabase) => {
  
  for (const userId in usersDatabase) {
    const user = usersDatabase[userId];
    console.log('test', user, email, user.email === email);
    if (user.email === email) {
      return user;
    }
  }
  return undefined; //changed this from null to undefined due to mocha test requirement
};

//generates a random string to create a short URL
const generateRandomString = () => {
  let result           = '';
  const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

//messages to use
const tellsVisitorToLogin = "Please log in <a href='/login'><b>here</b></a>";
const informsRestriction = "The URL does not belong to you. Click <a href='/urls'><b>here</b></a> for the list of your URLs";

module.exports = {
  getUserByEmail,
  generateRandomString,
  tellsVisitorToLogin,
  informsRestriction}
;