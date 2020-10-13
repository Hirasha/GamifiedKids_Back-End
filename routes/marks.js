const express = require("express");
const router = express.Router();
const Marks = require('../models/Marks');
const multer = require('multer');
require("dotenv/config");
const fs = require('fs');
const http = require('http');
const https = require('https');
var request = require('request');
const { type } = require("os");


router.get("/marks/:username", async (req, res) => {
    try {
        const id = req.params.username;
        const marks = await Marks.findOne({ username: id });
        if (marks) {
            res.status(200).json(marks);
        } else {
            res.status(404).json({ message: "No valid entry found" });
        }
    } catch (err) {
        res.status(500).json({ message: err });
    }
});

router.get('/getallmarks', async function (req, res) {
    try {
        const marks = await Marks.find({});
        if (marks) {
            res.status(200).json(marks);
        } else {
            res.status(404).json({ message: "No valid entry found" });
        }
    } catch (err) {
        res.status(500).json({ message: err });
    }
});

// router.post('/savemarks', async function (req, res) {
//     console.log("be hit")
//     var mark = new Marks({
//         username: req.body.username,
//         marks: req.body.marks,
//     });
//     // console.log(user)
//     let promise =  mark.save();

//     promise.then(function (doc) {
//         return res.status(201).json(doc);

//     });

//     promise.catch(function (err) {
//         return res.status(500).json({ message: 'Error registering User!' });
//     });



// });


module.exports = router;