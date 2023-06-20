const microservices = [
  {
    name: 'user-service',
    url: 'http://user-service:4000',
    routes: ['/users', '/users/:id'],
  },
  {
    name: 'product-service',
    url: 'http://product-service:5000',
    routes: ['/addProduct', '/products/:id'],
  },
  {
    name: 'order-service',
    url: 'http://order-service:6000',
    routes: ['/orders', '/orders/:id'],
  },
];

module.exports = microservices;
