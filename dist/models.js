"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartGameEvent = exports.StartGamePayload = exports.Team = exports.LinkTokenPayload = exports.GameStartedEvent = exports.GameEndedEvent = exports.Winners = exports.TeamScore = exports.AuthTokenPayload = exports.TournamentId = exports.MatchId = exports.PlayerId = exports.GameId = void 0;
const zod_1 = require("zod");
const environment_1 = require("./environment");
exports.GameId = zod_1.z.literal(environment_1.Env.GAME_ID);
exports.PlayerId = zod_1.z.string();
exports.MatchId = zod_1.z.string();
exports.TournamentId = zod_1.z.string();
exports.AuthTokenPayload = zod_1.z.object({
    gameId: exports.GameId,
});
exports.TeamScore = zod_1.z.object({
    players: exports.PlayerId.array(),
    scores: zod_1.z.number().array(),
});
exports.Winners = zod_1.z.record(zod_1.z.number(), exports.TeamScore);
exports.GameEndedEvent = zod_1.z.object({
    matchId: exports.MatchId,
    tournamentId: zod_1.z.string().optional(),
    winners: zod_1.z.record(zod_1.z.number(), exports.TeamScore)
});
exports.GameStartedEvent = zod_1.z.object({
    matchId: exports.MatchId,
    tournamentId: exports.TournamentId.optional(),
    timestamp: zod_1.z.coerce.number().int(),
});
exports.LinkTokenPayload = zod_1.z.object({
    gameId: exports.GameId,
    playerId: exports.PlayerId,
    rating: zod_1.z.coerce.number().optional(),
});
exports.Team = zod_1.z.object({
    players: exports.PlayerId.array(),
});
exports.StartGamePayload = zod_1.z.object({
    matchId: exports.MatchId,
    tournamentId: exports.TournamentId.optional(),
    backUrl: zod_1.z.string().url().optional(),
    rivals: exports.Team.array(),
});
exports.StartGameEvent = zod_1.z.object({
    games: exports.StartGamePayload.array(),
});
