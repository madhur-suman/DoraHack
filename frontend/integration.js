const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://django-api:8000',
      changeOrigin: true,
      secure: false,
      logLevel: 'silent',
      onProxyReq: (proxyReq, req, res) => {
        // ensure cookies/domains work when coming from localhost:3000
        proxyReq.setHeader('Origin', 'http://localhost:3000');
      },
      onProxyRes: (proxyRes, req, res) => {
        const setCookie = proxyRes.headers['set-cookie'];
        if (setCookie) {
          proxyRes.headers['set-cookie'] = setCookie.map(c => c.replace(/Domain=[^;]+;?/i, ''));
        }
      },
    })
  );
};