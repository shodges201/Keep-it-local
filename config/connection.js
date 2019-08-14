var mysql = require('mysql');
require('dotenv').config();
console.log(process.env);
var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  connection.connect(function(err) {
    if (err) throw err.stack;
    console.log("Connected!");
  });

  module.exports = connection;