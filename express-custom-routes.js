// Inside index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import custom routes
const customRouter = require("./express-custom-routes");

dotenv.config();

const app = express();

app.use(cors()); // If you need CORS
app.use(express.json());

// Mount custom routes at a base path, e.g. "/"
app.use("/", customRouter);

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);

});
