
const express = require("express");
const session = require("express-session");
const app = express();
const fs = require("fs");
const { JSDOM } = require('jsdom');

// static path mappings
app.use("/js", express.static("public/js"));
app.use("/css", express.static("public/css"));
app.use("/img", express.static("public/imgs"));
app.use("/fonts", express.static("public/fonts"));
app.use("/html", express.static("public/html"));
app.use("/media", express.static("public/media"));

var profile = fs.readFileSync("./app/html/profile.html", "utf8");
var profileDOM = new JSDOM(profile);
var oDataCon = profileDOM.window.document.getElementById("dataContent");
var dataRecord=oDataCon.getElementsByTagName("li");


app.use(session(
  {
      secret:"extra text that no one will guess",
      name:"wazaSessionID",
      resave: true,
      saveUninitialized: true })
);



app.get("/", function (req, res) {

    if(req.session.loggedIn) {
        res.redirect("/profile");
    } else {

        let doc = fs.readFileSync("./app/html/index.html", "utf8");

        res.set("Server", "Wazubi Engine");
        res.set("X-Powered-By", "Wazubi");
        res.send(doc);

    }

});


app.get("/profile", function(req, res) {

    // check for a session first!
    if(req.session.loggedIn) {

        // let profile = fs.readFileSync("./app/html/profile.html", "utf8");
        // let profileDOM = new JSDOM(profile);
        // var oDataCon = profileDOM.window.document.getElementById("dataContent");
        // var dataLength=oDataCon.getElementsByTagName("li");

        // criticdata();

        // great time to get the user's data and put it into the page!
        profileDOM.window.document.getElementsByTagName("title")[0].innerHTML
             = req.session.name + "'s Profile";
        profileDOM.window.document.getElementById("Inf_part1").innerHTML
             = "User name: "+req.session.name;
        profileDOM.window.document.getElementById("Inf_part2").innerHTML
             = "EmailAdd: "+req.session.email;
        profileDOM.window.document.getElementById("Inf_part3").innerHTML
            = "Password: "+req.session.password;
        profileDOM.window.document.getElementById("Inf_part4").innerHTML
             = "User age: "+req.session.age ;
        profileDOM.window.document.getElementById("Inf_part5").innerHTML
            = "MemberNo.: "+req.session.member ;
        profileDOM.window.document.getElementById("Inf_part6").innerHTML
            ="Rrg date: "+req.session.regdate;
             // profileDOM.window.document.getElementById("profile_name").innerHTML
        //      = "Welcome back " + req.session.name;
        
        res.set("Server", "Wazubi Engine");
        res.set("X-Powered-By", "Wazubi");
        res.send(profileDOM.serialize());

    } else {
        // not logged in - no session and no access, redirect to home!
        res.redirect("/");
    }
    
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Notice that this is a "POST"
app.get("/login", function(req, res) {               //post换成app.post
    res.setHeader("Content-Type", "application/json");


    // console.log("What was sent", req.body.email,"and", req.body.password);   //post换成用此行。注意body
    console.log("What was sent", req.query.email,+"and"+ req.query.password);    //get换成此行.注意query


    // let results = authenticate(req.body.email, req.body.password,           //post换成用此行
    let results = authenticate(req.query.email, req.query.password,            //get换成此行
            function(userRecord) {
            //console.log(rows);
            if(userRecord == null) {
                // server couldn't find that, so use AJAX response and inform
                // the user. when we get success, we will do a complete page
                // change. Ask why we would do this in lecture/lab :)
                res.send({ status: "fail", msg: "User account not found." });
            } else {
                // authenticate the user, create a session
                req.session.loggedIn = true;
                req.session.email = userRecord.email;
                req.session.password = userRecord.password;
                req.session.name = userRecord.name;
                req.session.age = userRecord.age;
                req.session.member = userRecord.memberNO;
                req.session.regdate = userRecord.regdate;
                req.session.save(function(err) {
                    // session saved, for analytics, we could record this in a DB
                });
                // all we are doing as a server is telling the client that they
                // are logged in, it is up to them to switch to the profile page
                res.send({ status: "success", msg: "Logged in." });
            }
    });
    criticdata() ;
    
});



app.get("/logout", function(req,res){

    if (req.session) {
        req.session.destroy(function(error) {
            if (error) {
                res.status(400).send("Unable to log out")
            } else {
                // session deleted, redirect to home
                res.redirect("/");
            }
        });
    }
});

function authenticate(email, pwd, callback) {

    const mysql = require("mysql2");
    const connection = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "a5_login"
    });
    connection.connect();
    connection.query(
      //'SELECT * FROM user',
      "SELECT * FROM user WHERE email = ? AND password = ?", [email, pwd],
      function(error, results, fields) {
          // results is an array of records, in JSON format
          // fields contains extra meta data about results
          console.log("Results from DB", results, "and the # of records returned", results.length);

          if (error) {
              // in production, you'd really want to send an email to admin but for now, just console
              console.log(error);
          }
          if(results.length > 0) {
              // email and password found
              return callback(results[0]);
          } else {
              // user not found
              return callback(null);
          }

      }
    );
    connection.end();
}

/*
 * Function that connects to the DBMS and checks if the DB exists, if not
 * creates it, then populates it with a couple of records. This would be
 * removed before deploying the app but is great for
 * development/testing purposes.
 */
