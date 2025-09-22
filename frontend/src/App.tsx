import { useState, useEffect } from 'react';

function App() {
  const [routes, setRoutes] = useState<{ id: number; name: string; status: string }[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL;
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${apiUrl}/routes`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setRoutes(data);
        setError('');
      })
      .catch(err => setError('fetch error:' + err.message)); 
  } , [apiUrl]);

  return (
    <div className="App">
      <h1>Transit</h1>
      <p><strong>API URL:</strong> {apiUrl}</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {routes.length > 0 ? (
        <ul>
          {routes.map(route => (
            <li key={route.id}>
              <strong>{route.name}</strong> - {route.status}
            </li>
          ))}
        </ul>
      ) : (
        !error && <p>Loading routes...</p>
      )}
    </div>
  );
};

export default App;