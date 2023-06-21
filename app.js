const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const circuitBreaker = require('express-circuit-breaker');
const rateLimit = require('express-rate-limit');
const axiosRetry = require('axios-retry');
const microservices = require('./microservicesDirectory');
const logger = require('./logger');
const authenticateToken = require('./auth');

const app = express();

// Apply retry strategy to Axios
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

// Apply rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Limit each IP to 1000 requests per minute
});

app.use(apiLimiter);

microservices.forEach((service) => {
  const { name, url, routes } = service;

  routes.forEach((route) => {
    const proxy = createProxyMiddleware({
      target: url,
      changeOrigin: true,
      pathRewrite: { [`^${route}`]: '' },
      router: {
        [`${route}`]: url,
        [`${route}/:id`]: url,
      },
      onError: (err, req, res) => {
        logger.error(`Error proxying request to ${name}: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
      },
    });

    const proxyWithCircuitBreaker = circuitBreaker(proxy, {
      timeoutDuration: 5000, // Timeout in milliseconds
      errorThreshold: 0.5, // Percentage of errors to trip the circuit
      resetTimeout: 30000, // Time in milliseconds to wait before attempting to close the circuit
      fallback: (req, res, next) => {
        logger.error(`Circuit breaker open for ${name}`);
        res.status(503).json({ message: 'Service Unavailable' });
      },
    });

    app.use(route, proxyWithCircuitBreaker);
  });
});

// Apply authentication middleware
app.use(authenticateToken);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
