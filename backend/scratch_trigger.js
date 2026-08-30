const http = require('http');

const data = JSON.stringify({ instances: [] });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/v1/admin/experiences/b9fd4eb6-01cf-47b8-b051-05c070238117/services',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
