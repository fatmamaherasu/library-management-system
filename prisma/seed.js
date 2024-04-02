const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcryptjs');

function n(n){
    if (n > 99) return n.toString();
    else if (n > 9) return "0" + n;
    else return "00" + n
}

async function seed() {
    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash("a1b2c3D@4", salt)
    const books = []
    const locations = []
    try {
        
        await prisma.user.create({
            data: {
                name: "admin",
                email: "admin@library.com",
                password,
                isAdmin: true
            }
        }),
        await prisma.user.create({
            data: {
                name: "user",
                email: "user@library.com",
                password,
                isAdmin: false
            }
        }),
        fs.createReadStream('./prisma/seed' + '/booksShortList.csv')
        .pipe(csv())
        .on('data', (data) => books.push(data))
        .on('end', async () => {
            
            const locationsLength = books.length
            const shelves = Math.ceil(locationsLength / 999)
    
            for (let i = 0; i <= 999; i++) {
                for (let j = 0; j <= shelves; j++) {
                    locations.push(n(i) + "." + j.toString())
                }
            }

            let z = 0
            for (const book of books) {
                book.location = locations[z]
                z += 1
            }

            await prisma.book.createMany({
                data: books.map(({ ISBN, title, author, location }) => ({
                    ISBN,
                    title,
                    author,
                    quantity: Math.floor(Math.random() * 101), 
                    location
                }))
            });
        });
    } catch (error) {
        console.log(error);
    }
}

seed()
    .then(() => console.log('done'))
    .catch((e) => console.error(e));