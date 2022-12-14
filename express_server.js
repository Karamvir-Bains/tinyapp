const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const methodOverride = require('method-override');
const { urlDatabase, usersDatabase } = require("./database.js");
const {
  getUserByEmail,
  generateRandomString,
  shortUrlExists,
  urlsForUser,
  isUniqueViewer,
  sendError
} = require("./helpers");

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
  if (!userID) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

// Displays the urls the user owns
app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  if (!userID) {
    sendError(res, userID, 401, "Must Be Logged In To View URLs", "Login", "/login", usersDatabase);
  } else {
    const userURLs = urlsForUser(userID, urlDatabase);
    const templateVars = {
      urlDatabase: userURLs,
      usersDatabase,
      userID,
    };
    res.render("urls_index", templateVars);
  }
});

// Adds new shortURL object to url database
app.post("/urls", (req, res) => {
  const userID = req.session.userID;
  if (!userID) {
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

// Displays the all urls in the database
app.get("/urls/public", (req, res) => {
  const userID = req.session.userID;
  const templateVars = {
    urlDatabase,
    usersDatabase,
    userID,
  };
  res.render("urls_public", templateVars);
});

// Displays create new url form
app.get("/urls/new", (req, res) => {
  const userID = req.session.userID;
  const templateVars = {
    usersDatabase,
    userID,
  };
  if (!userID) {
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
  if (!shortUrlExists(shortURL, urlDatabase)) return sendError(res, userID, 404, "URL Does Not Exist", "My URLs", "/urls", usersDatabase);
  if (!userID) return sendError(res, userID, 401, "Must Be Logged In To View URLs", "Login", "/login", usersDatabase);
  const longURL = urlDatabase[shortURL].longURL;
  // Checks if the user is the owner, to enable edit features
  const userURLs = urlsForUser(userID, urlDatabase);
  const canEdit = userURLs[shortURL] ? true : false;
  const templateVars = {
    id: shortURL,
    longURL: longURL,
    usersDatabase,
    userID,
    URL: urlDatabase[shortURL],
    canEdit,
  };
  res.render("urls_show", templateVars);
});

// Updates longURL if user is owner
app.put("/urls/:id", (req, res) => {
  const userID = req.session.userID;
  const shortURL = req.params.id;
  if (!shortUrlExists(shortURL, urlDatabase)) return sendError(res, userID, 404, "URL Does Not Exist", "My URLs", "/urls", usersDatabase);
  if (!userID) return sendError(res, userID, 401, "Login To Update URL", "Login", "/login", usersDatabase);
  const userURLs = urlsForUser(userID, urlDatabase);
  if (!userURLs[shortURL]) return sendError(res, userID, 403, "Can't Edit URLs You Don't Own", usersDatabase);
  const newLongURL = req.body.longURL;
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect(`/urls`);
});

// Deletes shortURL from url database if user is owner
app.delete("/urls/:id/delete", (req, res) => {
  const userID = req.session.userID;
  const shortURL = req.params.id;
  if (!shortUrlExists(shortURL, urlDatabase)) return sendError(res, userID, 404, "URL Does Not Exist", "My URLs", "/urls", usersDatabase);
  if (!userID) return sendError(res, userID, 401, "Login To Delete URL", "Login", "/login", usersDatabase);
  const userURLs = urlsForUser(userID, urlDatabase);
  if (!userURLs[shortURL]) return sendError(res, userID, 403, "Can't Delete URLs You Don't Own", usersDatabase);
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Redirects user to longURL
app.get("/u/:id", (req, res) => {
  const userID = req.session.userID;
  const shortURL = req.params.id;
  if (!shortUrlExists(shortURL, urlDatabase)) return sendError(res, userID, 404, "URL Does Not Exist", "My URLs", "/urls", usersDatabase);
  const longURL = urlDatabase[shortURL].longURL;
  // Creates a log of when a shortURL is used
  const timestamp = new Date();
  const log = {
    userID: userID,
    timestamp: timestamp
  };
  urlDatabase[shortURL].visitHistory.push(log);
  // Updates Total View Count
  urlDatabase[shortURL].views += 1;
  // Updates Unique Viewer Count, if user is logged in
  if (isUniqueViewer(shortURL, userID, usersDatabase)) {
    urlDatabase[shortURL].uniqueViews += 1;
    usersDatabase[userID].history.push(shortURL);
  }
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
  if (!email) return sendError(res, userID, 401, "Email Can't Be Empty", "Try Again", "/register", usersDatabase);
  if (!password) return sendError(res, userID, 401, "Password Can't Be Empty", "Try Again", "/register", usersDatabase);
  if (getUserByEmail(email, usersDatabase)) return sendError(res, userID, 403, "User Already Exists", "Login", "/login", usersDatabase);
  usersDatabase[id] = {
    id: id,
    email: email,
    password: hashedPassword,
    history: [],
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
  if (!email) return sendError(res, userID, 401, "Email Can't Be Empty", "Try Again", "/login", usersDatabase);
  if (!user) return sendError(res, userID, 404, "Email Not Found, Try Registering", "Register", "/register", usersDatabase);
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