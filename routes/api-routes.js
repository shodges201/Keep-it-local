// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");
var isAuthenticated = require("../config/middleware/isAuthenticated");
var notAuthenticated = require("../config/middleware/notAuthenticated");
var connection = require('../config/connection');
var Messages = require('../models/messages');
var voucher_codes = require('voucher-code-generator');
var moment = require('moment');
var NodeGeocoder = require('node-geocoder');
var turf = require('@turf/turf');
var options = {
  provider: 'mapquest',
  apiKey: 'vp4Ua1uwTlWCTF3R29jaF0LRR6GZgfuw' 
};
var geocoder = NodeGeocoder(options);

/*
geocoder.geocode("300 Atrium Drive, Somerset, NJ", function ( err, data ) {
        console.log("-------------------------");
        console.log(data);
      });
*/



module.exports = function (app) { 

  //====================== render/html routes ========================================//
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
      let currentLoc = formatCoords(req.user.currentLocation);
      const options = {units: 'miles'};
      db.Events.findAll({
        where: {
          creatorID: {
            [db.Sequelize.Op.ne]: req.user.userName
          }
        }
      }).then(function (dbEvents) {
          console.log(req.user.currentLocation);
          dbEvents.forEach(function (element) {
            console.log('data vals: ');
            console.log(element.dataValues);
            let destinationCoords = formatCoords(element.dataValues.coords);
            let distance = turf.distance(currentLoc, destinationCoords, options);
            console.log(distance);
            if(distance <= 30){
              console.log(distance);
              let dataVals = element.dataValues;
              dataVals['distance'] = toTwoPlaces(distance);
              all.push(dataVals);
            }
          })
        }).then(function () {
          db.Events.findAll({ 
            where: { creatorID: req.user.userName } 
          }).then(function (dbUserEvents) {
            dbUserEvents.forEach(function (item) {
              let destinationCoords = formatCoords(item.dataValues.coords);
              let distance = turf.distance(currentLoc, destinationCoords, options);
              let dataVals = item.dataValues;
              dataVals['distance'] = toTwoPlaces(distance);
              user.push(item.dataValues);
            });
            console.log(all)
            console.log(user)
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
      let currentLoc = req.user.currentLocation;
      const options = {units: 'miles'};
      db.Events.findAll({
          where: {
            creatorID: {
              [db.Sequelize.Op.ne]: req.user.userName
            }
          }
        }).then(function (dbEvents) {
          dbEvents.forEach(function (element) {
            let destinationCoords = element.dataValues.coords;
            let distance = distanceBetween(currentLoc, destinationCoords, options);
            console.log(distance);
            if(distance <= 30){
              console.log(distance);
              let dataVals = element.dataValues;
              dataVals['distance'] = toTwoPlaces(distance);
              all.push(dataVals);
            }
          });
        }).then(function() {
          db.Events.findAll({
              where: {
                creatorID: req.user.userName
              }
          }).then(function (dbUserEvents) {
            dbUserEvents.forEach(function (item) {
              let destinationCoords = item.dataValues.coords;
              let distance = distanceBetween(currentLoc, destinationCoords, options);
              let dataVals = item.dataValues;
              dataVals['distance'] = toTwoPlaces(distance);
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
                    connection.query(`SELECT * FROM Messages_${req.params.id} ORDER BY id ASC;`, function (err, result) {
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

  //====================== api routes ========================================//
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
    currentPassword = req.body.password;
    let now = moment().format();
    now = momentToString(now);
    if(!currentUser || !currentPassword){
      res.statusMessage = 'Bad username or password';
      res.status(400).end();
    }
    else{
      db.User.create({
        userName: req.body.username,
        password: req.body.password,
        referral: req.body.referral,
        lastReferral: now,
        currentLocation: req.body.location
      }).then(function () {
        db.ReferralCodes.destroy({
          where: {
            code: req.body.referral,
          }
        }).then(function(resp){
          res.redirect(307, "/api/login");
        })
      }).catch(function(err) {
        console.log(err);
        res.json(err);
      });
    }
  });

  app.post("/api/checkcode", function (req,res){
    db.ReferralCodes.findOne({
      where: {code: req.body.referral}}).then(function(result){
        if(!result){
          res.statusMessage = "Bad Referral Code";
          res.status(400).end();
        }
        console.log(result);
        res.end();
    });
  });

  app.get("/api/allcodes", function (req,res){
    db.ReferralCodes.findAll({
      where: {
        creatorID: req.user.userName
      }}).then(function(allcodes){
        res.send(allcodes);
        
    })
  })

  app.get("/api/code", function (req, res) {
    // This generates a code for the user when the button is checked.
    db.User.findOne({
      where: {
        userName: req.user.userName
      }
    }).then(function (result) {
      // Gets the current time in a moment object
      let currentTime = moment().format();

      let test = '2019-07-11T11:49:52-04:00'

      console.log(currentTime);
      // Calls our helper function to format the current time to match format of the time on the database
      currentTime = momentToString(currentTime);
      currentTime = moment(currentTime);

      // test = momentToString(test);
      // test = moment(test);

      let eligible = false;
      let lastRef = new Date(result.lastReferral).toISOString();
      lastRef = moment(lastRef);
      
      let userStart = new Date(result.createdAt).toISOString();
      userStart = moment(userStart);
    
    
      //change the test to currentTime
     if(lastRef.diff(currentTime, 'days') < 3) {
        console.log("You're not eligible for a new code")
        res.json({status: 1})
      }
      else {
        console.log("You're eligible for a new code")
        res.json({status: 2})
      }

      
    // Checks the lastReferral with current time. Edit the int to set the amount of days
    
    })
  
  });

  app.post("/api/code", function (req, res) {
    // Route used to post a referral code on click
    db.ReferralCodes.create({
      creatorID: req.user.userName,
      // Generates an array of 5 random strings with 8 characters in length and selecting the first one.
      code: voucher_codes.generate({
        length: 8,
        count: 5
      })[0]
    }).then(function (resp) {
      console.log("code created");
      console.log(resp);
      res.json(resp);
    });
  });

  app.post("/api/code/admin", function (req, res) {
    // Route used to post a referral code on click
    if(req.body.apiKey === 'MA3Igp6a'){
      db.ReferralCodes.create({
        creatorID: 'admin',
        // Generates an array of 5 random strings with 8 characters in length and selecting the first one.
        code: voucher_codes.generate({
          length: 8,
          count: 5
        })[0]
      }).then(function (resp) {
        console.log("code created");
        console.log(resp);
        res.json(resp);
      });
    }
    else{
      res.statusMessage = 'Bad API key';
      res.status(401).end();
    }
  });


  app.get("/api/rsvp/:id", function(req,res){
    // RSVP create and get
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
  
  app.get('/api/event/:id', function(req, res){
    // get a single event
    db.Events.findOne({
      where: {
        id:req.params.id}, 
        plain:true
    }).then(function(data){
      console.log(data);
      res.json(data);
    })
  })

  app.put("/api/event/:id", function(req, res){
    //change name and/or description of an event
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

  app.post("/api/event", function (req, res) {
    //create new event with a name, category, and location passed in
    //upVotes is initially 0, and the creatorID is the user's id that is currently logged in.

    // let fullAddr = `${req.body.address}, ${req.body.city_state}`
    // geocoder.geocode(fullAddr, function (err, data) {
    //   if(err) throw err.stack;
    //   console.log(data)
    // });
    let description = "";
    if(req.body.description){
      description = req.body.description
    }
    geocoder.geocode(req.body.location, function(err, data){
      
      let loc = data[0].latitude.toString() + ', ' + data[0].longitude.toString();
      console.log(data[0].latitude.toString() + ', ' + data[0].longitude.toString());

      let from = turf.point([data[0].latitude, data[0].longitude]);
      let userLoc = req.user.currentLocation;
      userLoc = userLoc.split(', ');
      
      let to = turf.point([userLoc[0], userLoc[1]]);
      console.log(userLoc[0]+ ', ' + userLoc[1]);
      let options = {units: 'miles'};

      let distance = turf.distance(from, to, options);
      console.log('distance: ' + distance);

      if(distance >= 30){
        res.statusMessage = "Too far away";
        res.status(400).end();
        return;
      }

      let now = moment().format('YYYY-MM-DD');
      let eventDate = req.body.date;
      let future = compareDashedDates(now, eventDate);
      if(!future){
        res.statusMessage = "Invalid Date";
        res.status(400).end();
        return;
      }

      // else if(date is in the past){
        // res.statusMessage = "Invalid Date";
        // res.status(400).end();
      // }
      else {
        db.Events.create({
          name: req.body.name,
          description: description,
          date:req.body.date,
          category: req.body.category,
          // streetAddress: req.body.address,
          location: req.body.location,
          coords: loc,
          creatorID: req.user.userName,
          // startTime: req.body.startTime,
          // endTime: req.body.endTime,
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
      }
    })
  });

  app.post("/api/message", function(req, res){
    // create new message 
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

  app.get("/api/message/:id", function(req, res){
    //get all messages from a certain event
    let event_id = req.params.id;
    // ============= mysql method =======================
    connection.query(`SELECT * FROM Messages_${event_id} ORDER BY id ASC`, function(err, result){
      if(err) throw err.stack;
      console.table(result);
      res.send(result);
    });
  });


  //====================== helper functions ========================================//
  function escapeString (str) {
    //used for making mysql queries with strings including special characters
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

  function formatCoords(str){
    str = str.split(', ');
    let list = [parseFloat(str[0]), parseFloat(str[1])];
    return list;
  }

  function toTwoPlaces(num){
    return parseFloat(Math.round(num * 100) / 100).toFixed(2);
  }

  function momentToString(currentTime) {
    let x = currentTime.split('-');
    currentTime = currentTime.replace('-' + x[x.length - 1], '.000Z');
    return currentTime;
  }

  function distanceBetween(coords1, coords2){
    //takes in comma seperated coordinates and returns the distance between them
    coords1 = formatCoords(coords1);
    coords2 = formatCoords(coords2);
    let from = turf.point(coords1);
    let to = turf.point(coords2);
    let options = {units: 'miles'};
    let distance = turf.distance(from, to, options);
    return distance;
  }

  // takes two string respresentations of dates in format "YYYY-MM-DD"
  function compareDashedDates(date1, date2){
    date1 = date1.split('-');
    date2 = date2.split('-');
    for(let i = 0; i < date1.length; i++){
      if(parseInt(date1[i]) < parseInt(date2[i])){
        return true;
      }
      else if(parseInt(date1[i]) > parseInt(date2[i])){
        return false;
      }
    }
  }
}

