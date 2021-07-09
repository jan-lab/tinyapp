const cookieSession = require('cookie-session');
const express = require("express");
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const { getUserByEmail } = require('./helpers.js');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); //tells the Express app to use EJS as its templating engine
app.use(morgan('dev'));
//const bodyParser = require("body-parser");
app.use(express.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'sessionJun21',
  keys: ['no significance', 'key2', 'more stuff']
}));

//generates a random string to make up the short URL
const generateRandomString = () => {
  let result           = '';
  const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

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

//in-memory database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "apple"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "stone"
  },
  AbCdE: {
    longURL: "https://www.lighthouselabs.ca",
    userID: "green"
  },
  b1d2E: {
    longURL: "https://www.nodejs.com",
    userID: "apple"
  }
};

const users = {
};

//messages to use
const tellsVisitorToLogin = "Please log in <a href='/login'><b>here</b></a>";
const informsRestriction = "The URL does not belong to you. Click <a href='/urls'><b>here</b></a> for the list of your URLs";


//GET /
app.get("/", (req, res) => {
  if (!req.session.user_id) {
    
    return res.redirect('/login');
  }
  return res.redirect('/urls');
});

//GET /urls
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send(tellsVisitorToLogin);
  }
    
  let user;
  if (req.session.user_id) {
    const email = req.session.email;
    user = getUserByEmail(email, users);
  }

  const urls = urlsForUser(req.session.user_id);
  
  const templateVars = { urls, user };

  res.render("urls_index", templateVars);
});


//GET /urls/new
app.get("/urls/new", (req, res) => {
  let user;

  if (!req.session.user_id) {
    return res.redirect('/login');
  }

  if (req.session.user_id) {
    const email = req.session.email;
    user = getUserByEmail(email, users);
  }

  const templateVars = {user};
  
  res.render("urls_new", templateVars);
});

//GET /urls/:shortURL
app.get("/urls/:shortURL", (req, res) => {
  if (!req.session.user_id) {
    return res.send(tellsVisitorToLogin);
  }
  
  let urls = urlsForUser(req.session.user_id);
  if (!Object.keys(urls).includes(req.params.shortURL)) {
    return res.send(informsRestriction);
  }

  const urlID = req.params.shortURL;

  let user;

  if (req.session.user_id) {
    const email = req.session.email;
    user = getUserByEmail(email, users);
  }
  const templateVars = { shortURL: urlID, longURL: urlDatabase[req.params.shortURL].longURL, user};
  res.render("urls_show", templateVars);
});

//GET /u/:shortURL
app.get("/u/:shortURL", (req, res) => {
  for (let key in urlDatabase) {
    // console.log(key);
    // console.log(req.params.shortURL);
    if (key === req.params.shortURL) {
      const longURL = urlDatabase[req.params.shortURL].longURL;
      return res.redirect(longURL);
    }
  }
  res.status('404').send('URL does not exist');
});

//GET /register
app.get('/register', (req,res) => {
  let user;
  if (req.session.user_id) {
    // const email = req.session.email;
    // user = getUserByEmail(email, users);
    return res.redirect('urls');
  }
  const templateVars = {user};
  return res.render('register', templateVars);
});

//GET /login
app.get('/login', (req,res) => {
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
  // add the new user to our users object
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  // check if both email and password have been provided
  if (!email || !password) {
    return res.status(400).send('Email and password cannot be blank. Please <a href="/register">try again</a>.');
  }
  // find out if email is already in use
  const user = getUserByEmail(email, users);
  if (user) {
    return res.status(400).send('The email address is already in use. Please <a href="/register">try again</a>.');
  }

  // hash the user's password
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
      users[id] = {
        id,
        email,
        password: hash
      };
      
      req.session.user_id = id;
      req.session.email = req.body.email;
      
      return res.redirect('/urls');

    });
  });
});


//POST /login
app.post('/login', (req,res) => {
  const email = req.body.email;
  const password = req.body.password;

  // renders error message when email is not provided
  if (!email || !password) {
    return res.status(403).send('Email and password cannot be blank');
  }
  // find out if email is already in use
  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(403).send(`Email Not Found - <html><body>You can create an account <a href='/register'><b>here</b></a>.</body></html>\n`);
  }

  // user found - compare the password
  bcrypt.compare(password, user.password, (err, result) => {
    
    if (!result) {
      return res.status(403).send('Incorrect Password');
    }

    //Happy path
    req.session.user_id = user.id;
    req.session.email = user.email;

    // redirect the user
    res.redirect('/urls');
  });
});


//Add POST /urls
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send(tellsVisitorToLogin);
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].userID = req.session.user_id;
 
  let urls = urlsForUser(req.session.user_id);
  if (!Object.keys(urls).includes(shortURL)) {
    return res.send(informsRestriction);
  }

  res.redirect(`/urls/${shortURL}`);
});

//Edit POST /urls/:shortURL
app.post('/urls/:shortURL', (req, res) => {
  if (!req.session.user_id) {
    return res.send(tellsVisitorToLogin);
  }
  
  let urls = urlsForUser(req.session.user_id);
  if (!Object.keys(urls).includes(req.params.shortURL)) {
    return res.send(informsRestriction);
  }

  const shortURL = req.params.shortURL;
  //grab the body of the request
  const newURL = req.body.newURL;
 
  urlDatabase[shortURL].longURL = newURL;

  res.redirect('/urls');
});


//Delete POST /urls/:shortURL/delete
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.session.user_id) {
    return res.send(tellsVisitorToLogin);
  }
  
  let urls = urlsForUser(req.session.user_id);
  if (!Object.keys(urls).includes(req.params.shortURL)) {
    return res.send(informsRestriction);
  }

  const id = req.params.shortURL;
  delete urlDatabase[id];
  res.redirect('/urls'); //redirects the client back to the url_index page ('/urls')
});

//POST /logout
app.post('/logout', (req,res) => {
  //clear the cookie
  req.session = null;
  return res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
