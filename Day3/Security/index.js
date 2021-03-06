const express=require("express");
var session = require('express-session')
var cookieParser = require('cookie-parser')
const app=express();
const port =8080;

//Get form data
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));


//app.use(express.static("public"));
app.set("view engine", "vash");
const data =require("./data");
const hasher=require("./auth/hasher");

//setup passport
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
    var u=data.users.find( user=> user.username==username);
      if (!u) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (hasher.computeHash(u.salt,password)==u.password)
      {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, u);
  }
));

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
  app.use(cookieParser())
  app.use(session({
    secret: 'keyboard cat',
  }))
app.use(passport.initialize());
app.use(passport.session());

app.get('/login',(req,res)=>{
    res.render("login");
});

app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: true })


);

app.get("/register",(req,res)=>{
    
    res.render("register");
});
app.get("/",ensureAuthenticated,(req,res)=>{
    console.log(req.user);
    res.render("index",{"user":req.user});
});


app.post("/register",(req,res)=>{
    var user={"username":req.body.userName,"salt":"",passwordHash:""};
    user.salt=hasher.createSalt();
    user.passwordHash=hasher.computeHash(user.salt,req.body.password)
    data.users.push(user);
    data.Save();
    res.render("login",{message:"You are now registered"});
});

app.get("/api",ensureApiAuthenticated,(req,res)=>{
    res.send({"name":"Jimmy"});
})


app.listen(port,()=>console.log(`Example app running on ${port}`));



function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      // req.user is available for use here
      return next(); }
  
    // denied. redirect to login
    res.redirect('/login')
  }

  function ensureApiAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      // req.user is available for use here
      return next(); }
  
    // denied. redirect to login
    res.send(401,"Not authorized");
  }