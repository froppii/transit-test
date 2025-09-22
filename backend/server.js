import express from 'express';
import cors from 'cors';
import { downloadGTFS, extractGTFS, getRoutes, getShapes, getStops } from './gtfsService.js';

const app = express();
app.use(cors());

(async () => {
    await downloadGTFS();
    await extractGTFS();
})();

app.get('/api', (req, res) => {
    res.json({ message: 'Transit API is running' });
});

app.get('/routes', async (req, res) => {
    try {
        const routes = await getRoutes();
        res.json(routes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch routes' });
    }
});

app.get('/api/stops', async (req, res) => {
    try {
        const stops = await getStops();
        res.json(stops);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });

    }
});

app.get('/api/shapes', async (req, res) => {
    try {
        const shapes = await getShapes();
        res.json(shapes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.listen(3001, () => console.log('Server running on port 3001'));