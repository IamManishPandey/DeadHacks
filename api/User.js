const express = require( 'express' );
const bcrypt = require( 'bcryptjs' );
const cookieParser = require( 'cookie-parser' );
require( "../db/connDB" );
//Schema
const User = require( "../models/User" );
const UserVerification = require( '../models/UserVerification' );
const PasswordReset = require( '../models/PasswordReset' );


const path = require( "path" )
const router = express.Router();

//email vaidator
const validator = require( "email-validator" );

router.use( cookieParser() );

//nodemailer sends mail 
const nodemailer = require( "nodemailer" );
const { v4: uuidv4 } = require( "uuid" );

//nodemailer using for mailing
let transporter = nodemailer.createTransport( {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.PASSWORD
    }
} );

//testing transporter for mail 
transporter.verify( ( error, success ) => {
    if ( error ) {
        console.log( error )
    } else {
        console.log( "Ready for sending msg" );
        console.log( success );
    }
} );

// Student REgistration DATA 

router.get( '/', ( req, res ) => {
    // res.status( 200 ).send( "Backend server " )
    res.status( 202 ).render( 'index.hbs' )
} );
router.get( '/faculty', ( req, res ) => {
    res.status( 202 ).render( 'Faculty.hbs' )
} );
router.get( '/login', ( req, res ) => {
    res.status( 202 ).render( 'Access.hbs' )
} );

router.post( '/signup', async ( req, res ) => {

    let { fullName, email, phone, password, confirmPassword } = req.body;
    // email = email.trim();

    // password = password.trim();

    if ( !fullName || !email || !phone || !password || !confirmPassword ) {
        res.json( {
            status: "FAILED",
            message: "Fill All Fields"
        } );
    } else if ( !/^[a-zA-Z ]+$/.test( fullName ) ) {
        res.json( {
            status: "FAILED",
            message: "Inavalid Name"
        } );
    } else if ( !validator.validate( email ) ) {
        res.json( {
            status: "FAILED",
            message: "Inavalid Email"
        } );
    } else if ( password.length < 6 ) {
        res.json( {
            status: "FAILED",
            message: "Password is too short !"
        } );
    } else if ( password !== confirmPassword ) {
        res.json( {
            status: "FAILED",
            message: "Password does not match !"
        } );
    } else {
        //Creating if user already exists
        User.find( { email } ).then( result => {
            if ( result.length ) {
                res.json( {
                    status: "FAILED",
                    message: "Email already exists !"
                } );
            } else {
                //Try to ctreate new user`
                //hashing password
                const saltRounds = 10;
                bcrypt.hash( password, saltRounds ).then( hashedPassword => {
                    const newUser = new User( {
                        fullName,
                        email,
                        phone,
                        password: hashedPassword,
                        verified: false,

                    } )

                    const data = newUser.save()
                        .then( ( data ) => {
                            //Send verification message
                            sendVerificationEmail( data, res );
                            res.sendFile( path.join( __dirname, './../views/Access.html' ) );
                            res.json( {
                                status: "SUCCESS",
                                message: "Email Sent For verification",
                                data: data
                            } )

                        } )
                        .catch( error => {
                            console.log( error )
                            res.json( {
                                status: "FAILED",
                                message: "Error in Saving User account!"
                            } );
                        } )

                } ).catch( error => {
                    console.log( error );
                    res.json( {
                        status: "FAILED",
                        message: "Error in hashing !"
                    } );
                } )
            }
        } ).catch( err => {
            console.log( err );
            res.json( {
                status: "FAILED",
                message: "An Error occurred while Checking Users!"
            } );
        } )

    }

} );

//Send verification email

const sendVerificationEmail = ( { _id, email }, res ) => {
    //Url to send the mail
    const uniqueString = uuidv4() + _id;
    const url = process.env.EMAIL_SERVER_URL || "http://localhost:4000"
    const currentUrl = `${ url }/user/verify/${ _id }/${ uniqueString }/ `;

    //mailing mailOptions
    const mailOptions = {
        from: `"ＤΞΛＤ ＨΛＣＫＳ⭐"${ process.env.EMAIL_USER }`,
        to: email,
        bcc: email,
        subject: "ＤΞΛＤ ＨΛＣＫＳ , Email Verification ✔ ",
        // text: `Registration Confirmation Mail `,
        html: `<p>Verify Your email to complete the registration.</p>
        <p>This link <b>expires in 6 hours</b></p>
        <p>Press this link <a href=${ currentUrl }>Click here</a>to verify.</p>  `,
    };
    // hashing unique value 
    const saltBounds = 10;
    bcrypt.hash( uniqueString, saltBounds )
        .then( ( hashedUniqueString ) => {
            const newVerification = new UserVerification( {
                userId: _id,
                uniqueString: hashedUniqueString,
                createdAt: Date.now(),
                expiresAt: Date.now() + 21600000,
            } );

            newVerification
                .save()
                .then( () => {
                    transporter.sendMail( mailOptions, function ( error, message ) {
                        if ( error ) {
                            console.log( error )
                            res.json( {
                                status: "FAILED",
                                message: "Email Verification Failed!"
                            } );
                        } else {
                            res.json( {
                                status: "PENDING",
                                message: "Verification Email Sent !"
                            } );
                        }
                    } );
                } )
                .catch( ( error ) => {
                    res.json( {
                        status: "FAILED",
                        message: "Can't save verification email data!"
                    } );
                } )
        } ).catch( ( error ) => {
            res.json( {
                status: "FAILED",
                message: "An Error occurred hashing mail!"
            } );
        } )

};

