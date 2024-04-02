const express = require('express');
const router = express.Router();
const {validationResult} = require('express-validator');

const userController = require('../controllers/userController.js');

const {UserDTO, signupValidations, loginValidations, updateUserValidations} = require('../models/user');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const isAdmin = require('../middleware/isAdmin.js');
const ensureAuthenticated = require('../middleware/isAuth.js');

/**
 *  @swagger
 * components:
 *   securitySchemes:
 *      bearerAuth:            
 *        type: http
 *        scheme: bearer
 *        bearerFormat: JWT
 */



/**
 * @swagger
 * /users/register:
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
 *     tags: [Users]
 *     summary: Sign up
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *              - name
 *              - email
 *              - password
 *           properties:
 *              name:
 *                  type: string
 *              email:
 *                  type: string
 *              password: 
 *                  type: string
 *           example:
 *              name: Fatma
 *              email: "fatma.maher.elsayed@gmail.com"
 *              password: "a1b2c3D@4"
 */
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


/**
 * @swagger
 * /users/login:
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
 *     tags: [Users]
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *              - email
 *              - password
 *           properties:
 *              email:
 *                  type: string
 *              password: 
 *                  type: string
 *           example:
 *              email: "fatma.maher.elsayed@gmail.com"
 *              password: "a1b2c3D@4"
 */
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


/**
 * @swagger
 * /users/admin/{id}:
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
 *     tags: [Users]
 *     summary: Upgrade user to admin for admins
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 */
router.patch('/admin/:id', isAdmin, async (req, res, next) => {
    try {
        await userController.addAdmin(req.params.id);
        return res.status(200).send("Account upgraded to admin successfully");

    } catch (err) {
        next(err)
    }
})


/**
 * @swagger
 * /users/me:
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
 *     tags: [Users]
 *     summary: Get profile of logged in user
 */
router.get('/me', ensureAuthenticated, async (req, res, next)=>{
    try {
        const user = await userController.getUserById(req.user.id);
        return res.status(200).json({profile: user});
    } catch (err) {
        next(err)
    }
})


/**
 * @swagger
 * /users/me/{id}:
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
 *     tags: [Users]
 *     summary: Edit profile for logged in user
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *              - name
 *              - phone
 *           properties:
 *              name:
 *                  type: string
 *              phone: 
 *                  type: string
 *           example:
 *              name: Fatma
 *              phone: "1111111111"
 */
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


/**
 * @swagger
 * /users:
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
 *     tags: [Users]
 *     summary: Get a list of users for admins
 */
router.get('/', isAdmin, async (req, res, next)=>{
    try {
        const users = await userController.getAllUsers(req.query);
        return res.status(200).json({data: users});
    } catch (err) {
        next(err)
    }
})


/**
 * @swagger
 * /users/{id}:
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
 *     tags: [Users]
 *     summary: Get a user by id for admins
 *   parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 */
router.get('/:id', isAdmin, async (req, res, next)=>{
    try {
        const user = await userController.getUserById(req.params.id);
        return res.status(200).json({user: user});
    } catch (err) {
        next(err)
    }
})


/**
 * @swagger
 * /users/{id}:
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
 *     tags: [Users]
 *     summary: Delete a user by id for admins
 *   parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 */
router.delete('/:id', isAdmin, async (req, res, next)=>{
    try {
        const user = await userController.deleteUser(req.params.id);
        return res.status(200).json({message: "User deleted sucessfully", deletedUser: user});
    } catch (err) {
        next(err)
    }
})

module.exports = router;