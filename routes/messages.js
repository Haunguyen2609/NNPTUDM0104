let express = require('express');
let mongoose = require('mongoose');
let router = express.Router()
let { CheckLogin } = require('../utils/authHandler');
let { uploadFile } = require('../utils/uploadHandler');
let messageModel = require('../schemas/messages');
let userModel = require('../schemas/users');

let populateUser = [
    {
        path: 'from',
        select: 'username email fullName avatarUrl'
    },
    {
        path: 'to',
        select: 'username email fullName avatarUrl'
    }
]

router.get('/', CheckLogin, async function (req, res, next) {
    try {
        let currentUserID = req.user._id.toString();
        let messages = await messageModel.find({
            $or: [
                { from: req.user._id },
                { to: req.user._id }
            ]
        })
            .sort({ createdAt: -1 })
            .populate(populateUser)

        let conversationMap = new Set();
        let lastMessages = [];

        for (const message of messages) {
            let partnerID = message.from._id.toString() === currentUserID
                ? message.to._id.toString()
                : message.from._id.toString();

            if (!conversationMap.has(partnerID)) {
                conversationMap.add(partnerID);
                lastMessages.push(message);
            }
        }

        res.send(lastMessages);
    } catch (error) {
        res.status(400).send({
            message: error.message
        })
    }
})

router.get('/:userID', CheckLogin, async function (req, res, next) {
    try {
        let userID = req.params.userID;
        if (!mongoose.Types.ObjectId.isValid(userID)) {
            res.status(404).send({
                message: "user khong ton tai"
            })
            return;
        }

        let checkUser = await userModel.findOne({
            _id: userID,
            isDeleted: false
        })
        if (!checkUser) {
            res.status(404).send({
                message: "user khong ton tai"
            })
            return;
        }

        let messages = await messageModel.find({
            $or: [
                {
                    from: req.user._id,
                    to: userID
                },
                {
                    from: userID,
                    to: req.user._id
                }
            ]
        })
            .sort({ createdAt: 1 })
            .populate(populateUser)

        res.send(messages);
    } catch (error) {
        res.status(400).send({
            message: error.message
        })
    }
})

router.post('/', CheckLogin, uploadFile.single('file'), async function (req, res, next) {
    try {
        let { to, text } = req.body;

        if (!to || !mongoose.Types.ObjectId.isValid(to)) {
            res.status(404).send({
                message: "user nhan khong hop le"
            })
            return;
        }

        let checkUser = await userModel.findOne({
            _id: to,
            isDeleted: false
        })
        if (!checkUser) {
            res.status(404).send({
                message: "user nhan khong ton tai"
            })
            return;
        }

        let messageContent = null;
        if (req.file) {
            messageContent = {
                type: 'file',
                text: req.file.path.replace(/\\/g, '/')
            }
        } else if (text && text.trim()) {
            messageContent = {
                type: 'text',
                text: text.trim()
            }
        } else {
            res.status(400).send({
                message: "noi dung tin nhan khong duoc de trong"
            })
            return;
        }

        let newMessage = new messageModel({
            from: req.user._id,
            to: to,
            messageContent: messageContent
        })

        await newMessage.save();
        await newMessage.populate(populateUser)
        res.send(newMessage);
    } catch (error) {
        res.status(400).send({
            message: error.message
        })
    }
})

module.exports = router
