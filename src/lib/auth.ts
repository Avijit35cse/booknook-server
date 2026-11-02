import {betterAuth} from 'better-auth'
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db } from './db.js';

console.log("Google Client ID loaded:", !!process.env.GOOGLE_CLIENT_ID);
console.log("Google Client Secret loaded:", !!process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:5000"
  ],
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 6,
  },
  socialProviders: {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
},
});
