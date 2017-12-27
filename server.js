var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var bodyParser = require('body-parser');
var env = require('dotenv').load();
var exphbs = require('express-handlebars');
var flash = require('express-flash');

var app = express();

var port = process.env.port || 5000; 
 
//For BodyParser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
// For Passport
app.use(session({
    secret: 'v23523pathais35alwaysr723i3472d88c9n0247f99dn9dn29dn70xb90302bd23unferxigt',
    resave: true,
    saveUninitialized: true
})); // session secret

app.use(flash());

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
 
//For Handlebars
app.set('views', './app/views');
app.engine('hbs', exphbs({
    extname: '.hbs'
}));

app.set('view engine', '.hbs');

app.use(express.static(__dirname + '/public'));

//Models
var models = require("./app/models");
 
//Routes
var routes = require('./app/routes/routes.js')(app);
var authRoute = require('./app/routes/auth.js')(app, passport, models.user);
 
 
//load passport strategies
require('./app/config/passport/passport.js')(passport, models.user);
 
 
//Sync Database
models.sequelize.sync().then(function() {
    console.log('Nice! Database looks fine')
}).catch(function(err) {
    console.log(err, "Something went wrong with the Database Update!")
});
 
 
app.listen(port, function(err) {
    if (!err)
        console.log("Site is live on Port " + port);
    else console.log(err)
});