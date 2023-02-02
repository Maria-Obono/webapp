require("dotenv").config();
const express = require("express");
const app = express(); 
const cors = require('cors');

var corOptions = {
    origin: "https://localhost:3000"
}

const userRouter = require("./api/users/user.router");


//app.get("/api", (req, res)=> {
   // res.json({
       // success:1,
      //message: "This is rest apis working"
   // });
//});

app.use(express.json());
app.use(cors(corOptions));
app.use(express.urlencoded({extended: true}))

app.use("/api/users", userRouter);
app.listen(process.env.APP_PORT,() => {
    console.log("Server up and running on Port : ", process.env.APP_PORT);
});

