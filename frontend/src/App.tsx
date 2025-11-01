import { useState, useEffect } from 'react';
import MapView from './MapView';

function App() {
  const [routes, setRoutes] = useState<any[]>([]);
  const rawApiUrl = import.meta.env.VITE_API_URL;
  const apiUrl = rawApiUrl || window.location.origin;

  useEffect(() => {
    fetch(`${apiUrl}/api/routes`)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(data => setRoutes(data))
      .catch(err => console.error('fetch error', err));
  }, [apiUrl]);

  return (
    // make App a column flex container and take full viewport height
    <div className="App" style={{ fontFamily: 'monospace', padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ margin: 0 }}>Transit</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '12px' }}>
        {routes.map(route => {
          const color = (route.color || '333333').replace(/^#/, '').padStart(6,'3');
          return (
            <div
              key={route.id}
              style={{
                backgroundColor: `#${color}`,
                color: 'white',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
              }}
              title={route.longName}
            >
              {route.shortName || route.id}
            </div>
          );
        })}
      </div>

      {/* map wrapper fills remaining space */}
      <div style={{ flex: 1, marginTop: '20px', minHeight: 0 }}>
        <MapView />
      </div>
    </div>
  );
}

export default App;
