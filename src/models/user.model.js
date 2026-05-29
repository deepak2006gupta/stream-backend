import mongoose, {Schema} from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isValidPassword = async function ( password ) {
    return await bcrypt.compare(password, this.password)
}

export const User = mongoose.model("User", userSchema);