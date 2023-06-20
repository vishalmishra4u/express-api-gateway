const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const microservices = require('./microservices');

const app = express();

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

module.exports = app;
