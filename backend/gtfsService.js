import fetch from 'node-fetch';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import csv from 'csv-parser';
import { error } from 'console';

const DATA_DIR = path.join(process.cwd(), 'data');
const GTFS_URL = 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip';

export async function downloadGTFS() {
    console.log('Downloading GTFS data...');
    const res = await fetch(GTFS_URL);
    if (!res.ok) throw new Error(`Failed to download GTFS: ${res.statusText}`); 

    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }

    const zipPath = path.join(DATA_DIR, 'gtfs_subway.zip'); 
    const fileStream = fs.createWriteStream(zipPath);

    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on('error', reject);
        fileStream.on('finish', resolve);
    });

    console.log('GTFS saved:', zipPath);
    return zipPath;
}

export async function extractGTFS() {
    const zipPath = path.join(DATA_DIR, 'gtfs_subway.zip');
    console.log('Extracting GTFS...');

    await unzipper.Open.file(zipPath)
        .then((directory) => {
            directory.extract({ path: DATA_DIR, concurrency: 5  })
        })

    console.log('Extracted to:', DATA_DIR);
}

export function getRoutes() {
    return new Promise((resolve, reject) => {
        const routes = [];
        fs.createReadStream(path.join(DATA_DIR, 'routes.txt'))
            .pipe(csv())
            .on('data', (row) => {
                routes.push({
                    id: row.route_id,
                    shortName: row.route_short_name,
                    longName: row.route_long_name,
                    type: row.route_type,
                    color: row.route_color,
                });
            })
            .on('end', () => {
                resolve(routes);
            })
            .on('error', reject);
    });
}

export function getStops() {
    return new Promise((resolve, reject) => {
        const stops = [];
        const filePath = path.resolve('data/stops.txt');

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                stops.push({
                    id: row.stop_id,
                    name: row.stop_name,
                    lat: parseFloat(row.stop_lat),
                    lon: parseFloat(row.stop_lon),
                })
            })
            .on('end', () => resolve(stops))
            .on('error', reject);
    });
}

export function getShapes() {
    return new Promise((resolve, reject) => {
        const shapes = {};
        const filePath = path.resolve('data/shapes.txt');

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const shapeId = row.shape_id;
                if (!shapes[shapeId]) shapes[shapeId] = [];
                shapes[shapeId].push({
                    lat: parseFloat(row.shape_pt_lat),
                    lon: parseFloat(row.shape_pt_lon),
                    seq: parseInt(row.shape_pt_sequence, 10)
                });
            })
            .on('end', () => {
                Object.keys(shapes).forEach((shapeId) => {
                    shapes[shapeId].sort((a, b) => a.seq - b.seq);
                });
                resolve(shapes);
            })
            .on('error', reject);
    });
}