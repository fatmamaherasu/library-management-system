const express = require('express');
const app = express();
const { errorHandler } = require('./src/helpers/errorHandler')
require('dotenv/config');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const api = process.env.API_URL;

const swaggerDefinition = {
    info: {
    title: "Library Managemenet API",
    description: "Library Managemenet API",
},
};

const options = {
    swaggerDefinition,
    apis: ['./routers/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

const bookRouter = require('./src/routers/bookRouter');
const userRouter = require('./src/routers/userRouter');


app.use(express.json());
app.use(`${api}/users`, userRouter)
app.use(`${api}/books`, bookRouter)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log(api);
    console.log('server is running http://localhost:3000');
})