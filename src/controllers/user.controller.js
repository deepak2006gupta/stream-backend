import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadToCloudinary, deleteLocalFile } from '../utils/FileUpload.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const GenerateAccessAndRefreshToken = async (userId) => {
    try{
        const user = await User.findByIdAndUpdate(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {
            accessToken,
            refreshToken
        }

    }catch(error){
        throw new ApiError(500, "Error while generating access and refresh token");
    }

}

const registerUser = asyncHandler(async (req, res) => {
    /*steps to registeruser:
    1.get user details from user
    2.validate user details
    3.cherck if user already exists(unsername/email)
    4.check for images and avatar
    5.upload images,avatar to cloudinary and check
    6.create user object - create entry in database
    7.remove password and refresh token from user object
    8.check if user created successfully
    9.send response to user
    */

    //user details from user
    const { username, email, fullname, password, } = req.body

    //validate user details
    if(fullname === "" || username === "" || email === "" || password === ""){
        throw new ApiError(400, "All fields are required");
    }

    //check user exit
    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(userExists){
        //delete local files if user already exists
        const avatarLocalPath = req.files?.avatar[0]?.path
        const coverImageLocalPath = req.files?.coverImage[0]?.path

        if(avatarLocalPath){
            deleteLocalFile(avatarLocalPath)
        }

        if(coverImageLocalPath){
            deleteLocalFile(coverImageLocalPath)
        }

        //throw error   
        console.error("User with email or username already exists", userExists)
        throw new ApiError(409, "User with email or username already exists");

    }

    //check for images and avatar
    const avatarLocalPath = req.files?.avatar[0]?.path

    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required");
    }

    //upload images to cloudinary and check
    const avatar = await uploadToCloudinary(avatarLocalPath);
    const coverImage = await uploadToCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar image is required");
    }

    //create user object - create entry in database
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",

    });

    //check if user created successfully and remove password and refresh token from user object
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -_id"
    )
    if(!createdUser){
        console.error("Error while creating user", user)
        throw new ApiError(500, "Error while creating user");
    }
    //console response to user
    console.log("User registered successfully", createdUser)
    //send response to user
    return res.status(201).json(
            new ApiResponse(200, createdUser, "User registered successfully"),
        
    );

});

const loginUser = asyncHandler(async (req,res) =>{
/*steps to loginuser:
1.get user details from user{
    username,email,password
    }
2.get username or email
3.check if user exists
4.validate password
5.generate access token and refresh token
6.send secure cookie with refresh token
*/

    const { username, email, password } = req.body;

    if(!(username || email)){
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordValid(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password");
    }
    
    const { accessToken, refreshToken } = await GenerateAccessAndRefreshToken(user._id)

    const logeduser = await User.findById(user._id).select("-password -refreshToken")

    const cookieOptions = {
        httpOnly: true,
        secure: true,
    }
    console.log("User logged in successfully", logeduser.username)
    return res
    .status(200)
    .cookie("accessToken",accessToken,cookieOptions)
    .cookie("refreshToken",refreshToken,cookieOptions)
    .json(
        new ApiResponse(
            200,
            { 
                user: logeduser, accessToken, refreshToken 
            }
            , "User logged in successfully"
        )
    )
    
});

const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user?._id, {
            $set: { refreshToken: undefined }
        },
        {new: true},
    );
    const cookieOptions = {
        httpOnly: true,
        secure: true,
    
    }
    console.log("User logged out successfully", req.user.username || req.user.email)
    return res.status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(
        new ApiResponse(
            200,
            {},
            "User logged out successfully"
        )
    )

});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorised request: No refresh token provided");
    }
    try{
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id)

        if(!user){
            throw new ApiError(401, "Unauthorised request: Invalid refresh token");
        }

        if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Unauthorised request: Invalid refresh token");
        }

        const { accessToken, newRefreshToken } = await GenerateAccessAndRefreshToken(user._id)

        const cookieOptions = {
            httpOnly: true,
            secure: true,
        }
        console.log("Access token refreshed successfully", user.username)
        return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "Access token refreshed successfully"
            )
        )
    }catch(error){
        throw new ApiError(401, error?.message ||"Unauthorised request: Invalid refresh token");
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordValid(oldPassword);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});
    console.log("Password changed successfully", user.username)

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    )


})

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken");

    if(!user){
        throw new ApiError(404, "User not found");
    }

    console.log("Current user fetched successfully", user.username || user.email)
    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Current user fetched successfully"
        )
    )

})

const updateCurrentUser = asyncHandler(async (req, res) => {
    const { username, email, fullname } = req.body;

    if(!username && !email && !fullname){
        throw new ApiError(400, "At least one field is required to update");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { 
            username, 
            email, 
            fullname 
        } },
        { new: true }
    ).select("-password");

    if(!user){
        throw new ApiError(404, "User not found");
    }

    console.log("Current user updated successfully", user.username || user.email)
    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Current user updated successfully"
        )
    )


})

const updateCurrentUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.avatar[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required");
    }
    const avatar = await uploadToCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400, "Avatar image is not uploaded successfully");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: avatar.url } },
        { new: true }
        ).select("-password");

    if(!user){
        throw new ApiError(404, "User not found");
    }

    console.log("Current user avatar updated successfully", user.username || user.email)
    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Current user avatar updated successfully"
        )
    )

})

const updateCurrentUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.coverImage[0]?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image is required");
    }
    const coverImage = await uploadToCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(400, "Cover image is not uploaded successfully");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password");
    if(!user){
        throw new ApiError(404, "User not found");
    }

    console.log("Current user cover image updated successfully", user.username || user.email)
    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Current user cover image updated successfully"
        )
    )
})

export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword,
    getCurrentUser, 
    updateCurrentUser, 
    updateCurrentUserAvatar,
    updateCurrentUserCoverImage
};