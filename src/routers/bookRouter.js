const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator');

const bookController = require('../controllers/bookController.js');
const { BookDTO, createBookValidations, updateBookValidations,  } = require('../models/book');
const { pageValidations } = require('../models/page.js');
const ensureAuthenticated = require('../middleware/auth.js');
const isAdmin = require('../middleware/admin.js');
const cron = require('node-cron');


router.get('/', pageValidations, async (req, res, next)=>{
    try {
        const books = await bookController.getAllBooks(req.query)
        return res.status(200).json({books})
    } catch (err) {
        next(err)
    }
})

router.get('/me', ensureAuthenticated, pageValidations, async (req, res, next)=>{
    try {
        const checkouts = await bookController.getUserCheckouts(req.user.id, req.query);
        return res.status(200).json({checkouts});
    } catch (err) {
        next(err)
    }
})

router.get('/checkouts', isAdmin, pageValidations, async (req, res, next)=>{
    try {
        const checkouts = await bookController.getAllCheckouts(req.query)
        return res.status(200).json({checkouts})
    } catch (err) {
        next(err)
    }
})

router.get('/overdue', isAdmin,  pageValidations, async (req, res, next)=>{
    try {
        const checkouts = await bookController.getOverdueBooks(req.query)
        return res.status(200).json({checkouts})
    } catch (err) {
        next(err)
    }
})

router.get('/:id', async (req, res, next)=>{
    try {
        const book = await bookController.getBookById(parseInt(req.params.id))
        return res.status(200).json({book: book})
    } catch (err) {
        next(err)
    }
})

router.delete('/:id', async (req, res, next)=>{
    try {
        await bookController.deleteBook(parseInt(req.params.id))
    } catch (err) {
        next(err)
    }
})

router.post('/:id', createBookValidations, async (req, res, next)=>{
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

cron.schedule('0 0 * * *', () => {
    bookController.markOverdueBooks()
    console.log("cron job executed")
});

  
module.exports = router;