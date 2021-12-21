const dotenv = require( 'dotenv' );
dotenv.config( { path: './config.env' } )
const cors = require( 'cors' )
const express = require( 'express' );
const cookieParser = require( 'cookie-parser' );
const path = require( 'path' )
const pug = require( 'pug' );
const hbs = require( 'hbs' )

const app = express();
app.use( cors() );
app.use( cookieParser() );
app.use( express.json() );

const UserRouter = require( "./api/User" )

//Define the sever PORT
const PORT = process.env.PORT || 4000

//DB connection 
require( './db/connDB' )
require('./api/User')
// Calling API ROUTES
app.use( UserRouter );

//To access files in express modulea
app.use( express.urlencoded( { extended: false } ) );
var bodyParser = require( 'body-parser' );
app.use( bodyParser.json() );


const staticPath = path.join( __dirname, './public' )
// console.log(path.join(__dirname, './public')) 

app.use( express.static( staticPath ) );
app.use( "/css", express.static( path.join( __dirname, './node_modules/bootstrap/dist/css' ) ) );
app.set( 'view engine', 'hbs' )
//Now set the views directory
app.set( 'views', path.join( __dirname, 'views' ) );


//Listeing PORT
app.listen( PORT, () => {
    console.log( `Server is running ..PORT ${ PORT }` )
} )