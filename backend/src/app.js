const express = require('express');
const cors = require("cors");
const routes = require('./routes');

const app = express();
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:8080',
      'https://berenicecalderon.com.mx',
      'https://admin.berenicecalderon.com.mx',
      'https://service-athletic-gym-frontend-182411964865.us-central1.run.app'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
  res.send('OK');
});

app.use('/api', routes);

module.exports = app;
