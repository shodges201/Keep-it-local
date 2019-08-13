// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");
var isAuthenticated = require("../config/middleware/isAuthenticated");
var notAuthenticated = require("../config/middleware/notAuthenticated");
var Messages = require('../models/messages');
var voucher_codes = require('voucher-code-generator');
var moment = require('moment');

// Helper function to manipulate the ISO86 timestamp to become an easier format to check
var momentToString = function(currentTime){
  let x = currentTime.split('-');
  currentTime = currentTime.replace('-' + x[x.length-1], '.000Z');
  return currentTime;
}


module.exports = function (app) {


  //Loads the page that holds the button to generate a code
  app.get("/getcode", function (req, res) {
    res.render("generatecode");
  })

  // Loads a page that displays code the user generated
  app.get("/yourcode", function (req, res) {
    res.render("yourcode")
  })

  // A route that renders the generatecode.hdbs html page
  app.get("/code", function (req, res) {
    res.render('generatecode');
  })

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

  app.get("/events/:id", isAuthenticated, function(req,res){
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

  app.put("/api/login", passport.authenticate("local"), function (req, res) {
    console.log('tried to login');
    console.log(req.body.location);
    db.User.update({
      currentLocation: req.body.location
    },{
      where: {
        userName: req.body.username
      }
    }).then(function(resp){
      console.log(resp);
      res.end();
     });
  });

  app.post("/api/signup", function(req, res) {
    console.log('req.body: ');
    console.log(req.body);
    currentUser = req.body.username;
    let now = moment().format();
    now = momentToString(now);
    db.User.create({
      userName: req.body.username,
      password: req.body.password,
      lastReferral: now,
      currentLocation: req.body.location
    }).then(function () {
      res.redirect(307, "/api/login");
    }).catch(function(err) {
      console.log(err);
      res.json(err);
    });
  });

  // This generates a code for the user when the button is checked.
  app.get("/api/codes", function (req, res) {
    db.User.findOne({
      where: {
        userName: req.user.userName
      }
    }).then(function (result) {
    // Gets the current time in a moment object
      let currentTime = moment().format();
      console.log(currentTime);
    // Calls our helper function to format the current time to match format of the time on the database
      currentTime = momentToString(currentTime);
      currentTime = moment(currentTime);
      let eligible = false;

      let str = new Date(result.lastReferral).toISOString();
      str = moment(str);
    // Checks the lastReferral with current time. Edit the int to set the amount of days
      if(str.diff(currentTime, 'days') >= 0){
          console.log("You're eligible for a new code")
         eligible = true;
        }
      res.json({eligible: eligible})
    })
  
  });

  // Route used to post a referral code on click
  app.post("/api/getcode", function (req, res) {
    db.ReferralCodes.create({
      creatorID: req.user.userName,
      // Generates an array of 5 random strings with 8 characters in length and selecting the first one.
      code: voucher_codes.generate({
        length: 8,
        count: 5
      })[0]
    }).then(function (resp) {
      console.log("code created");
      res.json(resp);
    })
  })


  // RSVP create and get
  app.get("/api/rsvp/:id", function(req,res){
    // console.log("GET /api/rsvp")
    let event_id = req.params.id;
    console.log("event_id received "+event_id)
    db.Events.findOne({
      where: {
        id: event_id
      }
    }).then(function(dbEvents){
      // console.log("looking for rsvp")
      // console.log(dbEvents)
      let event = {
        upVotes: dbEvents.dataValues.upVotes
      }
      // console.log("rsvp count "+event.upVotes)
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
  

  //get a single event
  app.get('/api/event/:id', function(req, res){
    db.Events.findOne({where:{id:req.params.id}, plain:true})
    .then(function(data){
      console.log(data);
      res.json(data);
    })
  })

  //change name and/or description of an event
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
      res.json(data);
    }).catch(function (err) {
      res.json(err);
    });
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

}

