const express = require('express');
const router = express.Router();
const {validationResult} = require('express-validator');

const userController = require('../controllers/userController.js');

const {UserDTO, signupValidations, loginValidations, updateUserValidations} = require('../models/user');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const isAdmin = require('../middleware/isAdmin.js');
const ensureAuthenticated = require('../middleware/isAuth.js');


router.post('/register', signupValidations, async (req, res, next) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()})
        }

        const {password, email, ...rest} = req.body
        const userExists = await userController.getUserByEmail(email)

        if (userExists) {
            return res.status(400).send('A user with this email already exists');
        }

        const salt = await bcrypt.genSalt();

        const user = new UserDTO({
            password: await bcrypt.hash(password, salt),
            email,
            ...rest
        })

        await userController.addUser(user);
        return res.status(200).send("Account created successfully, please proceed to login");

    } catch (err) {
        next(err)
    }
})

router.post('/login', loginValidations, async (req, res, next) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()})
        }

        const user = await userController.getUserByEmail(req.body.email)
        const secret = process.env.secret;

        if(!user) {
            return res.status(404).send('User not found');
        }

        if(user && bcrypt.compareSync(req.body.password, user.password)) {
            const token = jwt.sign({
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin
            },
                secret,
                {expiresIn: '1d'}
            )
            return res.status(200).json({user: user.email, token: token})
        } else {
            return res.status(400).send('Wrong password');
        }
    } catch (err) {
        next(err)
    }
})

router.patch('/admin/:id', isAdmin, async (req, res, next) => {
    try {
        await userController.addAdmin(req.params.id);
        return res.status(200).send("Account upgraded to admin successfully");

    } catch (err) {
        next(err)
    }
})


router.get('/me', ensureAuthenticated, async (req, res, next)=>{
    try {
        const user = await userController.getUserById(req.user.id);
        return res.status(200).json({profile: user});
    } catch (err) {
        next(err)
    }
})


router.patch('/me', ensureAuthenticated ,updateUserValidations, async (req, res, next)=>{

    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()})
        }

        const user = await userController.updateUser(req.user.id, req.body);
        return res.status(200).json({profile: user});
    } catch (err) {
        next(err)
    }
})

// /**
//  * @swagger
//  * /users:
//  *   get:
//  *     tags: [Users]
//  *     summary: Get a list of users for admins
//  */

router.get('/', isAdmin, async (req, res, next)=>{
    try {
        const users = await userController.getAllUsers(req.query);
        return res.status(200).json({data: users});
    } catch (err) {
        next(err)
    }
})

router.get('/:id', isAdmin, async (req, res, next)=>{
    try {
        const user = await userController.getUserById(req.params.id);
        return res.status(200).json({user: user});
    } catch (err) {
        next(err)
    }
})

router.delete('/:id', isAdmin, async (req, res, next)=>{
    try {
        const user = await userController.deleteUser(req.params.id);
        return res.status(200).json({message: "User deleted sucessfully", deletedUser: user});
    } catch (err) {
        next(err)
    }
})

module.exports = router;