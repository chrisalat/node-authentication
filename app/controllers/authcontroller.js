var exports = module.exports = {};
 
exports.signup = function(req, res) {
    res.render('signup', {
        message: req.flash('error')
    });
};

exports.login = function(req, res) {
    res.render('login', {
        message: req.flash('error')
    });
};

exports.dashboard = function(req, res) {
    res.render('dashboard');
};

exports.logout = function(req, res) {
    req.session.destroy(function(err) {
        res.redirect('login');
    });
};

exports.passwordReset = function(req, res) {
    res.render('resetPassword', {
        message: req.flash('message')
    });
};