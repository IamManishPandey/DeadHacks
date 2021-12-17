const express = require( 'express' );
const bcrypt = require( 'bcryptjs' );
const cookieParser = require( 'cookie-parser' );
require( "../db/connDB" );
const jwt = require( "jsonwebtoken" )

const StudentData = require( "../models/studentSchema" );

const aboutMiddleware = require( "../middleware/aboutMiddleware" );

const contactData = require( "../models/contactSchema" )

const router = express.Router();


//Faculty REgistration DATA Storing   start
router.use( cookieParser() );

const nodemailer = require( "nodemailer" );

// Student REgistration DATA 

router.post( '/signup', async ( req, res ) => {

    const { fullName, userId, dateOfBirth, email, phone, password, cpassword } = req.body;
    if ( !fullName || !userId || !email || !phone || !password || !cpassword || !dateOfBirth ) {
        res.status( 421 ).send( { error: 'Please Fill All fields' } );
    }

    try {
        const userExist = await StudentData.findOne( { email: email } )
        if ( userExist ) {
            res.status( 423 ).send( { error: 'Student  already exists' } );
        } else if ( password != cpassword ) {
            res.status( 424 ).send( { error: 'Password not matched' } );
        } else {
            const student = new StudentData( {
                fullName, userId, dateOfBirth, email, phone, password, cpassword
            } );

            const studentRegistered = await student.save()

            if ( studentRegistered ) {
                res.status( 201 ).send( { success: "Registered Successfully" } )
                // sending mail registration confirmation 
                let transporter = nodemailer.createTransport( {

                    //if no service then use host port and secure 

                    // hort:'',
                    // port:587, 
                    // secure:false,

                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.PASSWORD
                    }
                } );
                let mailOptions = {
                    from: `"PU Projections👻"${ process.env.EMAIL_USER }`,
                    to: studentRegistered.email,
                    subject: "PU Projections 2022 ✔ ",
                    text: `Registration Confirmation Mail `,
                    html: `<div style="font-family:Arial, Garamond, sans-serif; "><h3 style='text-align:center'>Please keep your credentials private! <br><h4>Name : ${ studentRegistered.fullName } <br/><p>UserId: ${ studentRegistered.userId } </p><br>Registered Mail : ${ studentRegistered.email }</br><br>Phone : ${ studentRegistered.phone }</br><br>Password: ${ req.body.password }</br></h3><hr><h2 style="color:red">In case you forget your password please refer this .</h2></hr><br><h2 style='color:green' >Thank You! 😊</h2></br><br><a href="http://www.paruluniversity.ac.in">Visit to our website.</a></br> </div>`,
                }

                transporter.sendMail( mailOptions, function ( error, message ) {
                    if ( error ) {
                        console.log( "error in sending mail", error )
                        res.status( 401 ).send( "Mail Not sent" )


                    } else {
                        console.log( "Sent", message )

                        res.status( 200 ).send( "Mail send Successfully" )
                    }
                } );

            } else {
                res.status( 422 ).send( { error: 'Failed to register' } )
            }
        }

    } catch ( error ) {
        console.log( error )
        res.status( 502 ).send( { error: error } )
    }
} );
// student Login ----------------------

router.post( "/login", async ( req, res ) => {

    try {

        let token;
        const { email, password } = req.body;

        if ( !email || !password ) {
            res.status( 421 ).send( { error: 'Fill the data' } )
        }

        const studentLogin = await StudentData.findOne( { email: email } );

        if ( studentLogin ) {
            token = await studentLogin.generateAuthToken();

            res.cookie( "jwtoken", token, {
                expires: new Date( Date.now() + 432000000 ), //5 days milliseconds
                httpOnly: true
            } );

            const isMatch = await bcrypt.compare( password, studentLogin.password );

            if ( !isMatch ) {
                res.status( 422 ).send( { error: "Invalid credentials" } );
            }

            else {

                res.status( 201 ).send( { success: "Login Successfully" } )

            }
        } else {
            res.status( 502 ).send( { error: "user not found" } )
        }
    } catch ( error ) {

        console.log( error )
    }
} );


router.post( '/contactus', async ( req, res ) => {

    const { firstName, lastName, email, city, state, zip, message } = req.body;

    if ( !firstName || !lastName || !email || !city || !state || !zip || !message ) {
        res.status( 421 ).send( { error: 'Fill ALL the FIELDS' } )
    }

    try {

        const user = new contactData( { firstName, lastName, email, city, state, zip, message } );

        const userMessage = await user.save();

        if ( userMessage ) {
            res.status( 201 ).send( { success: "Message Sent" } );

            // sending mail 

            let transporter = nodemailer.createTransport( {


                //if no service then use host port and secure 

                // hort:'',
                // port:587, 
                // secure:false,

                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.PASSWORD
                }
            } );

            let mailOptions = {
                from: `"Ritesh NodeAPP👻"${ userMessage.email }`,
                to: 'riteshkr95929592@gmail.com',
                subject: "Hello ✔ Mail from Ritesh",
                text: `The message is:${ userMessage.message }`,
                // html: "<h1>Hello! Auto mailer from Ritesh NODE APP : <b>Thank yeah Its working </b></h1>",
            }

            transporter.sendMail( mailOptions, function ( error, message ) {
                if ( error ) {
                    console.log( "error in sending mail", error )
                    res.status( 401 ).send( "Not sent" )


                } else {
                    console.log( "Sent", message )

                    res.status( 200 ).send( "Mail send Successfully" )
                }
            } )

        } else {
            res.status( 422 ).send( { error: 'Message Not Sent' } )
        }

    } catch ( error ) {
        console.log( error )
    }
} );

//Setting up email service for contact page

router.get( '/sendmail', async function ( req, res, next ) {

    let transporter = nodemailer.createTransport( {

        //if no service then use host port and secure 

        // hort:'',
        // port:587, 
        // secure:false,

        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.PASSWORD
        }
    } );

    let mailOptions = {
        from: '"Ritesh NodeAPP👻"<riteshkr95929592@gmail.com>',
        to: "riteshkr9592@gmail.com,kirtitomar2001@gmail.com,riteshkr7275@gmail.com,",
        subject: "Hello ✔ Mail from Ritesh", // Subject line
        text: "Hello  This mail is from Ritesh Node APP || Autogenerated", // plain text body
        html: "<h1>Hello! Auto mailer from Ritesh NODE APP : <b>Thank yeah Its working </b></h1>",
    }

    transporter.sendMail( mailOptions, function ( error, message ) {
        if ( error ) {
            res.send( "Not sent" )
            console.log( "error in sending mail", error )

        } else {
            console.log( "Sent", message )
            res.send( "Mail send Successfully" )
        }
    } )
} );




module.exports = router;