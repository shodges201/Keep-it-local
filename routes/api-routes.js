// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");
var isAuthenticated = require("../config/middleware/isAuthenticated");
var notAuthenticated = require("../config/middleware/notAuthenticated");
var Messages = require('../models/messages');
var connection = require('../config/connection');

module.exports = function (app) {

//====================== render/html routes ========================================
  // If the user already has an account send them to the members page
  app.get("/", notAuthenticated, function (req, res) {
    console.log("login");
    res.render("login")
  });

  app.get("/login", notAuthenticated, function(req,res){
    res.render("login");
  });
  
  app.get("/signup", notAuthenticated, function(req,res){
    res.render("signup");
  });

  app.get("/logout", isAuthenticated, function(req, res) {
    req.logout();
    res.redirect("/");
  });

  app.get("/create", isAuthenticated, function (req, res) {
    res.render("create");
  });

  app.get("/events", isAuthenticated, function (req, res) {
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

  app.get("/events/:id", isAuthenticated,function(req,res){
    console.log(req.user);
    if (req.user) {
      let all = [];
      let user = [];
      let msgs = [];
      let focus;
      db.Events.findAll({
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
                  focus = {
                    data: dbUserEvents[0].dataValues,
                    ownedByUser: owner
                    // equals: function(userID) {
                    //   if(this.data.creatorID == userID) {
                    //     return true
                    //   }
                    //   else {
                    //     return false
                    //   }
                    // }
                  }
                  }).then(function() {
                    connection.query(`SELECT * FROM events_db.Messages_${req.params.id} ORDER BY id ASC;`, function (err, result) {
                      if (err) throw err.stack;
                      console.log("Messages_"+req.params.id);
                      console.table(result);
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

  //====================== api routes ========================================
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

  app.get("/api/rsvp/:id", function(req,res){
    console.log("GET /api/rsvp")
    let event_id = req.params.id;
    console.log("event_id received "+event_id)
    db.Events.findOne({
      where: {
        id: event_id
      }
    }).then(function(dbEvents){
      console.log("looking for rsvp")
      console.log(dbEvents)
      let event = {
        upVotes: dbEvents.dataValues.upVotes
      }
      console.log("rsvp count "+event.upVotes)
      res.send(event)
    })
  })

  app.put("/api/rsvp", function(req,res){
    console.log("PUT /api/rsvp")
    let event_id = req.body.event_id;
    db.Events.update({
      upVotes: db.sequelize.literal('upVotes + 1')
    }, 
    {
      where: {
        id: event_id
      }
    }).then(function(){
      res.end();
    }).catch(function (err) {
      console.log(err);
      res.json(err);
    });
  })
  
  app.get('/api/event/:id', function(req, res){
    db.Events.findOne({where:{id:req.params.id}, plain:true})
    .then(function(data){
      console.log(data);
      res.json(data);
    })
  })

  app.get("/api/rsvp/:id", function(req,res){
    console.log("GET /api/rsvp")
    let event_id = req.params.id;
    console.log("event_id received "+event_id)
    db.Events.findOne({
      where: {
        id: event_id
      }
    }).then(function(dbEvents){
      console.log("looking for rsvp")
      console.log(dbEvents)
      let event = {
        upVotes: dbEvents.dataValues.upVotes
      }
      console.log("rsvp count "+event.upVotes)
      res.send(event)
    })
  })

  //change name and/or description of event
  app.put("/api/event/:id", function(req, res){
    db.Events.update({
      name: req.body.name,
      description: req.body.description
    },
    {
      where:{
        id: req.params.id
      }
    }
    ).then(function(data){
      console.log('data: ');
      console.log(data);
      res.json(data);
    }).catch(function (err) {
      console.log(err);
      res.json(err);
    });
  });

  //get the details of one single event
  app.get('/api/event/:id', function(req, res){
    db.Events.findOne({where:{id: req.params.id}, plain:true})
    .then(function(data){
      console.log(data);
      res.json(data);
    })
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
    let description = "";
    if(req.body.description){
      description = req.body.description;
    }
    db.Events.create({
      name: req.body.name,
      description: description,
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
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, function(err, resp){
          res.end();
        });

    }).catch(function (err) {
      console.log(err);
      res.json(err);
    })
  });

  //get all messages from a certain event

  // create new message 
  app.post("/api/message", function(req, res){
    let event_id = req.body.id;
    //console.log('content: ');
    let content = escapeString(req.body.content);
    console.log(content);
    connection.query(`INSERT INTO Messages_${event_id}(content, creatorID) VALUES("${content}", "${req.user.userName}");`, 
      function(err, result){
        if (err) throw err.stack;
        console.log('got everything');
        console.table(result);
        res.end();
    });
  });

  //get all messages from a certain event
  app.get("/api/message/:event_id", function(req, res){
    let event_id = req.params.event_id;

    // ============= mysql method =======================
    connection.query(`SELECT * FROM events_db.Messages_${event_id} ORDER BY id ASC`, function(err, result){
      if(err) throw err.stack;
      console.table(result);
      res.send(result);
    });
  });

  //used for making mysql queries with strings including special characters
  function escapeString (str) {
    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char; // prepends a backslash to backslash, percent,
                                  // and double/single quotes
        }
    });
}
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
