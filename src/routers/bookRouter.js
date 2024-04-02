const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');

const bookController = require('../controllers/bookController.js');
const { BookDTO, createBookValidations, updateBookValidations,  } = require('../models/book');
const { pageValidations } = require('../models/page.js');
const ensureAuthenticated = require('../middleware/isAuth.js');
const isAdmin = require('../middleware/isAdmin.js');
const cron = require('node-cron');


/**
 * @swagger
 * /books:
 *   get:
 *     responses:
 *        '200': 
 *          description: success
 *        '400': 
 *          description: bad request
 *        '404':
 *          description: not found
 *        '401': 
 *          description: unauthorized
 *        '403': 
 *          description: forbidden resource
 *     tags: [Books]
 *     summary: Get a list of all books
 *         
 */
router.get('/', pageValidations, async (req, res, next)=>{
    try {
        const books = await bookController.getAllBooks(req.query)
        return res.status(200).json({books})
    } catch (err) {
        next(err)
    }
})

/**
 * @swagger
 * /books/me:
 *   get:
 *     responses:
 *        '200': 
 *          description: success
 *        '400': 
 *          description: bad request
 *        '404':
 *          description: not found
 *        '401': 
 *          description: unauthorized
 *        '403': 
 *          description: forbidden resource
 *     security:
 *      - bearerAuth: []
 *     tags: [Books]
 *     summary: Get all books checked out by logged in user
 */
router.get('/me', ensureAuthenticated, pageValidations, async (req, res, next)=>{
    try {
        const checkouts = await bookController.getUserCheckouts(req.user.id, req.query);
        return res.status(200).json({checkouts});
    } catch (err) {
        next(err)
    }
})

/**
 * @swagger
 * /books/checkouts:
 *   get:
 *     responses:
 *        '200': 
 *          description: success
 *        '400': 
 *          description: bad request
 *        '404':
 *          description: not found
 *        '401': 
 *          description: unauthorized
 *        '403': 
 *          description: forbidden resource
 *     security:
 *       - bearerAuth: []
 *     tags: [Books]
 *     summary: Get all checkouts for admins
 */
router.get('/checkouts', isAdmin, pageValidations, async (req, res, next)=>{
    try {
        const checkouts = await bookController.getAllCheckouts(req.query)
        return res.status(200).json({checkouts})
    } catch (err) {
        next(err)
    }
})

/**
 * @swagger
 * /books/overdue:
 *   get:
 *     responses:
 *        '200': 
 *          description: success
 *        '400': 
 *          description: bad request
 *        '404':
 *          description: not found
 *        '401': 
 *          description: unauthorized
 *        '403': 
 *          description: forbidden resource
 *     security:
 *      - bearerAuth: []
 *     tags: [Books]
 *     summary: Get a list of all overdue books
 */
router.get('/overdue', isAdmin, pageValidations, async (req, res, next)=>{
    try {
        const checkouts = await bookController.getOverdueBooks(req.query)
        return res.status(200).json({checkouts})
    } catch (err) {
        next(err)
    }
})

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     responses:
 *        '200': 
 *          description: success
 *        '400': 
 *          description: bad request
 *        '404':
 *          description: not found
 *        '401': 
 *          description: unauthorized
 *        '403': 
 *          description: forbidden resource
 *     tags: [Books]
 *     summary: Get a book by id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The book id
 */
router.get('/:id', async (req, res, next)=>{
    try {
        const book = await bookController.getBookById(parseInt(req.params.id))
        return res.status(200).json({book: book})
    } catch (err) {
        next(err)
    }
})


/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     responses:
 *        '200': 
 *          description: success
 *        '400': 
 *          description: bad request
 *        '404':
 *          description: not found
 *        '401': 
 *          description: unauthorized
 *        '403': 
 *          description: forbidden resource
 *     security:
 *      - bearerAuth: []
 *     tags: [Books]
 *     summary: Delete a book by id for admins
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The book id
 */
router.delete('/:id', isAdmin, async (req, res, next)=>{
    try {
        const book = await bookController.deleteBook(parseInt(req.params.id))
        return res.status(200).json({message: "Book deleted sucessfully", deletedBook: book});
    } catch (err) {
        next(err)
    }
})


/**
 * @swagger
 * /books:
 *   post:
 *     responses:
 *        '200': 
 *          description: success
 *        '400': 
 *          description: bad request
 *        '404':
 *          description: not found
 *        '401': 
 *          description: unauthorized
 *        '403': 
 *          description: forbidden resource
 *     security:
 *      - bearerAuth: []
 *     tags: [Books]
 *     summary: Add a new book for admins
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *              - title
 *              - author
 *              - ISBN
 *              - location
 *              - quantity
 *           properties:
 *              title:
 *              type: string
 *           author:
 *              type: string
 *           ISBN: 
 *              type: string
 *           location:
 *              type: string
 *           quantity:
 *              type: integer
 *           example:
 *              title: The New Turing Omnibus
 *              author: Alexander K. Dewdney
 *              ISBN: '9999999'
 *              location: '123.45'
 *              quantity: 100
 */
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


/**
 * @swagger
 * /books/edit/{id}:
 *   patch:
 *     responses:
 *        '200': 
 *           description: success
 *        '400': 
 *           description: bad request
 *        '404':
 *           description: not found
 *        '401': 
 *           description: unauthorized
 *        '403': 
 *           description: forbidden resource
 *     security:
 *      - bearerAuth: []
 *     tags: [Books]
 *     summary: Edit book details for admins
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The book id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *              - location
 *              - quantity
 *           properties:
 *              location:
 *                  type: string
 *              quantity:
 *                  type: integer
 *           example:
 *              location: '123.45'
 *              quantity: 100
 */
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


/**
 * @swagger
 * /books/borrow/{id}:
 *   patch:
 *     responses:
 *        '200': 
 *          description: success
 *        '400': 
 *          description: bad request
 *        '404':
 *          description: not found
 *        '401': 
 *          description: unauthorized
 *        '403': 
 *          description: forbidden resource
 *     security:
 *      - bearerAuth: []
 *     tags: [Books]
 *     summary: Borrow a book by id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The book id
 */
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


/**
 * @swagger
 * /books/return/{id}:
 *   patch:
 *     responses:
 *        '200': 
 *          description: success
 *        '400': 
 *          description: bad request
 *        '404':
 *          description: not found
 *        '401': 
 *          description: unauthorized
 *        '403': 
 *          description: forbidden resource
 *     security:
 *      - bearerAuth: []
 *     tags: [Books]
 *     summary: Return a book by checkout id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The book id
 */
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