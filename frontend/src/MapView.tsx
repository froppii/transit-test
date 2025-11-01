import { Fragment, useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, CircleMarker } from 'react-leaflet';
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
  // allow flexible stop payloads
  [k: string]: any;
}

interface ShapePoint {
  lat: number;
  lon: number;
  seq: number;
}

interface Route {
  id: string;
  shortName?: string;
  longName?: string;
  color?: string;
  // flexible fields
  shape_id?: string;
  shapes?: string[] | any;
  [k: string]: any;
}

function MapInitializer({ onMap }: { onMap: (m: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onMap(map);
    try {
      map.invalidateSize();
    } catch (e) {}
  }, [map, onMap]);
  return null;
}

export default function MapView() {
  const [stops, setStops] = useState<Stop[]>([]);
  const [shapes, setShapes] = useState<Record<string, ShapePoint[]>>({});
  const [routes, setRoutes] = useState<Route[]>([]);
  const [rawShapes, setRawShapes] = useState<any>(null);
  const [rawRoutes, setRawRoutes] = useState<any>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  const rawApiUrl = import.meta.env.VITE_API_URL;
  // prefer explicit env, then deployed backend, then local backend during dev, then current origin
  const apiUrl =
    rawApiUrl ||
    'https://transittest.froppii.hackclub.app' || // deployed backend
    (import.meta.env.DEV ? 'http://localhost:38573' : window.location.origin);

  const nycCenter: LatLngExpression = [40.7128, -74.0060];

  function normalizeShapes(payload: unknown): Record<string, ShapePoint[]> {
    const out: Record<string, ShapePoint[]> = {};
    if (!payload) return out;

    if (Array.isArray(payload)) {
      (payload as any[]).forEach((p) => {
        const shapeId = p.shape_id ?? p.shapeId ?? p.shape ?? p.trip_id ?? 'unknown';
        const lat = Number(p.shape_pt_lat ?? p.lat ?? p.lat_dd ?? p.latitude);
        const lon = Number(p.shape_pt_lon ?? p.lon ?? p.lon_dd ?? p.longitude);
        const seq = Number(p.shape_pt_sequence ?? p.seq ?? p.sequence ?? 0);
        if (Number.isNaN(lat) || Number.isNaN(lon)) return;
        if (!out[shapeId]) out[shapeId] = [];
        out[shapeId].push({ lat, lon, seq });
      });
      Object.values(out).forEach((arr) => arr.sort((a, b) => a.seq - b.seq));
      return out;
    }

    (Object.entries(payload as Record<string, any>) as [string, any][]).forEach(([key, val]) => {
      const arr = Array.isArray(val) ? val : (val && (val.points || val.shape || val.coordinates)) || [];
      const points: ShapePoint[] = (arr as any[]).map((p: any) => {
        const lat = Number(p.lat ?? p.shape_pt_lat ?? p.lat_dd ?? p.latitude);
        const lon = Number(p.lon ?? p.shape_pt_lon ?? p.lon_dd ?? p.longitude);
        const seq = Number(p.seq ?? p.shape_pt_sequence ?? p.sequence ?? 0);
        return { lat, lon, seq };
      })
        .filter((pt) => !Number.isNaN(pt.lat) && !Number.isNaN(pt.lon))
        .sort((a, b) => a.seq - b.seq);
      out[key] = points;
    });

    return out;
  }

  useEffect(() => {
    fetch(`${apiUrl.replace(/\/$/, '')}/api/routes`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: any) => {
        console.log('routes raw ->', data);
        setRawRoutes(data);
        setRoutes(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('routes fetch error', err));

    fetch(`${apiUrl.replace(/\/$/, '')}/api/stops`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: any) => {
        setStops(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('stops fetch error', err));

    fetch(`${apiUrl.replace(/\/$/, '')}/api/shapes`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: any) => {
        console.log('shapes raw ->', data);
        setRawShapes(data);
        const normalized = normalizeShapes(data);
        console.log('shapes normalized ->', Object.keys(normalized).length);
        setShapes(normalized);
      })
      .catch((err) => console.error('shapes fetch error', err));
  }, [apiUrl]);

  useEffect(() => {
    if (!map) return;
    const allPoints: [number, number][] = [];
    Object.values(shapes).forEach((pts) => {
      pts.forEach((p) => allPoints.push([p.lat, p.lon]));
    });
    if (allPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(allPoints as any);
        map.fitBounds(bounds, { padding: [20, 20] });
      } catch (e) {
        console.error('fitBounds failed', e);
      }
    }
  }, [shapes, map]);

  useEffect(() => {
    console.log('loaded routes:', routes.length, 'shapes:', Object.keys(shapes).length);
  }, [routes, shapes]);

  function findRouteForShape(shapeId: string): Route | undefined {
    if (!shapeId) return undefined;
    for (const r of routes) {
      if (r.shape_id && String(r.shape_id) === shapeId) return r;
      if (Array.isArray(r.shapes) && r.shapes.includes(shapeId)) return r;
    }
    const sidLower = shapeId.toLowerCase();
    for (const r of routes) {
      if (r.id && sidLower.includes(String(r.id).toLowerCase())) return r;
      if (r.shortName && sidLower.includes(String(r.shortName).toLowerCase())) return r;
    }
    return undefined;
  }

  function routeLabelIcon(text: string, bg: string) {
    const color = bg ? (bg.startsWith('#') ? bg : `#${bg}`) : '#333';
    const textColor = luminanceContrast(color) > 0.5 ? '#000' : '#fff';
    const html = `<div style="
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:700;
      width:36px;height:36px;border-radius:18px;
      background:${color};
      color:${textColor};
      border:2px solid rgba(255,255,255,0.8);
      box-shadow:0 0 6px rgba(0,0,0,0.2);
      font-size:14px;
    ">${text}</div>`;
    return L.divIcon({ html, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
  }

  function luminanceContrast(hex: string) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    const Lp = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return Lp;
  }

  // direct Leaflet layer fallback (draws every shape onto the map)
  const drawnLayersRef = useRef<L.Layer[]>([]);
  useEffect(() => {
    if (!map) return;
    // cleanup previous
    drawnLayersRef.current.forEach((l) => {
      try { map.removeLayer(l); } catch (e) {}
    });
    drawnLayersRef.current = [];

    const allPoints: [number, number][][] = [];

    Object.entries(shapes).forEach(([shapeId, pts]) => {
      if (!pts || pts.length < 2) return;
      const latlngs: [number, number][] = pts
        .map((p) => [Number(p.lat), Number(p.lon)])
        .filter(([lat, lon]) => !Number.isNaN(lat) && !Number.isNaN(lon));

      if (latlngs.length < 2) return;
      allPoints.push(latlngs);

      // bright fallback color so it's visible
      const poly = L.polyline(latlngs as any, { color: '#ff00ff', weight: 8, opacity: 0.95 }).addTo(map);
      const start = L.circleMarker(latlngs[0] as any, { radius: 6, color: '#fff', fillColor: '#ff00ff', fillOpacity: 1 }).addTo(map);
      const end = L.circleMarker(latlngs[latlngs.length - 1] as any, { radius: 6, color: '#fff', fillColor: '#ff00ff', fillOpacity: 1 }).addTo(map);

      drawnLayersRef.current.push(poly, start, end);
    });

    // fit bounds to everything we drew
    if (allPoints.length > 0) {
      try {
        const flat = ([] as [number, number][]).concat(...allPoints);
        const bounds = L.latLngBounds(flat as any);
        map.fitBounds(bounds, { padding: [20, 20] });
      } catch (e) {
        console.error('fallback fitBounds failed', e);
      }
    }

    return () => {
      drawnLayersRef.current.forEach((l) => {
        try { map.removeLayer(l); } catch (e) {}
      });
      drawnLayersRef.current = [];
    };
  }, [map, shapes]);

  // visible map: draw routes/shapes with colors and labels (remove debug overlay)
  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
      <MapContainer center={nycCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
        <MapInitializer onMap={setMap} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* stops */}
        {stops.map((stop) => {
          const lat = Number(stop.lat);
          const lon = Number(stop.lon);
          if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
          return (
            <Marker key={stop.id} position={[lat, lon]}>
              <Popup>{stop.name}</Popup>
            </Marker>
          );
        })}

        {/* draw all shapes with route color + start/end markers + midpoint label */}
        {Object.entries(shapes).map(([shapeId, points]) => {
          if (!points || points.length < 2) return null;
          const positions = points.map((p) => [p.lat, p.lon] as [number, number]);

          const route = findRouteForShape(shapeId);
          const rawColor = route?.color ?? route?.route_color ?? route?.color_text ?? '#ff8800';
          const color = String(rawColor ?? '#ff8800').replace(/^#?/, '');
          const hexColor = color.startsWith('#') ? color : `#${color}`;

          const mid = positions[Math.floor(positions.length / 2)];

          return (
            <Fragment key={shapeId}>
              <Polyline positions={positions} pathOptions={{ color: hexColor, weight: 6, opacity: 0.95 }} />
              <CircleMarker center={positions[0]} radius={6} pathOptions={{ color: '#fff', fillColor: hexColor, fillOpacity: 1 }}>
                <Popup>start {shapeId}{route ? ` — ${route.shortName ?? route.id}` : ''}</Popup>
              </CircleMarker>
              <CircleMarker center={positions[positions.length - 1]} radius={6} pathOptions={{ color: '#fff', fillColor: hexColor, fillOpacity: 1 }}>
                <Popup>end {shapeId}{route ? ` — ${route.shortName ?? route.id}` : ''}</Popup>
              </CircleMarker>

              {mid && route && (
                <Marker position={mid} icon={routeLabelIcon(route.shortName ?? route.id, hexColor)}>
                  <Popup>{route.longName ?? route.shortName ?? route.id}</Popup>
                </Marker>
              )}
            </Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}