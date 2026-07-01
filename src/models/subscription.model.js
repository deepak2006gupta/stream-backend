import mongoose, {schema} from 'mongoose';

const subscriptionSchema = new schema({
    subscriberId:{
        type: mongoose.Schema.Types.ObjectId, //user who is subscriber
        ref: "User",
        required: true,
    },
    channelId:{
        type: mongoose.Schema.Types.ObjectId, //user who is channel owner
        ref: "User",
        required: true,
    },
},{timestamps: true});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);