var express = require('express');
var models = require('../models');
var utils = require('../utils');
var router = express.Router();
var Flickr = require("node-flickr");
var geoTools = require('geo-tools');
var keys = {"api_key": "9a5d45a2cd04a509f584c84931a93048"};
flickr = new Flickr(keys);
/*Flickr
Key:9a5d45a2cd04a509f584c84931a93048
Secret:e68ebd0a7736ce32 */

//Used for pagination
var IMAGE_PER_PAGE=24;
var MAX_PAGES=10;

/*
    Render the Create Album Page
 */
router.get('/createAlbum', utils.requireLogin, function(req, res) {
    res.render('createAlbum.jade',{ csrfToken: req.csrfToken() });
    //Get the current user email id, display all the albums and add option to add albums
});

/*
    Handle request for creating a new Album for a specific user
 */
router.post('/CreateAlbumRequest', function(req,res){
    var UserAlbum = new models.UserAlbum({
        albumName : req.body.album_name,
        email:      req.user.email,
    });

    //Check if the album already exists in DB, otherwise create one
    models.UserAlbum.findOne({ email: req.user.email, albumName:req.body.album_name }, function(err, bAlbum) {
        if (bAlbum)
        {
            console.log('user album already exists');
            var error = ' This Album already exists for the user. Please try again.';
            res.render('error.jade',{error:error, errno : 1});
        }
        else
        {
            UserAlbum.save(function(err) {
                if (err)
                {
                    var error = 'Something bad happened! Please try again.';
                    res.render('error.jade',{error:error, errno : 1});
                }
                else
                {
                    console.log('New Album Created');
                    //Close the
                    res.render('createAlbum.jade',{success:1, rd_url: "/mainAlbum", album_name:req.body.album_name});
                }
            });
        }

    });
});
/*
    Handle AJAX request when adding a photo to specific album

 */
router.post('/addPhotos', function(req,res)
{
    console.log('in add Photo');
    var photo_url = req.body.photo_link;

    var PhotoStore = new models.PhotoStore({
        albumName : req.body.albumName,
        email:      req.user.email,
        album_link: photo_url
    });

    //check if the photo in already in the user's album, otherwise add to album
    //send appropriate response
    models.PhotoStore.findOne({ email: req.user.email, albumName:req.body.albumName,album_link:photo_url }, function(err, bAlbum) {

        var json_response;
        if (bAlbum)
        {
            console.log('Photo already exists in the album');
            json_response = JSON.stringify({'result':'image_already_exists', code:1});
            res.send(json_response);
        }
        else
        {
            PhotoStore.save(function(err) {
                if (err)
                {
                    json_response = JSON.stringify({'result': err, code:-1});
                }
                else
                {
                    console.log('New Photo Saved!');
                    json_response = JSON.stringify({'result':'success', code:0});
                }
                res.send(json_response);
            });
        }

    });
});

/*
    Render the edit page with stored photos for a given Album
 */
router.get('/mainAlbum/edit/:albumName', utils.requireLogin, function(req,res){
    console.log('in mainAlbum edit');
    //This query could return empty
    var rURL_DB = [];
    var rOBJ_ID_DB=[];
    var sQ = models.PhotoStore.find({email:req.user.email,albumName:req.params.albumName});
    sQ.exec(function(err,photos){
        if (err) return console.error(err);
        for (var i=0; i < photos.length; i++)
        {
            rURL_DB.push(photos[i].album_link);
            rOBJ_ID_DB.push(photos[i]._id);
        }
        console.log(rOBJ_ID_DB);
        res.render('mainAlbumEdit.jade',{albumName: req.params.albumName, image_url_db:rURL_DB, object_id_url:rOBJ_ID_DB, csrfToken: req.csrfToken()});
    });
});

/*
    Handle the request for deleting a photo from an album with ObjectID
 */
router.post('/mainAlbum/delete/photo', utils.requireLogin, function(req,res){
    console.log('in del mainAlbum');

    var object_id = req.body.object_id;
    console.log(object_id);
    var sQ = models.PhotoStore.remove({_id:object_id});
    sQ.exec(function(err,result){
        //Success
        var json_response;
        if (result.result.ok == 1)
        {
            json_response = JSON.stringify({'result': 'success', code:0});
        }
        else
        {
            json_response = JSON.stringify({'result': err, code:-1});
        }
        res.send(json_response);
    });
});

/*
    Handle the request when deleting the given Album Name
    It will also delete the photos for given album
 */
router.post('/mainAlbum/delete/album',utils.requireLogin,function(req,res){

    var albumName = req.body.albumName;

    //Remove from userAlbum and PhotoStore
    var sQ = models.UserAlbum.remove({albumName:albumName,email:req.user.email});
    sQ.exec(function(err,result){

        var json_response;
        if (result.result.ok == 1)
        {
            var sQ = models.PhotoStore.remove({albumName:albumName,email:req.user.email});
            sQ.exec(function(err,result){
                //Success
                var json_response;
                if (result.result.ok == 1)
                {
                    json_response = JSON.stringify({'result': 'success', code:0});
                }
                else
                {
                    json_response = JSON.stringify({'result': err, code:-1});
                }
                res.send(json_response);
            });
        }
        else
        {
            json_response = JSON.stringify({'result': err, code:-1});
            res.send(json_response);
        }
    });
});

