const express = require("express");
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require("dotenv/config");
const fs = require('fs');
const http = require('http');
const https = require('https');
var request = require('request');
const { type } = require("os");

function getFaceId(imageUri, callBack) {
    var options = {
        'method': 'POST',
        'url': process.env.FACE_API_HOST + process.env.FACE_API_PATH_DETECT,
        'headers': {
            'Ocp-Apim-Subscription-Key': process.env.FACE_API_KEY,
            'Content-Type': 'application/octet-stream'
        },
        body: Buffer.from(imageUri.split(",")[1],'base64')
    };
    request(options, function (error, response) {

        var finalData = JSON.parse(response.body.toString());
        return callBack(finalData);
        // console.log(JSON.parse(response.body)[0].faceId)
    });
}

function verifyId(faceId1, faceId2, callBack) {
    var options = {
        'method': 'POST',
        'url': process.env.FACE_API_HOST + process.env.FACE_API_PATH_VERIFY,
        'headers': {
            'Ocp-Apim-Subscription-Key': process.env.FACE_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "faceId1": faceId1, "faceId2": faceId2 })

    };
    request(options, function (error, response) {
        var results = response.body;
        return callBack(results);
    });

}

function getEmotion(imageUri, callBack) {
    var options = {
        'method': 'POST',
        'url': process.env.FACE_API_HOST + process.env.FACE_API_PATH_DETECT_EMOTION,
        'headers': {
            'Ocp-Apim-Subscription-Key': process.env.FACE_API_KEY,
            'Content-Type': 'application/octet-stream'
        },
        body: Buffer.from(imageUri.split(",")[1], 'base64')
    };
    request(options, function (error, response) {

        var finalData = JSON.parse(response.body.toString());
        return callBack(finalData);
        // console.log(JSON.parse(response.body)[0].faceId)
    });
}

router.post('/register', async function (req, res) {
    console.log("be hit")
    var user = new User({
        username: req.body.username,
        studentname: req.body.studentname,
        password: User.hashPassword(req.body.password),
        grade: req.body.grade,
        faceId: req.body.faceId,
        image: req.body.image
    });
    // console.log(user)
    let promise = user.save();

    promise.then(function (doc) {
        return res.status(201).json(doc);

    });

    promise.catch(function (err) {
        return res.status(500).json({ message: 'Error registering User!' });
    });



});

router.post('/detectface', async function (req, res) {
    var imageUri = req.body.image;
    getFaceId(imageUri, function (response) {
        console.log(response)
        if (response[0] != undefined) {
            if (response[0].faceId) {
                console.log(response[0].faceId)
                return res.status(200).json(response[0].faceId);
            }
            else {
                return res.status(500).json({ message: 'Face not detected!' });
            }
        }
        else {
            return res.status(500).json({ message: 'No Face detected!' });
        }
    });



});


router.post('/login', async (req, res) => {
    let promise = User.findOne({ username: req.body.username }).exec();

    promise.then(function (doc) {
        if (doc) {
            if (doc.isValid(req.body.password)) {
                let token = jwt.sign({ username: doc.username }, 'secret', { expiresIn: '2h' });

                return res.status(200).json(token);
            }
            else {
                return res.status(500).json({ message: 'Invalid Credentials' });
            }
        }
        else {
            return res.status(500).json('User not Found!');
        }
    });

    promise.catch(function (err) {
        return res.status(500).json({ message: 'Internal Error' });
    });


});

