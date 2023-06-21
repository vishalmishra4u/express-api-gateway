const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const microservices = require('./microservicesDirectory');
const logger = require('./logger');

const app = express();

// Apply rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Limit each IP to 1000 requests per minute
});

app.use(apiLimiter);

microservices.forEach((service) => {
  const { name, url, routes } = service;

  routes.forEach((route) => {
    app.use(
      route,
      createProxyMiddleware({
        target: url,
        changeOrigin: true,
        pathRewrite: { [`^${route}`]: '' },
        router: {
          [`${route}`]: url,
          [`${route}/:id`]: url,
        },
        onError: (err, req, res) => {
          console.error(`Error proxying request to ${name}`, err);
          res.status(500).json({ error: 'Internal Server Error' });
        },
      })
    );
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
