const express = require('express');
const app = express();

app.use(express.static('public'));
process.loadEnvFile('.env');

app.listen(process.env.PORT);
