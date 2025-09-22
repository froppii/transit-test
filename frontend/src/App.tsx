import { useState, useEffect } from 'react';

function App() {
  const [routes, setRoutes] = useState<any[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${apiUrl}/routes`)
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
    </div>
  );
}

export default App;