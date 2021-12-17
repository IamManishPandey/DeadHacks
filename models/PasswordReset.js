const mongoose = require( 'mongoose' );

const UserPasswordReset = new mongoose.Schema( {
    userId: {
        type: String,
    },
    resetString: {
        type: String,
    },

    createdAt: {
        type: Date,
    },
    expiresAt: Date

}, { timestamps: true } );

const PasswordReset = mongoose.model( 'PasswordReset', UserPasswordReset );

module.exports = PasswordReset;