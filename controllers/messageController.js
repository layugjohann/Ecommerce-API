const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const auth = require("../auth");

const { errorHandler } = require("../auth");

module.exports.createMessage = (req, res) => {

	const senderId = req.user.id;
	const { conversationId, text } = req.body;

	if (!conversationId) {
		return res.status(400).send({
			success: false,
			error: "Conversation ID is required"
		});
	}

	if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).send({
            success: false,
            error: "Invalid Conversation ID"
        });
    }

    return Message.create({
    	senderId,
    	conversationId,
    	text
    })
    .then(message => res.status(200).send({
    	success: true,
    	message: message
    }))

    .catch(err => errorHandler(err, req, res));
}


module.exports.getMessages = (req, res) => {

	const { conversationId } = req.params;
	const userId = req.user.id;

	if (!conversationId) {
		return res.status(400).send({
			success: false,
			error: "Conversation ID is required"
		});
	}

	if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).send({
            success: false,
            error: "Invalid Conversation ID"
        });
    }

    return Message.find({ conversationId })
    .populate("senderId", "name email")
    .sort({ createdAt: 1 })
    .then(messages => res.status(200).send({
    	success: true,
    	messages: messages
    }))

    .catch(err => errorHandler(err, req, res));
}


module.exports.markAsRead = (req, res) => {

	const { messageId } = req.params;
	const userId = req.user.id;

	if (!messageId) {
		return res.status(400).send({
			success: false,
			error: "Message ID is required"
		});
	}

	if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(400).send({
            success: false,
            error: "Invalid Message ID"
        });
    }

    return Message.findByIdAndUpdate(
    	messageId,
    	{ $addToSet: { readBy: userId } },
    	{ new: true}
    )
    .then(message => {
    	if (!message) {
    		throw {
    			status: 404,
    			success: false,
    			message: "Message not found"
    		};
    	}

    	res.status(200).send({
    		success: true,
    		message: "Message marked as read",
    		data: message
    	});
    })
    .catch(err => errorHandler(err, req, res));

}







