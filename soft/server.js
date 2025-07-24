// server.js
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('青春オーバードライブ：Node.jsサーバ起動成功！');
});

server.listen(3000, () => {
  console.log('http://localhost:3000 でサーバーが動いています');
});
