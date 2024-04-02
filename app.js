const express = require('express');
const app = express();
const cors = require("cors");
const { errorHandler } = require('./src/middleware/errorHandler')
require('dotenv/config');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');
const api = process.env.API_URL;
const PORT = process.env.PORT || 3000;
const bookRouter = require('./src/routers/bookRouter');
const userRouter = require('./src/routers/userRouter');

const swaggerDefinition = {
    openapi: "3.1.0",
    info: {
    title: "Library Managemenet API",
    description: "Library Managemenet API",
    version: '1.0.0',
    },
    servers: [
        {
          url: `http://localhost:${PORT}`+api,
        },
    ],
    produces: ["application/json"],
    securityDefinitions: {
        bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            scheme: 'bearer',
            in: 'header',
        },
    }
};

const options = {
    swaggerDefinition,
    apis: ["./src/routers/*.js"]
};

const swaggerSpec = swaggerJSDoc(options);

app.use(express.json());
app.use(cors())
app.options('*', cors());
app.use(`${api}/users`, userRouter)
app.use(`${api}/books`, bookRouter)
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
app.use(errorHandler);


app.listen(PORT, ()=>{
    console.log(api);
    console.log(`server is running http://localhost:${PORT}`);
})