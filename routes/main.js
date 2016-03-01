var express = require('express');

var utils = require('../utils');
var models = require('../models');
var router = express.Router();

/**
 * Render the home page.
 */
router.get('/', function(req, res) {
    res.render('index.jade');
});

/*
 Render the Dashboard page with list of "Created Albums" for a given user
 */
router.get('/dashboard', utils.requireLogin, function(req, res) {

    //Get the current user email id, display all the albums for current logged in user
    var rAlbums = [];
    var sQ = models.UserAlbum.find({email:req.user.email});
    sQ.exec(function(err,albums){
        if (err) return console.error(err);
        for (var i=0; i < albums.length; i++)
        {
            rAlbums.push(albums[i].albumName);
        }

        console.log(rAlbums);
        res.render('dashboard.jade',{'rAlbums':rAlbums});
    });
});

module.exports = router;