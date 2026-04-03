const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Message = require('../models/Message'); // Đảm bảo đường dẫn tới Model chính xác

// 1. Cấu hình lưu trữ file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // File sẽ vào thư mục này
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Giả định User hiện tại được truyền qua Header để bạn dễ test Postman
// Trong thực tế, bạn sẽ lấy từ req.user (nếu có Passport/JWT)
const getCurrentUserId = (req) => req.headers.userid;


// ROUTER 1: GET /:userID - Lấy lịch sử chat 2 người
router.get('/:userID', async (req, res) => {
  try {
    const currentId = getCurrentUserId(req);
    const partnerId = req.params.userID;

    const messages = await Message.find({
      $or: [
        { from: currentId, to: partnerId },
        { from: partnerId, to: currentId }
      ]
    }).sort({ createdAt: 1 }); // Cũ trước, mới sau

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ROUTER 2: POST / - Gửi tin nhắn (Text hoặc File)
// Sử dụng upload.single('file') để bắt file từ Postman (key là 'file')
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const from = getCurrentUserId(req);
    const { to, text } = req.body;

    let messageContent = {
      type: 'text',
      text: text
    };

    // Nếu có upload file
    if (req.file) {
      messageContent = {
        type: 'file',
        text: req.file.path // Lưu đường dẫn file
      };
    }

    const newMessage = new Message({
      from,
      to,
      messageContent
    });

    const savedMsg = await newMessage.save();
    res.status(201).json(savedMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ROUTER 3: GET / - Lấy tin nhắn cuối cùng
router.get('/', async (req, res) => {
  try {
    const userIdRaw = getCurrentUserId(req);
    if (!userIdRaw) return res.status(400).json({ error: "Thiếu userid ở Header" });

    const currentId = new (require('mongoose').Types.ObjectId)(userIdRaw);

    const lastMessages = await Message.aggregate([
      { $match: { $or: [{ from: currentId }, { to: currentId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$from", currentId] }, 
              "$to", 
              "$from"
            ]
          },
          lastMsg: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$lastMsg" } },
      { $sort: { createdAt: -1 } }
    ]);

    res.json(lastMessages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;