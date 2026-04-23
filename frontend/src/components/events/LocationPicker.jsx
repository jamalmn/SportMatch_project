import { useState, useRef, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import shadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: icon, shadowUrl: shadow });

const MURCIA = [37.9838, -1.1002];
const NOMINATIM = 'https://nominatim.openstreetmap.org';

/* Moves the map view when lat/lng change (MapContainer center is immutable) */
function MapUpdater({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}`,
    { headers: { 'Accept-Language': 'es' } }
  );
  const data = await res.json();
  return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function LocationPicker({ value, onChange, error }) {
  const { direccion = '', lat = null, lng = null } = value ?? {};

  const [query, setQuery]           = useState(direccion);
  const [searching, setSearching]   = useState(false);
  const [searchError, setSearchError] = useState(null);
  const markerRef = useRef(null);

  /* Keep input in sync when edit mode populates value externally */
  useEffect(() => {
    if (direccion && direccion !== query) setQuery(direccion);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direccion]);

  const hasPosition = lat != null && lat !== '' && lng != null && lng !== '';
  const position    = hasPosition ? [Number(lat), Number(lng)] : MURCIA;

  const doSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `${NOMINATIM}/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await res.json();
      if (!data.length) {
        setSearchError('Dirección no encontrada');
        return;
      }
      const { lat: newLat, lon: newLon, display_name } = data[0];
      setQuery(display_name);
      onChange({ direccion: display_name, lat: Number(newLat), lng: Number(newLon) });
    } catch {
      setSearchError('Error al contactar con el servicio de búsqueda');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
  };

  const handleDragEnd = async () => {
    const m = markerRef.current;
    if (!m) return;
    const { lat: newLat, lng: newLng } = m.getLatLng();
    try {
      const dir = await reverseGeocode(newLat, newLng);
      setQuery(dir);
      onChange({ direccion: dir, lat: newLat, lng: newLng });
    } catch {
      onChange({
        direccion: `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`,
        lat: newLat,
        lng: newLng,
      });
    }
  };

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sm-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSearchError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar dirección..."
            className="w-full rounded-xl border border-sm-gray-200 pl-9 pr-3.5 py-2.5 text-sm text-sm-dark placeholder:text-sm-gray-300 outline-none focus:border-sm-green-500 focus:ring-2 focus:ring-sm-green-100 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={doSearch}
          disabled={searching}
          className="px-4 rounded-xl border border-sm-gray-200 text-sm text-sm-gray-600 hover:border-sm-green-400 hover:bg-sm-green-50 transition-colors disabled:opacity-50 shrink-0"
        >
          {searching ? '…' : 'Buscar'}
        </button>
      </div>

      {searchError && (
        <p className="text-xs text-red-500">{searchError}</p>
      )}

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-sm-gray-200">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={false}
          className="h-48 w-full"
          style={{ zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker
            position={position}
            draggable
            ref={markerRef}
            eventHandlers={{ dragend: handleDragEnd }}
          />
          {hasPosition && (
            <MapUpdater lat={Number(lat)} lng={Number(lng)} />
          )}
        </MapContainer>
      </div>

      {/* Coords */}
      {hasPosition && (
        <p className="font-mono text-xs text-sm-gray-400 text-right">
          {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
        </p>
      )}

      {/* Field-level error from react-hook-form */}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