//Verify email
router.get( "/user/verify/:_id/:uniqueString/", async ( req, res ) => {
    let { _id, uniqueString } = req.params;
    const userId = _id;
    const result = await UserVerification.findOne( { userId } )
    if ( result ) {
        if ( result ) {
            // User verification record exists and we can proceed 
            const { expiresAt } = result;
            // const hashedUniqueString = result[0].uniqueString;
            if ( expiresAt < Date.now() ) {
                //Record expired we can delete it 
                const deletedUser = await UserVerification.deleteOne( { userId } );
                // .then( ( result ) => {
                if ( deletedUser ) {
                    User.deleteOne( { _id: userId } )
                        .then( () => {
                            let message = "Link has expired please signup again";
                            res.redirect( `/user/verified/error=true&message=${ message }` );
                        } )
                        .catch( ( error ) => {
                            console.log( error );
                            let message = 'Clearing with expire  uinque string failed';
                            res.redirect( `/user/verified/error=true&message=${ message }` );
                        }
                        )
                } else {
                    let message = 'An error occurred whileclearing verification record';
                    res.redirect( `/user/verified/error=true&message=${ message }` );
                }
                // } )
                // .catch( ( error ) => {
                //     console.log( error );
                //     let message = 'An error occurred whileclearing verification record';
                //     res.redirect( `/user/verified/error=true&message=${ message }` );
                // } );
            } else {
                // VAlid  record exists 
                //First compare and hash string
                // bcrypt.compare( uniqueString, hashedUniqueString )
                //     .then( ( result ) => {
                //         if ( result ) {
                //Strings Exists and match 
                User.updateOne( { _id: userId }, { verified: true } )
                    .then( () => {
                        UserVerification.deleteOne( { _id: userId } )
                            .then( () => {
                                res.sendFile( path.join( __dirname, './../views/verifyemail.html' ) );
                            } )
                            .catch( ( error ) => {
                                console.log( error );
                                let message = 'An eror occured while deleting record from user Verification';
                                res.redirect( `/user/verified/error=true&message=${ message }` );
                            } )
                    } )
                    .catch( ( error ) => {
                        let message = 'An eror occured while updating record';
                        res.redirect( `/user/verified/error=true&message=${ message }` );
                    } )

                //     } else {
                //         // existing record but verification failed 
                //         let message = 'Invalid record please the inbox and try again.';
                //         res.redirect( `/user/verified/error=true&message=${ message }` );
                //     }
                // } )
                // .catch( ( error ) => {
                //     let message = 'Error while compare unique strings';
                //     res.redirect( `/user/verified/error=true&message=${ message }` );
                // } )
            }
        } else {
            let message = "Accound Record does not exists or has already verified. Please Signup or Login";
            res.redirect( `/user/verified/error=true&message=${ message }` );
        }
    }
    else {
        console.log( error );
        let message = 'An error occurred while checking existing record';
        res.redirect( `/user/verified/error=true&message=${ message }` )
    }
} );

router.get( "/user/verified", ( req, res ) => {
    res.sendFile( path.join( __dirname, "./../views/verifyemail.html" ) );
} );



// student Login ----------------------

router.post( "/login", ( req, res ) => {

    let { email, password } = req.body;

    // email = email.trim();
    // password = password.trim();

    if ( email == "" || password == " " ) {
        res.json( {
            status: "FAILED",
            message: "Fill all fields !"
        } );
    } else {
        //Create login process 

        User.find( { email } )
            .then( ( data ) => {
                if ( data.length ) {
                    //User Exists
                    // check if user is verifies 

                    if ( !data[0].verified ) {
                        res.json( {
                            status: "FAILED",
                            message: "User not verified,Check your inbox  !"
                        } );
                    } else {
                        const hashedPassword = data[0].password;
                        bcrypt.compare( password, hashedPassword )
                            .then( result => {
                                if ( result ) {
                                    res.sendFile( path.join( __dirname, "./../views/User_Dashboard.html" ) );
                                    res.json( {
                                        status: "SUCCESS",
                                        message: "Login SUCCESS !",
                                        data
                                    } );
                                } else {
                                    res.json( {
                                        status: "FAILED",
                                        message: "Invalid Password !"
                                    } );
                                }
                            } )
                            .catch( ( error ) => {

                                res.json( {
                                    status: "FAILED",
                                    message: "Error Comparing Password!"
                                } );
                            } );
                    }
                } else {
                    res.json( {
                        status: "FAILED",
                        message: "Invalid Credentials !"
                    } );
                }
            } )
            .catch( error => {
                res.json( {
                    status: "FAILED",
                    message: "User error!"
                } );
            } )
    }


} );

