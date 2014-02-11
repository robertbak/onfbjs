
exports.ERROR_BAD_SIGNATURE = "Bad signature";

exports.parse_signed_request = function (signed_request, app_secret, cb) {
    var b64url = require('b64url');
    var crypto = require('crypto');
    var qs = require('querystring');

    var encoded_data = signed_request.split('.', 2);

    var sig = encoded_data[0];
    var json = b64url.decode(encoded_data[1]);
    var data = JSON.parse(json);

    // check algorithm
    if (!data.algorithm || (data.algorithm.toUpperCase() != 'HMAC-SHA256')) {
        cb(new Error("unknown algorithm. expected HMAC-SHA256"));
        return;
    }

    // check signature
    var secret = app_secret;
    var expected_sig = crypto.createHmac('sha256', secret).update(encoded_data[1]).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace('=', '');

    if (sig !== expected_sig) {
        cb(new Error(exports.ERROR_BAD_SIGNATURE));
        return;
    }
    // not logged in or not authorized
    if (!data.user_id) {
        cb(null, data);
        return;
    }

    if (data.access_token || data.oauth_token) {
        cb(null, data);
        return;
    }

    if (!data.code) {
        cb(new Error("no oauth token and no code to get one"));
        return;
    }
};

exports.generateAskForPermissionsPage = function(app_id, redirect_uri, permissions){


    var oauth_url = 'http://www.facebook.com/dialog/oauth/';
    oauth_url += '?client_id='+app_id;

        oauth_url += '&redirect_uri='+encodeURIComponent(redirect_uri);
    if (permissions != null){
        // passed as an array
        if (Array.isArray(permissions)){
            oauth_url += '&scope='+permissions.join(',');
        }
        // or a string
        else{
            oauth_url += '&scope='+permissions;
        }

    }
    var finalString = "<script type='text/javascript'>"+
                      "window.top.location = '" + oauth_url + "';"+
                      "</script>"

    return finalString;
}

exports.generateFixSafariPage = function(redirect_uri){
    var finalString = "<script type='text/javascript'>"+
        "window.top.location = '" + redirect_uri + "';"+
        "</script>"

    return finalString;
}

exports.generateRedirectUrl = function(link, app_id){
     if (link && link.indexOf('pages')==-1){
         return link+'/app_'+app_id;
     }
     else if (link.indexOf('pages')>-1) {
         var pageId = (link.substr(link.lastIndexOf('/')+1));
         return link+'?id='+pageId+'&sk=app_'+app_id;
     }
     return "";
};