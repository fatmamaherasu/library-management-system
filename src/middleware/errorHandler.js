const HttpStatusCode = {
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    FORBIDDEN_RESOURCE: 403
   }

function errorHandler(err, req, res, next) {
    if (!err) return next();
    else if (err instanceof BaseError) {
      return res.status(err.status).send(err.message)
    } else return res.status(500).send(err.message);
}

class BaseError extends Error {
 
    constructor(status, message) {
      super();
      this.message = message;
      this.status = status;
    }

}

class BadRequestException extends BaseError {
    constructor(message) {
      super(HttpStatusCode.BAD_REQUEST, message);
    }
}

class NotFoundException extends BaseError {
    constructor(message) {
      super(HttpStatusCode.NOT_FOUND, message);
    }
}

class UnauthorizedException extends BaseError {
    constructor(message) {
      super(HttpStatusCode.UNAUTHORIZED, message);
    }
}

class ForbiddenResourceException extends BaseError {
    constructor(message) {
      super(HttpStatusCode.FORBIDDEN_RESOURCE, message);
    }
}


module.exports = {
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
    ForbiddenResourceException,
    errorHandler
}