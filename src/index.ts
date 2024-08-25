import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { signPayload } from './auth';
import { Env } from './environment';
import { AuthTokenPayload, GameEndedEvent, GameStartedEvent, StartGameEvent, Winners } from './models';

async function main() {
    const startedGames = new Set<string>();

    const app = express();

    const httpServer = http.createServer(app);

    const io = new Server(httpServer);

    const client = Client(Env.GAME_API_URL, {
        auth: {
            token: signPayload(AuthTokenPayload.parse({ gameId: Env.GAME_ID })),
        },
    });

    // Handle incoming connections with Socket.io
    io.on('connection', (socket) => {
        console.log('A client connected');

        async function waitForResult(matchId: string): Promise<Winners> {
            return new Promise<Winners>((resolve) => {
                socket.on('matchResult', (result: GameEndedEvent) => {
                    if (result.matchId === matchId) {
                        resolve(result.winners);
                    }
                });
            });
        }

        socket.on('startGame', async (payload: unknown) => {
            const parsedPayload = StartGameEvent.parse(payload);
            console.log('start game', parsedPayload.games);

            await Promise.all(
                parsedPayload.games.map(async (game) => {
                    if (!startedGames.has(game.matchId)) {
                        startedGames.add(game.matchId);

                        // Notify ZeroSum API about the started game
                        await client.emit(
                            'gameStarted',
                            GameStartedEvent.parse({
                                matchId: game.matchId,
                                tournamentId: game.tournamentId,
                                timestamp: Math.floor(Date.now()),
                            } satisfies GameStartedEvent),
                        );

                        // Wait for the match result
                        const winners = await waitForResult(game.matchId);

                        // Notify ZeroSum API about the game ended
                        await client.emit(
                            'gameEnded',
                            GameEndedEvent.parse({
                                winners,
                                matchId: game.matchId,
                            } satisfies GameEndedEvent),
                        );
                    } else {
                        console.log(`${game.matchId} already started`);
                    }
                }),
            );
        });

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
}

main();
