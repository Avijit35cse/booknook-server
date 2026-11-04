
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { db } from './lib/db.js';
import { ObjectId } from 'mongodb';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';

const app = express();
const port = process.env.PORT || 5000;

// Collections
const books = db.collection("books");
const borrows = db.collection("borrows");

// Middlewares
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://booknook-client-new.vercel.app",
    ],
    credentials: true,
}));

// Better Auth
app.all("/api/auth/{*splat}", toNodeHandler(auth));

// JSON middleware
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.send("BookNook server is running!");
});

// Get all books or filter by user email
app.get('/books', async (req, res) => {
    try {
        const addedBy = req.query.addedBy as string | undefined;
        const query = addedBy ? { addedBy } : {};

        const allBooks = await books.find(query).toArray();

        res.send(allBooks);
    } catch (error) {
        console.dir(error);
        res.status(500).send({
            message: "Failed to fetch books"
        });
    }
});

// Get latest 6 books
app.get('/books/latest', async (req, res) => {
    try {
        const latestBooks = await books
            .find({})
            .sort({ createdAt: -1 })
            .limit(6)
            .toArray();

        res.send(latestBooks);
    } catch (error) {
        console.dir(error);
        res.status(500).send({
            message: "Failed to fetch latest books"
        });
    }
});

// Get single book
app.get('/books/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid book ID"
            });
        }

        const bookId = new ObjectId(id);
        const result = await books.findOne({ _id: bookId });

        if (!result) {
            return res.status(404).send({
                message: "Book not found"
            });
        }

        res.send({
            message: "Book fetched successfully",
            result
        });
    } catch (error) {
        console.dir(error);
        res.status(500).send("Failed to fetch book");
    }
});

// Add book
app.post('/books', async (req, res) => {
    try {
        const {
            title,
            author,
            category,
            image,
            description,
            totalCopies
        } = req.body;

        // Validate required fields
        if (
            typeof title !== "string" ||
            !title.trim() ||
            typeof author !== "string" ||
            !author.trim() ||
            typeof category !== "string" ||
            !category.trim() ||
            typeof image !== "string" ||
            !image.trim() ||
            typeof description !== "string" ||
            !description.trim()
        ) {
            return res.status(400).send({
                message: "Please provide all required book information."
            });
        }

        // Validate category
        const allowedCategories = [
            "Fiction",
            "Science",
            "History",
            "Kids",
            "Others"
        ];

        if (!allowedCategories.includes(category)) {
            return res.status(400).send({
                message: "Please select a valid book category."
            });
        }

        // Validate total copies
        if (
            !Number.isInteger(totalCopies) ||
            totalCopies < 1
        ) {
            return res.status(400).send({
                message: "Total copies must be a positive integer."
            });
        }

        const bookData = {
            ...req.body,
            createdAt: new Date()
        };

        const result = await books.insertOne(bookData);

        res.status(201).send({
            message: "Book added successfully",
            result
        });

    } catch (error) {
        console.error("Add book error:", error);

        res.status(500).send({
            message: "Failed to add book. Please try again."
        });
    }
});

// Borrow book
app.post('/borrows', async (req, res) => {
    try {
        const { bookId } = req.body;

        if (!ObjectId.isValid(bookId)) {
            return res.status(400).send({
                message: "Invalid book ID"
            });
        }

        const book = await books.findOne({
            _id: new ObjectId(bookId)
        });

        if (!book) {
            return res.status(404).send({
                message: "Book not found"
            });
        }

        const alreadyBorrowed = await borrows.findOne({
            bookId,
            userEmail: req.body.userEmail
        });

        if (alreadyBorrowed) {
            return res.status(400).send({
                message: "You have already borrowed this book"
            });
        }

        if (book.availableCopies <= 0) {
            return res.status(400).send({
                message: "No copies available"
            });
        }

        await books.updateOne(
            { _id: new ObjectId(bookId) },
            {
                $inc: {
                    availableCopies: -1
                }
            }
        );

        await borrows.insertOne(req.body);

        res.status(201).send({
            message: "Borrow book successfully"
        });
    } catch (error) {
        console.dir(error);
        res.status(500).send({
            message: "Failed to borrow book"
        });
    }
});

// Get borrow records
app.get('/borrows', async (req, res) => {
    try {
        const userEmail = req.query.userEmail as string;

        const allBorrows = await borrows.find({
            userEmail
        }).toArray();

        res.send(allBorrows);
    } catch (error) {
        console.dir(error);
        res.status(500).send({
            message: "Failed to fetch borrow records"
        });
    }
});

// Return borrowed book
app.delete('/borrows/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid borrow ID"
            });
        }

        const borrow = await borrows.findOne({
            _id: new ObjectId(id)
        });

        if (!borrow) {
            return res.status(404).send({
                message: "Borrow record not found"
            });
        }

        const bookId = new ObjectId(borrow.bookId);

        const availableCopies = await books.updateOne(
            { _id: bookId },
            {
                $inc: {
                    availableCopies: 1
                }
            }
        );

        if (availableCopies.matchedCount === 0) {
            return res.status(404).send({
                message: "Book not found"
            });
        }

        await borrows.deleteOne({
            _id: new ObjectId(id)
        });

        res.send({
            message: "Book returned successfully"
        });
    } catch (error) {
        console.dir(error);
        res.status(500).send({
            message: "Failed to return borrow book"
        });
    }
});

// Update book
app.patch('/books/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid book ID"
            });
        }

        const bookId = new ObjectId(id);

        const result = await books.updateOne(
            { _id: bookId },
            { $set: req.body }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send({
                message: "Book not found"
            });
        }

        res.send({
            message: "Book updated successfully",
            result
        });
    } catch (error) {
        console.dir(error);
        res.status(500).send("Failed to update book");
    }
});

// Delete book
app.delete('/books/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid book ID"
            });
        }

        const bookId = new ObjectId(id);
        const result = await books.deleteOne({ _id: bookId });

        if (result.deletedCount === 0) {
            return res.status(404).send({
                message: "Book not found"
            });
        }

        res.status(200).send({
            message: "Book deleted successfully",
            result
        });
    } catch (error) {
        console.dir(error);
        res.status(500).send("Failed to delete book");
    }
});

export default app;
