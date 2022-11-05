const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const methodOverride = require('method-override');
const { getUserByEmail, generateRandomString, shortUrlExists, urlsForUser } = require("./helpers");

///////////////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////////////

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW",
    views: 0,
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW",
    views: 0,
  },
  "ojx23l": {
    longURL: "https://www.youtube.com/",
    userID: "abc123",
    views: 0,
  },
};

const usersDatabase = {
  "abc123": {
    id: "abc123",
    email: "example@gmail.com",
    password: "$2a$10$88eZVuGIamCusxt1qDjVzuv6aNDAeAIU1rzc/kEpKIP0HBJ.h1cwa",
  },
  "aJ48lW": {
    id: "aJ48lW",
    email: "example1@gmail.com",
    password: "$2a$10$Z6EFryOHMMtUwhq6GYyinOtWWooA1BlQQVD8J74hSO1KsTX9v9Pli",
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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  if (userID === undefined) {
    res.send("Login To View Urls");
  } else {
    const templateVars = {
      urls: urlDatabase,
      usersDatabase,
      userID,
    };
    res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {
  const userID = req.session.userID;
  if (userID === undefined) {
    res.send("Login To Create Short Url");
  } else {
    const longURL = req.body.longURL;
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: longURL,
      userID: userID,
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

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

app.get("/urls/:id", (req, res) => {
  const userID = req.session.userID;
  const shortURL = req.url.split("/")[2];
  if (!shortUrlExists(shortURL, urlDatabase)) return res.send("URL Does Not Exist");
  if (userID === undefined) return res.send("Login To View Url");
  const longURL = urlDatabase[shortURL].longURL;
  const userURLs = urlsForUser(userID, urlDatabase);
  urlDatabase[shortURL].views += 1;
  const viewCount = urlDatabase[shortURL].views;
  if (userURLs[shortURL]) {
    const templateVars = {
      id: shortURL,
      longURL: longURL,
      usersDatabase,
      userID,
      viewCount,
    };
    res.render("urls_show", templateVars);
  } else {
    res.send("You Do Not Own The Url");
  }
});

app.put("/urls/:id/update", (req, res) => {
  const userID = req.session.userID;
  const shortURL = req.url.split("/")[2];
  if (!shortUrlExists(shortURL, urlDatabase)) return res.send("URL Does Not Exist");
  if (userID === undefined) return res.send("Login To Update URL");
  const userURLs = urlsForUser(userID, urlDatabase);
  if (userURLs[shortURL].userID === userID) {
    const newLongURL = req.body.longURL;
    urlDatabase[shortURL].longURL = newLongURL;
    res.redirect(`/urls`);
  } else {
    res.send("Can't Edit URLs You Don't Own");
  }
});

app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.url.split("/")[2];
  res.redirect(`/urls/${shortURL}`);
});

app.delete("/urls/:id/delete", (req, res) => {
  const userID = req.session.userID;
  const shortURL = req.url.split("/")[2];
  if (!shortUrlExists(shortURL, urlDatabase)) return res.send("URL Does Not Exist");
  if (userID === undefined) return res.send("Login To Delete URL");
  const userURLs = urlsForUser(userID, urlDatabase);
  if (userURLs[shortURL].userID === userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.send("Can't Delete URLs You Don't Own");
  }
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.url.split("/")[2];
  const longURL = urlDatabase[shortURL].longURL;
  if (!shortUrlExists(shortURL, urlDatabase)) return res.send("Url Does Not Exist");
  res.redirect(longURL);
});

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

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (email === "") return res.send("Empty Field Input Email: 404");
  if (password === "") return res.send("Empty Field Input Password: 404");
  if (getUserByEmail(email, usersDatabase)) return res.send("User Already Exists: 404");
  usersDatabase[id] = {
    id: id,
    email: email,
    password: hashedPassword,
  };
  req.session.userID = id;
  res.redirect("/urls");
});

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

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, usersDatabase);
  if (user === null) return res.send("Email Not Found: 403");
  if (bcrypt.compareSync(password, user.password)) {
    req.session.userID = user.id;
    res.redirect("/urls");
  } else {
    res.send("Wrong Password: 403");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('session');
  res.clearCookie('session.sig');
  res.redirect("/login");
});

///////////////////////////////////////////////////////////////////
// Functions
///////////////////////////////////////////////////////////////////