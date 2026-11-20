const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/kpis', require('./routes/kpis'));
app.use('/api/worklogs', require('./routes/worklogs'));

app.get('/', (req, res) => res.send('Digital Workforce Analytics API is running'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`[SERVER] Listening on port ${PORT}`));
