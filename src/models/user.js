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
    body('email').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({min: 8}),
  ]
  

  const signupValidations = [
    body('name', 'Name cannot be empty').notEmpty(),
    body('email', 'Invalid email').isEmail(),
    body('password', 'Password must be at least 8 character containing uppercase letters, lowercase letters, numbers and special characters.')
    .isLength({min: 8}).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/),
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