const mongoose = require( 'mongoose' );

const usersSchema = new mongoose.Schema( {
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: Number,
    password: {
        type: String,
    },
    confirmPassword: {
        type: String,
    },
    verified: Boolean

}, { timestamps: true } );

const User = mongoose.model( 'DeadHack-USERS', usersSchema );

module.exports = User;