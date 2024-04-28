// Login API
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs"); // using bycryptjs to encrypt passwords
const JWT = require('jsonwebtoken') // using jsonwebtoken library
const JWT_SECRET = "fghsdf123"; // secret key used to verify the json webtokens (note should be an env file, but because this is being marked, would be easier to not include in a env file). 
const user = require("../../models/UserDetails"); // import user details model
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(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);

// Function to validate email format with the correct pattern regex
function emailRegex(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function sendNotificationEmail(userEmail) {
    const notification = {
        to: userEmail,
        from: '2024tunetalk@gmail.com',
        subject: '!TIME TO TUNE IN',
        text: 'Hello! It is time to post your current/recently played song for your friends to see!'
    };

    sgMail
        .send(notification)
        .then(() => {
            console.log('Notification Email sent');
        })
        .catch((error) => {
            console.error(error);
        });
}

router.post("/", async(req,res) => {
    const {userLogin, password} = req.body

    try {

        let existingUser;

        /*
            Check whether the login details are either a email or username and if they exist in mongodb
            - Using email regex as it will help identify that the input is an email address with the @ symbol.
        */
        if(emailRegex(userLogin)) {
            existingUser = await user.findOne({ email: userLogin });
        }
        // Else if username does not match email regex its considered a username.
        else {
            existingUser = await user.findOne({ username: userLogin });
        }

        if (!existingUser) {
            return res.json({status: "error", error: "user_not_found"});
        }
        // Decrypt password and check whether password input matches input in mongo by generating jwt 
        if(await bcrypt.compare(password, existingUser.password)) {
            // will generate a token with the user id in mongodb as well as their email and pass the jwt_secret variable 
            const token = JWT.sign({ id: existingUser.id, email: existingUser.email}, JWT_SECRET); 
            
            // Send email notification
            sendNotificationEmail(existingUser.email);

            // Return user's email along with token
            return res.json({status: "ok", user: {email: existingUser.email, username: existingUser.username}, token });
        }
        res.json({status: "error", error: "incorrect_password"});
    }
    catch (e) {
        console.log(e);
        res.json({status: "error", message: e.message});
    }
});

module.exports = router;