module.exports = {

    'facebookAuth' : {
        'clientID'      : 'XXXXXXXXXX', // your App ID
        'clientSecret'  : 'XXXXXXXXXXXXXXXXXXXXXXX', // your App Secret
        'callbackURL'   : 'http://localhost:5000/auth/facebook/callback',
        'profileFields' : ['id', 'email', 'birthday', 'gender', 'link', 'locale', 'name', 'timezone', 'updated_time', 'verified'],
        'scope'			: ['public_profile', 'email']
    }

};