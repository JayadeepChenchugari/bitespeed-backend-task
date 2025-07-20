const express = require('express');
const contactRoutes = require('./src/routes/contactRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use('/', contactRoutes);

module.exports = app;
