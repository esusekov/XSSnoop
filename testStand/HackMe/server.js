var express = require('express');
var http = require('http');
var path = require('path');
var cookieParser = require('cookie-parser');
var app = express();

app.use(cookieParser());

// set a cookie
app.use(function (req, res, next) {
    // check if client sent cookie
    var cookie = req.cookies.cokkieName;
    if (cookie === undefined)
    {
        // no: set a new cookie
        var randomNumber=Math.random().toString();
        randomNumber=randomNumber.substring(2,randomNumber.length);
        res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: false });
        console.log('cookie have created successfully');
    }
    else
    {
        // yes, cookie was already present
        console.log('cookie exists', cookie);
    }
    next(); // <-- important!
});

app.use(express.static(path.join(__dirname, 'public')));

var server = app.listen(3000, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port)

});