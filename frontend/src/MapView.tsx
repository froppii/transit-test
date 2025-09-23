import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useEffect, useState } from 'react';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Stop {
    id: string;
    name: string;
    lat: number;
    lon: number;
}

interface ShapePoint {
    lat: number;
    lon: number;
    seq: number;
}

export default function MapView() {
    const [stops, setStops] = useState<Stop[]>([]);
    const [shapes, setShapes] = useState<Record<string, ShapePoint[]>>({});

    const apiUrl = import.meta.env.VITE_API_URL;
    const nycCenter: LatLngExpression = [40.7128, -74.0060];


    useEffect(() => {
        fetch(`${apiUrl}/api/stops`)
            .then((res) => res.json())
            .then(setStops)
            .catch(console.error);

        fetch(`${apiUrl}/api/shapes`)
            .then((res) => res.json())
            .then(setShapes)
            .catch(console.error);
    }, [apiUrl]);

    return (
        <MapContainer
            center={nycCenter} // Default to New York City
            zoom={12}
            style={{ height: '100vh', width: '100vw' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {stops.map((stop) => (
                <Marker key={stop.id} position={[stop.lat, stop.lon]}>
                    <Popup>{stop.name}</Popup>
                </Marker>
            ))}

            {Object.entries(shapes).map(([shapeId, points]) => (
                <Polyline 
                    key={shapeId}
                    positions={points.map((p) => [p.lat, p.lon])}
                    pathOptions={{ color: 'blue', weight: 3,  opacity: 0.7 }}
                />
            ))}
        </MapContainer>
    );
}