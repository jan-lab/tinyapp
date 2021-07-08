const cookieSession = require('cookie-session');
const express = require("express");
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); //tells the Express app to use EJS as its templating engine; ejs automatically look into templates inside a folder Views.
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
  // "apple": {
  //   id: "apple",
  //   email: "a@a.com",
  //   password: "1234"
  // },
  // "green": {
  //   id: "green",
  //   email: "b@b.com",
  //   password: "1234"
  // },
  // "stone": {
  //   id: "stone",
  //   email: "c@c.com",
  //   password: "1234"
  // }
};

//messages to use
const tellsVisitorToLogin = "<html><body>Please log in <a href='/login'><b>here</b></a></body></html>\n";
const informsRestriction = "<html><body>The URL does not belong to you. Click <a href='/urls'><b>here</b></a> for the list of your URLs</body></html>\n";

//returns a user of an email if in the users database
const findUserByEmail = (email) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};


//GET /
app.get("/", (req, res) => {
  // if (!req.session.user_id) {
  if (!req.session.user_id) {
    
    return res.redirect('/login');
  }
  return res.redirect('/urls');
});

// //GET /urls.json
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

//GET /hello
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });


//GET /urls
app.get("/urls", (req, res) => {

  //if (!req.session.user_id) {
  if (!req.session.user_id) {
    return res.send(tellsVisitorToLogin);
    //return res.redirect('/login');
  }

  let user;
  for (let key in users) {
    //if (key === req.session.user_id) {
    if (key === req.session.user_id) {
      user = users[key];
    }
  }

  const urls = urlsForUser(req.session.user_id);
  
  const templateVars = { urls, user }; //the key names, urls and user, (which also are values in this case) are the variable names we assign.

  res.render("urls_index", templateVars);   //renders a template named urls_index and makes templateVars available to the template.
});


//GET /urls/new
app.get("/urls/new", (req, res) => {
  let user;

  //if (!req.session.user_id) {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  
  for (let key in users) {
    //if (key === req.session.user_id) {
    if (key === req.session.user_id) {
      user = users[key];
    }
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
  for (let userKey in users) {
    if (userKey === req.session.user_id) {
      user = users[userKey];
    }
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
  for (let userKey in users) {
    if (userKey === req.session.user_id) {
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
    if (userKey === req.session.user_id) {
      user = users[userKey];
    }
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
    return res.status(400).send('email and password cannot be blank');
  }
  // find out if email is already in use
  const user = findUserByEmail(email);
  if (user) {
    return res.status(400).send('that email address is already in use');
  }

  // hash the user's password
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
      users[id] = {
        id,
        email,
        password: hash
      };
      
      //console.log(password)

      //set a user_id cookie containing the user's newly generated ID.
      //res.cookie('user_id', id);
      req.session.user_id = id;
      console.log(users);
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
  const user = findUserByEmail(email);
  // console.log(password); //1234
  // console.log(user.password); //hashed
  if (!user) {
    return res.status(403).send(`Email Not Found - <html><body>You can create an account <a href='/register'><b>here</b></a>.</body></html>\n`);
  }

  // we found the user! now we need to compare the password //shouldn't have saved email and password to cookie
  bcrypt.compare(password, user.password, (err, result) => {
    //console.log(result) //true
    // console.log(password); //1234
    // console.log(user.password); //hashed
    
    if (!result) {
      return res.status(403).send('Incorrect Password');
    }

    // happy path! at last
    //res.cookie('user_id', user.id);
    //req.session.userId = user.id;
    req.session.user_id = user.id;

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
  //console.log(body); //if you see req.body is undefined, you don't have the body-parser set up.
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
  //res.clearCookie('user_id');
  //console.log(req.cookies);
  req.session = null;
  return res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});