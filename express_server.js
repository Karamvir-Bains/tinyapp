const express = require("express");
const cookieParser = require("cookie-parser");

///////////////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////////////

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW",
  },
  "ojx23l": {
    longURL: "https://www.youtube.com/",
    userID: "abc123",
  },
};

const users = {
  "abc123": {
    id: "abc123",
    email: "example@gmail.com",
    password: "123",
  },
  "aJ48lW": {
    id: "aJ48lW",
    email: "example1@gmail.com",
    password: "123",
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
app.use(cookieParser());

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
  const userID = req.cookies["user_id"];
  if (userID === undefined) {
    res.send("Login To View Urls");
  } else {
    const templateVars = {
      urls: urlDatabase,
      users,
      userID,
    };
    res.render("urls_index", templateVars);
  }
});

app.post("/urls", (req, res) => {
  const userID = req.cookies["user_id"];
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
  const userID = req.cookies["user_id"];
  const templateVars = {
    users,
    userID,
  };
  if (userID === undefined) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const userID = req.cookies["user_id"];
  const shortURL = req.url.split("/")[2];
  if (!shortUrlExists(shortURL)) return res.send("URL Does Not Exist");
  if (userID === undefined) return res.send("Login To View Url");
  const longURL = urlDatabase[shortURL].longURL;
  const userURLs = urlsForUser(userID);
  if (userURLs[shortURL]) {
    const templateVars = {
      id: shortURL,
      longURL: longURL,
      users,
      userID,
    };
    res.render("urls_show", templateVars);
  } else {
    res.send("You Do Not Own The Url");
  }
});

app.post("/urls/:id/update", (req, res) => {
  const userID = req.cookies["user_id"];
  const shortURL = req.url.split("/")[2];
  if (!shortUrlExists(shortURL)) return res.send("URL Does Not Exist");
  if (userID === undefined) return res.send("Login To Update URL");
  const userURLs = urlsForUser(userID);
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

app.post("/urls/:id/delete", (req, res) => {
  const userID = req.cookies["user_id"];
  const shortURL = req.url.split("/")[2];
  if (!shortUrlExists(shortURL)) return res.send("URL Does Not Exist");
  if (userID === undefined) return res.send("Login To Delete URL");
  const userURLs = urlsForUser(userID);
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
  if (!shortUrlExists(shortURL)) return res.send("Url Does Not Exist");
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = {
    urls: urlDatabase,
    users,
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
  if (email === "") return res.send("Empty Field Input Email: 404");
  if (password === "") return res.send("Empty Field Input Password: 404");
  if (userLookUp(email)) return res.send("User Already Exists: 404");
  users[id] = {
    id: id,
    email: email,
    password: password,
  };
  res.cookie("user_id", id);
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const userID = req.cookies["user_id"];
  const templateVars = {
    urls: urlDatabase,
    users,
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
  const user = userLookUp(email);
  if (user === null) return res.send("Email Not Found: 403");
  if (user.password !== password) return res.send("Wrong Password: 403");
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

///////////////////////////////////////////////////////////////////
// Functions
///////////////////////////////////////////////////////////////////

const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};

const userLookUp = function(email) {
  const userArray = Object.values(users);
  for (const user of userArray) {
    if (user["email"] === email) {
      return user;
    }
  }
  return null;
};

const shortUrlExists = function(shortUrl) {
  for (const key in urlDatabase) {
    if (key === shortUrl) {
      return true;
    }
  }
  return false;
};

const urlsForUser = function(id) {
  let userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};