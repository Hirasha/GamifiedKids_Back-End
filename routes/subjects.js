const express = require("express");
const router = express.Router();
require("dotenv/config");
const fs = require('fs');
const http = require('http');
const https = require('https');
var request = require('request');
const { type } = require("os");
const Subject = require("../models/Subjects");

router.get("/getallsubjects", async (req, res) => {

    try {
        const subject = await Subject.find({ });
        if (subject) {
            res.status(200).json(subject);
        } else {
            res.status(404).json({ message: "No valid entry found" });
        }
    } catch (err) {
        res.status(500).json({ message: err });
    }

 
});


router.get("/:sub_id", async (req, res) => {
    try {
        const id = req.params.sub_id;
        const subject01 = await Subject.findOne({ sub_id: id });
        if (subject01) {
            res.status(200).json(subject01);
        } else {
            res.status(404).json({ message: "No valid entry found" });
        }
    } catch (err) {
        res.status(500).json({ message: err });
    }
});


module.exports = router;

