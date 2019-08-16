var mysql = require('mysql');
require('dotenv').config();
console.log(process.env);

var connection;

if (process.env.JAWSDB_URL) {
  connection = mysql.createConnection(process.env.JAWSDB_URL);
  console.log("jaws");
} else {
  console.log('non-jaws');
  connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "DJ10ssless",
    database: 'events_db'
  });
  
  connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });
}

connection.config.typeCast = function(field, next) {
  if (field.type == "TINY" && field.length == 1) {
    return field.string() == "1"; // 1 = true, 0 = false
  }
  return next();
};


module.exports = connection;