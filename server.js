// server.js (ฉบับอัปเกรด รองรับ REST API + WebSocket + Security + Validation)
const express = require('express');
const http = require('http'); // << Import http ของ Node
const { Server } = require("socket.io"); // << Import Server จาก socket.io
require('dotenv').config();
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');

const app = express();
const server = http.createServer(app); // << สร้าง server ด้วย http
const io = new Server(server, {
    cors: { origin: "*" }
});

const PORT = process.env.PORT || 3001;
const APP_NAME = process.env.APP_NAME;

app.use(cors());
app.use(express.json());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'"],
    },
  },
}));

// เสิร์ฟไฟล์ HTML สำหรับ Client (WebSocket Chat)
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// REST API
app.get('/api/data', (req, res) => {
    res.json({ message: 'This data is open for everyone!' });
});

// Joi Schema & User API
const userSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
    birth_year: Joi.number().integer().min(1900).max(new Date().getFullYear())
});

app.post('/api/users', (req, res) => {
    const { error, value } = userSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ message: 'Invalid data', details: error.details });
    }

    console.log('Validated data:', value);
    res.status(201).json({ message: 'User created successfully!', data: value });
});

// WebSocket Chat
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        io.emit('chat message', `[${socket.id} says]: ${msg}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server with WebSocket running on http://localhost:${PORT}`);
});