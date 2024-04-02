const {body} =  require('express-validator')

class UserDTO {
    name;
    email;
    password;
    phone;
  
    constructor(data) {
      this.name = data.name;
      this.email = data.email;
      this.password = data.password;
      this.phone = data.phone;
    }
  }

  const loginValidations = [
    body('email', 'Email cannot be empty').notEmpty(),
    body('email', 'Invalid email').isEmail(),
    body('password', 'The minimum password length is 8 characters').isLength({min: 8}),
  ]
  

  const signupValidations = [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').notEmpty(),
    body('password').isLength({min: 6}),
    body("phone").isAlphanumeric().optional()
  ]

  const updateUserValidations = [
    body('name').isString().optional(),
    body("phone").isAlphanumeric().optional(),
  ]

  module.exports = {
    UserDTO,
    loginValidations,
    signupValidations,
    updateUserValidations
  }