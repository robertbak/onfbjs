exports = module.exports = function (options) {

    var fbtools = require('./fbtools');

    var linkDictionary = {};

    if (options == null) {
        options = {};
    }
    checkOptions(options);

    return middleware;

    function returnAskForPermissionsPage(req, res) {
        var urlToOpen;
        if (options.authentication_redirect_url) {
            urlToOpen = options.authentication_redirect_url;
        }
        else {
            if (req.session.signed_request != null && req.session.signed_request.page != null) {
                //     urlToOpen = 'https://www.facebook.com/'+req.session.signed_request.page.id;
                if ( linkDictionary['id_'+req.session.signed_request.page.id] != null){
                    res.send(fbtools.generateAskForPermissionsPage(options.app_id, linkDictionary['id_'+req.session.signed_request.page.id]+'/app_'+options.app_id, options.permissions));
                    return;
                }
                var https = require('https');
                var reqOptions = {
                    hostname: 'graph.facebook.com',
                    port: 443,
                    path: '/'+req.session.signed_request.page.id,
                    method: 'GET'
                };
                var request = https.get(reqOptions, function(response) {
                    response.setEncoding('utf8');
                    var dat = "";
                    response.on('data', function (chunk) {
                        dat += chunk;
                        console.log(dat);
                    });
                    response.on('end', function(){
                        var data = JSON.parse(dat);
                        res.send(fbtools.generateAskForPermissionsPage(options.app_id, 'https://www.facebook.com/'+data.username+'/app_'+options.app_id, options.permissions));
                        linkDictionary['id_'+req.session.signed_request.page.id]  = data.link;
                    })
                });
                request.end();
            }
        }

    }

    function middleware(req, res, next) {
        console.log('FB middleware being called');
        console.log(req.headers['referer']);
        // preliminaries
        checkSafariCookies(req, res);
        checkRequestIds(req, res);
        getSignedRequest(req, res, function () {
            if (options.allowedPages.length > 0  && req.session != null && req.session.signed_request != null && req.session.signed_request.page != null ){
                var found = false;
                options.allowedPages.forEach(function(item){
                    if (item == req.session.signed_request.page.id) found = true;
                });
                if (!found){
                    res.send('This app is not allowed on this page');
                    return;
                }
            }
            if (req.session.signed_request == null || req.session.signed_request.user_id == undefined || req.session.signed_request.user_id == null) {
                returnAskForPermissionsPage(req, res);
                return;
            }
            next();
            return;
        });
        return;
    };

    function checkOptions(options) {
        if (options.app_id == null) {
            throw new Error('onfbid requires "app_id" option to be set');
        }
        if (options.app_secret == null) {
            throw new Error('onfbid requires "app_secret" option to be set');
        }
        if (options.allowedPages == null){
            options.allowedPages = [];
        }
    };

    /**
     * Makes sure the safari cookies are present
     * @param req
     * @param res
     */
    function checkSafariCookies(req, res) {
        if (req.headers['user-agent'] == null)
            return;
        var onSafari = req.headers['user-agent'].indexOf('afari') > -1 && req.headers['user-agent'].indexOf('hrome') == -1;
        var hasACookie = Object.keys(req.signedCookies).length > 0;
        if (onSafari && !hasACookie) {

            if (options.autoHandle == false) {
                res.send(fbtools.generateFixSafariPage(options.redirect_uri));
            }
            return;
        }
    }

    function getSignedRequest(req, res, cb) {
        // Make sure you have a signed request
        var sent_signed_request;
        sent_signed_request = req.body.signed_request || req.cookies["fbsr_" + options.app_id];
        if (sent_signed_request && sent_signed_request != '') {
            fbtools.parse_signed_request(sent_signed_request, options.app_secret,
                function (err, result) {
                    if (err) {
                        return  returnAskForPermissionsPage(req, res);
                    }
                    console.log(result);
                    req.session.signed_request = result;
                    cb();
                });
        }
        else cb();
    };

    function checkRequestIds(req, res) {
        if (req.param && req.param('notif_t')) {
            console.log('setting request ids');
            req.session.request_ids = req.param('request_ids');
        }
        ;
    }
}
