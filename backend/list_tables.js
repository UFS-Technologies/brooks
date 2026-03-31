const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('c:/Users/SAPNA/Desktop/UFS PROJECT/backend/briffni-backend-db.sql'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  const match = line.match(/CREATE TABLE `(.+?)`/i);
  if (match) {
    console.log(match[1]);
  }
});
