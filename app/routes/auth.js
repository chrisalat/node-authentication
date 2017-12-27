var nodemailer = require('nodemailer');
var async = require('async');
var crypto = require('crypto');
var xoauth2 = require('xoauth2');
var bCrypt = require('bcrypt-nodejs');

var nodemailerConf = require('../config/nodemailer.js');
var authController = require('../controllers/authcontroller.js');
 
module.exports = function(app, passport, user) {

    var User = user;

    app.get('/signup', authController.signup);
 
    app.get('/login',sessionValidate, authController.login);

    //app.get('/auth/facebook', passport.authenticate('facebook', { scope : ['email'] }));

    app.get('/dashboard',isLoggedIn, authController.dashboard);

    app.get('/logout',authController.logout);

    app.get('/password-reset',authController.passwordReset);

    app.get('/reset/:token', function(req, res, done) {
        User.findOne({
            where: {
                resetPasswordToken: req.params.token,
                resetPasswordExpires: { $gt: Date.now() }
            }
        }).then (function(user, done) {
            if (!user) {
                req.flash('message', 'Password reset token is invalid or has expired' );
                res.redirect(307, '/password-reset');
                return res.end();
            }
            res.render('reset', {
                user: req.user
            });
        });
    });

    app.get('/email-verification/:token', function(req, res, done) {
        User.findOne({
            where: {
                emailVerification: req.params.token,
                resetPasswordExpires: { $gt: Date.now() }
            }
        }).then (function(user, done) {
            if (!user) {
                req.flash('message', 'Verification token is invalid or has expired. Please create a new account.' );
                res.redirect(307, '/signup');
                return res.end();
            }
            var data = {
                status: "active",
                emailVerification: 'undefined',
                resetPasswordExpires: 'undefined'
            };
            user.updateAttributes(data);
            req.flash('error', 'Success! Your account is verified.');
            req.session.save(function () {
                res.redirect('/login');
            });
        });
    });

    // Registration
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/signup',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    // Login
    app.post('/login', passport.authenticate('local-signin', {
        successRedirect: '/dashboard',
        failureRedirect: '/login',
        failureFlash: true
    }));

    // Reset password

    app.post('/password-reset', function(req, res, next) {
        async.waterfall([
            function (done) {
                crypto.randomBytes(20, function (err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                });
            }, function (token, done) {
                User.findOne({
                    where: {
                        email: req.body.email
                    }
                }).then(function(user) {

                    if (!user) {
                        req.flash('message', 'No account with that email address exists.');
                        req.session.save(function () {
                            res.redirect('/password-reset');
                        });
                        return;
                    }

                    var data = {
                        resetPasswordToken: token,
                        resetPasswordExpires: Date.now() + 3600000
                    };

                    user.updateAttributes(data).then(function(userInput) {
                        if (userInput) {
                            return done(null, user, token);
                        }
                    });

                });
            }, function (user, token, done) {
                var transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth:{
                        user: 'salat.christian@gmail.com',
                        pass: '6=weV3dt'
                    }
                });
                var mailOptions = {
                    to: user.email,
                    from: 'info@test.com',
                    subject: 'Test Password Reset of Account',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
                transporter.sendMail(mailOptions, function (err) {
                    req.flash('message', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    req.session.save(function () {
                        res.redirect('/password-reset');
                    });
                    return transporter.close();
                });
            }
        ], function (err) {
            if (err) return next(err);
            res.redirect('/password-reset');
        });
    });

    app.post('/reset/:token', function(req, res) {
        var data = {};
        async.waterfall([
            function(done) {
                User.findOne({

                    resetPasswordToken: req.params.token,
                    resetPasswordExpires: { $gt: Date.now() }

                }).then(function(user) {

                    if (!user) {
                        req.flash('message', 'Password reset token is invalid or has expired');
                        req.session.save(function () {
                            res.redirect('/password-reset');
                        });
                        return;
                    }

                    var generateHash = function(password) {
                        return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
                    };

                    var userPassword = generateHash(req.body.password);

                    data.password = userPassword;
                    data.resetPasswordToken = 'undefined';
                    data.resetPasswordExpires = 'undefined';

                    user.updateAttributes(data).then(function(userInput) {
                        if (userInput) {
                            return done(null, user);
                        }
                    });

                    req.flash('error', 'Success! Your password has been changed.');
                    req.session.save(function () {
                        res.redirect('/login');
                    });
                });
            }, function(user, done) {
                var transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth:{
                        user: 'salat.christian@gmail.com',
                        pass: '6=weV3dt'
                    }
                });
                var mailOptions = {
                    to: user.email,
                    from: 'info@test.com',
                    subject: 'Your password has been changed',
                    text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                };
                transporter.sendMail(mailOptions, function(err) {
                    req.flash('message', 'Success! Your password has been changed.');
                    done(err);
                });
            }
        ], function(err) {
            res.redirect('/password-reset');
        });
    });

    /*app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/dashboard',
        failureRedirect: '/login'
    }));*/

    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();
        res.redirect('/login');
    }

    function sessionValidate(req,res,next){
        if (req.user) {
            res.redirect('/dashboard');
        } else {
            next();
        }
    }
};