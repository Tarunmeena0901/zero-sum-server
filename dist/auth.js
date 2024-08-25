"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signPayload = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("./environment");
const signPayload = (payload) => {
    return jsonwebtoken_1.default.sign(payload, environment_1.Env.GAME_SECRET, { algorithm: 'HS256' });
};
exports.signPayload = signPayload;
