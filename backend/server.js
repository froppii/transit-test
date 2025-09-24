import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import unzipper from "unzipper";
import csv from "csv-parser";

const app = express();
const PORT = process.env.PORT || 44173;

app.use(cors());

const GTFS_URL = "https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip";
const DATA_DIR = path.join(process.cwd(), "data", "gtfs_subway");

async function downloadGTFS() {
  console.log("Downloading GTFS...");
  const res = await fetch(GTFS_URL);
  if (!res.ok) throw new Error("Failed to download GTFS");

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const zipPath = path.join(DATA_DIR, "gtfs_subway.zip");
  const fileStream = fs.createWriteStream(zipPath);

  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });

  console.log("GTFS downloaded:", zipPath);
  return zipPath;
}

async function extractGTFS() {
  const zipPath = path.join(DATA_DIR, "gtfs_subway.zip");
  console.log("Extracting GTFS...");

  await unzipper.Open.file(zipPath).then((directory) =>
    directory.extract({ path: DATA_DIR, concurrency: 5 })
  );

  console.log("Extracted to:", DATA_DIR);
}

app.get("/api", (req, res) => {
  res.json({ message: "API is running" });
});

app.get("/api/routes", (req, res) => {
  const routes = [];
  const filePath = path.join(DATA_DIR, "routes.txt");

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      routes.push({
        id: row.route_id,
        shortName: row.route_short_name,
        longName: row.route_long_name,
        type: row.route_type,
        color: row.route_color,
      });
    })
    .on("end", () => res.json(routes))
    .on("error", (err) => res.status(500).json({ error: err.message }));
});

app.get("/api/stops", (req, res) => {
  const stops = [];
  const filePath = path.join(DATA_DIR, "stops.txt");

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      stops.push({
        id: row.stop_id,
        name: row.stop_name,
        lat: parseFloat(row.stop_lat),
        lon: parseFloat(row.stop_lon),
      });
    })
    .on("end", () => res.json(stops))
    .on("error", (err) => res.status(500).json({ error: err.message }));
});

app.get("/api/shapes", (req, res) => {
  const shapes = {};
  const shapesFile = path.join(DATA_DIR, "shapes.txt");

  fs.createReadStream(shapesFile)
    .pipe(csv())
    .on("data", (row) => {
      const shapeId = row.shape_id;
      if (!shapes[shapeId]) shapes[shapeId] = [];
      shapes[shapeId].push({
        lat: parseFloat(row.shape_pt_lat),
        lon: parseFloat(row.shape_pt_lon),
        seq: parseInt(row.shape_pt_sequence, 10),
      });
    })
    .on("end", () => {
      Object.keys(shapes).forEach((id) => {
        shapes[id].sort((a, b) => a.seq - b.seq);
      });
      res.json(shapes);
    })
    .on("error", (err) => res.status(500).json({ error: err.message }));
});

(async () => {
  try {
    await downloadGTFS();
    await extractGTFS();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Error setting up GTFS:", err);
  }
})();