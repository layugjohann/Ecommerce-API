const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const auth = require("../auth");

const { errorHandler } = require("../auth");

module.exports.createConversation = (req, res) => {

	const userId = req.user.id;
	const { participantId } = req.body;

	if (!participantId) {

		return res.status(400).send({
			success: false,
			error: "Participant ID is required"
		});
	}

	 if (!mongoose.Types.ObjectId.isValid(participantId)) {
        return res.status(400).send({
            success: false,
            error: "Invalid participant ID"
        });
    }

    return Conversation.findOne({ participants: {$all: [userId, participantId] } })
    .then(existingConversation => {
    	if (existingConversation) {
    		return res.status(200).send({
    			success: true,
    			message: "Conversation already exists",
    			conversation: existingConversation
    		});
    	}

    	return Conversation.create({ participants: [userId, participantId] });
    })
    .then(conversation => res.status(201).send({
    	sucess: true,
    	message: "Conversation created",
    	conversation: conversation
    }))
    .catch(err => errorHandler(err, req, res));
};


module.exports.getUserConversations = (req, res) => {

	const userId = req.user.id;

	return Conversation.find({ participants: userId })
	.populate("participants", "name email")
	.then(conversation => {

		if (!conversation) {

			throw {
				status:404,
				success: false,
				message: "Conversation not found"
			};
		}

		return res.status(200).send({
			success: true,
			conversation: conversation
		});
	})
	.catch(err => errorHandler(err, req, res));
}
	

module.exports.getConversationById = (req, res) => {

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
            error: "Invalid conversation ID"
        });
    }

    return Conversation.findById(conversationId)
    .populate("participants", "name email")
    .then(conversation => {

    	if (!conversation) {
    		
    		throw {
    			status: 404,
    			success: false,
    			message: "Conversation not found"
    		};
    	}

    	return res.status(200).send({
    		success: true,
    		conversation: conversation
    	});
    })
    .catch(err => errorHandler(err, req, res));
}


module.exports.deleteConversation = (req, res) => {

	const userId = req.user.id;
	const { conversationId } = req.params;

	if (!conversationId) {
		throw {
			status: 400,
			success: false,
			error: "Conversation ID is required"
		};
	}

	if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).send({
            success: false,
            error: "Invalid conversation ID"
        });
    }

    return Conversation.findById(conversationId)
    .then(conversation => {

    	if (!conversation) {
    		throw {
    			status: 404,
    			success: false,
    			message: "Conversation not found"
    		};
    	}

    	if (!conversation.participants.includes(userId)) {
    		throw {
    			status: 403,
    			success: false,
    			message: "Action unauthorized"
    		}
    	};

    	return Conversation.findByIdAndDelete(conversationId);
    })
    .then(() => {
    	res.status(200).send({
    		success: true,
    		message: "Conversation deleted successfully"
    	});
    })
 .catch(err => errorHandler(err, req, res));

}









