import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { signPayload } from './auth';
import { Env } from './environment';
import { AuthTokenPayload, GameEndedEvent, GameStartedEvent, StartGameEvent, StartGamePayload, TeamScore, Winners } from './models';
import { Socket } from 'socket.io';

async function main() {
    const startedGames = new Set<string>();
    const runningGames: {
        [gameId: string]: GameStartedEvent
    } = {}

    const app = express();

    const httpServer = http.createServer(app);

    const io = new Server(httpServer);

    const client = Client(Env.GAME_API_URL, {
        auth: {
            token: signPayload(AuthTokenPayload.parse({ gameId: Env.GAME_ID })),
        },
    });

    io.on('connection', (gameSocket: Socket) => {
        console.log('A game client connected');
        gameSocket.emit("connected", "you are connected to master server");

        async function waitForResult(matchId: string): Promise<Winners> {
            return new Promise<Winners>((resolve) => {
                gameSocket.on('matchResult', (result: any) => {
                    let winners: { [key: number]: TeamScore } = {};
                    result.winners.forEach((team: TeamScore, i: number) => {
                        winners[i] = team;
                    });
                    if (result.matchId === matchId) {
                        resolve(winners);
                    }
                });
            });
        }

        client.on('startGame', (data: StartGameEvent) => {
            const parsedData = StartGameEvent.parse(data);
            gameSocket.emit("startGame",parsedData);
        });

        gameSocket.on('gameStarted', async (payload: unknown) => {
            const parsedPayload = StartGameEvent.parse(payload);
            console.log('start game', parsedPayload.games);

            await Promise.all(
                parsedPayload.games.map(async (game) => {
                    if (!startedGames.has(game.matchId)) {
                        startedGames.add(game.matchId);

                        //Notify ZeroSum API about the started game
                        client.emit(
                            'gameStarted',
                            GameStartedEvent.parse({
                                matchId: game.matchId,
                                tournamentId: game.tournamentId,
                                timestamp: Math.floor(Date.now()),
                            } satisfies GameStartedEvent),
                        );
                        gameSocket.emit("startInfo","zero sum is informed about the game started event");

                        // Wait for the match result
                        const winnerTeams = await waitForResult(game.matchId);
                        gameSocket.emit("resultInfo","master server recieved the game results");

                        //Notify ZeroSum API about the game ended
                        client.emit(
                            'gameEnded',
                            GameEndedEvent.parse({
                                winners: winnerTeams,
                                matchId: game.matchId,
                                tournamentId: game.tournamentId ?? game.tournamentId
                            } satisfies GameEndedEvent),
                        );
                        startedGames.delete(game.matchId);
                        delete runningGames[game.matchId];
                        gameSocket.emit("endInfo","zero sum is informed about the game ended event");
                    } else {
                        console.log(`${game.matchId} already started`);
                        gameSocket.emit(`${game.matchId} already started`)
                    }
                }),
            );
        });

        gameSocket.on('disconnect', (reason) => {
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

    // client.on('startGame', (data: StartGameEvent) => {
    //     const parsedData = StartGamePayload.parse(data)
    //     gameSocket.emit("startGame", )
    //     console.log(parsedData);
    // });

    client.on('disconnect', (reason) => {
        console.log(`Disconnected from Game API: ${reason}`);
    });
}

main();
