import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Visit } from '../types';

interface HoloMapProps {
  visits: Visit[];
  onMarkerClick?: (visit: Visit) => void;
}

// Map controller to pan/zoom dynamically when visits update
function MapController({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates.length > 0) {
      // Find bounding box or center
      const lats = coordinates.map(c => c[0]);
      const lons = coordinates.map(c => c[1]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLon = (minLon + maxLon) / 2;
      
      // Animate pan to new center
      map.panTo([centerLat, centerLon], { animate: true, duration: 1.5 });
    }
  }, [coordinates, map]);

  return null;
}

export default function HoloMap({ visits, onMarkerClick }: HoloMapProps) {
  // Filter out visits that don't have valid coordinates
  const validVisits = visits.filter(
    v => typeof v.latitude === 'number' && typeof v.longitude === 'number'
  );

  // Group visits by city/location to avoid overlapping markers
  const groupedLocations = validVisits.reduce((acc, visit) => {
    const key = `${visit.city || 'Unknown'}-${visit.country || 'Unknown'}`;
    if (!acc[key]) {
      acc[key] = {
        city: visit.city || 'Unknown',
        country: visit.country || 'Unknown',
        latitude: visit.latitude!,
        longitude: visit.longitude!,
        visitsCount: 0,
        devices: {} as Record<string, number>,
        latestVisit: visit
      };
    }
    acc[key].visitsCount += 1;
    acc[key].devices[visit.device] = (acc[key].devices[visit.device] || 0) + 1;
    return acc;
  }, {} as Record<string, {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    visitsCount: number;
    devices: Record<string, number>;
    latestVisit: Visit;
  }>);

  const locationsArray = Object.values(groupedLocations);
  const mapCoordinates = locationsArray.map(l => [l.latitude, l.longitude] as [number, number]);

  return (
    <div className="w-full h-[320px] rounded-xl border border-cyan-500/20 bg-slate-950 overflow-hidden relative" id="holo-hud-map">
      {/* Cyber Grid background layout for extra high-tech aesthetic */}
      <div className="absolute inset-0 cyber-grid pointer-events-none z-10 opacity-30" />
      
      {/* Laser line effect scanning across map */}
      <div className="hud-laser-line" />
      
      <MapContainer
        center={[14.5995, 120.9842]} // Default center Philippines
        zoom={2}
        minZoom={1}
        maxZoom={12}
        className="w-full h-full z-0"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* Holographic dark map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {locationsArray.map((loc, idx) => {
          // Circle radius scales logarithmically with click counts to prevent oversized dots
          const radius = Math.min(18, 6 + Math.log2(loc.visitsCount) * 2.5);
          
          return (
            <CircleMarker
              key={idx}
              center={[loc.latitude, loc.longitude]}
              radius={radius}
              fillColor="#06b6d4"
              color="#00f0ff"
              weight={1.5}
              opacity={0.8}
              fillOpacity={0.4}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) onMarkerClick(loc.latestVisit);
                }
              }}
            >
              <Popup>
                <div className="p-1 font-sans text-xs space-y-1.5 text-slate-100">
                  <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1">
                    <span className="font-bold text-cyan-400 font-display tracking-wide uppercase">
                      {loc.city}, {loc.country}
                    </span>
                    <span className="font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded text-[10px]">
                      {loc.visitsCount} Clicks
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Latest Visit: <span className="text-slate-300 font-mono">{new Date(loc.latestVisit.timestamp).toLocaleString()}</span>
                  </p>
                  <div className="text-[10px] text-slate-400">
                    Device Spread:
                    <ul className="list-disc pl-3 text-slate-300 mt-0.5">
                      {Object.entries(loc.devices).map(([dev, count]) => (
                        <li key={dev}>{dev}: {count}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        <MapController coordinates={mapCoordinates} />
      </MapContainer>
    </div>
  );
}
