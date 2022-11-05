const getUserByEmail = function(email, database) {
  console.log(database);
  for (const user in database) {
    console.log(database[user]);
    if (database[user].email === email) {
      return database[user];
    }
  }
  return null;
};

module.exports = {
  getUserByEmail,
};