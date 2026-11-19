const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => res.send('Government Certificate API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[SERVER] Listening on port ${PORT}`));
