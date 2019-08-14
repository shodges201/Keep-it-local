var mysql = require('mysql');
require('dotenv').config();
console.log(process.env);

if (process.env.JAWSDB_URL) {
  connection = mysql.createConnection(process.env.DB_HOST);
  console.log("jaws");
} else {
var connection = mysql.createConnection({
  connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "", // add your local password here.
    database: "events_db" // add your db name here
  });
  });
  
  connection.connect(function(err) {
    if (err) throw err.stack;
    console.log("Connected!");
  });

  module.exports = connection;