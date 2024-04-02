const {PrismaClient} = require('@prisma/client');
const { Page } = require("../models/page");
const { NotFoundException, UnauthorizedException } = require('../middleware/errorHandler');
const { use } = require('../routers/userRouter');

const prisma = new PrismaClient();

async function getAllUsers(queries) {
    const page = new Page(prisma.user, queries)
    const search = queries.search
    const filter = {
        ...(search && search.name && { name: { contains: search.name, mode: 'insensitive' } }),
        ...(search && search.email && { email: { contains: search.email, mode: 'insensitive' } }),
        isDeleted: false
    }
    const { result: users, ...rest} = await page.filter(filter).exec()
    return {
        users,
        ...rest
    }
}

async function getUserById (id) {
    return await prisma.user.findUnique({
        where: {id},
        include: {booksBorrowed: true}
    })
}

async function getUserByEmail (email) {
    return await prisma.user.findUnique({
        where: {email}
    })
}

async function addUser(userData) {
    return await prisma.user.create({
        data: userData
    })
}

async function addAdmin(id) {
    const user = await prisma.user.findUnique({
        where: {
            id,
            isDeleted: false
        }
    })
    if (!user) throw new NotFoundException("User not found")
    return await prisma.user.update({
        where: {
            id
        },
        data: {
            isAdmin: true
        }
    })
}

async function updateUser(id, userData) {
    const user = await prisma.user.findUnique({
        where: {
            id,
            isDeleted: false
        }
    })
    if (!user) throw new NotFoundException("User not found")
    return await prisma.user.update({
        where: {
            id
        },
        data: {
            name: userData.name? userData.name : undefined,
            phone: userData.phone? userData.phone : undefined
        }
    })
}

async function deleteUser(id) {
    const user = await prisma.user.findUnique({
        where: { 
            id 
        },
        include: {
            booksBorrowed: true
        }
    })
    if (!user) throw new NotFoundException("User not found")
    if (user.isAdmin) throw new UnauthorizedException("Admins cannot be deleted")
    if(user.booksBorrowed.length > 0) {
        return await prisma.user.update({
            where: {
                id
            },
            data: {
                isDeleted: true
            }
        })
    }
    return await prisma.user.delete({
        where: {
            id
        }
    })
}

module.exports = {
    getAllUsers,
    getUserById,
    getUserByEmail,
    addUser,
    addAdmin,
    updateUser,
    deleteUser
}