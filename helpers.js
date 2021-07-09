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

module.exports = { getUserByEmail };