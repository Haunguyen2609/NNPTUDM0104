let mongoose = require('mongoose');

let messageContentSchema = mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['file', 'text'],
            required: true
        },
        text: {
            type: String,
            required: true
        }
    },
    {
        _id: false
    }
)

let messageSchema = mongoose.Schema(
    {
        from: {
            type: mongoose.Types.ObjectId,
            ref: 'user',
            required: true
        },
        to: {
            type: mongoose.Types.ObjectId,
            ref: 'user',
            required: true
        },
        messageContent: {
            type: messageContentSchema,
            required: true
        }
    },
    {
        timestamps: true
    }
)

module.exports = new mongoose.model('message', messageSchema)
