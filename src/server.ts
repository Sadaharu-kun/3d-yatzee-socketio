import type { Request, Response } from 'express'; // TS allows both types
import type { Socket } from 'socket.io';

import express from 'express';
// import cors from 'cors'

// const express, { Request, Response} = require('express');
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { UserMessage, PlayerState, GameState, RoundResult, FinalGameResults } from './types.ts';
// const { Server } = require('socket.io');

// MongoDB connection
// const { initDb, getDb, client } = require('./db');
import { initDb, getDb, client } from './db.js';

const app = express();
// app.use(cors())
const server = createServer(app); // wrapps app
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const port = 3000;

// Starta MongoDB
(async () => {
    await initDb();
    console.log('DB initierad!');
})().catch((error) => {
    console.error('Failed to initialise database:', error);
    process.exit(1);
});


// Använd för build, annars löser Vite
// app.use(express.static('src/public'));

// Endpoint för att visa meddelanden från MongoDB
app.get('/rounds', async (req: Request, res: Response) => {
    try {
        const db = getDb();
        //? Collection property, ska inte typas
        const roundsCollection = db.collection('playerRounds');

        const rounds = await roundsCollection.find({}).toArray();

        res.status(200).json({
            ok: true,
            data: rounds,
        });
    } catch (error) {
        console.error('Error när spara till mdb. Error:', error);
    }
});

const players = new Set<string>();

// Måste använda socket som parameter
io.on('connection', (socket: Socket) => {
    console.log(`A client with ID ${socket.id} connected to the chat!`);

    socket.on('chatMessage', (msg: UserMessage) => {
        console.info('socket on chatMessage');

        const { username } = msg;
        players.add(username);

        io.emit('newChatMessage', msg);
        io.emit('updatePlayers', [...players]);
    });

    socket.on('finalKeptDice', (gameState: GameState) => {
        console.log('SOCKET in finalKeptDice...');

        if (!gameState) console.error('Hittar inte gameState');
        console.log('IO EMIT --> "newFinalKeptDice" --> gameState:', gameState);

        // Listning i mitten med användare och poäng
        io.emit('newFinalKeptDice', gameState);
        // io.emit('displayFinalKeptDice', )
    });

    // socket.on('updateScore', async ({ player, category, score, round}: RoundResult) => {
    socket.on('updateScore', async (roundResultParam: RoundResult) => {
        console.log('SOCKET ON updateScore -->\n', roundResultParam);

        const { player, category, score, round } = roundResultParam;

        //! score är 0 så !score fastän är 0 failar pga FALSY VÄRDE!!!
        if (!player || !category || score === undefined || !round)
            return console.error('Hittar inte egenskaper från roundResult parametern');

        console.table({ player, category, score, round });
        console.log('Spara till MongoDB');
        try {
            const db = getDb();
            // const roundsCollection = db.collection<RoundResult>('playerRounds')
            // const roundsCollection: RoundResult = db.collection('playerRounds');
            //? Collection property, ska inte typas
            const roundsCollection = db.collection('playerRounds');

            await roundsCollection.insertOne({
                ...roundResultParam,
            });
            console.log('roundResult sparat!');

            console.log('Emitta från server för att fylla tabellen för upkopplade spelare');
            io.emit('updateScore', roundResultParam);
        } catch (error) {
            console.error('Error när spara till mdb. Error:', error);
        }
    });

    socket.on('finalGameResult', async (finalGameResultParam: FinalGameResults) => {
        console.log('SOCKET ON finalGameResult -->\n', finalGameResultParam);

        const { players, finalScores, winner } = finalGameResultParam;

        if (!players || !finalScores)
            return console.error('Hittar inte spelare/finalScores från finalResults parametern');
        if (!winner) console.error('Hittar inte vinnaren från finalResults parametern');

        console.table({ players, finalScores, winner });
        console.log('Spara till MongoDB');
        try {
            const db = getDb();
            // const roundsCollection = db.collection<RoundResult>('playerRounds')
            // const roundsCollection: RoundResult = db.collection('playerRounds');
            //? Collection property, ska inte typas
            const roundsCollection = db.collection('finalScores');

            await roundsCollection.insertOne({
                ...finalGameResultParam,
            });
            console.log('finalGameResult sparat!');
        } catch (error) {
            console.error('Error när spara finalResults till mdb. Error:', error);
        }
    });

    socket.on('disconnect', () => {
        // remove player?
    });
});

server.listen(port, () => {
    console.log(`Socket.IO server running at http://localhost:${port}/`);
});
