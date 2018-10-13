/*
 * Primary file for API
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder =  require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// Instantiate HTTP server
const httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, () => {
  console.log('The HTTP server is listening on port', config.httpPort);
});

// Instantiate HTTPS server
const httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
};

const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

// Start the HTTPS Server
httpsServer.listen(config.httpsPort, () => {
  console.log('The HTTPS server is listening on port', config.httpsPort);
});

// Unified server login for both the http and https servers
const unifiedServer = (req, res) => {

  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  const queryStringObject = parsedUrl.query;

  // Get HTTP method
  const method = req.method.toUpperCase();

  // Get headers as an object
  const headers = req.headers;

  // Get payload
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // Choose handler this request should go to.
    const chosenHandler = typeof(router[trimmedPath]) !== 'undefined'
      ? router[trimmedPath]
      : handlers.notFound;

    // Construct data object to send to handler
    const data = {
      'trimmedPath' : trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': buffer
    };

    // Route the request to handler
    chosenHandler(data , (statusCode, payload) => {
      // Use the status code called back by the handler
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // Use the payload called back by the handler
      payload = typeof(payload) == 'object' ? payload : {};

      // Convert payload to string
      const payloadString = JSON.stringify(payload);

      // Return response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request path
      console.log('Request received on path:', trimmedPath);
      console.log('Method:', method);
      console.log('Response:', statusCode, payloadString);
    });


  });
};

// Define handlers
const handlers = {};

// Hello World handler
handlers.hello = (data, callback) => {
  const response = {
    'message': 'Hello world! Welcome to my API.',
  };
  callback(200, response);
}

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Define request router
const router = {
  'hello': handlers.hello
};
