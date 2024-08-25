"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const socket_io_client_1 = require("socket.io-client");
const auth_1 = require("./auth");
const environment_1 = require("./environment");
const models_1 = require("./models");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const startedGames = new Set();
        // Initialize Express
        const app = (0, express_1.default)();
        // Create an HTTP server with Express
        const httpServer = http_1.default.createServer(app);
        // Initialize Socket.io on the server
        const io = new socket_io_1.Server(httpServer);
        // Connect to the external Game API using Socket.io client
        const client = (0, socket_io_client_1.io)(environment_1.Env.GAME_API_URL, {
            auth: {
                token: (0, auth_1.signPayload)(models_1.AuthTokenPayload.parse({ gameId: environment_1.Env.GAME_ID })),
            },
        });
        // Function to wait for the match result
        function waitForResult(matchId) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve) => {
                    client.on('matchResult', (result) => {
                        if (result.matchId === matchId) {
                            resolve(result.winners);
                        }
                    });
                });
            });
        }
        // Handle incoming connections with Socket.io
        io.on('connection', (socket) => {
            console.log('A client connected');
            socket.on('startGame', (payload) => __awaiter(this, void 0, void 0, function* () {
                const parsedPayload = models_1.StartGameEvent.parse(payload);
                console.log('start game', parsedPayload.games);
                yield Promise.all(parsedPayload.games.map((game) => __awaiter(this, void 0, void 0, function* () {
                    if (!startedGames.has(game.matchId)) {
                        startedGames.add(game.matchId);
                        // Notify ZeroSum API about the started game
                        yield client.emit('gameStarted', models_1.GameStartedEvent.parse({
                            matchId: game.matchId,
                            tournamentId: game.tournamentId,
                            timestamp: Math.floor(Date.now()),
                        }));
                        // Wait for the match result
                        const winners = yield waitForResult(game.matchId);
                        // Notify ZeroSum API about the game ended
                        yield client.emit('gameEnded', models_1.GameEndedEvent.parse({
                            winners,
                            matchId: game.matchId,
                        }));
                    }
                    else {
                        console.log(`${game.matchId} already started`);
                    }
                })));
            }));
            socket.on('disconnect', (reason) => {
                console.log(`Client disconnected: ${reason}`);
            });
        });
        // Start the server on port 3000
        httpServer.listen(3000, () => {
            console.log('Server is running on port 3000');
        });
        // Handle connection to the Game API
        client.on('connect', () => {
            console.log('Connected to Game API');
        });
        client.on('disconnect', (reason) => {
            console.log(`Disconnected from Game API: ${reason}`);
        });
    });
}
main();
