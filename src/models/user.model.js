import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required : true,
        unique: true,
        lowercase: true,
        index: true,   // very useful for faster search. It jumps directly to the letter which is typed
        trim: true
    },
    email: {
        type: String,
        required : true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname: {
        type: String,
        required : true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,  //cloudinary url
        required : true,
    },
    coverImage: {
        type: String
    },
    watchHistory: [
        {
        type: Schema.Types.ObjectId,
        ref: "Video"
        }
    ],
    password: {
        type: String, //bcrypt stores password in encrypted form
        required : true,
    },
    refreshToken: {
        type: String //jwt is a bearer token
    }
    }, {timestamps: true});

    userSchema.pre("save", async function(next){
        if(this.isModified("password")){
            this.password = bcrypt.hash(this.password, 10);
            next();
        }
    });

    userSchema.methods.isPasswordCorrect = async function(password){
        return bcrypt.compare(password, this.password);
    }

    userSchema.methods.generateAccessToken = function(){
        return jwt.sign(
        {
            username: this.username,
            email: this.email,
            fullname: this.fullname,
            _id: this._id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
    }

    userSchema.methods.generateRefreshToken= function(){
        return jwt.sign(
            {
                username: this.username,
                email: this.email,
                fullname: this.fullname,
                _id: this._id,
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        )
    }
    export const User = mongoose.model("User", userSchema);