var bodyParser = require('body-parser');
var csrf = require('csurf');
var express = require('express');
var mongoose = require('mongoose');
var session = require('client-sessions');

var middleware = require('./middleware');
var Facebook = require('facebook-node-sdk');
var facebook = new Facebook({ appID: '964253926962933', secret: 'ecdce11faf45d690314f79d87a8dc194' });

/*module.exports.init_ig = function()
{
    ig.use({
        client_id: 'eb7148a2ec3c45df9f0ac4bb994a7dd0',
        client_secret: '9cbed6be5e9c457197b87962ac97d005'
    });
    return ig;
}*/

/**
 * Given a user object:
 *
 *  - Store the user object as a req.user
 *  - Make the user object available to templates as #{user}
 *  - Set a session cookie with the user object
 *
 *  @param {Object} req - The http request object.
 *  @param {Object} res - The http response object.
 *  @param {Object} user - A user object.
 */
module.exports.createUserSession = function(req, res, user) {
    var cleanUser = {
        firstName:  user.firstName,
        lastName:   user.lastName,
        email:      user.email,
        data:       user.data || {},
    };

    req.session.user = cleanUser;
    req.user = cleanUser;
    res.locals.user = cleanUser;
};


/**
 * Create and initialize an Express application that is 'fully loaded' and
 * ready for usage!
 *
 * This will also handle setting up all dependencies (like database
 * connections).
 *
 * @returns {Object} - An Express app object.
 */
module.exports.createApp = function() {
    mongoose.connect('mongodb://localhost/AlbumMaker');

    var app = express();

    // settings
    app.set('view engine', 'jade');

    // middleware
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(session({
        cookieName: 'session',
        secret: 'dsjfkfmfsjfkdsfnjhdjfhsdf23323jhdbfds',
        saveUninitialized: true,
        resave : true,
        duration: 120 * 60 * 1000,
        activeDuration: 5 * 60 * 1000,
    }));

    app.use(csrf());
    app.use(middleware.simpleAuth);
    app.locals.pretty = true;
    app.use(express.static(__dirname + '/public'));

    // routes
    app.use(require('./routes/auth'));
    app.use(require('./routes/main'));
    app.use(require('./routes/createAlbum'));

    return app;
};

/**
 * Ensure a user is logged in before allowing them to continue their request.
 *
 * If a user isn't logged in, they'll be redirected back to the login page.
 */
module.exports.requireLogin = function(req, res, next) {
    if (!req.user) {
        res.redirect('/login');
    } else {
        next();
    }
};
