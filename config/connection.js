var mysql = require('mysql');
require('dotenv').config();
console.log(process.env);

  // "development": {
  //   "username": "cvzrayq3nwdhmsmc",
  //   "password": "yjt76ne10wymwc67",
  //   "database": "l2u6736043i4uqxd",
  //   "host": "x3ztd854gaa7on6s.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
  //   "dialect": "mysql"
  // },

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

// var connection = mysql.createPool({
//   connectionLimit : 10,
//   host     : process.env.DB_HOST,
//   user     : process.env.DB_USERNAME,
//   password : process.env.DB_PASSWORD,
//   database : process.env.DB_NAME
// });

connection.config.typeCast = function(field, next) {
  if (field.type == "TINY" && field.length == 1) {
    return field.string() == "1"; // 1 = true, 0 = false
  }
  return next();
};


module.exports = connection;