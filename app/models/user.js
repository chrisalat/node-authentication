module.exports = function(sequelize, Sequelize) {
 
    var User = sequelize.define('user', {
 
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },

        fb: {
            type: Sequelize.STRING,
            allowNull: true
        },

        token: {
            type: Sequelize.STRING,
            allowNull: true
        },

        chiffre: {
            type: Sequelize.STRING
        },
 
        firstname: {
            type: Sequelize.STRING,
            notEmpty: true
        },
 
        lastname: {
            type: Sequelize.STRING,
            notEmpty: true
        },

        street: {
            type: Sequelize.STRING,
        },

        plz: {
            type: Sequelize.INTEGER,
        },

        city: {
            type: Sequelize.STRING,
        },

        country: {
            type: Sequelize.STRING,
        },

        email: {
            type: Sequelize.STRING,
            validate: {
                isEmail: true
            }
        },

        emailVerification: {
            type: Sequelize.STRING
        },
 
        password: {
            type: Sequelize.STRING
        },

        resetPasswordToken: {
            type: Sequelize.STRING
        },

        resetPasswordExpires: {
            type: Sequelize.DATE
        },
 
        status: {
            type: Sequelize.ENUM('active', 'inactive'),
            defaultValue: 'inactive'
        },

        last_login: {
            type: Sequelize.DATE
        }
 
    });
 
    return User;
 
};