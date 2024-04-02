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
    body("location", "Location has to be of the form (123.4) or (123.45)").isString().optional().isLength({min: 5}).matches(/\d{3}\.\d{1,2}/),
  ]

  module.exports = {
    BookDTO,
    createBookValidations,
    updateBookValidations
  }