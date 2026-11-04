import type { RequestHandler } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";

const authURL = process.env.BETTER_AUTH_URL;

if (!authURL) {
    throw new Error("BETTER_AUTH_URL is not configured");
}

const JWKS = createRemoteJWKSet(
    new URL("/api/auth/jwks", authURL)
);

export const verifyToken: RequestHandler = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
            message: "Unauthorized: Token is required",
        });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: authURL,
            audience: authURL,
        });

        res.locals.auth = payload;

        next();
    } catch (error) {
        // res.status(401).json({
        //     message: "Unauthorized: Invalid or expired token",
        // });
         console.error("JWT verification failed:", error);

    res.status(401).json({
        message: "Unauthorized: Invalid or expired token",
    });
    }
};