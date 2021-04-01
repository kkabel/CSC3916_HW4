var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var User = require('./Users');
var Movie = require('./Movies');

mongoose.Promise = global.Promise;

//mongoose.connect(process..env.DB, { useNewUrlParser: true });
try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("connected"));
}catch (error) {
    console.log("could not connect");
}
mongoose.set('useCreateIndex', true);

var ReviewSchema = new Schema({
    username: {type:String, required: true},
    comment:{type: String, required: true},
    rating:{type: String, emu:['1','2','3','4','5'],required: true},
    title:{type:String, required:true, ref:'Movie'},
    movie_id:{type:Schema.Types.ObjectId, ref:'Movie'},
    user_id:{type:Schema.Types.ObjectId, ref:"User"}

});

module.exports = mongoose.model('Review', ReviewSchema);