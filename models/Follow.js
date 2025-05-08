const FollowScema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    followee: {    
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });

FollowSchema.index({ follower: 1 });
FollowSchema.index({ followee: 1 });

const Follow = mongoose.model("Follow", FollowScema);

module.exports = Follow;


