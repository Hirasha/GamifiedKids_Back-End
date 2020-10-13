const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require('body-parser');
require("dotenv/config");

// GLOBAL MIDDLEWARE
app.use(express.static('public'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, x-access-token, Ocp-Apim-Subscription-Key');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
    }
    else {
        next();
    }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());

app.get("/", (req, res) => {
    res.send("Gamefield Back-End!")
});

const routeUsers = require('./routes/users');
app.use("/api/users", routeUsers);

const routeMarks = require('./routes/marks');
app.use("/api/marks", routeMarks);

const routeSubjects = require('./routes/subjects');
app.use("/api/subjects", routeSubjects);

mongoose.connect(process.env.DB_CONNECTION,
    { useNewUrlParser: true, useUnifiedTopology: true }, () =>
    console.log("connected to database!")
)

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));