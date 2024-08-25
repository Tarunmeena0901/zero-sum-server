"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
exports.Env = zod_1.z.object({
    GAME_API_URL: zod_1.z.string().url(),
    PLATFORM_URL: zod_1.z.string().url(),
    GAME_ID: zod_1.z.string(),
    GAME_SECRET: zod_1.z.string(),
}).parse(process.env);
