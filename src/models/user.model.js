import mongoose, {Schema} from 'mongoose';

const userSchema = new Schema({
    unsername:{
        type: string,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email:{
        type: string,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname:{
        type: string,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    avatar: {
        type: string, //cloudnary url
        required: true,
    },
    coverImage: {
        type: string, //cloudnary url
    },
    watchHistory: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],

    },
    refreshToken: {
        type: String,
    },

}, {timestamps: true});

export const User = mongoose.model("User", userSchema);