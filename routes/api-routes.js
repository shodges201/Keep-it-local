// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");
var isAuthenticated = require("../config/middleware/isAuthenticated");
var Messages = require('../models/messages');
var connection = require('../config/connection');

module.exports = function (app) {

  console.log(db);
  // If the user already has an account send them to the members page
  app.get("/", function (req, res) {
    console.log("login");
    res.render("login")
  });

  app.get("/events", function (req, res) {
    console.log(req.user);
    if (req.user) {
      let all = [];
      let user = [];
      db.Events.findAll({
        // attributes: ['name', 'category', 'location', 'upVotes', 'creatorID']
        //uncomment this line to only get events that are not created by the user
        //,where: {creatorID: {[db.Sequelize.Op.ne]: req.user.username}}
      })
        .then(function (dbEvents) {
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
            res.render('index', { 
              all_events: all, 
              user_events: user 
            });
          });
        });
    }
    else{
      res.redirect('/');
    }
  });

  app.get("/login", function(req,res){
    res.render("login");
  })
  
  app.get("/signup", function(req,res){
    res.render("signup");
  })

  app.get("/:id", function(req,res){
    console.log(req.user);
    if (req.user) {
      let all = [];
      let user = [];
      let msgs = [];
      let focus;
      db.Events.findAll({
          // attributes: ['name', 'category', 'location', 'upVotes', 'creatorID']
        }).then(function (dbEvents) {
          dbEvents.forEach(function (element) {
            all.push(element.dataValues);
          });
        }).then(function() {
          db.Events.findAll({
              where: {
                creatorID: req.user.userName
              }
          }).then(function (dbUserEvents) {
            dbUserEvents.forEach(function (item) {
              user.push(item.dataValues);
            })
            }).then(function() {
                db.Events.findAll({
                    where: {
                      id: req.params.id
                    }
                }).then(function (dbUserEvents) {
                  console.log('dbUserEvents');
                  console.log(dbUserEvents[0].dataValues);
                  let owner = req.user.userName === dbUserEvents[0].dataValues.creatorID;
                  focus = {data: dbUserEvents[0].dataValues,
                           ownedByUser: owner}
                  }).then(function() {
                    connection.query(`SELECT * FROM events_db.Messages_${req.params.id} ORDER BY createdAt DESC;`, function (err, result) {
                      if (err) throw err.stack;
                      console.table(result);
                      console.log("focus")
                      console.log(focus)
                      res.render('focus', {
                        all_events: all,
                        user_events: user,
                        select_event: focus,
                        messages: result
                      });
                    });
                  })
                  
            });
        });
    }
    else{
      res.redirect("/");
    }
  });


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


  app.put("/api/rsvp", function(req,res){
    let event_id = req.body.event_id;
    db.Events.update({
      upVotes: sequelize.literal('upVotes + 1')
    }, 
    {
      where: {
        id: event_id
      }
    }).then(function(){
      res.end()
    }).catch(function (err) {
      console.log(err);
      res.json(err);
    });
  })


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
    let eventId;
    db.Events.create({
      name: req.body.name,
      category: req.body.category,
      location: req.body.location,
      creatorID: req.body.id,
      upVotes: 0
    }).then(function (resp) {
      console.log("event created");
      console.log(resp.dataValues.id);
      eventID = resp.dataValues.id;
    }).then(function(){
      //create a new table with name Messages_<eventname>
      connection.query(`CREATE TABLE Messages_${eventID}
      (
        id INTEGER(10) AUTO_INCREMENT PRIMARY KEY,
        content VARCHAR(255) NOT NULL,
        creatorID VARCHAR(255) NOT NULL,
        upVotes INTEGER(10) NOT NULL, 
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, function(err, resp){
          res.end();
        });

    }).catch(function (err) {
      console.log(err);
      res.json(err);
    })
  });

  // create new message 
  app.post("/api/message", function(req, res){
    let eventName = req.body.eventname;
    connection.query(`INSERT INTO Messages_${eventName}(content, creatorID, upVotes) VALUES('${req.body.content}', '${req.body.id}', 0);`, function(err, result){
      console.log('got everything');
      console.table(result);
      res.end();
    });
  });

  //get all messages from a certain event
  app.get("/api/message/:eventname", function(req, res){
    let eventName = req.params.eventname;
      db.Events.findOne({
          where: {
            name: req.body.name
          }
        }).then(function (dbNewEvent) {
            let event_id;
            dbNewEvent.forEach(function (item) {
              console.log(item.dataValues)
              event_id = item.dataValues.id
            })
          //create a new table with name Messages_<eventname>
          connection.query(`CREATE TABLE Messages_${event_id} (
            id INTEGER(10) AUTO_INCREMENT PRIMARY KEY,
            content VARCHAR(255) NOT NULL,
            creatorID VARCHAR(255) NOT NULL,
            upVotes INTEGER(10) NOT NULL, 
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id)
          )`, function(err, resp){
                res.end();
          })
        }).catch(function (err) {
          console.log(err);
          res.json(err);
        })
    });

  // create new message 
  app.post("/api/message", function(req, res){
    let event_id = req.body.id;

    connection.query(`INSERT INTO Messages_${event_id}(content, creatorID) VALUES('${req.body.content}', '${req.user.userName}');`, 
      function(err, result){
        if (err) throw err.stack;
        console.log('got everything');
        console.table(result);
        res.end()
    });
  });

  //get all messages from a certain event
  app.get("/api/message/:event_id", function(req, res){
    let event_id = req.params.event_id;

    // ============= mysql method =======================
    connection.query(`SELECT * FROM events_db.Messages_${event_id}`, function(err, result){
      if(err) throw err.stack;
      console.table(result);
      res.send(result);
    });
  });

  //get event of specific name 
  // app.get("/api/event/:eventname", function (req, res) {
  //   db.Events.findAll({
  //     // attributes: ['name', 'category', 'location', 'upVotes', 'creatorID'],
  //     where:{name: req.params.eventname}
  //   }).then(function (event) {
  //       //checks if user created the event
  //       let owner = event[0].dataValues.ownerID === req.user.username;
  //       // returns a json object that has two keys
  //       // eventDetails are is the table row object for that event
  //       // ownedByUser is a boolean value denoting if the user created the event - used for front-end admin privileges
  //       let result = {
  //         eventDetails: event[0].dataValues,
  //         ownedByUser: owner
  //       };
  //       res.json(result);
  //     });

  // })
}
