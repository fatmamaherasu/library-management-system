const jwt = require('jsonwebtoken');
const { UnauthorizedException } = require('./errorHandler');


function ensureAuthenticated(req, res, next) {

    if(!req.header('Authorization')) {
        throw new UnauthorizedException('You need to login')
    }

    const token = req.header('Authorization').split(' ')[1];
    const secret = process.env.secret;
    let payload = null;
    try {
        payload = jwt.verify(token, secret);
    }
    catch (err) {
        return res.status(401).send({ message: err.message });
    }

    if (!payload) {
        return res.status(401).send({ message: 'Token is invalid or has expired' });
    }

    req.user = payload;
    return next();
    
}

module.exports = ensureAuthenticated;