import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshToken=async(userId)=>{
    try{
        const user= await User.findById(userId);
        const accessToken= user.generateAccessToken();
        const refreshToken= user.generateRefreshToken();

        user.refreshToken= refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken}

    } catch(error){
        throw new ApiError(500, "Something Went Wrong while generating Access and Refresh Token!!!");
    }
}

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


    const loginUser = asyncHandler(async (req, res) =>{
    // get data from req.body
    // check for username or email
    // find the user
    // check for password
    // access and refresh token
    // send cookies
    
        const {email, username, password} = req.body;
        console.log(email);
    
        if (!username && !email) {
            throw new ApiError(400, "username or email is required")
        }
        
        // Here is an alternative of above code based on logic discussed in video:
        // if (!(username || email)) {
        //     throw new ApiError(400, "username or email is required")
            
        // }
    
        const user = await User.findOne({
            $or: [{username}, {email}]
        })
    
        if (!user) {
            throw new ApiError(404, "User does not exist")
        }
    
       const isPasswordValid = await user.isPasswordCorrect(password)
    
       if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
        }
    
       const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id)
    
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )
    
    })

    const logOutUser= asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id, 
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
    .json(new ApiResponse(200, {}, "User Logged Out Successfully!!!"))
    })

    const refreshAccessToken= asyncHandler(async(req, res)=>{
        const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken;
        if(!incomingRefreshToken){
            throw new ApiError(400, "Unauthorized Access!!!");
        }

        try {
            const decodedToken= jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user= await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(400, "Invalid Token!!!");
        }

        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(400, "Refresh Token either used or expired!!!");
        }

        const options={
            httpOnly: true,
            secure: true
        }
        const {accessToken, refreshToken}= await generateAccessandRefreshToken(user._id);

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken},
                "Access Token Refreshed Successfully!!!"
            )
        )
        } catch (error) {
            throw new ApiError(401, "Something Went Wrong while refreshing Access Token!!!");
        }
    })

    const changeCurrentPassword= asyncHandler(async(req, res)=>{
        const {oldPasssword, newPassword, confPassword}= req.body;
        if(newPassword !== confPassword){
            throw new ApiError(400, "New Password and Confirm Password does not match!!!");
        }

        const user= await User.findById(req.user._id);
        const isPasswordCorrect= await user.isPasswordCorrect(oldPasssword);
        if(!isPasswordCorrect){
            throw new ApiError(400, "Old Password is incorrect!!!");
        }
        user.password = newPassword
        await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
    })

    const getCurrentUser= asyncHandler(async(req, res)=>{
        return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User data fetched successfully"))
    })

    /* its always better to update text and files seprately */
    const updateAccountDetails= asyncHandler(async(req,res)=>{
        const { fullName, email}= req.body;
        if(!fullName || !email){
            throw new ApiError(400, "Atleast one of the above field should be changed");
        }
        const user= await User.findByIdAndUpdate(req.body._id,
                {
                    $set: {
                    fullName: fullName,
                    email: email
                }
                },
                {
                    new: true
                }).select("-password")

        return res
        .status(200)
        .json(
            (200, user, "Account details updated successfully")
        )
    })

    const updateUserAvatar= asyncHandler(async(req, res)=>{
        const avatarLocalPath= req.files?.path
        if(!avatarLocalPath){
            throw new ApiError(400, "Avatar file is missing");
        }

        const avatar= await uploadOnCloudinary(avatarLocalPath)
        if(!avatar){
            throw new ApiError(400, "Avatar image which is to be updated is not uploaded");
        }

        const user= await User.findByIdAndUpdate(
            req.body?._id,
            {
                $set:{
                    avatar: avatar.url
                }
            },
            {
                new: true
            }
        ).select("-password")

        return res
        .status(200)
        .json(
            200, user, "Avatar updated Successfully!!!"
        )
    })

    const updateUserCoverImage= asyncHandler(async(req, res)=>{
        const coverImageLocalPath= req.files?.path
        if(!coverImageLocalPath){
            throw new ApiError(400, "Cover Image file is missing");
        }

        const coverImage= await uploadOnCloudinary(coverImageLocalPath)
        if(!coverImage){
            throw new ApiError(400, "Cover image which is to be updated is not uploaded");
        }

        const user= await User.findByIdAndUpdate(
            req.body?._id,
            {
                $set:{
                    coverImage: coverImage.url
                }
            },
            {
                new: true
            }
        ).select("-password")

        return res
        .status(200)
        .json(
            200, user, "Cover Image updated Successfully!!!"
        )
    })

    const getUserChannelProfile=asyncHandler(async(req, res)=>{
        const {username} = req.params
        if(!username){
            return res.status(400).json(400, "Username is missing")
        }

        const channel= await User.aggregate([
            {
                $match: {
                    username: username?.toLowerCase
                }
            }
        ])
    })


export {registerUser, loginUser, logOutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage};