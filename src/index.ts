
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { db } from './lib/db.js';
import { ObjectId } from 'mongodb';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import { verifyToken } from './lib/middleware/verifyToken.js';

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


// Get all books (public)
app.get('/books', async (req, res) => {
    try {
        const allBooks = await books.find({}).toArray();

        res.status(200).send(allBooks);
    } catch (error) {
        console.dir(error);

        res.status(500).send({
            message: "Failed to fetch books"
        });
    }
});

// Get user's own books (JWT protected)

app.get('/books/my-books', verifyToken, async (req, res) => {
    try {
        const userEmail = res.locals.auth?.email;

        if (!userEmail || typeof userEmail !== "string") {
            return res.status(401).send({
                message: "Unauthorized: User information missing"
            });
        }

        const myBooks = await books.find({
            addedBy: userEmail
        }).toArray();

        res.status(200).send(myBooks);

    } catch (error) {
        console.dir(error);

        res.status(500).send({
            message: "Failed to fetch your books"
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
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        if (!id) {
            return res.status(400).send({
                message: "Invalid book ID"
            });
        }

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

app.post('/books', verifyToken, async (req, res) => {
    try {
        // Get authenticated user's information from JWT
        const userEmail = res.locals.auth?.email;
        const userName = res.locals.auth?.name || "";

        if (!userEmail || typeof userEmail !== "string") {
            return res.status(401).send({
                message: "Unauthorized: User information missing"
            });
        }

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

        // Create book data using trusted server-side information
        const bookData = {
            title: title.trim(),
            author: author.trim(),
            category,
            image: image.trim(),
            description: description.trim(),
            totalCopies,
            availableCopies: totalCopies,
            addedBy: userEmail,
            addedByName: userName,
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

app.post('/borrows', verifyToken, async (req, res) => {
    try {
        // Get authenticated user's email from JWT
        const userEmail = res.locals.auth?.email;

        if (!userEmail || typeof userEmail !== "string") {
            return res.status(401).send({
                message: "Unauthorized: User information missing"
            });
        }

        // Get book ID from request body
        const { bookId } = req.body;

        if (typeof bookId !== "string" || !ObjectId.isValid(bookId)) {
            return res.status(400).send({
                message: "Invalid book ID"
            });
        }

        // Find the book
        const book = await books.findOne({
            _id: new ObjectId(bookId)
        });

        if (!book) {
            return res.status(404).send({
                message: "Book not found"
            });
        }

        // Check if the user already borrowed this book
        const alreadyBorrowed = await borrows.findOne({
            bookId,
            userEmail
        });

        if (alreadyBorrowed) {
            return res.status(400).send({
                message: "You have already borrowed this book"
            });
        }

        // Decrease available copies atomically
        const updateResult = await books.updateOne(
            {
                _id: new ObjectId(bookId),
                availableCopies: { $gt: 0 }
            },
            {
                $inc: {
                    availableCopies: -1
                }
            }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(400).send({
                message: "No copies available"
            });
        }

        // Set borrow and return dates
        const borrowDate = new Date();

        const returnDate = new Date(borrowDate);
        returnDate.setDate(returnDate.getDate() + 7);

        // Create borrow record using trusted server-side data
        const borrowData = {
            bookId,
            bookTitle: book.title,
            bookImage: book.image,
            userName: res.locals.auth?.name || "",
            userEmail,
            borrowDate,
            returnDate
        };

        await borrows.insertOne(borrowData);

        res.status(201).send({
            message: "Book borrowed successfully"
        });

    } catch (error) {
        console.dir(error);

        res.status(500).send({
            message: "Failed to borrow book"
        });
    }
});


// Get borrow records

app.get('/borrows', verifyToken, async (req, res) => {
    try {
        const userEmail = res.locals.auth?.email;

        if (!userEmail || typeof userEmail !== "string") {
            return res.status(401).send({
                message: "Unauthorized: User information missing"
            });
        }

        const allBorrows = await borrows.find({
            userEmail
        }).toArray();

        res.status(200).send(allBorrows);

    } catch (error) {
        console.dir(error);
        res.status(500).send({
            message: "Failed to fetch borrow records"
        });
    }
});


// Return borrowed book

app.delete('/borrows/:id', verifyToken, async (req, res) => {
    try {
        // Get authenticated user's email from JWT
        const userEmail = res.locals.auth?.email;

        if (!userEmail || typeof userEmail !== "string") {
            return res.status(401).send({
                message: "Unauthorized: User information missing"
            });
        }

        // Get borrow ID
        const id = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;

        if (!id || !ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid borrow ID"
            });
        }

        // Find borrow record belonging to this user
        const borrow = await borrows.findOne({
            _id: new ObjectId(id),
            userEmail
        });

        if (!borrow) {
            return res.status(404).send({
                message: "Borrow record not found"
            });
        }

        const bookId = new ObjectId(borrow.bookId);

        // Increase available copies
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

        // Delete only this user's borrow record
        await borrows.deleteOne({
            _id: new ObjectId(id),
            userEmail
        });

        res.status(200).send({
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

app.patch('/books/:id', verifyToken, async (req, res) => {
    try {
        const id = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;

        if (!id || !ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid book ID"
            });
        }

        const userEmail = res.locals.auth?.email;

        if (!userEmail || typeof userEmail !== "string") {
            return res.status(401).send({
                message: "Unauthorized: User information missing"
            });
        }

        // Request body validation
        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {
            return res.status(400).send({
                message: "Invalid request data"
            });
        }

        const {
            title,
            author,
            category,
            image,
            description,
            totalCopies
        } = req.body;

        const allowedCategories = [
            "Fiction",
            "Science",
            "History",
            "Kids",
            "Others"
        ];

        // Only allow approved fields
        const updateData: Record<string, any> = {};

        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) {
                return res.status(400).send({
                    message: "Invalid book title"
                });
            }
            updateData.title = title.trim();
        }

        if (author !== undefined) {
            if (typeof author !== "string" || !author.trim()) {
                return res.status(400).send({
                    message: "Invalid author name"
                });
            }
            updateData.author = author.trim();
        }

        if (category !== undefined) {
            if (!allowedCategories.includes(category)) {
                return res.status(400).send({
                    message: "Invalid book category"
                });
            }
            updateData.category = category;
        }

        if (image !== undefined) {
            if (typeof image !== "string" || !image.trim()) {
                return res.status(400).send({
                    message: "Invalid book image"
                });
            }
            updateData.image = image.trim();
        }

        if (description !== undefined) {
            if (typeof description !== "string" || !description.trim()) {
                return res.status(400).send({
                    message: "Invalid book description"
                });
            }
            updateData.description = description.trim();
        }

        if (totalCopies !== undefined) {
            if (
                !Number.isInteger(totalCopies) ||
                totalCopies < 1
            ) {
                return res.status(400).send({
                    message: "Total copies must be a positive integer"
                });
            }
        }

        if (Object.keys(updateData).length === 0 && totalCopies === undefined) {
            return res.status(400).send({
                message: "No valid fields provided for update"
            });
        }

        const bookId = new ObjectId(id);

        // Find only the book owned by this user
        const existingBook = await books.findOne({
            _id: bookId,
            addedBy: userEmail
        });

        if (!existingBook) {
            return res.status(404).send({
                message: "Book not found or you are not authorized to update it"
            });
        }

        // Preserve the number of books currently borrowed
        if (totalCopies !== undefined) {
            const borrowedCopies =
                existingBook.totalCopies - existingBook.availableCopies;

            if (totalCopies < borrowedCopies) {
                return res.status(400).send({
                    message: `At least ${borrowedCopies} copies are currently borrowed`
                });
            }

            updateData.totalCopies = totalCopies;
            updateData.availableCopies = totalCopies - borrowedCopies;
        }

        const result = await books.updateOne(
            {
                _id: bookId,
                addedBy: userEmail
            },
            {
                $set: updateData
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send({
                message: "Book not found or you are not authorized to update it"
            });
        }

        res.send({
            message: "Book updated successfully",
            result
        });

    } catch (error) {
        console.dir(error);
        res.status(500).send({
            message: "Failed to update book"
        });
    }
});

// Delete book

app.delete('/books/:id', verifyToken, async (req, res) => {
    try {
        const id = req.params.id;

        if (typeof id !== "string" || !ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid book ID"
            });
        }

        const userEmail = res.locals.auth?.email;

        if (!userEmail || typeof userEmail !== "string") {
            return res.status(401).send({
                message: "Unauthorized: User information missing"
            });
        }

        const bookId = new ObjectId(id);

        const result = await books.deleteOne({
            _id: bookId,
            addedBy: userEmail
        });

        if (result.deletedCount === 0) {
            return res.status(404).send({
                message: "Book not found or you are not authorized to delete it"
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
