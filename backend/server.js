import express from 'express';
import cors from 'cors';
import { getRoutes } from './gtfsService.js';

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;

app.get('/api', (req, res) => {
    res.json({ message: 'Transit API is running' });
});

async function init() {
    try {
        await downloadGTFS();
        extractGTFS();

        app.get('/routes', (req, res) => {
            res.json({ message: 'GTFS downloaded and extracted successfully' });
        });

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Error initializing server:', err);
    }
}

init();