router.post('/facelogin', async (req, res) => {
    let promise = User.findOne({ studentname: req.body.studentname }).exec();

    var imageUri = req.body.image;

    promise.then(function (doc) {
        if (doc) {
            console.log("doc", doc.faceId)

            getFaceId(doc.image, function (response) {
                console.log(response[0])
                var faceId1 = response[0].faceId;
                console.log("faceId1", faceId1);
                getFaceId(imageUri, function (response) {
                    console.log(response[0])
                    if (response[0] != undefined) {
                        var faceId2 = response[0].faceId;
                        console.log("faceId2", faceId2);
                        verifyId(faceId1, faceId2, function (response) {
                            console.log(JSON.parse(response));
                            if (parseFloat(JSON.parse(response).confidence) >= parseFloat(process.env.FACE_API_CONFIDENCE_TRESHOLD)) {
                                console.log("authenticated")
                                let token = jwt.sign({ studentname: doc.studentname }, 'secret', { expiresIn: '2h' });
    
                                return res.status(200).json(token);
                            }
                            else {
                                console.log("Not authenticated")
                                return res.status(500).json({ message: 'Not authenticated' });
                            }
                        });
                    }
                    else {
                        console.log("face not detected")
                        return res.status(500).json({ message: 'face not detected' });
                    }
                });
            });

            

        }
        else {
            console.log("User not Found!")
            return res.status(500).json({ message: 'User not Found!' });
        }
    });

    promise.catch(function (err) {
        console.log("promise err")
        return res.status(500).json({ message: 'Internal Error' });
    });

});

router.get("/login/:username", async (req, res) => {
    try {
        const id = req.params.username;
        const user = await User.findOne({ username: id });
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: "No valid entry found" });
        }
    } catch (err) {
        res.status(500).json({ message: err });
    }
});

router.get("/facelogin/:studentname", async (req, res) => {
    try {
        const id = req.params.studentname;
        const user = await User.findOne({ studentname: id });
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: "No valid entry found" });
        }
    } catch (err) {
        res.status(500).json({ message: err });
    }
});

router.get('/username', verifyToken, async (req, res) => {
    return res.status(200).json(decodedToken.username);
});


router.get('/studentname', verifyToken, async (req, res) => {
    return res.status(200).json(decodedToken.studentname);
});

var decodedToken = '';
function verifyToken(req, res, next) {
    let token = req.query.token;
    jwt.verify(token, 'secret', function (err, tokendata) {
        if (err) {
            return res.status(400).json({ message: 'Unauthorized request' });
        }
        if (tokendata) {
            decodedToken = tokendata;
            next();
        }
    })
}




//to save the details completed games and update total marks
router.post('/savemarks/:username', async function (req, res) {

    const id = req.params.username;
    const user = await User.findOne({ username: id });
    var completed_games = req.body.completed_games;



    if (user) {

        var old_games = [];

        user.completed_games.forEach((obj, i) => {
            var array = {};
            array.game_id = obj.game_id;
            array.marks = obj.marks;
            array.time_spent = obj.time_spent;

            old_games.push(array);
        });


         completed_games.forEach((obj, i) => {
            var new_array = {};
            new_array.game_id = obj.game_id;
            new_array.marks = obj.marks;
            new_array.time_spent = obj.time_spent;

            old_games.push(new_array);

        });


        user.completed_games = old_games;


        var cal_marks = 0;
        user.completed_games.forEach((obj, i) => {
            cal_marks = cal_marks + obj.marks;
        });

        user.totalMarks = cal_marks;

    } else {
        res.status(404).json({ message: "No user found" });
    }
        // console.log(user)
        let promise = user.save();
    
        promise.then(function (doc) {
            return res.status(201).json(doc);
    
        });
    
        promise.catch(function (err) {
            return res.status(500).json({ message: 'Error entering marks!' });
        });
    
    
    
    });

//to get level vise marks of a student

router.post('/getEmotion', async (req, res) => {

    var imageUri = req.body.image;

    getEmotion(imageUri, function (response) {
        console.log(response[0])
        var emotions = response[0].faceAttributes.emotion;
        console.log("emotions", emotions);
        if (response[0] != undefined) {
            const emotion = Object.entries(emotions).reduce((a, b) => a[1] > b[1] ? a : b)[0]
            res.status(200).json({
                message: "emotion detected",
                emotion: emotion
            });
        }
        else {
            console.log("face not detected")
            return res.status(500).json({ 
                message: 'face not detected',
                emotion: null 
            });
        }
    });

});

router.patch('/saveEmotions', async (req, res) => {
    let emotions = req.body.emotions;
    let username = req.body.username;
    User.update({username: username}, { $set: {emotions: emotions}})
    .exec()
    .then( result => {
        console.log(result);
        res.status(200).json(result);
    })
    .catch( err => {
        console.log("err",err);
        res.status(500).json({
            errors: err
        });
    });
});


module.exports = router;