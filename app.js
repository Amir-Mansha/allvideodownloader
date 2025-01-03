const express = require("express");
const cors = require("cors");
const requestIp = require("request-ip");
require("dotenv").config();
const mongoos = require("mongoose");
const UAParser = require("ua-parser-js");
const MONGO_CONNECT =`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.hpjwupk.mongodb.net/Download-Api`;
const PORT_NO = "3030";

const app = express();
const corsOptions = {
  origin: [
    "*",
    "http://localhost:3000",
    "https://instagram.com",
    "https://www.kakosab.site",
    "https://kakosab.site", // Added without "www"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
  allowedHeaders: ["Content-Type"], // Allowed headers
  credentials: true, // Allow credentials
};

app.use(express.json());
app.use(cors(corsOptions)); // Apply CORS middleware

app.options("*", cors(corsOptions));
app.use(requestIp.mw());
const User = require("./models/user");

const publicRoutes = require("./routes/public");
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
//   res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.header("Access-Control-Allow-Credentials", "true");
//   next();
// });
app.use((req, res, next) => {
  User.findOne({ ip: req.clientIp })
    .then((user) => {
      if (!user) {
        const useragent = req.headers["user-agent"];
        let parser = new UAParser(useragent);
        let parserResults = parser.getResult();
        console.log(parserResults);

        const newUser = new User({
          ip: req.clientIp,
          deviceInfo: parserResults,
          activity: [],
        });
        return newUser.save().then((result) => {
          User.findOne({ ip: req.clientIp }).then((user) => {
            req.users = user;
            next();
          });
        });
      } else {
        req.users = user;
        next();
      }
    })
    .catch((err) => {
      console.log(err);
      next(new Error(err));
    });
});

app.use(publicRoutes);

mongoos
  .connect(MONGO_CONNECT)
  .then((result) => {
    app.listen(process.env.PORT || PORT_NO, () => {
      console.log(`Server Rnning On ${PORT_NO}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
