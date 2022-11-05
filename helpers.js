const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};

const shortUrlExists = function(shortUrl, database) {
  for (const key in database) {
    if (key === shortUrl) {
      return true;
    }
  }
  return false;
};

const urlsForUser = function(userID, database) {
  let userURLs = {};
  for (const shortURL in database) {
    if (database[shortURL].userID === userID) {
      userURLs[shortURL] = database[shortURL];
    }
  }
  return userURLs;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  shortUrlExists,
  urlsForUser
};