import { useState, useEffect } from 'react';
import MapView from './MapView';

function App() {
  const [routes, setRoutes] = useState<any[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${apiUrl}/api/routes`)
      .then(res => res.json())
      .then(data => setRoutes(data))
      .catch(err => console.error('fetch error', err)); 
  } , []);

  return (
    <div className="App" style={{ fontFamily: 'monospace', padding: '20px'}}>
      <h1>Transit</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {routes.map(route => (
          <div
            key={route.id}
            style={{
              backgroundColor: `#${route.color || '333' }`,
              color: 'white',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 'bold',
            }}
            title={route.longName}
            >
              {route.shortName || route.id}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', height: '80vh', width: '100%'}}>
        <MapView />
      </div>
    </div>
  );
}

export default App;