const express = require("express");
const router = express.Router();
const User = require('../models/User');
const Subject = require('../models/Subjects');
const Level = require('../models/Level');
const Game = require('../models/Games');
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
        image: req.body.image,
        totalMarks : 0
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
    // var emotions = req.body.emotions;
    // console.log("completed_games",completed_games)

    if (user) {

        var old_games = [];
if (user.completed_games == null){
    completed_games.forEach((obj, i) => {
        var new_array = {};
        new_array.game_id = obj.game_id;
        new_array.marks = obj.marks;
        new_array.time_spent = obj.time_spent;
        new_array.emotions = obj.emotions;
        old_games.push(new_array);
    });
}
else {
        user.completed_games.forEach((obj, i) => {
            var array = {};
            array.game_id = obj.game_id;
            array.marks = obj.marks;
            array.time_spent = obj.time_spent;
            array.emotions = obj.emotions;
            old_games.push(array);
        });


         completed_games.forEach((obj, i) => {
            var new_array = {};
            new_array.game_id = obj.game_id;
            new_array.marks = obj.marks;
            new_array.time_spent = obj.time_spent;
            new_array.emotions = obj.emotions;
            old_games.push(new_array);

        });

    }
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



router.post('/getEmotion', async (req, res) => {

    var imageUri = req.body.image;
    console.log("imageuri", imageUri)
    getEmotion(imageUri, function (response) {
        console.log(response[0])
        
        
        if (response[0] != undefined) {
            var emotions = response[0].faceAttributes.emotion;
            console.log("emotions", emotions);
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


router.get("/getdetails/:username", async (req, res) => {
    try {
        const id = req.params.username;
        const user = await User.findOne({ username: id });

        if (user) {
        var student = ({
            stu_name : user.studentname,
            username : user.username,
            grade : user.grade,
            totalMarks : user.totalMarks,
            completed_games : user.completed_games

        })
            res.status(200).json(student);
        } else {
            res.status(404).json({ message: "No valid entry found" });
        }
    } catch (err) {
        res.status(500).json({ message: err });
    }
});


router.get("/getmarks/:username", async (req, res) => {
    try {
        const id = req.params.username;
        const user = await User.findOne({ username: id });

        if (user) {
            res.status(200).json(user.totalMarks);
        } else {
            res.status(404).json({ message: "No valid entry found" });
        }
    } catch (err) {
        res.status(500).json({ message: err });
    }
});

router.get("/getcompletedgames/:username", async (req, res) => {
    try {
      
        const id = req.params.username;
        const user = await User.findOne({ username: id });
       
        if (user) {
            var games = [];
            var final = [];
            user.completed_games.forEach((obj, i) => {
                var array = {};
                array.game_id = obj.game_id;
                array.marks = obj.marks;
                array.time_spent = obj.time_spent;
                games.push(array);
            });
            games.forEach(async (obj, i) => {
                    const game = await Game.findOne({ game_id: obj.game_id });
                // console.log(i);
                    if (game) {
                    var subjectid = game.subject_id;
                    const subject = await Subject.findOne({ sub_id: subjectid });
                        if (subject){
                            var final_array = {}
                                final_array.game_id = obj.game_id;
                                final_array.subject = subject.sub_name;
                                final_array.game_name = game.game_name;
                                final_array.game_name = game.game_name;
                                final_array.level = game.level_id;
                                final_array.marks = obj.marks;
                                final_array.time_spent = obj.time_spent;                 
                                final.push(final_array);

                               if (i == (games.length-1)){
                                res.status(200).json(final);
                               }
                                // console.log(final);
                        }
                         
                    }
 
            });    
            // console.log(final);
            // res.status(200).json(final);

            
        } else {
            res.status(404).json({ message: "No valid entry found" });
        }
    } catch (err) {
        res.status(500).json({ message: err });
    }
});

router.get("/getgamesdetails/:gameid", async (req, res) => {
    try {
        const id = req.params.gameid;
        const game = await Game.findOne({ game_id: id });

        if (game) {
        
        var subjectid = game.subject_id;
        // console.log(subjectid)
        const subject = await Subject.findOne({ sub_id: subjectid });
            if (subject){
                // console.log(subject)
                var gamedetails = ({
                    subject : subject.sub_name,
                    game_name : game.game_name,
                    level : game.level_id,
                })
                // console.log(gamedetails)
                
            } else{
                res.status(404).json({ message: "No valid entry found" });
            }
    
        } else {
            res.status(404).json({ message: "No valid entry found" });
        }
    } catch (err) {
        res.status(500).json({ message: err });
    }
});

router.get("/getranks/:grade", async (req, res) => {

    try {
        const grade = req.params.grade;
        var array= [];
        var final_array = [];
        var rank = 0;
        const user = await User.find({ grade : grade});
        if (user) {
            user.forEach(async (obj, i) => {
                var new_array = {};
                // new_array.rank = rank+1;
                // rank= rank+1;
                new_array.username = obj.username;
                new_array.totalMarks = obj.totalMarks;
                new_array.completed_games = obj.completed_games.length;
                array.push(new_array);
                // console.log(new_array);
            });
            array.sort((a, b) => b.totalMarks - a.totalMarks);
            array.forEach(async (obj, i) => {
                var rankArray = {};
                rankArray.username = obj.username;
                rankArray.totalMarks = obj.totalMarks;
                rankArray.completed_games = obj.completed_games;
                rankArray.rank = rank + 1;
                rank= rank+1;
                final_array.push(rankArray);
            });
            final_array.forEach((e) => {
            // console.log(`${e.rank} ${e.username} ${e.totalMarks} ${e.completed_games}`);
});
            res.status(200).json(final_array); 
           
        } else {
            res.status(404).json({ message: "No valid entry found" });
        }
    } catch (err) {
        res.status(500).json({ message: err });
    }

 
});



module.exports = router;