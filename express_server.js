const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); //tells the Express app to use EJS as its templating engine //ejs automatically look into templates inside a folder Views.

const morgan = require('morgan');
app.use(morgan('dev'));

const bodyParser = require("body-parser");
app.use(express.urlencoded({extended: true}));


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


//home page
app.get("/", (req, res) => {
  res.send("Hello!");
});

//json of database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Browse GET /urls
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase }; //Q. how does it work here when urls: urlDatabase is entered?? why is it not just {urlDatabase}?
  res.render("urls_index", templateVars);   //renders a template named urls_index.
});


app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//Read GET /urls/:shortURL
app.get("/urls/:shortURL", (req, res) => {
  const urlID = req.params.shortURL;
  const templateVars = { shortURL: urlID, longURL: urlDatabase[req.params.shortURL] }; //1:31:03
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});