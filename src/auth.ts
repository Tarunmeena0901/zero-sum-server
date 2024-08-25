import jwt from 'jsonwebtoken';
import { Env } from './environment';
export const signPayload = <T extends {}>(payload: T) => {
    return jwt.sign(payload, Env.GAME_SECRET, { algorithm: 'HS256' });
};