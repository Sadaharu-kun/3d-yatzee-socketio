import type { Request, Response } from 'express'; // TS allows both types
import type { Socket } from 'socket.io';

// const express, { Request, Response} = require('express');
const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

// MongoDB connection
const { initDb, getDb } = require('./db');

const app = express();
const server = createServer(app); // wrapps app
const io = new Server(server);

const port = 3000;

// MongoDB
/* För mongoose
const MessageModel = require('./models/messageModel');

const connectionMongoDB = require('./connectionMongoDB');
connectionMongoDB(); */
// await initDb(); Kan inte använda await överst i commonjs till skillnad mot ES6
(async () => {
    try {
        await initDb(); // Nu kan använda await
        console.log('Databasen är initierad');

        server.listen(3000, () => {
            console.log('Server körs på http://localhost:3000');
        });
    } catch (error: any) {
        console.error('Servern misslyckades:', error);
        process.exit(1);
    }
})(); // IIFE

// Enable after not using vite
// app.use(express.static('src/public'));

// Endpoint för att visa meddelanden från MongoDB
app.get('/messages', async (req: Request, res: Response) => {
    try {
        console.error('/messages req och res');
        console.error('mongodb find() inte implementerad än.');
        // const allMessages = await MessageModel.find()
        // return res.status(200).json(allMessages)
    } catch (error: any) {
        return res.status(500).json({
            ok: false,
            error: error.message,
        });
    }
});

// Måste använda socket som parameter
io.on('connection', (socket: Socket) => {
    console.log(`A client with ID ${socket.id} connected to the chat!`);
});
