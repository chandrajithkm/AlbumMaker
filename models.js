var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

/**
 * Our User model.
 *
 * This is how we create, edit, delete, and retrieve user accounts via MongoDB.
 */
module.exports.User = mongoose.model('User', new Schema({
    id:           ObjectId,
    firstName:    { type: String, required: '{PATH} is required.' },
    lastName:     { type: String, required: '{PATH} is required.' },
    email:        { type: String, required: '{PATH} is required.', unique: true },
    password:     { type: String, required: '{PATH} is required.' },
    data:         Object,
}));

var schema = mongoose.Schema({
    id : ObjectId,
    albumName: { type: String, required: '{PATH} is required.'},
    email:        { type: String, required: '{PATH} is required.'},
});
//schema = schema.index({ albumName: -1, email: 1 }, { unique: true });
module.exports.UserAlbum = mongoose.model('UserAlbum',schema);

var schema = mongoose.Schema({
    id : ObjectId,
    albumName: { type: String, required: '{PATH} is required.'},
    email:        { type: String, required: '{PATH} is required.'},
    album_link: {type: String, required: '{PATH} is required.'}
});
//schema = schema.index({ albumName: -1, email: 1 }, { unique: true });
module.exports.PhotoStore = mongoose.model('PhotoStore',schema);
