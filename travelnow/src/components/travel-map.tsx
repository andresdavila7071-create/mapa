import { useEffect } from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { divIcon, type Map as LeafletMap } from 'leaflet';
import type { TouristPlace } from '@workspace/api-client-react';

import 'leaflet/dist/leaflet.css';

type Coordinates = [number, number];

const placeIcon = divIcon({
  className: 'tn-leaflet-place-icon',
  html: '<span></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

function MapViewport({
  center,
  zoom,
}: {
  center: Coordinates;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.75 });
  }, [center, map, zoom]);

  return null;
}

function MapReady({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
  }, [map, onReady]);

  return null;
}

function ViewportEvents({
  onMove,
  onZoom,
}: {
  onMove: (center: Coordinates) => void;
  onZoom: (zoom: number) => void;
}) {
  useMapEvents({
    moveend(event) {
      const center = event.target.getCenter();
      onMove([center.lat, center.lng]);
    },
    zoomend(event) {
      onZoom(event.target.getZoom());
    },
  });

  return null;
}

type TravelMapProps = {
  center: Coordinates;
  zoom: number;
  places: TouristPlace[];
  userLocation: Coordinates | null;
  alternativeTiles: boolean;
  onReady: (map: LeafletMap) => void;
  onSelectPlace: (place: TouristPlace) => void;
  onMove: (center: Coordinates) => void;
  onZoom: (zoom: number) => void;
};

export function TravelMap({
  center,
  zoom,
  places,
  userLocation,
  alternativeTiles,
  onReady,
  onSelectPlace,
  onMove,
  onZoom,
}: TravelMapProps) {
  return (
    <MapContainer
      className="tn-leaflet-map"
      center={center}
      zoom={zoom}
      minZoom={2}
      maxZoom={19}
      scrollWheelZoom
      worldCopyJump
      attributionControl
    >
      <TileLayer
        key={alternativeTiles ? 'hot' : 'standard'}
        url={
          alternativeTiles
            ? 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        }
        attribution='&copy; OpenStreetMap contributors'
      />
      <MapViewport center={center} zoom={zoom} />
      <MapReady onReady={onReady} />
      <ViewportEvents onMove={onMove} onZoom={onZoom} />
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.latitude, place.longitude]}
          icon={placeIcon}
          eventHandlers={{ click: () => onSelectPlace(place) }}
        >
          <Popup>
            <div className="tn-leaflet-popup">
              <strong>{place.name}</strong>
              <span>{place.category}</span>
              <small>
                {place.source === 'TravelNow demo'
                  ? 'Recomendación de demostración'
                  : `Fuente: ${place.source}`}
              </small>
              <button type="button" onClick={() => onSelectPlace(place)}>
                Ver en el mapa
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
      {userLocation && (
        <CircleMarker
          center={userLocation}
          radius={9}
          pathOptions={{
            color: '#193f47',
            fillColor: '#e0b96f',
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Popup>
            <div className="tn-leaflet-popup">
              <strong>Tu ubicación</strong>
              <span>Ubicación del navegador</span>
            </div>
          </Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}