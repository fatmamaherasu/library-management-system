const {PrismaClient} = require('@prisma/client');
const { Page } = require("../models/page");
const { NotFoundException, UnauthorizedException } = require('../helpers/errorHandler');

const prisma = new PrismaClient();

async function getAllUsers(queries) {
    const page = new Page(prisma.user, queries)
    const search = queries.search
    const filter = {
        ...(search && search.name && { name: { contains: search.name, mode: 'insensitive' } }),
        ...(search && search.email && { email: { contains: search.email, mode: 'insensitive' } }),
    }
    const { result: users, ...rest} = await page.filter(filter).exec()
    return {
        users,
        ...rest
    }
}

async function getUserById (id) {
    return await prisma.user.findUnique({
        where: {id}
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
            id
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
    const user = await prisma.findUnique({
        where: {
            id
        }
    })
    if (!user) throw new NotFoundException("User not found")
    return await prisma.user.update({
        where: {
            id
        },
        data: {
            userData
        }
    })
}

async function deleteUser(id) {
    const user = await prisma.user.findUnique({
        where: { 
            id 
        }
    })
    if (!user) throw new NotFoundException("User not found")
    if (user.isAdmin) throw new UnauthorizedException("Admins cannot be deleted")
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