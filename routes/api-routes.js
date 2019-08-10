// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");
var isAuthenticated = require("../config/middleware/isAuthenticated");
var currentUser = "";

module.exports = function(app) {
  
  app.get("/", function (req, res) {
    if (req.user) {
      res.redirect("/events");
    }
    res.render("signup")
  });
  
  
  app.get("/events", function (req, res) {
    db.Events.findAll({
      attributes: ['name', 'category', 'location','upVotes','creatorID']
    })
    .then(function (all) {
      console.log(all)
      db.Events.findAll({
        attributes: ['name', 'category', 'location', 'upVotes', 'creatorID'],
        where: {
          creatorID: currentUser
        }
      }).then(function(user){
        console.log(user)
        res.render("index",{all_events:all,user_events:user})
      })
    })

  });

  app.get("/login", function(req,res){
    res.render("login")
  })
  
  app.get("/signup", function(req,res){
    res.render("signup")
  })


  app.post("/api/login", passport.authenticate("local"), function(req, res) {
    console.log('tried to login');
    res.end();
  });


  app.post("/api/signup", function(req, res) {
    console.log(req.body);
    currentUser = req.body.username;
    db.User.create({
      userName: req.body.username,
      password: req.body.password
    }).then(function() {
      res.redirect(307, "/api/login");
    }).catch(function(err) {
      console.log(err);
      res.json(err);
    });
  });


  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });


  app.get("/api/user_data", function(req, res) {
    console.log(req.user);
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    }
    else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        id: req.user.id
      });
    }
  });

  // create new event
  app.post("/api/event", function (req, res) {
    db.Events.create({
      name: req.body.name,
      category: req.body.category,
      location: req.body.location,
      creatorID: req.body.id,
      upVotes: 0
    }).then(function() {
      console.log("event created");
      res.end();
    }).catch(function(err) {
      console.log(err);
      res.json(err);
      // res.status(422).json(err.errors[0].message);
    });
  });




  app.get("/api/events", function(req, res){
    db.Events.findAll({}).then(
      function(events){
       console.table(events)
      res.json(events)
      // res.render("index", {all_events:events})
    })

    })
  }

