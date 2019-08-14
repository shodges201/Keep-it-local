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
    password: "", // add your local password here.
    database: "events_db" // add your db name here
  });
}

connection.config.typeCast = function(field, next) {
  if (field.type == "TINY" && field.length == 1) {
    return field.string() == "1"; // 1 = true, 0 = false
  }
  return next();
};


module.exports = connection;