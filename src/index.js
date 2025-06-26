import express from "express"
import mongoose from "mongoose"
import { DB_NAME } from "./constants.js"
import dotenv from "dotenv";
import  connectDB from "./db/index.js"

const app= express();

dotenv.config();


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log("Server is running on port: ", process.env.PORT);
})
   })
.catch((error)=>{
    console.log("Connection fails here, the error is: ",error);
})


// const app = express();
// (async () => {
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error", (error)=>{
//             console.log("ERROR: ",error);
//             throw error;
//         })
//         app.listen(process.env.PORT, ()=>{
//             console.log("Server is running on port: ", process.env.PORT);
//         })
//     }
//     catch(error){
//         console.log("ERROR: ",error);
//         throw error;
//     }
// })
// It is a good approach to use async/await with try/catch but we will use more proffesional way we will write in a folder named db and then import it here this will make code clean and easy to read
