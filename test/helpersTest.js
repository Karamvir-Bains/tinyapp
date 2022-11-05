const { assert } = require('chai');

const { getUserByEmail, shortUrlExists, urlsForUser } = require('../helpers.js');

const testUserDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testURLDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
  },
};

describe('#getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUserDatabase);
    const expectedUserID = "userRandomID";
    const actualID = user.id;
    assert.equal(actualID, expectedUserID);
  });
  it('should return undefined for non-existent user', function() {
    const user = getUserByEmail("notreal@example.com", testUserDatabase);
    const expectedUserID = undefined;
    assert.equal(user, expectedUserID);
  });
});

describe('#shortUrlExists', function() {
  it('should return true if shortURL found', function() {
    const found = shortUrlExists("b2xVn2", testURLDatabase);
    assert.isTrue(found, true);
  });
  it('should return false for non-existent shortURL', function() {
    const found = shortUrlExists("d8wj2x", testURLDatabase);
    assert.isFalse(found);
  });
});

describe('#urlsForUser', function() {
  it('should return a data object of urls for that user', function() {
    const userURLs = urlsForUser("user2RandomID", testURLDatabase);
    const expectedObj = {
      "9sm5xK": {
        longURL: "http://www.google.com",
        userID: "user2RandomID",
      }
    };
    assert.deepEqual(userURLs, expectedObj);
  });
  it('should return a empty data object for user without urls', function() {
    const userURLs = urlsForUser("user3RandomID", testURLDatabase);
    const expectedObj = {};
    assert.deepEqual(userURLs, expectedObj);
  });
});