var bCrypt = require('bcrypt-nodejs');
var validator = require('validator');
var passwordValidator = require('password-validator');
var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var xoauth2 = require('xoauth2');

var schema = new passwordValidator();

schema
.is().min(8)
.is().max(20)
.has().uppercase()
.has().lowercase()
.has().digits()
.has().not().spaces()
.is().not().oneOf(['Passw0rd', 'Password123']);
 
module.exports = function(passport, user) {

    var User = user;
    var LocalStrategy = require('passport-local').Strategy;
    var FacebookStrategy = require('passport-facebook').Strategy;
    var configAuthFacebook = require('./facebookAuth');

    //LOCAL SIGNIN
    passport.use('local-signin', new LocalStrategy(
        {
            // by default, local strategy uses username and password, we will override with email
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },


        function(req, email, password, done) {

            var User = user;

            var isValidEmailSyntax = function(email) {
                return validator.isEmail(email);
            };

            var isValidPasswordSyntax = function(password) {
                return schema.validate(password);
            };

            var isValidPassword = function(userpass, password) {
                return bCrypt.compareSync(password, userpass);
            };

            User.findOne({
                where: {
                    email: email
                }
            }).then(function(user) {

                if (!isValidEmailSyntax(email)) {
                    return done(null, false, {
                        message: 'Email is not valid.'
                    });
                }

                if (!isValidPasswordSyntax(password)) {
                    return done(null, false, {
                        message: 'Password is not valid.'
                    });
                }

                if (!user) {
                    return done(null, false, {
                        message: 'Email does not exist.'
                    });
                }

                if (!isValidPassword(user.password, password)) {
                    return done(null, false, {
                        message: 'Incorrect password.'
                    });
                }

                if (user.status == "inactive") {
                    return done(null, false, {
                        message: 'Email not verified. Please verify your email with the link in your Inbox.'
                    });
                }

                var userinfo = user.get();
                return done(null, userinfo);


            }).catch(function(err) {

                console.log("Error:", err);

                return done(null, false, {
                    message: 'Something went wrong with your Signin'
                });

            });


        }

    ));
 
    // LOCAL SIGNUP
    passport.use('local-signup', new LocalStrategy({

        usernameField: 'email',
        firstnameField: 'firstname',
        lastnameField: 'lastname',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback

    }, function(req, email, password, done) {

        var isValidEmail = function(email) {
            return validator.isEmail(email);                
        };

        var isValidFirstname = function() {
            return validator.isAlpha(req.body.firstname);
        };

        var isValidLastname = function() {
            return validator.isAlpha(req.body.lastname);
        };

        var isValidPasswordSyntax = function(password) {
            return schema.validate(password);
        };

        var generateHash = function(password) {
            return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
        };

        var token = crypto.randomBytes(20).toString('hex');

        User.findOne({
            where: {
                email: email
            }
        }).then(function(user) {

            if (!isValidEmail(email)) {
                return done(null, false, {
                    message: 'Email is not valid'
                });
            }

            if (!isValidFirstname()) {
                return done(null, false, {
                    message: 'Firstname is not valid'
                });
            }

            if (!isValidLastname()) {
                return done(null, false, {
                    message: 'Lastname is not valid'
                });
            }

            if (!isValidPasswordSyntax(password)) {
                return done(null, false, {
                    message: 'Password is not valid'
                });
            }

            if (user) {
                console.log('FEHLER');
                return done(null, false, {
                    message: 'That email is already taken'
                });

            } else {
                console.log('WEITER');
                var userPassword = generateHash(password);

                var data = {
                    email: email,
                    emailVerification: token,
                    emailVerificationExpires: Date.now() + 3600000,
                    password: userPassword,
                    firstname: req.body.firstname,
                    lastname: req.body.lastname
                };

                User.create(data).then(function(newUser) {

                    if (!newUser) {
                        return done(null, false);
                    }   

                    if (newUser) {

                        var transporter = nodemailer.createTransport({
                            service: 'Gmail',
                            auth:{
                                user: 'salat.christian@gmail.com',
                                pass: '6=weV3dt'
                            }
                        });
                        var mailOptions = {
                            to: newUser.email,
                            from: 'info@test.com',
                            subject: 'Test email verification',
                            text: 'You are receiving this because you (or someone else) have requested the creation of an account on portal.\n\n' +
                            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                            'http://' + req.headers.host + '/email-verification/' + token + '\n\n' +
                            'If you did not request this, please ignore this email.\n'
                        };
                        transporter.sendMail(mailOptions, function () {
                            done(null, false, {
                                message: 'An e-mail has been sent to ' + newUser.email + ' with further instructions.'
                            });
                            req.session.save();
                            return transporter.close();
                        });
                    }

                }).catch(function(error) {
                    console.log("Error:", error);
                });

            }

        }).catch(function(error) {
            console.log("Error:", error);
        });
    }));

    // FACEBOOK LOGIN/SIGNUP
    passport.use('facebook', new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : configAuthFacebook.facebookAuth.clientID,
        clientSecret    : configAuthFacebook.facebookAuth.clientSecret,
        callbackURL     : configAuthFacebook.facebookAuth.callbackURL,
        profileFields   : configAuthFacebook.facebookAuth.profileFields,
        scope           : configAuthFacebook.facebookAuth.scope,
        enableProof     : true

    }, function(token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // find the user in the database based on their facebook id
            User.findOne({
                where: {
                    fb: profile.id
                }
            }).then(function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err) {
                    done(err);
                }

                console.log(profile.id);

                if(!user) {
                    // if there is no user found with that facebook id, create them
                    console.log('Lege User an')
                    var newUser            = new User();

                    // set all of the facebook information in our user model
                    newUser.fb    = profile.id; // set the users facebook id                   
                    newUser.token = token; // we will save the token that facebook provides to the user                    
                    newUser.firstname  = profile.name.givenName; // look at the passport user profile to see how names are returned
                    newUser.lastname  = profile.name.familyName; // look at the passport user profile to see how names are returned
                    newUser.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                    // save our user to the database
                    newUser.save(function(err) {
                        if (err) throw err;

                        // if successful, return the new user
                        //console.log('Lege User an und leite weiter')
                        done(null, newUser);
                    });

                } else {
                    console.log('Leite weiter')
                    done(null, user);

                }

            });
        });

    }));

    //serialize
    passport.serializeUser(function(user, done) {
     
        done(null, user.id);
     
    });

    // deserialize user 
    passport.deserializeUser(function(id, done) {
     
        User.findById(id).then(function(user) {
     
            if (user) {
     
                done(null, user.get());
     
            } else {
     
                done(user.errors, null);
     
            }
     
        });
     
    });
};