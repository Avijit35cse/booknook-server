import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const app = express()
const port = process.env.PORT || 5000

//middlewares
app.use(cors())
app.use(express.json())

//MongoDB connection

const client = new MongoClient(process.env.MONGODB_URI!);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
    process.exit(1);
  }
}


//Connect to MongoDB
const connectedClient = await connectToMongoDB();

//Select the BookNook Database
const db = connectedClient.db("booknookDB");

//Select the Books collection
const books = db.collection("books");


//Test route of server

app.get('/',(req,res)=>{
    res.send("BookNook server is running!")
})

//Get all books
app.get('/books',async(req,res)=>{

    try{
        const allBooks = await books.find({}).toArray();
        res.send(allBooks);
    }
    catch(error){
        console.dir(error);
        res.status(500).send({
            message: "Failed to fetch books"
        })
    }
    
});

//Start BookNook servermkdir src

app.listen(port,()=>{
    console.log(`BookNook server is running on port ${port}`);
})