//PAssword Reset 

router.post( "/requestresetpassword", ( req, res ) => {

    const { email, redirectUrl } = req.body;
    User.find( { email } ).then( ( data ) => {
        if ( data.length ) {
            if ( !data[0].verified ) {
                res.json( {
                    status: "FAILED",
                    message: "Email has not verified . Please verify email!"
                } );
            } else {
                sendResetEmail( data[0], redirectUrl, res );
            }
        } else {
            res.json( {
                status: "FAILED",
                message: "No account registered using this email !"
            } );
        }
    } ).catch( ( error ) => {

    } )

} );

const sendResetEmail = ( { _id, email }, redirectUrl, res ) => {
    const resetString = uuidv4() + _id;

    PasswordReset.deleteMany( { userId: _id } ).then( result => {
        //REset  record now send the email
        const currentUrl = `${ redirectUrl }/${ _id }/${ resetString } `;
        const mailOptions = {
            from: `"ＤΞΛＤ ＨΛＣＫＳ⭐"${ process.env.EMAIL_USER }`,
            to: email,
            bcc: email,
            subject: "ＤΞΛＤ ＨΛＣＫＳ, Reset Password ✔ ",
            // text: `Registration Confirmation Mail `,
            html: `<p>Lost the password Please reset here.</p>
                        <p>This link <b>expires in 60 minutes</b></p>
                        <p>Press this link <a href=${ currentUrl }>Click here </a> to reset password.</p>  `,
        };

        bcrypt.hash( resetString, 10 ).then( hashedResetString => {
            //SetValues to reset password
            const newPasswordReset = new PasswordReset( {
                userId: _id,
                resetString: hashedResetString,
                createdAt: Date.now(),
                expiresAt: Date.now() + 3600000
            } );

            newPasswordReset.save()
                .then( ( result ) => {
                    transporter.sendMail( mailOptions ).then( () => {
                        res.json( {
                            status: "PENDING",
                            message: "Reset password email sent!"
                        } );
                    } ).catch( ( error ) => {
                        res.json( {
                            status: "FAILED",
                            message: "Could not send email reset password !"
                        } );
                    } )
                } ).catch( () => {
                    res.json( {
                        status: "FAILED",
                        message: "Could not save password reset data !"
                    } );
                } )
        } ).catch( () => {
            res.json( {
                status: "FAILED",
                message: "Error in hashing password !"
            } );
        } )

    } ).catch( ( error ) => {
        //Error in clearing existing password record
        res.json( {
            status: "FAILED",
            message: "Error in clearing existing password record!"
        } );
    } )

}

//REsetting the password 

router.post( "/resetpassword", ( req, res ) => {
    let { userId, newPassword, resetString } = req.body;

    PasswordReset.find( { userId } ).then( ( result ) => {
        if ( result.length > 0 ) {
            //reset password record exists

            const { expiresAt } = result[0];
            const hashedResetString = result[0].resetString;
            if ( expiresAt < Date.now() ) {
                PasswordReset.deleteOne( { userId } ).then( () => {
                    res.json( {
                        status: "FAILED",
                        message: "Password reset link expired !"
                    } );
                } ).catch( () => {
                    res.json( {
                        status: "FAILED",
                        message: "Clearing password record failed !"
                    } );
                } )
            } else {
                bcrypt.compare( resetString, hashedResetString ).then( ( result ) => {
                    if ( result ) {
                        //Strings matched successfully
                        //Store hasded password reset


                        bcrypt.hash( newPassword, 10 ).then( ( hashedNewPassword ) => {
                            User.updateOne( { _id: userId }, { password: hashedNewPassword } ).then( () => {
                                PasswordReset.deleteOne( { userId } ).then( () => {
                                    res.json( {
                                        status: "SUCCESS",
                                        message: "Password has been reset successfully!"
                                    } );
                                } ).catch( () => {
                                    res.json( {
                                        status: "FAILED",
                                        message: "Error in delteing the reset records !"
                                    } );
                                } )
                            } ).catch( ( error ) => {
                                res.json( {
                                    status: "FAILED",
                                    message: "Error in updating new password !"
                                } );
                            } )
                        } ).catch( () => {
                            res.json( {
                                status: "FAILED",
                                message: "Error in hashing password !"
                            } );

                        } )
                    } else {
                        res.json( {
                            status: "FAILED",
                            message: "Invalid password reset details !"
                        } );
                    }
                } ).catch( () => {
                    res.json( {
                        status: "FAILED",
                        message: "Comparing reset string password failed !"
                    } );
                } )
            }
        } else {
            res.json( {
                status: "FAILED",
                message: "Password reset request not found!"
            } );
        }
    } ).catch( ( error ) => {
        res.json( {
            status: "FAILED",
            message: "Checking for existing password reset faild!"
        } );
    } )
} )


module.exports = router;