const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mysql = require("mysql2");
const connection = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "a5_data"
});
connection.connect();
connection.query(  "SELECT * FROM cruser ",function(error, results, fields) {
    // results is an array of records, in JSON format
    // fields contains extra meta data about results
    // console.log("Results from DB", results[0], "and the # of records returned", results.length);

    if (error) {
        // in production, you'd really want to send an email to admin but for now, just console
        console.log(error);
    }
    console.log(results[0]);
    
    // if(results.length > 0) {
        // email and password found
      //   profileDOM.window.
        // document.getElementsByTagName("Headline")[0].innerHTML = "Welcome back " + JSON.parse(results)[0].crname;
        // app.get('/profile', function(req, res) {
        //   res.send(results[0]);
        // });
        
        // return callback(results[0]);
    // } else {
        // user not found
        // return callback(null);
    // }

})
connection.end();

