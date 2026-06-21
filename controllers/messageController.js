const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
  try {
    const { sender, receiver } = req.query;

    if (req.user._id.toString() !== sender && req.user._id.toString() !== receiver) {
      return res.status(430).json({
        success: false,
        message: "Forbidden: You are not authorized to view these messages"
      });
    }

    const messages = await Message.find({
      $or: [
        {
          sender,
          receiver,
        },
        {
          sender: receiver,
          receiver: sender,
        },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};