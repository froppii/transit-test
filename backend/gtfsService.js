import fetch from 'node-fetch';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { error } from 'console';

const DATA_DIR = path.join(process.cwd(), 'data');

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