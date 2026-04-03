const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messageContent: {
        type: { type: String, enum: ['file', 'text'], required: true },
        text: { type: String, required: true } // Lưu nội dung text hoặc đường dẫn file
    }
}, { timestamps: true }); // Bật timestamps để dễ sắp xếp tin nhắn

module.exports = mongoose.model('Message', messageSchema);