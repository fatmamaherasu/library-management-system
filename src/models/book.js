const {body} =  require('express-validator')

  class BookDTO{
    title            
    author             
    ISBN               
    quantity           
    location           
    
    constructor(data) {
      this.title = data.title;
      this.author = data.author;
      this.ISBN = data.ISBN;
      this.quantity = data.quantity;
      this.location = data.location;
    }
  }


  const createBookValidations = [
    body("title").isString().notEmpty(),
    body("author").isString().notEmpty(),
    body("ISBN").isString().notEmpty(),
    body("quantity").isInt().notEmpty(),
    body("location").isString().notEmpty()
  ]

  const updateBookValidations = [
    body("quantity").isInt().optional(),
    body("location").isString().optional()
  ]

  module.exports = {
    BookDTO,
    createBookValidations,
    updateBookValidations
  }