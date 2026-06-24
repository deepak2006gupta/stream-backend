import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadToCloudinary } from '../utils/FileUpload.js';
import { ApiResponse } from '../utils/ApiResponse.js';



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
export { registerUser };