const mongoose = require('mongoose');

const UserDetailsSchema = new mongoose.Schema({
    email: {
        // ensure that the email is unique so that an existing user does not signup w/ the same email
        type: String, unique: true, 
        required: [true, "Must provide an email."],
        unique: [true, "Must be a unique email."]
    },
    username: {
        // ensure that the username is unique so that an existing user does not signup w/ the same username
        type: String, unique: true, 
        required: [true, "Must provide a username."],
        unique: [true, "Must be a unique username."]
    },
    password: {
        type: String, 
        required: [true, "Must provide a password"]
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'SongPost'
    }]
});

const UserDetails1 = mongoose.model("UserDetails1", UserDetailsSchema, 'userDetails1');
module.exports = UserDetails1;