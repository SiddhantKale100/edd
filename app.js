//require modules
const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const { FingerprintJsServerApiClient, Region } = require('@fingerprintjs/fingerprintjs-pro-server-api');
const FingerprintJS = require('@fingerprintjs/fingerprintjs-pro');

// Initialize an agent at application startup.
// const fpPromise = FingerprintJS.load({ apiKey: 'your-public-api-key' })

// Get the visitor identifier when you need it.
// fpPromise
//   .then(fp => fp.get())
//   .then(result => console.log(result.visitorId))
// Init client with the given region and the secret api_key
const clientF = new FingerprintJsServerApiClient({ region: Region.Global, apiKey: "mhvKGtvOrTg6eDiLLO3c" });
let code, userD;
let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "siddhantkale300@gmail.com",
    pass: "yisnpwezykepcoii"
  }
})
// Get visitor history

const port = process.env.PORT || 3000;
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://siddhant:2XdDHhCq1ucbkr0Z@edd.looccft.mongodb.net/Mindscript?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
//aquire express in app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//allow app to use public folder to load html and css
app.use(express.static("public", { "extensions": ["html", "css"] }));

//home route
app.get('/', async function (req, res) {
  res.sendFile('/index.html', { root: 'public' });
});

//signup route
app.get("/signup1", async function (req, res) {
  res.sendFile("/signup.html", { root: "public" });
});

//login route
app.get("/login", async function () {
  res.sendFile("/login.html", { root: "public" });
});

//take user data from signup page 
app.post("/signup1", async function (req, res) {
  try {
    userD = req.body;
    // Connect to the MongoDB cluster
    await client.connect();
    const database = client.db('Mindscript');
    const collection = database.collection('UserCredentials');
    if (userD.password.length < 8) {
      const errorMessage = 'Password must be atleast 8 digit long';
      res.redirect('/signup?error=' + errorMessage);
      return;
    }
    else {
      try {
        // Select the database and collection
        const query = { email: userD.email };
        const result = await collection.find(query).toArray();
        if (result.length === 0) {
          // const insertResult = await collection.insertOne(userData);
          code = Math.floor(10000 * Math.random());
          console.log(code);
          let details = {
            from: "siddhantkale300@gmail.com",
            to: userD.email,
            subject: "Here is the email verification code for your sign up",
            text: code.toString(),
          }
          mailTransporter.sendMail(details, function (err) {
            if (err) {
              const errorMessage = 'Enter a Valid email';
              res.redirect('/signup1?error=' + errorMessage);
              console.log(err);
              return;
            }
            else {
              res.sendFile("/code.html", { root: "public" });
            }
          })
        }
        else {
          const errorMessage = 'An account with that email already exists login or sign up with other email';
          res.redirect('/signup1?error=' + errorMessage);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }
    await client.close();
  }
  catch (error) {
    console.error(error);
  };
});


app.post("/code", async function (req, res) {
  const usercode = req.body;
  try {
    await client.connect();
    const database = client.db('Mindscript');
    const collection = database.collection('UserCredentials');
    if (usercode.code == code) {
      const insertResult = await collection.insertOne(userD);
      res.sendFile("/login.html", { root: "public" });
    }
    else {
      const errorMessage = 'Wrong code entered . Check your email for code';
      res.redirect('/code?error=' + errorMessage);
      return;
    }
  }
  catch (error) {
    console.error(error);
  };
})

//check login data while signup
app.post("/login", async function (req, res) {
  const userData = req.body;
  try {
    await client.connect();
    const database = client.db('Mindscript');
    const collection = database.collection('UserCredentials');
    const query = { email: userData.email };
    const result = await collection.find(query).toArray();
    // let details = {
    //   from: "siddhantkale300@gmail.com",
    //   to: userData.email,
    //   subject: "Here is the email verification code for your sign up",
    //   text: code.toString(),
    // }
    if (result.length === 0) {
      const errorMessage = 'No account exists with that email. Sign up instead!';
      res.redirect('/login?error=' + errorMessage);
      return;
    }
    else {
      if (result[0].password != userData.password) {
        const errorMessage = 'Wrong password entered!';
        res.redirect('/login?error=' + errorMessage);
        return;
      }
      else {
        if (result[0].visit != userData.visit) {
          code = Math.floor(10000 * Math.random());
          let details = {
            from: "siddhantkale300@gmail.com",
            to: userData.email,
            subject: "We found an unrecognized login on your account from other device",
            text: "If it was not you please change your password . If it was you enter this verification code" + code.toString(),
          }
          mailTransporter.sendMail(details, function (err) {
            res.sendFile("/codec.html", { root: "public" });
          })
        }
        else {
          res.sendFile("/success.html", { root: "public" });
        }
      }
    }
    await client.close();
  }
  catch (err) {
    console.error(err);
  }
});

app.post("/codec",function(req,res){
  const usercode = req.body;
  try {
    if (usercode.code == code) {
      res.sendFile("/login.html", { root: "public" });
    }
    else {
      const errorMessage = 'Wrong code entered. If not your account sign up below.';
      res.redirect('/codec?error=' + errorMessage);
      return;
    }
  }
  catch (error) {
    console.error(error);
  };
})
//listen on port
app.listen(port, function () {
  console.log("successfully launched server");
});

