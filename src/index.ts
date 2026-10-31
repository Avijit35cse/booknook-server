import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

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
const borrows = db.collection("borrows")


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

//Single book api

    app.get('/books/:id',async(req,res)=>{
        try{
            const id = req.params.id
            if(!ObjectId.isValid(id)){
                return res.status(400).send({
                    message : "Invalid book ID"
                })               
            }
            const bookId = new ObjectId(id) 
                const result = await books.findOne({_id: bookId}) 
            
                if(!result){
                    return res.status(404).send({
                        message :"Book not found"
                    })
                }
                res.send({
                    message : "Book fetched successfully",
                    result
                })

        } catch(error){
            console.dir(error)
            res.status(500).send("Failed to fetch book")
        }
    })


//Add Book

    app.post('/books',async(req,res)=>{

    try{
    const result = await books.insertOne(req.body)
        res.status(201).send({
            message:"Book added successfully",
            result
        }) 
    } catch(error){
        console.dir(error)
        res.status(500).send({
            message : "Failed to add book"
        })
    }
        
    })

// Borrow book

app.post('/borrows',async(req,res)=>{
    try{

        const result = await borrows.insertOne(req.body) 
        res.status(201).send({
            message : "Borrow book successfully"
        })

    } catch(error){
        console.dir(error)
        res.status(500).send({
            message: "Failed to borrow book"
        })
    }
})


// Get borrow book

app.get('/borrows',async(req,res)=>{
    try{
        const allBorrows = await borrows.find({}).toArray()
        res.send(allBorrows)

    } catch(error){
        console.dir(error)
        res.status(500).send({
            message: "Failed to fetch borrow records"
        })
    }
})

//Update book

    app.patch('/books/:id',async(req,res)=>{
        try{
            const id = req.params.id
            
            if(!ObjectId.isValid(id)){
                return res.status(400).send({
                    message : "Invalid book ID"
                })
            }

            const bookId = new ObjectId(id)

            const result = await books.updateOne(
                {_id: bookId},{ $set: req.body}
            )

            if(result.matchedCount === 0){
                return res.status(404).send({
                    message : "Book not found"
                })
            }
            res.send({
                message : "Book updated successfully",result
            })
        } catch(error){
            console.dir(error);
            res.status(500).send("Failed to update book")
        }
        
    })

//Delete book

    app.delete('/books/:id',async(req,res)=>{
        try{
            const id = req.params.id
            
            if(!ObjectId.isValid(id)){
                return res.status(400).send({
                    message : "Invalid book ID"
                })         
            }
            const bookId = new ObjectId(id)
                const result = await books.deleteOne({_id: bookId})
                if(result.deletedCount === 0){
                return res.status(404).send({
                    message : "Book not found"
                })
            }
            res.status(200).send({
                message : "Book deleted successfully",result
            })

        } catch(error){
            console.dir(error);
            res.status(500).send("Failed to delete book")
        }
    })

//Start BookNook server

app.listen(port,()=>{
    console.log(`BookNook server is running on port ${port}`);
})