const { PrismaClient } = require('@prisma/client');
const { Page } = require("../models/page")
const { BadRequestException, NotFoundException } = require("../helpers/errorHandler")

const prisma = new PrismaClient();

async function getAllBooks(queries) {
    const page = new Page(prisma.book, queries)
    const search = queries.search
    const filter = {
        ...(search && search.title && { title: { contains: search.title, mode: 'insensitive' } }),
        ...(search && search.author && { author: { contains: search.author, mode: 'insensitive' } }),
        ...(search && search.ISBN && { ISBN: search.ISBN })
    }
    const { result: books, ...rest} = await page.filter(filter).exec()
    return {
        books,
        ...rest
    }
    
}

async function getBookById (id) {
    const book = await prisma.book.findUnique({
        where: {id: parseInt(id)}
    })
    return book
}

async function addBook(bookData) {
    await prisma.book.create({
        data: bookData
    })
}

async function updateBook(id, bookData) {
    await prisma.book.update({
        where: {
            id: parseInt(id)
        },
        data: {
            bookData
        }
    })
}

async function getAllCheckouts(queries) {
    const page = new Page(prisma.checkout, queries)

    const { result: checkouts, ...rest} = await page.include({book: true, user: true}).exec()
    return {
        checkouts,
        ...rest
    }  
}

async function getUserCheckouts(userId, queries) {
    const page = new Page(prisma.checkout, queries)

    const { result: checkouts, ...rest} = await page.filter({userId}).include({book: true}).exec()
    return {
        checkouts,
        ...rest
    }  
}

async function markOverdueBooks() {
    const now = new Date()
    return await prisma.checkout.updateMany({
        where: {
            dueDate: {gte: now.getDate()},
            returned: false,
        },
        data: {
            overdue: true
        }
    })
}

async function getOverdueBooks(queries) {
    const page = new Page(prisma.checkout, queries)

    const { result: checkouts, ...rest} = await page.include({book: true, user: true}).filter({overdue: true}).exec()
    return {
        checkouts,
        ...rest
    }  
}

async function checkoutBook(userId, bookId) {
    const checked = await prisma.checkout.findMany({
        where: {
            userId,
        },
    })

    if (checked.length == 3) {
        throw new BadRequestException("You already have 3 books checked out")
    }

    for (const book of checked) {
        if (book.bookId == parseInt(bookId) &&  book.overdue == false && book.returned == false) {
            return await prisma.checkout.update({
                where: {
                    id: book.id
                },
                data: {
                    checked: true,
                    checkedAt: new Date(),
                    dueDate: new Date(Date.now() + ( 1000 * 60 * 60 * 24 * 7))
                }
            })
        }
        else if (book.overdue == true) {
            throw new BadRequestException("You have an overdue book, please return it first")
        }
    }

    return await prisma.checkout.create({
        data: {
            bookId: parseInt(bookId),
            userId,
            dueDate: new Date(Date.now() + ( 1000 * 60 * 60 * 24 * 7))
        }
    })
}

async function returnBook(userId, checkoutId) {
    const checked = await prisma.checkout.findUnique({
        where: {
            userId,
            id: parseInt(checkoutId)
        },
    })

    if (!checked) throw new NotFoundException('Checkout not found or not accessible')
    return await prisma.checkout.update({
        where: {
            id: parseInt(checkoutId)
        },
        data: {
            returned: true
        }
    })
}

async function deleteBook(id) {
    await prisma.book.delete({
        where: {
            id: parseInt(id)
        }
    })
}

module.exports = {
    getAllBooks,
    getBookById,
    addBook,
    updateBook,
    checkoutBook,
    getAllCheckouts,
    getUserCheckouts,
    getOverdueBooks,
    markOverdueBooks,
    returnBook,
    deleteBook
}