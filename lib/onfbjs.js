module.exports = function(options){

    return function middleware(req, res, next){
        console.log("This middleware is being called");
        next();
    }
}