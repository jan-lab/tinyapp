const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); //tells the Express app to use EJS as its templating engine //ejs automatically look into templates inside a folder Views.

const morgan = require('morgan');
app.use(morgan('dev'));

const bodyParser = require("body-parser");
app.use(express.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());


const generateRandomString = () => {
  let result           = '';
  const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

//in-memory database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// const urlDatabase = {
// };

const users = {
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

const findUserByEmail = (email) => {
  // if we find a user, return the user
  // if not, return null
  console.log(email);
  console.log(users);
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};


//GET / home page
app.get("/", (req, res) => {
  res.send("Hello!");
});

//GET /urls.json //json of database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//GET /hello
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


//Browse GET /urls
app.get("/urls", (req, res) => {
  let user;
  for (let userKey in users) {
    if (userKey === req.cookies['user_id']) {
      user = users[userKey];
    }
  }
  const templateVars = { urls: urlDatabase, user }; //urls is the variable name we gave

  res.render("urls_index", templateVars);   //renders a template named urls_index.
});

//GET /urls/new
app.get("/urls/new", (req, res) => {
  let user;

  if (!req.cookies['user_id']) {
    return res.redirect('/login');
  }
  
  for (let userKey in users) {
    if (userKey === req.cookies['user_id']) {
      user = users[userKey];
    }
  }
  const templateVars = {user};
  
  res.render("urls_new", templateVars);
});

//Read GET /urls/:shortURL
app.get("/urls/:shortURL", (req, res) => {
  const urlID = req.params.shortURL;
  let user;
  for (let userKey in users) {
    if (userKey === req.cookies['user_id']) {
      user = users[userKey];
    }
  }
  const templateVars = { shortURL: urlID, longURL: urlDatabase[req.params.shortURL], user}; //1:31:03
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//GET /register
app.get('/register', (req,res) => {
  let user;
  for (let userKey in users) {
    if (userKey === req.cookies['user_id']) {
      user = users[userKey];
    }
  }
  const templateVars = {user};
  res.render('register', templateVars);
});

//GET /login
app.get('/login', (req,res) => {
  let user;
  for (let userKey in users) {
    if (userKey === req.cookies['user_id']) {
      user = users[userKey];
    }
  }
  const templateVars = {user};
  res.render('login', templateVars);
});

//Add Post /urls
app.post("/urls", (req, res) => {
  //console.log(req.body);  // Log the POST request body to the console
  const newURL = req.body;
  const id = generateRandomString();
  //urlDatabase[id] = req.body.longURL;
  urlDatabase[id] = newURL.longURL;
  //console.log(urlDatabase);
  res.redirect(`/urls/${id}`);
});

//POST /register
app.post('/register', (req,res) => {
  // add the new user to our users object
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;



  // check if they gave us anything
  if (!email || !password) {
    return res.status(400).send('email and password cannot be blank');
  }
  // find out if email is already in use
  const user = findUserByEmail(email);
  if (user) {
    return res.status(400).send('that email address is already in use');
  }

  users[id] = {
    id,
    email,
    password
  };
  
  //set a user_id cookie containing the user's newly generated ID.
  res.cookie('user_id', id);

  console.log(users);

  return res.redirect('/urls');
  
});



//Edit Post /urls/:shortURL
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  //grab the body of the request
  const newURL = req.body.newURL;
  //console.log(body); //if you see req.body is undefined, you don't have the body-parser set up.
  urlDatabase[shortURL] = newURL;
  //once we are done with whatever it is, we are going back to the homepage.
  res.redirect('/urls');
});

//Delete Post /urls/:id/delete
//Add a POST route that removes a URL resource: POST /urls/:shortURL/delete
//After the resource has been deleted, redirect the client back to the urls_index page ("/urls").
app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.params.shortURL;
  delete urlDatabase[id];
  res.redirect('/urls');
});

//POST /login
app.post('/login', (req,res) => {
  const email = req.body.email;

  // check if they gave us anything
  if (!email) {
    return res.status(403).send('email not found');
  }
  // find out if email is already in use
  const user = findUserByEmail(email);
  if (user) {
    if (user.password !== req.body.password) { //shouldn't save email and password to cookie
      return res.status(403).send('incorrect password');
    }
    console.log(user);
    res.cookie('user_id', user.id);
    res.redirect('/urls');
    //req.cookies.user_id = user.id;
  }

  res.redirect('/urls');
});

//POST /logout
app.post('/logout', (req,res) => {
  res.clearCookie('user_id');
  console.log(req.cookies);
  return res.redirect('/urls');
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});