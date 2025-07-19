import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessandRefreshToken= asyncHandler(async(userId)=>{
    try{
        const user= await User.findById(userId);
        const accessToken= user.generateAccessToken();
        const refreshToken= user.generateRefreshToken();

        user.refreshToken= refreshToken;
        await user.save({validateBeforeSave: false});
    } catch(error){
        throw new ApiError(500, "Something Went Wrong while generating Access and Refresh Token!!!");
    }
})

const registerUser = asyncHandler( async (req, res) => {

    // get user details 
    // check if all field are filled or not
    // check if user already exists
    // check for image and avatar
    // upload them of cloudinary
    // create user object
    // remove password and refresh token from response
    // check for user creation
    // return response

    const {username, fullName, email, password}= req.body;

    if([username, fullName, email, password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existingUser){
        throw new ApiError(409, "User already exists with this email or username");
    }

    const avatarFile = req?.files?.avatar?.[0];
if (!avatarFile || !avatarFile.path) {
  throw new ApiError(400, "Avatar image is required");
}
const avatarLocalPath = avatarFile.path;
console.log("Uploaded files:", req.files);

const coverImageFile = req?.files?.coverImage?.[0];
/*or to avoid typeerror wala error we can also write like this:
let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    } */
const coverImageLocalPath = coverImageFile?.path || "";
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required");
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath);
    const coverImage= await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400, "Avatar image is required");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password
    })

    const createdUser= await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500, "Something Went Wrong while registering User!!!");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User Registered Successfully!!!")
    )
})

const loginUser= asyncHandler(async(req, res)=>{
    // get data from req.body
    // check for username or email
    // find the user
    // check for password
    // access and refresh token
    // send cookies

    const {username, email, password}= req.body;
    if(!username || !email){
        throw new ApiError(400, "Username or Email is required!!");
    }

    const user= User.findOne({
        $or: [{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "User does not exist!!");
    }

    const isPasswordValid= await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401, "Invalid Credentials!!");
    }

    const {accessToken, refreshToken} =await generateAccessandRefreshToken(user._id);

    const loggedInUser= await User.findById(user._id);

    const options= {
        httpOnly: true,
        secure: true
    }

    res.staus(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        },
        "User Logged In Successfully!!!")
    )
})

const logOutUser= asyncHandler(async(req, res)=>{
    await req.user.findByIdandUpdate(
        req.User._id, 
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options= {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(200, {}, "User Logged Out Successfully!!!")
})
export {registerUser, loginUser, logOutUser};