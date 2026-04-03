var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let mongoose = require('mongoose');

var app = express();

// 1. VIEW ENGINE SETUP
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// 2. MIDDLEWARES
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Cho phép truy cập ảnh/file từ thư mục uploads qua trình duyệt (để nộp bài)
app.use('/uploads', express.static('uploads'));

// 3. KẾT NỐI DATABASE (Đã sửa localhost -> 127.0.0.1)
const mongoURI = 'mongodb://127.0.0.1:27017/NNPTUD-C6';
mongoose.connect(mongoURI)
  .then(() => console.log("✅ Đã kết nối MongoDB thành công!"))
  .catch(err => console.log("❌ Lỗi kết nối Database: ", err.message));

mongoose.connection.on('disconnected', function () {
  console.log("⚠️ MongoDB đã bị ngắt kết nối");
});

// 6. EXPORT APP
module.exports = app;

// 4. KHAI BÁO CÁC ROUTERS
app.use('/', require('./routes/index'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/roles', require('./routes/roles'));
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/categories', require('./routes/categories'));
app.use('/api/v1/carts', require('./routes/carts'));
app.use('/api/v1/upload', require('./routes/upload'));

// Router tin nhắn bạn vừa viết
const messageRouter = require('./routes/message');
app.use('/messages', messageRouter);

// 5. ERROR HANDLERS (Luôn để ở cuối cùng)
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.send(err.message);
});
