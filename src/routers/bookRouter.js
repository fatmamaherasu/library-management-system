const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');

const bookController = require('../controllers/bookController.js');
const { BookDTO, createBookValidations, updateBookValidations,  } = require('../models/book');
const { pageValidations } = require('../models/page.js');
const ensureAuthenticated = require('../middleware/isAuth.js');
const isAdmin = require('../middleware/isAdmin.js');
const cron = require('node-cron');


// /**
//  * @swagger
//  * /books:
//  *   get:
//  *     tags: [Books]
//  *     summary: Get a list of all books
//  *   responses:
//  *       200:
//  *         content:
//  *           application/json
//  *       400:
//  *         description: post can not be found
//  */
router.get('/', pageValidations, async (req, res, next)=>{
    try {
        const books = await bookController.getAllBooks(req.query)
        return res.status(200).json({books})
    } catch (err) {
        next(err)
    }
})

// /**
//  * @swagger
//  * /books/me:
//  *   get:
//  *     tags: [Books]
//  *     summary: Get all books checked out by logged in user
//  */
router.get('/me', ensureAuthenticated, pageValidations, async (req, res, next)=>{
    try {
        const checkouts = await bookController.getUserCheckouts(req.user.id, req.query);
        return res.status(200).json({checkouts});
    } catch (err) {
        next(err)
    }
})

// /**
//  * @swagger
//  * /books/checkouts:
//  *   get:
//  *     tags: [Books]
//  *     summary: Get all checkouts for admins
//  */
router.get('/checkouts', isAdmin, pageValidations, async (req, res, next)=>{
    try {
        const checkouts = await bookController.getAllCheckouts(req.query)
        return res.status(200).json({checkouts})
    } catch (err) {
        next(err)
    }
})

// /**
//  * @swagger
//  * /books/overdue:
//  *   get:
//  *     tags: [Books]
//  *     summary: Get a list of all overdue books
//  */
router.get('/overdue', isAdmin, pageValidations, async (req, res, next)=>{
    try {
        const checkouts = await bookController.getOverdueBooks(req.query)
        return res.status(200).json({checkouts})
    } catch (err) {
        next(err)
    }
})

// /**
//  * @swagger
//  * /books/{id}:
//  *   get:
//  *     tags: [Books]
//  *     summary: Get a book by id
//  *   parameters:
//  *       - in: path
//  *         name: id
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: The book id
//  */
router.get('/:id', async (req, res, next)=>{
    try {
        const book = await bookController.getBookById(parseInt(req.params.id))
        return res.status(200).json({book: book})
    } catch (err) {
        next(err)
    }
})


// /**
//  * @swagger
//  * /books/{id}:
//  *   delete:
//  *     tags: [Books]
//  *     summary: Delete a book by id for admins
//  *   parameters:
//  *       - in: path
//  *         name: id
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: The book id
//  */
router.delete('/:id', isAdmin, async (req, res, next)=>{
    try {
        const book = await bookController.deleteBook(parseInt(req.params.id))
        return res.status(200).json({message: "Book deleted sucessfully", deletedBook: book});
    } catch (err) {
        next(err)
    }
})


router.post('/', isAdmin, createBookValidations, async (req, res, next)=>{
    try { 
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()})
        }
        const book = await bookController.addBook(new BookDTO(req.body))
        return res.status(200).json({book: book})
    } catch (err) {
        next(err)
    }
})

router.patch('/edit/:id', isAdmin, updateBookValidations, async (req, res, next)=>{
    try { 
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()})
        }
        const book = await bookController.updateBook(req.params.id, req.body)
        return res.status(200).json({book: book})
    } catch (err) {
        next(err)
    }
})

router.patch('/borrow/:id', ensureAuthenticated, async (req, res, next)=>{
    try { 
        const userId = req.user.id
        const bookId = req.params.id
        const checkout = await bookController.checkoutBook(userId, bookId)
        return res.status(200).json({checkout: checkout})
    } catch (err) {
        next(err)
    }
    
})

router.patch('/return/:id', ensureAuthenticated, async (req, res, next)=>{
    try { 
        const userId = req.user.id
        const checkoutId = req.params.id
        const checkout = await bookController.returnBook(userId, checkoutId)
        return res.status(200).json({checkout: checkout})
    } catch (err) {
        next(err)
    }
    
})

cron.schedule('0 * * * * *', () => {
    bookController.markOverdueBooks()
});

  
module.exports = router;