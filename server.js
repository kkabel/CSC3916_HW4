/*
CSC3916 HW3
File: Server.js
Description: Web API scaffolding for Movie API with added functionality
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var authController = require ('./auth'); //*
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews'); //*


var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) { //*
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
}); //*


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

/* router.route('movies/:reviews?') //*
    .get(authJwtController.isAuthenticated, function (req,res){
        if(req.query && req.query.reviews && req.query.reviews==='true'){
            Movie.findOne({title: req.params.title}, function (err, movie){
                if (err){
                    return res.status(403).json({success:false, msg:'Cannot get reviews for this movie.'});
                }else if(!movie){
                    return res.status(403).json({success:false, msg:'Cannot find the movie title.'});
                }else{
                    Movie.aggregate()
                        .match({_id:mongoose.Type.ObjectId(movie._id)})
                        .lookup({from:'reviews', localField:'_id', foreignField:'movie_id', as: 'reviews'})
                        .exec(function (err,result){
                            if(err){
                                return res.status(403).json({success: false, msg:'There are no movie with the title.'});
                            }else{
                                return res.status(200).json({success:true, msg:'Here are the reviews of the movie',movie:result});
                            }
                        })
                }
            });
        }
        else{
            return res.status(403).json({success:false, msg:'It fail if statement.'});
        }


    }) //*
*/


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

/* router.route('/movies/:movieID')
    .get(authJwtController.isAuthenticated, function (req, res) {
        //should return all the movie
        let movieID = req.params.movieID;
        Movie.findById(movieID,function (err,movies){
            if(err){
                return res.json(err);
            }
            else{
                res.json(movies);
            }
        });

    })
*/
//new code 
router.get('/', jwtAuth.isAuthenticated, async (req, res) => {
    try {
        if (!req.body || !req.body.title) throw 'Must include body: title in request.'

        const casedTitle = req.body.title;
        // Throws rejection
        const reviews = await Review.find({ movieTitle: casedTitle }).select('-_id -__v').lean().exec();
        
        if (!reviews) throw `No reviews found for ${casedTitle}`;
        
        res.status(200).json({ success: true, reviews: reviews });
    }
    catch (errMsg) {
        if (errMsg.message) {
            res.status(400).json({ success: false, msg: 'Database error.' });
            console.log(errMsg.message);
        }
        else {
            res.status(400).json({ success: false, msg: errMsg });
        }
    }
});



/*router.route('/movies/:title')  //update 3.30
    .get(authJwtController.isAuthenticated, function (req, res) {
        if (req.query && req.query.reviews && req.query.reviews === "true"){
            Movie.findOne({title: req.params.title}, function(err, movie) {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        message: "Unable to get reviews for the requested movie."
                    });
                } else if (!movie) {
                    return res.status(403).json({success: false, message: "Unable to find that movie."});

                } else {
                    Movie.aggregate()
                        .match({_id: mongoose.Types.ObjectId(movie._id)})
                        .lookup({from: 'reviews', localField: "_id", foreignField: 'movie_id', as: 'reviews'})
                        .addFields({averaged_rating: {$avg: "$reviews.rating"}})
                        .exec(function (err, mov) {
                            if (err) {
                                return res.status(403).json({
                                    success: false,
                                    message: "The movie title was not found."
                                });
                            } else {
                                return res.status(200).json({
                                    success: true,
                                    message: "Movie titled was found and there are reviews", movie: mov
                                })
                            }
                        })
                }
            })

        } else {
            Movie.find({title: req.params.title}).select("title year_released genre actors").exec(function (err, movie) {
                if (err) {
                    return res.status(403).json({success: false, message: "Unable to retrieve title passed in."});
                }
                if (movie && movie.length > 0) {
                    return res.status(200).json({
                        success: true,
                        message: "Successfully retrieved movie.",
                        movie: movie
                    });
                } else {
                    return res.status(404).json({
                        success: false,
                        message: "Unable to retrieve a match for title passed in."
                    });
                }

            })
        }
    })
*/

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
                    //MovieNew.id = req.headers.id

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
                        return res.json({success: false, msg:'Cannot find the movie.'})
                    }
                    else {
                        return res.json({success: true, msg: 'Movie deleted.'})
                    }
                    //delete movie
                });
            }
        }

    );

router.route('/review')  //*
    .post(authJwtController.isAuthenticated, function (req,res){
        if(req.body.comment && req.body.rating && req.body.title) {
            var review = new Review();


            jwt.verify(req.headers.authorization.substring(4), process.env.SECRET_KEY, function (err, ver_res) {
                if (err) {
                    return res.status(403).json({success: false, msg: 'Unable to post review.'});
                }
                else if(!ver_res){
                    return res.status(403).json({success:false, msg:'Unable to find the user.'});
                }
                else {
                    review.user_id = ver_res.id;
                }

                Movie.findOne({title: req.body.title}).exec(function (err, movie) {
                    if (err) {
                        res.send(err);
                    } else {
                        if (movie) {//if there is a movie found

                            review.username = ver_res.username;
                            review.comment = req.body.comment;
                            review.rating = req.body.rating;
                            review.title = req.body.title;
                            review.movie_id = movie._id
                            //review.movie_id = movie.id;
                            review.save(function (err) {

                                if (err) {
                                    return res.json(err);
                                }

                                res.json({success: true, msg: 'Review saved!'})
                            })

                        } else {
                            return res.status(403).json({
                                success: false,
                                msg: 'Unable to find the title of the movie.'
                            });
                        }
                    }
                })
            })
        }



        else {
            return res.json({success: false, msg: 'Please include all the information.'});
        }

    });  //*

/* router.route('/reviews/:title') //get reviews
    .get(authJwtController.isAuthenticated, function (req, res) {
        if (req.query.reviews === 'true')
        {
            var title = req.params.title;
            Movie.aggregate([
                {
                    $match: {
                        Title: title
                    }
                },
                {
                    $lookup:
                        {
                            from: 'reviews',
                            localField: 'title',
                            foreignField: 'MovieTitle',
                            as: 'Reviews'
                        }
                }

            ]).exec((err, movie)=>{
                if (err) res.json({message: 'Failed to get review'});
                res.json(movie);
            });
        }
        else
        {
            res.json({message: 'Please send a response with the query parameter true'});
        }


        Movie.findOne({title: req.params.title}).exec(function(err, movie1) {
            if (err) res.send(err);

            //var userJson = JSON.stringify(movie);
            // return that user
            if (movie1 !== null){
                res.json(movie1);
            }
            else{
                res.json({ message: 'Movie is not found' });
            }

        });
    }); //end get reviews 
*/


app.use('/', router);
app.listen(process.env.PORT || 8081);
module.exports = app; // for testing only