async function init() {

    // we'll go over promises in COMP 2537, for now know that it allows us
    // to execute some code in a synchronous manner
    const mysql = require("mysql2/promise");
    const connection = await mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      multipleStatements: true
    });
    const createDBAndTables = `CREATE DATABASE IF NOT EXISTS a5_login;
        use a5_login;
        CREATE TABLE IF NOT EXISTS user (
        ID int NOT NULL AUTO_INCREMENT,
        name varchar(30),
        email varchar(30),
        password varchar(30),
        age varchar(30),
        memberNO varchar(30),
        regdate varchar(30),
        PRIMARY KEY (ID));
        CREATE TABLE IF NOT EXISTS cruser (
            ID int NOT NULL AUTO_INCREMENT,
            crname varchar(30),
            crhead varchar(128),
            critic varchar(1024),
            crscore varchar(10),
            crdate varchar(30),
            PRIMARY KEY (ID));`;
    await connection.query(createDBAndTables);          //2tables:user  cruser

    // await allows for us to wait for this line to execute ... synchronously
    // also ... destructuring. There's that term again!
    const [rows, fields] = await connection.query("SELECT * FROM user");
    // no records? Let's add a couple - for testing purposes
    if(rows.length == 0) {
        // no records, so let's add a couple
        let userRecords = "insert into user (name, email, password,age,memberNo,regdate) values ?";
        let recordValues = [
            ["Hank", "hank_frank@bcit.ca", "a12345","22","Vip123456","2018/09/27"],
            ["Martin", "martin_jonson@bcit.ca", "a12345","20","Reg584111","2021/10/13"],
            ["David", "david_carmen@bcit.ca", "a12345","27","Vip658324","2011/03/08"],
            ["Barbie", "barbie_catherin@bcit.ca", "a12345","21","Vip121349","2015/12/09"]
        ];
        await connection.query(userRecords, [recordValues]);
    }

    const [rows1, fields1] = await connection.query("SELECT * FROM cruser");
    // no records? Let's add a couple - for testing purposes
    if(rows1.length == 0) {
        // no records, so let's add a couple
        let userRecords1 = "insert into cruser (crname, crhead, critic,crscore,crdate) values ?";
        let recordValues1 = [
            ["Hank", "The 10 most anticipated sci-fi movies of 2021",
             "2020 is a strange year, with sci-fi movies big and small escaping to 2021. With many cinemas  around the world still closing, it's no wonder Hollywood studios are reluctant to take the risk of releasing these films. Even in normal times, the sci-fi genre doesn't fare so well, especially for original sci-fi movies.","8.9","2021/11/15"],
            ["Martin", "Dune: Blockbusters like this are dying out", 
            "Despite catching a huge 2D screening on Friday , I waited two days before I was able to talk about the movie -- dune was so strong that I couldn't even begin to praise it","9.3","2021/11/15"],
            ["David", "Dune : The sleep of hardcore science fiction,takes the story to heart", 
            "Hollywood takes the story to heart","9.0","2021/11/15"],
            ["Barbie", "Those who give high ratings to be a person!", 
            "Paying to go to the cinema is sorry Grandpa MAO! No one will ever see this movie again","5.0","2021/11/15"],
            ["Jennifer", "A sci-fi version of the war in Afghanistan", 
            "Two Japanese a pockmarked face of a spider man in the ugly Japanese feel more puzzled is a Chinese also played a traitor disgusting dead yellow heart of Chinese people white heart except","7.5","2021/11/15"],
            ["Patricia", "It would be nice if I could finish the follow-up story with this quality", 
            "I still have some say in how the movie is going to be made. I've read the book, played Dune II, 2000 watched the original movie and the 2000 series, and have more or less gained some experience Only Paul in Dune is considered a prophet of the future on screen","8.0","2021/11/15"],
            ["James", "Those who give high ratings to be a person!", 
            "Paying to go to the cinema is sorry Grandpa MAO! No one will ever see this movie again","6.2","2021/11/15"],
            ["Robert", "Only Paul in Dune is considered a prophet of the future on screen", 
            "Does the fact that I was able to predict dune's entire plot before it even came out prove that I can see the future? Of course I don't. The real reason is... I've read the original. Is there anyone in the world who can see the future","7.1","2021/11/15"],
            ["Oliver", " Boring", 
            "10 minutes to finish things must be pieced together more than 2 hours, but also hard out of a 2 part song, inside the editing of the chaotic. The music scares you from time to time.","5.0","2021/11/15"],
            ["Liam", "A bad show. A waste of time", 
            "It's a 1 because it can't go any lower. I'm not a fan of books","5.0","2021/11/15"]
        ];
        await connection.query(userRecords1, [recordValues1]);
        // console.log(userRecord.crname[0]);
    }


    console.log("Listening on port " + port + "!");
    connection.end();
}

//影评数据库 函数   
        
//profile 数据生成

 function criticdata(){
        
    const mysql = require("mysql2");
    const connection = mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "a5_login"
    });
    connection.connect();
    connection.query("SELECT * FROM cruser ",function(error, results1, fields) {
        // console.log("critic data", results1[0], "and the # of records returned", results1.length);
        if (error) {
              console.log(error);
        }
        for (let i =0;i<results1.length;i++) {
            dataRecord[0+5*i].innerHTML=results1[i].crhead;
            dataRecord[1+5*i].innerHTML=results1[i].crdate;
            dataRecord[2+5*i].innerHTML=results1[i].crname;
            dataRecord[3+5*i].innerHTML=results1[i].critic;
            dataRecord[4+5*i].innerHTML=results1[i].crscore;
            
        }
        // console.log(results1[1].crhead);
        // return callback(results1);
    });
    connection.end();
}



// RUN SERVER
let port = 8000;

app.listen(port, init);
