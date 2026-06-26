import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadToCloudinary } from '../utils/FileUpload.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500, "Error while creating user");
    }

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

    if(!username && !email){
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
        req.user._id, {
            $set: { refreshToken: undefined }
        },
        {new: true},
    );
    const cookieOptions = {
        httpOnly: true,
        secure: true,
    
    }

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

export { registerUser, loginUser, logoutUser };