import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useEffect, useState } from 'react';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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

    const rawApiUrl = import.meta.env.VITE_API_URL;
    const apiUrl = rawApiUrl || window.location.origin;

    const nycCenter: LatLngExpression = [40.7128, -74.0060];

    useEffect(() => {
        fetch(`${apiUrl.replace(/\/$/, '')}/api/stops`)
            .then((res) => {
                if (!res.ok) throw new Error(res.statusText);
                return res.json();
            })
            .then(setStops)
            .catch(console.error);

        fetch(`${apiUrl.replace(/\/$/, '')}/api/shapes`)
            .then((res) => {
                if (!res.ok) throw new Error(res.statusText);
                return res.json();
            })
            .then(setShapes)
            .catch(console.error);
    }, [apiUrl]);

    return (
        <MapContainer
            center={nycCenter}
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