/*
 - Call Flickr API to search Photos by tags/location
 - GET : When user go to mainAlbum page after creating the ablum. User will see most popular images
 - POST: Handle request when user search by specific tag or location
 */
router.get('/mainAlbum/:albumName*', utils.requireLogin, shareHandler );
router.post('/mainAlbum/:albumName*', utils.requireLogin, shareHandler);

/*
    Share Handler used by both POST and GET when user is on mainAlbum page.
 */
function shareHandler(req,res)
{
    console.log('in mainAlbum');
    var rURL=[];
    var search_field = req.body.search_text;
    var albumName = req.body.albumName;
    var search_by = req.body.search_by;

    //Tags are given
    if (typeof search_field != "undefined")
    {

        //Handle paging
        var page = req.body.page_number;
        if (typeof page !== "undefined")
            page= page;
        else
            page=1;


        //Check if these are instance of Array
        if (search_field instanceof Array)
            search_field = search_field[0];
        if (search_by instanceof Array)
            search_by = search_by[0];
        /*if (albumName instanceof Array)
            albumName = albumName[0];

        console.log(page);
        console.log(search_by);
        console.log(search_field);
        console.log(albumName);*/


        var options,option_display;
        if (search_by == "search_by_tags")
        {
            options = {"tags": search_field, per_page:IMAGE_PER_PAGE, page:page};
            option_display = {"search_field": search_field};
            HandleRendering(options,req,res,b_show_tags=true,search_by,option_display,page);
        }
        else if (search_by == "search_by_location")
        {
            geocode(search_field, function(coordinates){
                console.log(coordinates);
                options = {"lat":coordinates.lat, "lon":coordinates.lng, "radius":7,per_page:IMAGE_PER_PAGE,page:page};
                option_display = {"search_field": search_field};
                HandleRendering(options,req,res,b_show_tags=true,search_by,option_display,page);
            });
        }
    }
    else
    {
        //Check if valid page number is given or not
        var params = req.url.split('/');
        var page;

        //page number is given
        if (params.length >= 4)
        {
             if (params[3] >=1 && params[3] <= MAX_PAGES)
                page = params[3];
             else
                page = 1;
        }
        else
            page = 1;


        //Get current popular tags
        flickr.get("tags.getHotList",{} ,function(err, result){
            if (err) return console.error(err);
            console.log('in getHotList');
            var tags_object = result.hottags.tag;
            var rTags=[];
            for (var i=0; i <tags_object.length;i++)
            {
                rTags.push(tags_object[i]._content);
            }

            if (rTags.length > 0)
            {
                sTags = rTags.join();
                var options = {"tags": sTags, per_page:IMAGE_PER_PAGE, page:page};
                HandleRendering(options,req,res,b_show_tags=false,search_by=false,option_display=false,page);
            }
             /*{ id: '24743639181',
             owner: '53460555@N04',
             secret: '636a78aea7',
             server: '1694',
             farm: 2,
             title: 'KB1_5378s',
             url: '/photos/53460555@N04/24743639181/in/photostream/',
             thumb: 'https://farm2.staticflickr.com/1694/24743639181_636a78aea7_s.jpg',
             license: '0',
             media: 'photo' } */
        });

    }
};

/*
    Handle the Rendering of given tags/location/popular photos, assist ShareHandle
    This will also check if the photo already exists in DB for given User/Album
    It will render the appropriate response depending on the situation

 */

function HandleRendering(options,req,res,b_show_tags,search_by,option_display,page)
{
    console.log('in Handle Rendering');
    var rURL = [];
    flickr.get("photos.search",options,function(err,result){

        var photo_object = result.photos.photo;
        var sHolder='';
        for (var i=0; i < photo_object.length; i++)
        {
            sHolder = 'https://farm2.staticflickr.com/'+photo_object[i].server+'/'+photo_object[i].id+
                '_'+photo_object[i].secret+'_z.jpg';
            rURL.push(sHolder);
        }

        //Handling Pagination
        var page_max = result.photos.pages;
        if (page_max > (MAX_PAGES))
        {
            page_max = MAX_PAGES;
        }

        var rURL_DB = [];
        var sQ = models.PhotoStore.find({email:req.user.email,albumName:req.params.albumName});
        sQ.exec(function(err,photos){
            if (err) return console.error(err);
            for (var i=0; i < photos.length; i++)
            {
                rURL_DB.push(photos[i].album_link);
            }

            var json_response;
            if (b_show_tags)
                json_response = {albumName: req.params.albumName, image_url: rURL,
                                tags:option_display.search_field, search_by_old:search_by,
                                image_url_db:rURL_DB, csrfToken: req.csrfToken(),
                                total_length:photo_object.length, page_max:page_max,
                                current_page:page};
            else
                json_response = {albumName: req.params.albumName, image_url: rURL,
                                image_url_db:rURL_DB, csrfToken: req.csrfToken(),
                                total_length:photo_object.length,page_max:page_max,
                                current_page:page};

            //console.log(json_response);
            res.render('mainAlbum.jade',json_response);
        });
    });
}

module.exports = router;