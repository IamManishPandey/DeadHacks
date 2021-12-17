const mongoose = require( 'mongoose' );

const DB = process.env.DATABASE;

mongoose.connect( DB, {
    useUnifiedTopology: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useCreateIndex: true
} ).then( () => {
    console.log( "Connected to DB" )
} ).catch( ( err ) => {
    console.log( "Error connecting to.... DB" )
} )