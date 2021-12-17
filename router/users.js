
const express = require( 'express' );

const UsersData = require( "../models/usersModel" );
require( "../db/connDB" );

const router = express.Router();

const nodemailer = require( "nodemailer" );

router.post( '/users', async ( req, res ) => {

    const { email, } = req.body;

    if ( !email ) {
        res.status( 422 ).send( { error: 'Fill All fields' } );
    }
    try {
        const userExist = await UsersData.findOne( { email: email } )
        if ( userExist ) {
            res.status( 421 ).send( { error: 'User already exists' } );
        }
        else {
            const user = new UsersData( { email, } );

            const userRegistered = await user.save();

            if ( userRegistered ) {
                res.status( 201 ).send( { success: "Registered Successfully" } )


                // sending mail registration confirmation 
                let transporter = nodemailer.createTransport( {

                    //if no service then use host port and secure 

                    // hort:'',
                    // port:587, 
                    // secure:false,

                    service: 'gmail',     //if no service then use host port and secure 
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.PASSWORD
                    }
                } );

                let mailOptions = {
                    from: `"Ritesh Academy👻"${ process.env.EMAIL_USER }`,
                    to: userRegistered.email,
                    bcc: userRegistered.email,
                    subject: "Academy Registration ✔ ",
                    text: `Confirmation Mail `,
                    html: "We make sure will contact you soon",
                }

                transporter.sendMail( mailOptions, function ( error, message ) {
                    if ( error ) {
                        // console.log( "error in sending mail", error )
                        res.status( 401 ).send( "Mail Not sent" )


                    } else {
                        // console.log( "Sent", message )

                        res.status( 200 ).send( "Mail send Successfully" )
                    }
                } );

            } else {
                res.status( 422 ).send( { error: 'Failed to register' } )
            }
        }

    } catch ( error ) {
        res.status( 502 ).send( "Can not be Registered" )
    }

} );


module.exports = router;