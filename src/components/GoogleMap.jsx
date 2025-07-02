import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GoogleMap = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [route, setRoute] = useState(null);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places']
      });

      try {
        const google = await loader.load();
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 35.6762, lng: 139.6503 }, // 東京
          zoom: 10,
        });
        setMap(mapInstance);
      } catch (error) {
        console.error('Google Maps の読み込みに失敗しました:', error);
      }
    };

    initMap();
  }, []);

  const calculateRoute = async () => {
    if (!map || !origin || !destination) return;

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();

    directionsRenderer.setMap(map);

    try {
      const result = await directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      directionsRenderer.setDirections(result);
      
      const route = result.routes[0].legs[0];
      setRoute({
        distance: route.distance.text,
        duration: route.duration.text
      });
    } catch (error) {
      console.error('ルート計算に失敗しました:', error);
    }
  };

  return (
    <div style={{ 
      padding: window.innerWidth <= 768 ? '16px' : '20px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      borderRadius: 16,
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      overflowY: window.innerWidth <= 768 ? 'auto' : 'hidden',
      maxHeight: window.innerWidth <= 768 ? '100vh' : 'none'
    }}>
      <h2 style={{ 
        color: '#111', 
        fontWeight: 'bold', 
        fontSize: window.innerWidth <= 768 ? '20px' : '24px', 
        marginBottom: '20px',
        flexShrink: 0
      }}>ルート検索</h2>
      
      <div style={{ marginBottom: '20px', flexShrink: 0 }}>
        <input
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="出発地"
          style={{
            width: '100%',
            padding: window.innerWidth <= 768 ? '10px' : '12px',
            marginBottom: '10px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: window.innerWidth <= 768 ? '14px' : '16px'
          }}
        />
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="目的地"
          style={{
            width: '100%',
            padding: window.innerWidth <= 768 ? '10px' : '12px',
            marginBottom: '10px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: window.innerWidth <= 768 ? '14px' : '16px'
          }}
        />
        <button
          onClick={calculateRoute}
          style={{
            padding: window.innerWidth <= 768 ? '10px 20px' : '12px 24px',
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: window.innerWidth <= 768 ? '14px' : '16px',
            cursor: 'pointer',
            width: window.innerWidth <= 768 ? '100%' : 'auto'
          }}
        >
          ルート検索
        </button>
      </div>

      {route && (
        <div style={{
          padding: window.innerWidth <= 768 ? '12px' : '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '20px',
          flexShrink: 0
        }}>
          <h3 style={{ fontSize: window.innerWidth <= 768 ? '16px' : '18px' }}>ルート情報</h3>
          <p style={{ fontSize: window.innerWidth <= 768 ? '14px' : '16px' }}><strong>距離:</strong> {route.distance}</p>
          <p style={{ fontSize: window.innerWidth <= 768 ? '14px' : '16px' }}><strong>時間:</strong> {route.duration}</p>
        </div>
      )}

      <div
        ref={mapRef}
        style={{
          width: '100%',
          flex: 1,
          borderRadius: '8px',
          border: '1px solid #ddd',
          minHeight: window.innerWidth <= 768 ? '300px' : '400px'
        }}
      />
    </div>
  );
};

export default GoogleMap; 