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
};

const users = {
  "abc123": {
    id: "abc123",
    email: "example@gmail.com",
    password: "123",
  }
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
  const templateVars = {
    urls: urlDatabase,
    users,
    userID,
  };
  res.render("urls_index", templateVars);
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
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    users,
    userID,
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/update", (req, res) => {
  const shortURL = req.url.split("/")[2];
  const newLongURL = req.body.longURL;
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect(`/urls`);
});

app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.url.split("/")[2];
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.url.split("/")[2];
  delete urlDatabase[shortURL];
  res.redirect("/urls");
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