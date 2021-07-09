//Final Version

//require necessary middleware packages
const cookieSession = require('cookie-session');
const express = require("express");
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const { getUserByEmail, generateRandomString, tellsVisitorToLogin, informsRestriction} = require('./helpers.js');
const app = express();
const PORT = 8080; // default port 8080

//tells the Express app to use EJS as its templating engine
app.set("view engine", "ejs");

//register middleware
app.use(morgan('dev'));
app.use(express.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'sessionJun21',
  keys: ['no significance', 'key2', 'more stuff']
}));

//returns the URLs where the userID is equal to the id of the currently logged-in user.
const urlsForUser = (id) => {
  let urls = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      urls[key] = urlDatabase[key];
    }
  }
  return urls;
};

//in-memory url database
const urlDatabase = {
};

//in-memory users database
const users = {
};


//GET /
app.get("/", (req, res) => {
  // if user is not logged in, redirect the user to '/login'
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  //otherwise, redirect the user to '/urls'
  return res.redirect('/urls');
});


//GET /urls
app.get("/urls", (req, res) => {
  //if user is not logged in, tell him/her to log in
  if (!req.session.user_id) {
    return res.send(tellsVisitorToLogin);
  }
  
  //store the relevant user and url information to be rendered to '/urls'
  const email = req.session.email;
  const user = getUserByEmail(email, users);
  const urls = urlsForUser(req.session.user_id);
  
  const templateVars = { urls, user };
  res.render("urls_index", templateVars);
});


//GET /urls/new
app.get("/urls/new", (req, res) => {

  //if the user is not logged in, redirect to '/login'
  if (!req.session.user_id) {
    return res.redirect('/login');
  }

  //store relevant user information to templateVars to be rendered via '/urls/new'
  const email = req.session.email;
  const user = getUserByEmail(email, users);
  
  const templateVars = {user};
  res.render("urls_new", templateVars);
});


//GET /urls/:shortURL
app.get("/urls/:shortURL", (req, res) => {
  //if user is not logged in, ask to log in
  if (!req.session.user_id) {
    return res.send(tellsVisitorToLogin);
  }
  
  //if user navigates to urls that they do not own, inform with an error message
  let urls = urlsForUser(req.session.user_id);
  if (!Object.keys(urls).includes(req.params.shortURL)) {
    return res.send(informsRestriction);
  }

  //store relevant url and user information into templateVars to be rendered via '/urls/:shortURL'
  const urlID = req.params.shortURL;
  const email = req.session.email;
  const user = getUserByEmail(email, users);

  const templateVars = { shortURL: urlID, longURL: urlDatabase[req.params.shortURL].longURL, user};
  res.render("urls_show", templateVars);
});


//GET /u/:shortURL
app.get("/u/:shortURL", (req, res) => {
  //if shortURL entered by user matches what is in the url database, user can navigate to /u/:shortURL
  for (let key in urlDatabase) {
    if (key === req.params.shortURL) {
      const longURL = urlDatabase[req.params.shortURL].longURL;
      return res.redirect(longURL);
    }
  }
  //if user enters non-existing shortURL, inform that the URL does not exist
  res.status('404').send('URL does not exist');
});


//GET /register
app.get('/register', (req,res) => {
  //if user is logged in, redirects to '/urls'
  if (req.session.user_id) {
    return res.redirect('urls');
  }

  //declare a user variable to be used in a conditional for rendering the header of the registration page
  let user;
  const templateVars = {user};
  return res.render('register', templateVars);
});

//GET /login
app.get('/login', (req,res) => {

  //declare a user variable to be used in a conditional for rendering the header of the login page
  let user;
  if (req.session.user_id) {
    const email = req.session.email;
    user = getUserByEmail(email, users);
  }

  const templateVars = {user};
  res.render('login', templateVars);
});


//POST /register
app.post('/register', (req,res) => {
  // add the new user to the users database
  // generate a new user ID
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  //if both email and password have been provided, display an error message
  if (!email || !password) {
    return res.status(400).send('Email and password cannot be blank. Please <a href="/register">try again</a>.');
  }
  //if email address entered is already in use, display an error message
  const user = getUserByEmail(email, users);
  if (user) {
    return res.status(400).send('The email address is already in use. Please <a href="/register">try again</a>.');
  }

  //happy path
  //hash the user's password
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {

      //stored user's info in the users database
      users[id] = {
        id,
        email,
        password: hash
      };
      
      //create cookie for the user's id
      req.session.user_id = id;
      //create cookie for the user's email to use in the getUserByEmail function
      req.session.email = req.body.email;
      
      return res.redirect('/urls');
    });
  });
});


//POST /login
app.post('/login', (req,res) => {

  const email = req.body.email;
  const password = req.body.password;

  //if email or password is not provided display an error message
  if (!email || !password) {
    return res.status(403).send('Email and password cannot be blank. Please <a href="/login">try again</a>.');
  }

  //if email is not found in the users database, display an error message
  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(403).send(`Email Not Found - <html><body>You can create an account <a href='/register'><b>here</b></a>.</body></html>\n`);
  }

  // user found - compare the password
  bcrypt.compare(password, user.password, (err, result) => {
    //if password entered is incorrect, display an error message
    if (!result) {
      return res.status(403).send('Incorrect Password');
    }

    //Happy path
    //create a cookie for the user_id
    req.session.user_id = user.id;
    //create a cookie for the user's email - prevents problem with header not displaying logout button
    req.session.email = user.email;

    res.redirect('/urls');
  });
});


//Add POST /urls
app.post("/urls", (req, res) => {
  //if user is not logged in, display an error message
  if (!req.session.user_id) {
    return res.send(tellsVisitorToLogin);
  }

  //generate a random shortURL ID and store user_id and longURL in the url database.
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].userID = req.session.user_id;

  res.redirect(`/urls/${shortURL}`);
});


//Edit POST /urls/:shortURL
app.post('/urls/:shortURL', (req, res) => {
  //if user is not logged in, display an error message
  if (!req.session.user_id) {
    return res.send(tellsVisitorToLogin);
  }
  
  //if user tries to access the link with a shortURL that does not belong to the user, display an error message
  let urls = urlsForUser(req.session.user_id);
  if (!Object.keys(urls).includes(req.params.shortURL)) {
    return res.send(informsRestriction);
  }

  //store the new long URL along with its key (shortURL) in the url database
  const shortURL = req.params.shortURL;
  //grab the body of the request to get the new long URL. newURL is the name of the input field on urls_show template
  const newURL = req.body.newURL;
  urlDatabase[shortURL].longURL = newURL;

  res.redirect('/urls');
});


//Delete POST /urls/:shortURL/delete
app.post("/urls/:shortURL/delete", (req, res) => {
  //if user is not logged in, display an error message
  if (!req.session.user_id) {
    return res.send(tellsVisitorToLogin);
  }
  
  //if user tries to delete an shortURL that does not belong to the user, display an error message
  let urls = urlsForUser(req.session.user_id);
  if (!Object.keys(urls).includes(req.params.shortURL)) {
    return res.send(informsRestriction);
  }

  //delete the shortURL and related data from the url database
  const id = req.params.shortURL;
  delete urlDatabase[id];

  //redirects the client back to the url_index page ('/urls')
  res.redirect('/urls');
});


//POST /logout
app.post('/logout', (req,res) => {
  //clear the cookie
  req.session = null;

  return res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`tinyApp listening on port ${PORT}!`);
});