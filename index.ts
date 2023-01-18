import apiRouter, {APP_SECRET} from "./src/api";
import mongoose from "mongoose";
import {verify} from "jsonwebtoken";
import {setIo, wsClients} from "./src/connections";

const express = require('express');
const app = express();
const cors = require('cors')
const http = require('http');
const server = http.createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
setIo(wss);

mongoose.connect('mongodb://127.0.0.1:27017/MyIonicApp').then(() => {
    console.log("Connected to database");
}).catch((error) => {
    console.log("Error connecting to database", error);
});


app.use(cors());
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.use('/api', apiRouter);


wss.on('connection', (socket, req) => {
    console.log("New ws connection");

    wsClients.push(socket);

    // @ts-ignore
    // wsClient.push(socket);
});

server.listen(6969, () => {
    console.log('listening on *:6969');
});
