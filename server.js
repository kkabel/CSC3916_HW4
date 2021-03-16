/*
CSC3916 HW3
File: Server.js
Description: Web API scaffolding for Movie API with added functionality
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');


var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});


router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});


router.route('/movies')
    .get(authJwtController.isAuthenticated, function (req, res) {
        //should return all the movie
        Movie.find(function (err,movies){
            if(err){
                return res.json(err);
            }
            else{
                res.json(movies);
            }
        });

    })


router.route('/movies')
.post(authJwtController.isAuthenticated, function (req, res) {
            if (!req.body.title || !req.body.year || !req.body.genre || !req.body.actors) {
                res.json({success: false, msg: 'Please include all the information of movie.'})
            }
            else {
                if (req.body.actors.length < 3) {
                    //check if there are at least 3 actors info
                    res.json({success: false, msg: 'Please input at least 3 actor/actress.'})
                } else {
                    var MovieNew = new Movie();
                    MovieNew.title = req.body.title;
                    MovieNew.year = req.body.year;
                    MovieNew.genre = req.body.genre;
                    MovieNew.actors = req.body.actors;
                    MovieNew.id = req.headers.id

                    MovieNew.save(function (err) {

                        if (err) {
                            if (err.code == 11000)// there are same title exist on database
                                return res.json({success: false, message: 'A movie with the title already exists.'});
                            else
                                return res.json(err);
                        }

                        res.json({success: true, msg: 'Movie saved!'})
                    })
                }
            }

        }
    );


    router.route('/movies')
        .put(authJwtController.isAuthenticated, function (req, res) {
            if (!req.body.title) {
                return res.json({success: false, message: 'Please input name of the movie that you want to modify.'})
            } else {
                Movie.findOne({title: req.body.title}).exec(function (err, movie) {
                    if (err) {
                        res.send(err);
                    }
                    else {
                        if(movie){
                            //check if the user input information per variable
                            if(req.body.year){
                                movie.year = req.body.year;
                            }
                            if(req.body.genre){
                                movie.genre = req.body.genre;
                            }
                            if(req.body.actors){
                                //check the user input 3 actors
                                if(req.body.actors.length<3){
                                    return res.json({success:false, msg:'Make sure you input 3 actors.'})
                                }
                                movie.actors = req.body.actors;
                            }


                            movie.save(function (err) {

                                if (err) {
                                    return res.json(err);
                                }

                                res.json({success: true, msg: 'Movie updated!'})
                            })
                        }
                        else{
                            return res.json({success:false, msg:'There are no movie matches the title.'})
                        }

                    }
                });
            }
        })


    router.route('/movies')
        .delete(authJwtController.isAuthenticated, function (req, res) {
                if (!req.body.title) {
                    return res.json({success: false, msg: 'Input name of the movie that you would like to delete.'})

                } else {
                    Movie.findOneAndDelete({title:req.body.title}, function (err, movie) {
                        if (err) {
                            res.send(err);
                        }else if(!movie){
                            return res.json({success: fale, msg:'Cannot find the movie.'})
                        }
                        else {
                            return res.json({success: true, msg: 'Movie deleted.'})
                        }
                        //delete movie
                    });
                }
            }

        );



    app.use('/', router);
    app.listen(process.env.PORT || 8080);
    module.exports = app; // for testing only