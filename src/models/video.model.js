import mongoose, {Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema({
    videoFile: {
        type: String, //cloudnary url
        required: true,
    },
    thumbnail: {
        type: String, //cloudnary url
        required: true,
    },
    title: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        required: true,
        lowercase: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
},{timestamps: true});

 videroSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);