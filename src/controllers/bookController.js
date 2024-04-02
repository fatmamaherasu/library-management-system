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
        ...(search && search.ISBN && { ISBN: search.ISBN }),
        isDeleted: false
    }
    const { result: books, ...rest} = await page.filter(filter).exec()
    return {
        books,
        ...rest
    }
    
}

async function getBookById (id) {
    const book = await prisma.book.findUnique({
        where: {id: parseInt(id)},
        include: {
            timesBorrowed: true
        }
    })
    return book
}

async function addBook(bookData) {
    await prisma.book.create({
        data: bookData
    })
}

async function updateBook(id, bookData) {
    const book = await prisma.book.findUnique({
        where: {
            id: parseInt(id),
            isDeleted: false
        }
    })
    if (!book) throw new NotFoundException("Book not found")
    if(bookData.location) {
        const location = await prisma.book.findUnique({
            where: {
                location: bookData.location
            }
        })
        if(location) throw new BadRequestException("Location is already used")
    }
    return await prisma.book.update({
        where: {
            id: parseInt(id)
        },
        data: {
            quantity: bookData.quantity? bookData.quantity : undefined,
            location: bookData.location? bookData.location : undefined
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
            dueDate: {lte: now},
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
            returned: false
        },
    })

    const book = await prisma.book.findUnique({
        where: {
            id: parseInt(bookId),
            isDeleted: false
        }
    })

    if (!book) throw new NotFoundException ("Book not found")

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
                    dueDate: new Date(Date.now() + ( 1000 * 60 * 10)) //Due date is customized for testing purposes (10 minutes after checking)
                }
            })
        }
        else if (book.overdue == true && book.returned == false) {
            throw new BadRequestException("You have an overdue book, please return it first")
        }
    }

    return await prisma.checkout.create({
        data: {
            bookId: parseInt(bookId),
            userId,
            dueDate: new Date(Date.now() + ( 1000 * 60 * 10)) //Due date is customized for testing purposes (10 minutes after borrowing)
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
            returned: true,
            returnedAt: new Date(),
            overdue: false
        }
    })
}

async function deleteBook(id) {
    const book = await prisma.book.findUnique({
        where: {
            id: parseInt(id)
        },
        include: {
            timesBorrowed: true
        }
    })
    if (!book) throw new NotFoundException("Book not found")
    if(book.timesBorrowed.length > 0) {
        return await this.book.update({
            where: {
                id: parseInt(id)
            },
            data: {
                isDeleted: true
            }
        })
    }
    return await prisma.book.delete({
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