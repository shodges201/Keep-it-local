// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");
var isAuthenticated = require("../config/middleware/isAuthenticated");
var Messages = require('../models/messages');

module.exports = function (app) {

  // If the user already has an account send them to the members page
  app.get("/", function (req, res) {
    console.log("signup");
    res.render("signup")
  });

  app.get("/events", function (req, res) {
    console.log(req.user);
    if (req.user) {
      let all = [];
      let user = [];
      db.Events.findAll({
        // attributes: ['id','name', 'category', 'location', 'upVotes', 'creatorID']
      }).then(function (dbEvents) {
          dbEvents.forEach(function (element) {
            all.push(element.dataValues);
          });
          // all.push(dbEvents[0].dataValues);
          // console.log(all);
        }).then(function () {
          db.Events.findAll({ 
            where: { creatorID: req.user.userName } 
          }).then(function (dbUserEvents) {
            // console.log("---------------user events----------------");
            // console.log(dbUserEvents);
            dbUserEvents.forEach(function (item) {
              user.push(item.dataValues);
            });
            res.render('index', { all_events: all, user_events: user });
          });
        });
    }
    else{
      res.redirect('/');
    }
  });

  app.get("/login", function(req,res){
    res.render("login")
  })
  
  app.get("/signup", function(req,res){
    res.render("signup")
  })

  app.get("/:id", function(req,res){
    console.log(req.user);
    if (req.user) {
      let all = [];
      let user = [];
      let focus;
      db.Events.findAll({
          // attributes: ['name', 'category', 'location', 'upVotes', 'creatorID']
        })
        .then(function (dbEvents) {
          dbEvents.forEach(function (element) {
            all.push(element.dataValues);
          });
          // all.push(dbEvents[0].dataValues);
          // console.log(all);
        }).then(function () {
          db.Events.findAll({
              where: {
                creatorID: req.user.userName
              }
          }).then(function (dbUserEvents) {
            // console.log("---------------user events----------------");
            // console.log(dbUserEvents);
            dbUserEvents.forEach(function (item) {
              user.push(item.dataValues);
            })
            }).then(function () {
                db.Events.findAll({
                    where: {
                      id: req.params.id
                    }
                }).then(function (dbUserEvents) {
                  console.log("Event Selected")
                  
                  dbUserEvents.forEach(function (item) {
                    console.log(item.dataValues)
                    focus = item.dataValues 
                  })
                  res.render('focus', {
                    all_events: all,
                    user_events: user,
                    select_event: focus
                  });
                })
                
            });
        });
    } 
    else {
      res.redirect('/events');
    }
  })


  app.post("/api/login", passport.authenticate("local"), function (req, res) {
    console.log('tried to login');
    res.end();
  });


  app.post("/api/signup", function(req, res) {
    console.log(req.body);
    currentUser = req.body.username;
    db.User.create({
      userName: req.body.username,
      password: req.body.password
    }).then(function () {
      res.redirect(307, "/api/login");
    }).catch(function(err) {
      console.log(err);
      res.json(err);
    });
  });

  app.get("/login", function(req, res){
    res.render("login");
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


  //create new event with a name, category, and location passed in
  //upVotes is initially 0, and the creatorID is the user's id that is currently logged in.
  app.post("/api/event", function (req, res) {
    db.Events.create({
      name: req.body.name,
      category: req.body.category,
      location: req.body.location,
      creatorID: req.body.id,
      upVotes: 0
    }).then(function () {
      console.log("event created");
      res.end();
    }).then(function(){
      var model = Messages.createTable(db.sequelize, db.Sequelize.DataTypes, req.body.name);
      db[model.name] = model;
      if(db[model.name].associate){
        db[model.name].associate(db);
      }
      console.log(db.Messages_m);
      console.log(db.Events);
      db['Messages_' + req.body.name].sync();
    }).catch(function (err) {
      console.log(err);
      res.json(err);
    })
  });




  app.get("/api/events", function (req, res) {
    db.Events.findAll({}).then(
      function (events) {
        console.table(events)
        res.json(events)
        // res.render("index", {all_events:events})
      })

  })
}

