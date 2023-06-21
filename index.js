const https = require('https');
const fs = require('fs');
const app = require('./app');

// Load SSL/TLS certificate and key
const sslOptions = {
  key: fs.readFileSync('/path/to/private.key'),
  cert: fs.readFileSync('/path/to/certificate.crt'),
};

// Create an HTTPS server
const server = https.createServer(sslOptions, app);

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  logger.info(`API Gateway is running on port ${port}`);
});
