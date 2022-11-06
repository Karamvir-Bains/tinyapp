const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const methodOverride = require('method-override');
const { getUserByEmail, generateRandomString, shortUrlExists, urlsForUser, isUniqueViewer, sendError } = require("./helpers");

///////////////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////////////

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW",
    dateCreated: "Wed Jun 09 2021",
    views: 0,
    uniqueViews: 0,
    visitHistory: [],
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW",
    dateCreated: "Mon Sep 19 2022",
    views: 0,
    uniqueViews: 0,
    visitHistory: [],
  },
  "ojx23l": {
    longURL: "https://www.youtube.com/",
    userID: "abc123",
    dateCreated: "Sun Mar 19 1995",
    views: 0,
    uniqueViews: 0,
    visitHistory: [],
  },
};

const usersDatabase = {
  "abc123": {
    id: "abc123",
    email: "example@gmail.com",
    password: "$2a$10$88eZVuGIamCusxt1qDjVzuv6aNDAeAIU1rzc/kEpKIP0HBJ.h1cwa",
    history: [],
  },
  "aJ48lW": {
    id: "aJ48lW",
    email: "example1@gmail.com",
    password: "$2a$10$Z6EFryOHMMtUwhq6GYyinOtWWooA1BlQQVD8J74hSO1KsTX9v9Pli",
    history: [],
  },
};

///////////////////////////////////////////////////////////////////
// Set-Up / Configuration
///////////////////////////////////////////////////////////////////

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

///////////////////////////////////////////////////////////////////
// Middleware
///////////////////////////////////////////////////////////////////

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({name: 'session', keys: ["u3M1tAyFG2", "2J225oPIny"]}));
app.use(methodOverride('_method'));

///////////////////////////////////////////////////////////////////
// Listener
///////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

///////////////////////////////////////////////////////////////////
// Routes
///////////////////////////////////////////////////////////////////

// Redirects to /urls if logged in, else to /login
app.get("/", (req, res) => {
  const userID = req.session.userID;
  if (userID === undefined) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

// Displays the urls the user owns
app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  if (userID === undefined) {
    sendError(res, userID, 401, "Must Be Logged In To View URLs", "Login", "/login", usersDatabase);
  } else {
    const templateVars = {
      urlDatabase,
      usersDatabase,
      userID,
    };
    res.render("urls_index", templateVars);
  }
});

