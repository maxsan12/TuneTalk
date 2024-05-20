const express = require("express");
const app = express();
const connectDB = require("./config/db");
const cors = require("cors");
const bodyParser = require("body-parser");
// Routes
const loginRouter = require("./routes/api/tunetalklogin"); 
const registerRouter = require("./routes/api/tunetalkregister");
const spotifyRouter = require("./routes/api/spotifylogin");
const friendRouter = require('./routes/api/friendRoutes');
const followRouter = require('./routes/api/followRoutes')
const addPost = require("./routes/routes")
const postRouter = require("./routes/api/posts");

//const commentRoutes = require('./routes/commentRoutes');

// routes / api
//const registerRouter = require("./routes/register");


// Connect to database
connectDB();

// Init middleware
//app.use(express.json()); // allows the data from frontend to be transferred to backend/json file
//I have commented out above lines as it sets the global limit to 1mb which prohibits the storing of images to mongoDB

app.use(cors({origin: true, credentials: true}));



// middleware/routes
// Init middleware
app.use(bodyParser.json({limit: '100mb'})); //100mb capacity for load
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));
app.use(express.json({extended: false, limit: '100mb' })); // Allows Express to read data sent using a POST or PUT request. It is used for recognizing incoming objects as JSON objects. 



app.use("/api/tunetalklogin", loginRouter);
app.use("/api/tunetalkregister", registerRouter);
app.use("/api/spotifylogin", spotifyRouter);
app.use("/api/friends", friendRouter);
app.use("/api/community", followRouter)
app.use("/api", addPost);
app.use("/api", followRouter)
app.use("/api/posts", postRouter)


// print server is running when starting server - nodemon app
app.listen(8082, () => {
    console.log("Server is running!");
    
});