var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

//mongoose.connect(process..env.DB, { useNewUrlParser: true });
try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("Connected"));
}catch (error) {
    console.log("Could Not Connect");
}
mongoose.set('useCreateIndex', true);

//user schema
var MovieSchema = new Schema({
    title: {type: String, required: true, index: { unique: true}}, //title is required to input, and need to be unique
    year: {type: String, required: true},
    genre: {type: String, emum: ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Thriller", "Western"], required: true},
    actors: {type: Array, items: {actorName:String, characterName:String}, required: true, minItems:3},
    //id:{type: String, required: true}
});

MovieSchema.pre('save', function(next) {
    next();
});


//return the model to server
module.exports = mongoose.model('Movie', MovieSchema);