// Adds new shortURL object to url database
app.post("/urls", (req, res) => {
  const userID = req.session.userID;
  if (userID === undefined) {
    sendError(res, userID, 401, "Must Be Logged In To Create Short URLs", "Login", "/login", usersDatabase);
  } else {
    const longURL = req.body.longURL;
    const shortURL = generateRandomString();
    const dateCreated = new Date().toDateString();
    urlDatabase[shortURL] = {
      longURL: longURL,
      userID: userID,
      dateCreated: dateCreated,
      views: 0,
      uniqueViews: 0,
      visitHistory: [],
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

// Displays create new url form
app.get("/urls/new", (req, res) => {
  const userID = req.session.userID;
  const templateVars = {
    usersDatabase,
    userID,
  };
  if (userID === undefined) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

// Displays the shortURL information
// Also if owner display edit controls
app.get("/urls/:id", (req, res) => {
  const userID = req.session.userID;
  const shortURL = req.params.id;
  if (!shortUrlExists(shortURL, urlDatabase)) return sendError(res, userID, 404, "URL Does Not Exist", usersDatabase);
  if (userID === undefined) return sendError(res, userID, 401, "Must Be Logged In To View URLs", "Login", "/login", usersDatabase);
  const longURL = urlDatabase[shortURL].longURL;
  const userURLs = urlsForUser(userID, urlDatabase);
  urlDatabase[shortURL].views += 1;
  const timestamp = new Date();
  const visitHistory = urlDatabase[shortURL].visitHistory;
  visitHistory.push({userID: userID, timestamp: timestamp});
  const viewCount = urlDatabase[shortURL].views;
  if (isUniqueViewer(shortURL, userID, usersDatabase)) {
    urlDatabase[shortURL].uniqueViews += 1;
    usersDatabase[userID].history.push(shortURL);
  }
  const uniqueViewCount = urlDatabase[shortURL].uniqueViews;
  const canEdit = userURLs[shortURL] ? true : false;
  const dateCreated = urlDatabase[shortURL].dateCreated;
  const templateVars = {
    id: shortURL,
    longURL: longURL,
    usersDatabase,
    userID,
    viewCount,
    uniqueViewCount,
    visitHistory,
    canEdit,
    dateCreated,
  };
  res.render("urls_show", templateVars);
});

// Updates longURL if user is owner
app.put("/urls/:id", (req, res) => {
  const userID = req.session.userID;
  const shortURL = req.params.id;
  if (!shortUrlExists(shortURL, urlDatabase)) return sendError(res, userID, 404, "URL Does Not Exist", usersDatabase);
  if (userID === undefined) return sendError(res, userID, 401, "Login To Update URL", "Login", "/login", usersDatabase);
  const userURLs = urlsForUser(userID, urlDatabase);
  if (userURLs[shortURL] === undefined) return sendError(res, userID, 403, "Can't Edit URLs You Don't Own", usersDatabase);
  const newLongURL = req.body.longURL;
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect(`/urls`);
});

// Deletes shortURL from url database if user is owner
app.delete("/urls/:id/delete", (req, res) => {
  const userID = req.session.userID;
  const shortURL = req.params.id;
  if (!shortUrlExists(shortURL, urlDatabase)) return sendError(res, userID, 404, "URL Does Not Exist", usersDatabase);
  if (userID === undefined) return sendError(res, userID, 401, "Login To Delete URL", "Login", "/login", usersDatabase);
  const userURLs = urlsForUser(userID, urlDatabase);
  console.log(userURLs[shortURL]);
  if (userURLs[shortURL] === undefined) return sendError(res, userID, 403, "Can't Delete URLs You Don't Own", usersDatabase);
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Redirects user to longURL
app.get("/u/:id", (req, res) => {
  const userID = undefined;
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  if (!shortUrlExists(shortURL, urlDatabase)) return sendError(res, userID, 404, "URL Does Not Exist", usersDatabase);
  res.redirect(longURL);
});

// Registration form
// If user is already logged in redirects to /urls
app.get("/register", (req, res) => {
  const userID = req.session.userID;
  const templateVars = {
    urls: urlDatabase,
    usersDatabase,
    userID,
  };
  if (userID !== undefined) {
    res.redirect("/urls");
  } else {
    res.render("urls_register", templateVars);
  }
});

// Creates new user
// If the form information is filled out correctly
app.post("/register", (req, res) => {
  const userID = undefined;
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (email === "") return sendError(res, userID, 401, "Email Can't Be Empty", "Try Again", "/login", usersDatabase);
  if (password === "") return sendError(res, userID, 401, "Password Can't Be Empty", "Try Again", "/login", usersDatabase);
  if (getUserByEmail(email, usersDatabase)) return sendError(res, userID, 403, "User Already Exists", "Login", "/login", usersDatabase);
  usersDatabase[id] = {
    id: id,
    email: email,
    password: hashedPassword,
  };
  req.session.userID = id;
  res.redirect("/urls");
});

// Login Form
// If already logged in redirects to /urls
app.get("/login", (req, res) => {
  const userID = req.session.userID;
  const templateVars = {
    urls: urlDatabase,
    usersDatabase,
    userID,
  };
  if (userID !== undefined) {
    res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }
});

// Checks if information is valid and logs in user
app.post("/login", (req, res) => {
  const userID = undefined;
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, usersDatabase);
  if (user === null) return sendError(res, userID, 403, "Email Not Found", "Try Again", "/login", usersDatabase);
  if (bcrypt.compareSync(password, user.password)) {
    req.session.userID = user.id;
    res.redirect("/urls");
  } else {
    sendError(res, userID, 401, "Wrong Password", "Try Again", "/login", usersDatabase);
  }
});

// Clears users cookies and logs out user
app.post("/logout", (req, res) => {
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect("/login");
});