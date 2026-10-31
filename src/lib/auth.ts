import {betterAuth} from 'better-auth'
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from './db.js';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:5000"
  ],
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
  },
});