import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { db } from './lib/db.js';
import { ObjectId } from 'mongodb';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';

const app = express()
const port = process.env.PORT || 5000

//middlewares
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}))
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json())


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

        const {bookId} = req.body

        if(!ObjectId.isValid(bookId)){
            return res.status(400).send({
                message : "Invalid book ID"
            })
        }

        const book = await books.findOne({
            _id : new ObjectId(bookId)
        })

        if(!book){
            return res.status(404).send({
                message : "Book not found"
            })
        }

        const alreadyBorrowed = await borrows.findOne({
            bookId,
            userEmail : req.body.userEmail
        })

        if(alreadyBorrowed){
            return res.status(400).send({
                message : "You have already borrowed this book"
            })
        }

        if(book.availableCopies <= 0){
            return res.status(400).send({
                message : "No copies avaliable"
            })
        }

        await books.updateOne(
            {_id: new ObjectId(bookId)},
            {
                $inc : {
                    availableCopies : -1
                }
            }
        )

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

//Return borrow book

app.delete('/borrows/:id',async(req,res)=>{
    try{
        const id = req.params.id

        if(!ObjectId.isValid(id)){
            return res.status(400).send({
                message : "Invalid borrow ID"
            })
        }
        const borrow = await borrows.findOne({
            _id : new ObjectId(id)
        })

        if(!borrow){
            return res.status(404).send({
                message : "Borrow record not found"
            })
        }

        
        const bookId = new ObjectId(borrow.bookId)
        const availableCopies = await books.updateOne({ _id : bookId},{ 
            $inc :{availableCopies : 1

            }
        })

       
        if(availableCopies.matchedCount === 0){
            return res.status(404).send({
                message : "Book not found"
            })
        }

         await borrows.deleteOne({
            _id : new ObjectId(id)
        })
        res.send({
            message : "Book returned successfully"
        })

    } catch(error){
        console.dir(error)
        res.status(500).send({
            message : "Failed to return borrow book"
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