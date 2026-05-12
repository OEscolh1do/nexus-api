const axios = require('axios');
const api = axios.create({ baseURL: '/admin' });
console.log(api.getUri({ url: '/catalog/inverters/123' }));
console.log(api.getUri({ url: 'catalog/inverters/123' }));
