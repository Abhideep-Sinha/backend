import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({limit: "15kb"}));
app.use(urlencoded({extended: true, limit: "15kb"}));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import {userRoutes} from "./routes/user.routes.js";

//routes decaration
app.use("/api/v1/user", userRoutes);

export {app};