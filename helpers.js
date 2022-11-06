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

const isUniqueViewer = function(shortURL, userID, database) {
  for (const visit of database[userID].history) {
    if (shortURL === visit) {
      return false;
    }
  }
  return true;
};

const sendError = function(res, userID, errorCode, errorMessage, redirectName, redirect, database) {
  const errorResponse = {
    usersDatabase: database,
    userID,
    errorMessage: errorMessage,
    redirectName: redirectName,
    redirect: redirect,
  };
  res.status(errorCode).render("urls_error", errorResponse);
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  shortUrlExists,
  urlsForUser,
  isUniqueViewer,
  sendError,
};