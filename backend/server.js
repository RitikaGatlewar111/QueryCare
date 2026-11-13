const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  console.log(`QueryCare API is listening on http://localhost:${port}`);
});
