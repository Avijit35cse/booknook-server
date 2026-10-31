import { MongoClient } from "mongodb";
import "dotenv/config";

//MongoDB connection

const client = new MongoClient(process.env.MONGODB_URI!);

await client.connect();

console.log("You successfully connected to MongoDB!");

// Select BookNook database
export const db = client.db("booknookDB");