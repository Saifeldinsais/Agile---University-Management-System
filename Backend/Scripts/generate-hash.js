const bcrypt = require('bcryptjs');

async function generateHash() {
  const hash = await bcrypt.hash('12345M', 10);
  console.log('Full hash: ' + hash);
}

generateHash();
