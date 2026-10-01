import { type FormEvent, useRef, useState } from 'react';
import { geocodeDestination, getGeocodeDestinationQueryKey, getSearchTouristPlacesQueryKey, useSearchTouristPlaces, type TouristPlace } from '@workspace/api-client-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type Map as LeafletMap } from 'leaflet';
import { Compass, LocateFixed, MapPin, Minus, Navigation, PanelRight, Plus, Route as RouteIcon, Search, Send, Sparkles, Utensils, X, Layers3, CalendarDays, CloudSun, Trees, Check, MessageCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { TravelMap } from '@/components/travel-map';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type Preference = 'culture' | 'food' | 'nature';
type ChatMessage = { id: number; role: 'assistant' | 'user'; text: string };

const preferences: { id: Preference; label: string }[] = [
  { id: 'culture', label: '🏛️ Cultura y turismo' },
  { id: 'food', label: '🍽️ Gastronomía y entretenimiento' },
  { id: 'nature', label: '🌳 Naturaleza y aventura' },
];

const capabilities = [
  { label: 'GPS y ubicación', icon: LocateFixed },
  { label: 'Eventos en tiempo real', icon: CalendarDays },
  { label: 'Restaurantes', icon: Utensils },
  { label: 'Lugares turísticos', icon: MapPin },
  { label: 'Clima local', icon: CloudSun },
  { label: 'Rutas', icon: RouteIcon },
];

const demoPlacesByCity: Record<string, TouristPlace[]> = {
  bogota: [
    { id: 'demo-bogota-oro', name: 'Museo del Oro', category: 'Museo', latitude: 4.6017, longitude: -74.0721, address: 'Centro de Bogotá', source: 'TravelNow demo' },
    { id: 'demo-bogota-monserrate', name: 'Monserrate', category: 'Mirador', latitude: 4.6058, longitude: -74.0551, address: 'Bogotá', source: 'TravelNow demo' },
    { id: 'demo-bogota-bolivar', name: 'Plaza de Bolívar', category: 'Plaza histórica', latitude: 4.5981, longitude: -74.0758, address: 'La Candelaria, Bogotá', source: 'TravelNow demo' },
  ],
  cartagena: [
    { id: 'demo-cartagena-castillo', name: 'Castillo de San Felipe de Barajas', category: 'Fortaleza histórica', latitude: 10.4236, longitude: -75.5372, address: 'Cartagena de Indias', source: 'TravelNow demo' },
    { id: 'demo-cartagena-murallas', name: 'Ciudad Amurallada', category: 'Centro histórico', latitude: 10.4236, longitude: -75.5481, address: 'Cartagena de Indias', source: 'TravelNow demo' },
    { id: 'demo-cartagena-getsemani', name: 'Getsemaní', category: 'Barrio cultural', latitude: 10.4229, longitude: -75.5452, address: 'Cartagena de Indias', source: 'TravelNow demo' },
  ],
  medellin: [
    { id: 'demo-medellin-botero', name: 'Plaza Botero', category: 'Arte público', latitude: 6.2518, longitude: -75.5684, address: 'Medellín', source: 'TravelNow demo' },
    { id: 'demo-medellin-antioquia', name: 'Museo de Antioquia', category: 'Museo', latitude: 6.2521, longitude: -75.5692, address: 'Medellín', source: 'TravelNow demo' },
    { id: 'demo-medellin-arvi', name: 'Parque Arví', category: 'Naturaleza', latitude: 6.2828, longitude: -75.5023, address: 'Medellín', source: 'TravelNow demo' },
  ],
  paris: [
    { id: 'demo-paris-eiffel', name: 'Torre Eiffel', category: 'Monumento', latitude: 48.8584, longitude: 2.2945, address: 'París', source: 'TravelNow demo' },
    { id: 'demo-paris-louvre', name: 'Museo del Louvre', category: 'Museo', latitude: 48.8606, longitude: 2.3376, address: 'París', source: 'TravelNow demo' },
    { id: 'demo-paris-notredame', name: 'Catedral de Notre-Dame', category: 'Arquitectura histórica', latitude: 48.853, longitude: 2.3499, address: 'París', source: 'TravelNow demo' },
  ],
  'nueva york': [
    { id: 'demo-ny-liberty', name: 'Estatua de la Libertad', category: 'Monumento', latitude: 40.6892, longitude: -74.0445, address: 'Nueva York', source: 'TravelNow demo' },
    { id: 'demo-ny-central', name: 'Central Park', category: 'Parque urbano', latitude: 40.7851, longitude: -73.9683, address: 'Nueva York', source: 'TravelNow demo' },
    { id: 'demo-ny-times', name: 'Times Square', category: 'Plaza urbana', latitude: 40.758, longitude: -73.9855, address: 'Nueva York', source: 'TravelNow demo' },
  ],
  madrid: [
    { id: 'demo-madrid-prado', name: 'Museo del Prado', category: 'Museo', latitude: 40.4138, longitude: -3.6921, address: 'Madrid', source: 'TravelNow demo' },
    { id: 'demo-madrid-retiro', name: 'Parque del Retiro', category: 'Parque urbano', latitude: 40.4153, longitude: -3.6844, address: 'Madrid', source: 'TravelNow demo' },
    { id: 'demo-madrid-palace', name: 'Palacio Real de Madrid', category: 'Palacio histórico', latitude: 40.4179, longitude: -3.7143, address: 'Madrid', source: 'TravelNow demo' },
  ],
  roma: [
    { id: 'demo-roma-colosseum', name: 'Coliseo', category: 'Monumento histórico', latitude: 41.8902, longitude: 12.4922, address: 'Roma', source: 'TravelNow demo' },
    { id: 'demo-roma-trevi', name: 'Fontana di Trevi', category: 'Fuente histórica', latitude: 41.9009, longitude: 12.4833, address: 'Roma', source: 'TravelNow demo' },
    { id: 'demo-roma-vatican', name: 'Ciudad del Vaticano', category: 'Patrimonio cultural', latitude: 41.9029, longitude: 12.4534, address: 'Roma', source: 'TravelNow demo' },
  ],
  tokio: [
    { id: 'demo-tokyo-sensoji', name: 'Templo Sensō-ji', category: 'Templo histórico', latitude: 35.7148, longitude: 139.7967, address: 'Tokio', source: 'TravelNow demo' },
    { id: 'demo-tokyo-tower', name: 'Tokyo Tower', category: 'Mirador', latitude: 35.6586, longitude: 139.7454, address: 'Tokio', source: 'TravelNow demo' },
    { id: 'demo-tokyo-meiji', name: 'Santuario Meiji', category: 'Santuario', latitude: 35.6764, longitude: 139.6993, address: 'Tokio', source: 'TravelNow demo' },
  ],
};

const recommendationCopy: Record<Preference, string> = {
  culture: 'Una ruta para descubrir historia, arte y arquitectura.',
  food: 'Una ruta para explorar sabores, barrios y planes para la tarde.',
  nature: 'Una ruta para salir, respirar y moverte al aire libre.',
};

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

function getDemoPlaces(destination: string) {
  const normalizedDestination = normalizeSearch(destination);
  const city = Object.keys(demoPlacesByCity).find((key) => normalizedDestination.includes(key));
  return city ? demoPlacesByCity[city] : [];
}

type MapSurfaceProps = {
  query: string;
  onSearch: (value: string) => void;
  onSearchSubmit: (value: string) => void;
  onZoom: (direction: 'in' | 'out') => void;
  onLocate: () => void;
  onOpenAI: () => void;
  onLayers: () => void;
  onPlaceSelect: (place: TouristPlace) => void;
  recommendedPlace: TouristPlace | null;
  layersActive: boolean;
  places: TouristPlace[];
  placesLoading: boolean;
  placesError: boolean;
  mapCenter: [number, number];
  mapZoom: number;
  userLocation: [number, number] | null;
  alternativeTiles: boolean;
  onMapReady: (map: LeafletMap) => void;
  onMapMove: (center: [number, number]) => void;
  onMapZoom: (zoom: number) => void;
  locationNote: string | null;
  searchError: string | null;
};

  function MapSurface({ query, onSearch, onSearchSubmit, onZoom, onLocate, onOpenAI, onLayers, onPlaceSelect, recommendedPlace, layersActive, places, placesLoading, placesError, mapCenter, mapZoom, userLocation, alternativeTiles, onMapReady, onMapMove, onMapZoom, locationNote, searchError }: MapSurfaceProps) {
  return (
    <section className="tn-map-stage" aria-label="Superficie del mapa">
      <TravelMap
        center={mapCenter}
        zoom={mapZoom}
        places={places}
        recommendedPlace={recommendedPlace}
        userLocation={userLocation}
        alternativeTiles={alternativeTiles}
        onReady={onMapReady}
        onSelectPlace={onPlaceSelect}
        onMove={onMapMove}
        onZoom={onMapZoom}
      />
      <div className="tn-map-status" data-testid="status-map-connection">
        <i className="tn-pulse" />
        {placesLoading
          ? 'Buscando lugares turísticos…'
          : layersActive && places.length
            ? `${places.length} lugares turísticos encontrados`
            : layersActive
              ? 'Capa turística · busca un destino'
              : 'Mapa base · sin datos conectados'}
      </div>
      {locationNote && <div className="tn-location-note" data-testid="status-location">{locationNote}</div>}
      {searchError && <div className="tn-place-notice is-error tn-search-error" data-testid="status-search-error">{searchError}</div>}
      <form className="tn-search-wrap" onSubmit={(event) => { event.preventDefault(); onSearchSubmit(query); }}>
        <label className="tn-search" htmlFor="destination-search">
          <Search size={19} strokeWidth={1.8} aria-hidden="true" />
          <input
            id="destination-search"
            data-testid="input-destination-search"
            type="search"
            value={query}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Busca un país, ciudad o lugar"
            aria-label="Busca un país, ciudad o lugar"
          />
          {query && <X size={16} color="#86a09d" aria-hidden="true" />}
        </label>
        {query && (
          <div className="tn-search-result" data-testid="status-search-result">
            Pulsa Enter para mostrar lugares turísticos reales cerca de “{query}”.
          </div>
        )}
      </form>
      <div className="tn-map-tools" aria-label="Controles del mapa">
        <button className="tn-map-tool" type="button" onClick={() => onZoom('in')} data-testid="button-map-zoom-in" aria-label="Acercar mapa"><Plus size={17} /></button>
        <button className="tn-map-tool" type="button" onClick={() => onZoom('out')} data-testid="button-map-zoom-out" aria-label="Alejar mapa"><Minus size={17} /></button>
        <button className="tn-map-tool" type="button" onClick={onLocate} data-testid="button-map-locate" aria-label="Usar ubicación actual"><LocateFixed size={17} /></button>
        <button className={`tn-map-tool ${layersActive ? 'is-active' : ''}`} type="button" onClick={onLayers} data-testid="button-map-layers" aria-label="Mostrar lugares turísticos"><Layers3 size={17} /></button>
      </div>
      {placesLoading && <div className="tn-place-notice">Consultando datos reales de OpenStreetMap…</div>}
      {placesError && <div className="tn-place-notice is-error">No pudimos cargar los lugares. Intenta de nuevo.</div>}
      {layersActive && !placesLoading && !placesError && query.trim().length >= 2 && !places.length && (
        <div className="tn-place-notice">No encontramos lugares turísticos para este destino.</div>
      )}
      {places.length > 0 && (
        <div className="tn-place-results" data-testid="list-tourist-places">
          <div className="tn-place-results-heading">
            <span>Lugares turísticos</span>
            <small>OpenStreetMap</small>
          </div>
          <div className="tn-place-list">
            {places.slice(0, 4).map((place, index) => (
              <button key={place.id} type="button" className="tn-place-item" onClick={() => onPlaceSelect(place)}>
                <span className="tn-place-number">{index + 1}</span>
                <span><strong>{place.name}</strong><small>{place.category}</small></span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="tn-map-source">TravelNow — Descubre lugares, actividades y experiencias</div>
      <div className="tn-map-credit">Mapa: OpenStreetMap</div>
      <button className="tn-ai-fab" type="button" onClick={onOpenAI} data-testid="button-map-ai" aria-label="Abrir asistente de TravelNow">
        <div><Sparkles size={17} strokeWidth={1.7} /><span>Tu viaje,<br />aquí</span><small>asistente</small></div>
      </button>
    </section>
  );
}

function AssistantPanel({ open, onClose, destination, placesReady, places, onPlaceSelect }: { open: boolean; onClose: () => void; destination: string; placesReady: boolean; places: TouristPlace[]; onPlaceSelect: (place: TouristPlace) => void }) {
  const [selected, setSelected] = useState<Preference[]>([]);
  const [recommended, setRecommended] = useState(false);
  const [aiRecommendedPlace, setAiRecommendedPlace] = useState<TouristPlace | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', text: 'Puedo ayudarte a enfocar la búsqueda. Pregúntame por una idea, un ritmo o una forma de explorar.' },
  ]);

  const togglePreference = (preference: Preference) => {
    setRecommended(false);
    setSelected((current) => current.includes(preference) ? current.filter((item) => item !== preference) : [...current, preference]);
  };
  

  const submitChat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', text: trimmed },
      { id: Date.now() + 1, role: 'assistant', text: 'Lo tendré en cuenta. La conexión a destinos y recomendaciones estará disponible en una próxima versión.' },
    ]);
    setChatInput('');
  };

  return (
    <aside className={`tn-panel ${open ? '' : 'is-closed'}`} aria-label="Asistente de TravelNow">
      <div className="tn-panel-header">
        <div>
          <div className="tn-eyebrow">TravelNow / guía inteligente</div>
          <h1>¿Qué quieres hacer?</h1>
          <p>Combina tus ganas de hoy. No necesitas tener el destino decidido.</p>
        </div>
        <button className="tn-mobile-ai-close" type="button" onClick={onClose} data-testid="button-close-ai" aria-label="Cerrar asistente"><X size={17} /></button>
      </div>
      <div className="tn-preferences">
        <p className="tn-section-label">Elige una o varias</p>
        <div className="tn-preference-list">
          {preferences.map((preference) => {
            const isSelected = selected.includes(preference.id);
            return (
              <button
                key={preference.id}
                className={`tn-preference ${isSelected ? 'is-selected' : ''}`}
                type="button"
                onClick={() => togglePreference(preference.id)}
                data-testid={`button-preference-${preference.id}`}
                aria-pressed={isSelected}
              >
                {preference.label}<Check className="tn-preference-check" size={17} />
              </button>
            );
          })}
        </div>
      </div>
      <button className="tn-recommend" type="button" disabled={!selected.length} onClick={() => setRecommended(true)} data-testid="button-recommend">
        Recomiéndame
      </button>
      <p className="tn-recommend-note">Tus preferencias se pueden combinar para afinar la dirección.</p>
      {recommended && (
        <div className="tn-recommendation" data-testid="status-recommendation">
          <strong>{destination ? `Ideas para “${destination}”` : 'Ideas para tu próxima salida'}</strong>
          <span className="tn-demo-label">Vista de demostración · verifica horarios y disponibilidad antes de salir.</span>
          <div className="tn-recommendation-list">
            {selected.map((preference) => (
              <div className="tn-recommendation-card" key={preference}>
                <span>{preferences.find((item) => item.id === preference)?.label}</span>
                <small>{recommendationCopy[preference]}</small>
              </div>
            ))}
            {places.slice(0, 3).map((place) => (
              <div className="tn-recommendation-place" key={place.id}>
                <div>
                  <strong>{place.name}</strong>
                  <small>{place.category}</small>
                </div>
                <button type="button" onClick={() => onPlaceSelect(place)}>Ver en el mapa</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="tn-chat">
        <div className="tn-chat-heading">
          <p className="tn-section-label">Habla con TravelNow</p>
          <span className="tn-chat-state"><i /> vista previa</span>
        </div>
        <div className="tn-chat-messages" aria-live="polite" data-testid="list-chat-messages">
          {messages.map((message) => (
            <div className={`tn-message ${message.role === 'user' ? 'user' : ''}`} key={message.id} data-testid={`message-chat-${message.id}`}>{message.text}</div>
          ))}
        </div>
        <form className="tn-chat-form" onSubmit={submitChat}>
          <MessageCircle size={16} color="#8ba09b" aria-hidden="true" />
          <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} data-testid="input-chat" placeholder="Escribe una pregunta..." aria-label="Pregunta para TravelNow" />
          <button className="tn-chat-send" type="submit" data-testid="button-send-chat" aria-label="Enviar pregunta"><Send size={15} /></button>
        </form>
      </div>
      <div className="tn-capabilities">
        <p className="tn-section-label">Próximamente</p>
        <div className="tn-capability-grid">
          {capabilities.map(({ label, icon: Icon }) => (
            <div className="tn-capability" key={label} data-testid={`status-capability-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon size={17} strokeWidth={1.7} />
               <span>{label}<small>{label === 'Lugares turísticos' && placesReady ? 'OpenStreetMap conectado' : 'No conectado aún'}</small></span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Home() {
  const [query, setQuery] = useState('');
  const [searchedDestination, setSearchedDestination] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [alternativeTiles, setAlternativeTiles] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [layersActive, setLayersActive] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<TouristPlace | null>(null);
  const [aiRecommendedPlace, setAiRecommendedPlace] = useState<TouristPlace | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const placesQuery = searchedDestination.trim();
  const placesRequest = useSearchTouristPlaces(
    { destination: placesQuery, limit: 8 },
    {
      query: {
        queryKey: getSearchTouristPlacesQueryKey({ destination: placesQuery, limit: 8 }),
        enabled: layersActive && placesQuery.length >= 2,
        retry: false,
      },
    },
  );
  const demoPlaces = getDemoPlaces(searchedDestination);
  const livePlaces = placesRequest.data ?? [];
  const demoPlaceIds = new Set(demoPlaces.map((place) => place.name.toLocaleLowerCase()));
  const places = [
    ...demoPlaces,
    ...livePlaces.filter((place) => !demoPlaceIds.has(place.name.toLocaleLowerCase())),
  ].slice(0, 12);

  const handleSearchSubmit = async (value: string) => {
    const nextQuery = value.trim();
    setQuery(nextQuery);
    setSearchError(null);
    setSelectedPlace(null);
    if (nextQuery.length < 2) {
      setSearchError('Escribe al menos dos caracteres para buscar un destino.');
      return;
    }

    setSearchedDestination(nextQuery);
    setLayersActive(true);

    try {
      const destination = await queryClient.fetchQuery({
        queryKey: getGeocodeDestinationQueryKey({ destination: nextQuery }),
        queryFn: () => geocodeDestination({ destination: nextQuery }),
      });
      const center: [number, number] = [destination.latitude, destination.longitude];
      setMapCenter(center);
      setMapZoom(12);
      mapRef.current?.flyTo(center, 12, { duration: 0.8 });
    } catch {
      setSearchError(`No encontramos “${nextQuery}”. Prueba con una ciudad, país o lugar diferente.`);
    }
  };

  const handlePlaceSelect = (place: TouristPlace) => {
    const center: [number, number] = [place.latitude, place.longitude];
    setSelectedPlace(place);
    setMapCenter(center);
    setMapZoom(16);
    mapRef.current?.flyTo(center, 16, { duration: 0.8 });
  };

  const handleLayers = () => {
    setSelectedPlace(null);
    setAlternativeTiles((current) => !current);
    setLayersActive((current) => !current);
  };

  const handleLocation = () => {
    setLocationNote(null);
    if (!navigator.geolocation) {
      setLocationNote('Tu navegador no permite usar la ubicación.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(center);
        setMapCenter(center);
        setMapZoom(15);
        mapRef.current?.flyTo(center, 15, { duration: 0.8 });
        setLocationNote('Mapa centrado en tu ubicación.');
      },
      (error) => {
        setLocationNote(
          error.code === error.PERMISSION_DENIED
            ? 'Permite la ubicación en tu navegador para centrar el mapa.'
            : 'No pudimos obtener tu ubicación. Intenta de nuevo.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <main className="travelnow-app">
      <header className="tn-topbar">
        <div className="tn-brand">
          <div className="tn-brand-mark"><Compass size={19} strokeWidth={2.1} /></div>
          <span className="tn-brand-word">TravelNow</span>
          <span className="tn-brand-note">decide your next now</span>
        </div>
        <div className="tn-top-actions">
          <button className="tn-utility" type="button" onClick={handleLocation} data-testid="button-location" aria-label="Activar ubicación">
            <Navigation size={15} /><span>{locationNote ? 'Ubicación lista' : 'Mi ubicación'}</span>
          </button>
          <button className="tn-utility" type="button" onClick={() => setPanelOpen((current) => !current)} data-testid="button-toggle-ai" aria-label={panelOpen ? 'Cerrar asistente' : 'Abrir asistente'}>
            <PanelRight size={15} /><span>{panelOpen ? 'Ocultar guía' : 'Abrir guía'}</span>
          </button>
        </div>
      </header>
      <div className={`tn-layout ${panelOpen ? '' : 'is-panel-closed'}`}>
         <MapSurface
           query={query}
           onSearch={setQuery}
           onSearchSubmit={handleSearchSubmit}
           layersActive={layersActive}
           onLayers={handleLayers}
           onZoom={(direction) => {
             if (direction === 'in') mapRef.current?.zoomIn();
             else mapRef.current?.zoomOut();
           }}
           onLocate={handleLocation}
           onOpenAI={() => setPanelOpen(true)}
           onPlaceSelect={handlePlaceSelect}
           recommendedPlace={aiRecommendedPlace}
           places={places}
           placesLoading={placesRequest.isLoading}
           placesError={Boolean(placesRequest.error)}
           mapCenter={mapCenter}
           mapZoom={mapZoom}
           userLocation={userLocation}
           alternativeTiles={alternativeTiles}
           onMapReady={(map) => { mapRef.current = map; }}
           onMapMove={setMapCenter}
           onMapZoom={setMapZoom}
           locationNote={locationNote}
           searchError={searchError}
         />
         {selectedPlace && (
           <div className="tn-place-detail" data-testid="status-selected-place">
             <button type="button" onClick={() => setSelectedPlace(null)} aria-label="Cerrar detalle del lugar"><X size={15} /></button>
             <span className="tn-section-label">Lugar turístico</span>
             <strong>{selectedPlace.name}</strong>
             <small>{selectedPlace.category}{selectedPlace.address ? ` · ${selectedPlace.address}` : ''}</small>
             <em>Fuente: {selectedPlace.source}</em>
           </div>
         )}
         <AssistantPanel open={panelOpen} onClose={() => setPanelOpen(false)} destination={searchedDestination || query} placesReady={places.length > 0} places={places} onPlaceSelect={handlePlaceSelect} />
      </div>
       <span className="sr-only" data-testid="status-map-zoom">Nivel de mapa: {mapZoom.toFixed(1)}</span>
    </main>
  );
}

function Router() {
  return (
    <ErrorBoundary resetKey={useLocation()[0]}>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;import { type FormEvent, useRef, useState } from 'react';
import { geocodeDestination, getGeocodeDestinationQueryKey, getSearchTouristPlacesQueryKey, useSearchTouristPlaces, type TouristPlace } from '@workspace/api-client-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type Map as LeafletMap } from 'leaflet';
import { Compass, LocateFixed, MapPin, Minus, Navigation, PanelRight, Plus, Route as RouteIcon, Search, Send, Sparkles, Utensils, X, Layers3, CalendarDays, CloudSun, Trees, Check, MessageCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { TravelMap } from '@/components/travel-map';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type Preference = 'culture' | 'food' | 'nature';
type ChatMessage = { id: number; role: 'assistant' | 'user'; text: string };

const preferences: { id: Preference; label: string }[] = [
  { id: 'culture', label: '🏛️ Cultura y turismo' },
  { id: 'food', label: '🍽️ Gastronomía y entretenimiento' },
  { id: 'nature', label: '🌳 Naturaleza y aventura' },
];

const capabilities = [
  { label: 'GPS y ubicación', icon: LocateFixed },
  { label: 'Eventos en tiempo real', icon: CalendarDays },
  { label: 'Restaurantes', icon: Utensils },
  { label: 'Lugares turísticos', icon: MapPin },
  { label: 'Clima local', icon: CloudSun },
  { label: 'Rutas', icon: RouteIcon },
];

const demoPlacesByCity: Record<string, TouristPlace[]> = {
  bogota: [
    { id: 'demo-bogota-oro', name: 'Museo del Oro', category: 'Museo', latitude: 4.6017, longitude: -74.0721, address: 'Centro de Bogotá', source: 'TravelNow demo' },
    { id: 'demo-bogota-monserrate', name: 'Monserrate', category: 'Mirador', latitude: 4.6058, longitude: -74.0551, address: 'Bogotá', source: 'TravelNow demo' },
    { id: 'demo-bogota-bolivar', name: 'Plaza de Bolívar', category: 'Plaza histórica', latitude: 4.5981, longitude: -74.0758, address: 'La Candelaria, Bogotá', source: 'TravelNow demo' },
  ],
  cartagena: [
    { id: 'demo-cartagena-castillo', name: 'Castillo de San Felipe de Barajas', category: 'Fortaleza histórica', latitude: 10.4236, longitude: -75.5372, address: 'Cartagena de Indias', source: 'TravelNow demo' },
    { id: 'demo-cartagena-murallas', name: 'Ciudad Amurallada', category: 'Centro histórico', latitude: 10.4236, longitude: -75.5481, address: 'Cartagena de Indias', source: 'TravelNow demo' },
    { id: 'demo-cartagena-getsemani', name: 'Getsemaní', category: 'Barrio cultural', latitude: 10.4229, longitude: -75.5452, address: 'Cartagena de Indias', source: 'TravelNow demo' },
  ],
  medellin: [
    { id: 'demo-medellin-botero', name: 'Plaza Botero', category: 'Arte público', latitude: 6.2518, longitude: -75.5684, address: 'Medellín', source: 'TravelNow demo' },
    { id: 'demo-medellin-antioquia', name: 'Museo de Antioquia', category: 'Museo', latitude: 6.2521, longitude: -75.5692, address: 'Medellín', source: 'TravelNow demo' },
    { id: 'demo-medellin-arvi', name: 'Parque Arví', category: 'Naturaleza', latitude: 6.2828, longitude: -75.5023, address: 'Medellín', source: 'TravelNow demo' },
  ],
  paris: [
    { id: 'demo-paris-eiffel', name: 'Torre Eiffel', category: 'Monumento', latitude: 48.8584, longitude: 2.2945, address: 'París', source: 'TravelNow demo' },
    { id: 'demo-paris-louvre', name: 'Museo del Louvre', category: 'Museo', latitude: 48.8606, longitude: 2.3376, address: 'París', source: 'TravelNow demo' },
    { id: 'demo-paris-notredame', name: 'Catedral de Notre-Dame', category: 'Arquitectura histórica', latitude: 48.853, longitude: 2.3499, address: 'París', source: 'TravelNow demo' },
  ],
  'nueva york': [
    { id: 'demo-ny-liberty', name: 'Estatua de la Libertad', category: 'Monumento', latitude: 40.6892, longitude: -74.0445, address: 'Nueva York', source: 'TravelNow demo' },
    { id: 'demo-ny-central', name: 'Central Park', category: 'Parque urbano', latitude: 40.7851, longitude: -73.9683, address: 'Nueva York', source: 'TravelNow demo' },
    { id: 'demo-ny-times', name: 'Times Square', category: 'Plaza urbana', latitude: 40.758, longitude: -73.9855, address: 'Nueva York', source: 'TravelNow demo' },
  ],
  madrid: [
    { id: 'demo-madrid-prado', name: 'Museo del Prado', category: 'Museo', latitude: 40.4138, longitude: -3.6921, address: 'Madrid', source: 'TravelNow demo' },
    { id: 'demo-madrid-retiro', name: 'Parque del Retiro', category: 'Parque urbano', latitude: 40.4153, longitude: -3.6844, address: 'Madrid', source: 'TravelNow demo' },
    { id: 'demo-madrid-palace', name: 'Palacio Real de Madrid', category: 'Palacio histórico', latitude: 40.4179, longitude: -3.7143, address: 'Madrid', source: 'TravelNow demo' },
  ],
  roma: [
    { id: 'demo-roma-colosseum', name: 'Coliseo', category: 'Monumento histórico', latitude: 41.8902, longitude: 12.4922, address: 'Roma', source: 'TravelNow demo' },
    { id: 'demo-roma-trevi', name: 'Fontana di Trevi', category: 'Fuente histórica', latitude: 41.9009, longitude: 12.4833, address: 'Roma', source: 'TravelNow demo' },
    { id: 'demo-roma-vatican', name: 'Ciudad del Vaticano', category: 'Patrimonio cultural', latitude: 41.9029, longitude: 12.4534, address: 'Roma', source: 'TravelNow demo' },
  ],
  tokio: [
    { id: 'demo-tokyo-sensoji', name: 'Templo Sensō-ji', category: 'Templo histórico', latitude: 35.7148, longitude: 139.7967, address: 'Tokio', source: 'TravelNow demo' },
    { id: 'demo-tokyo-tower', name: 'Tokyo Tower', category: 'Mirador', latitude: 35.6586, longitude: 139.7454, address: 'Tokio', source: 'TravelNow demo' },
    { id: 'demo-tokyo-meiji', name: 'Santuario Meiji', category: 'Santuario', latitude: 35.6764, longitude: 139.6993, address: 'Tokio', source: 'TravelNow demo' },
  ],
};

const recommendationCopy: Record<Preference, string> = {
  culture: 'Una ruta para descubrir historia, arte y arquitectura.',
  food: 'Una ruta para explorar sabores, barrios y planes para la tarde.',
  nature: 'Una ruta para salir, respirar y moverte al aire libre.',
};

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

function getDemoPlaces(destination: string) {
  const normalizedDestination = normalizeSearch(destination);
  const city = Object.keys(demoPlacesByCity).find((key) => normalizedDestination.includes(key));
  return city ? demoPlacesByCity[city] : [];
}

type MapSurfaceProps = {
  query: string;
  onSearch: (value: string) => void;
  onSearchSubmit: (value: string) => void;
  onZoom: (direction: 'in' | 'out') => void;
  onLocate: () => void;
  onOpenAI: () => void;
  onLayers: () => void;
  onPlaceSelect: (place: TouristPlace) => void;
  recommendedPlace: TouristPlace | null;
  layersActive: boolean;
  places: TouristPlace[];
  placesLoading: boolean;
  placesError: boolean;
  mapCenter: [number, number];
  mapZoom: number;
  userLocation: [number, number] | null;
  alternativeTiles: boolean;
  onMapReady: (map: LeafletMap) => void;
  onMapMove: (center: [number, number]) => void;
  onMapZoom: (zoom: number) => void;
  locationNote: string | null;
  searchError: string | null;
};

  function MapSurface({ query, onSearch, onSearchSubmit, onZoom, onLocate, onOpenAI, onLayers, onPlaceSelect, recommendedPlace, layersActive, places, placesLoading, placesError, mapCenter, mapZoom, userLocation, alternativeTiles, onMapReady, onMapMove, onMapZoom, locationNote, searchError }: MapSurfaceProps) {
  return (
    <section className="tn-map-stage" aria-label="Superficie del mapa">
      <TravelMap
        center={mapCenter}
        zoom={mapZoom}
        places={places}
        recommendedPlace={recommendedPlace}
        userLocation={userLocation}
        alternativeTiles={alternativeTiles}
        onReady={onMapReady}
        onSelectPlace={onPlaceSelect}
        onMove={onMapMove}
        onZoom={onMapZoom}
      />
      <div className="tn-map-status" data-testid="status-map-connection">
        <i className="tn-pulse" />
        {placesLoading
          ? 'Buscando lugares turísticos…'
          : layersActive && places.length
            ? `${places.length} lugares turísticos encontrados`
            : layersActive
              ? 'Capa turística · busca un destino'
              : 'Mapa base · sin datos conectados'}
      </div>
      {locationNote && <div className="tn-location-note" data-testid="status-location">{locationNote}</div>}
      {searchError && <div className="tn-place-notice is-error tn-search-error" data-testid="status-search-error">{searchError}</div>}
      <form className="tn-search-wrap" onSubmit={(event) => { event.preventDefault(); onSearchSubmit(query); }}>
        <label className="tn-search" htmlFor="destination-search">
          <Search size={19} strokeWidth={1.8} aria-hidden="true" />
          <input
            id="destination-search"
            data-testid="input-destination-search"
            type="search"
            value={query}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Busca un país, ciudad o lugar"
            aria-label="Busca un país, ciudad o lugar"
          />
          {query && <X size={16} color="#86a09d" aria-hidden="true" />}
        </label>
        {query && (
          <div className="tn-search-result" data-testid="status-search-result">
            Pulsa Enter para mostrar lugares turísticos reales cerca de “{query}”.
          </div>
        )}
      </form>
      <div className="tn-map-tools" aria-label="Controles del mapa">
        <button className="tn-map-tool" type="button" onClick={() => onZoom('in')} data-testid="button-map-zoom-in" aria-label="Acercar mapa"><Plus size={17} /></button>
        <button className="tn-map-tool" type="button" onClick={() => onZoom('out')} data-testid="button-map-zoom-out" aria-label="Alejar mapa"><Minus size={17} /></button>
        <button className="tn-map-tool" type="button" onClick={onLocate} data-testid="button-map-locate" aria-label="Usar ubicación actual"><LocateFixed size={17} /></button>
        <button className={`tn-map-tool ${layersActive ? 'is-active' : ''}`} type="button" onClick={onLayers} data-testid="button-map-layers" aria-label="Mostrar lugares turísticos"><Layers3 size={17} /></button>
      </div>
      {placesLoading && <div className="tn-place-notice">Consultando datos reales de OpenStreetMap…</div>}
      {placesError && <div className="tn-place-notice is-error">No pudimos cargar los lugares. Intenta de nuevo.</div>}
      {layersActive && !placesLoading && !placesError && query.trim().length >= 2 && !places.length && (
        <div className="tn-place-notice">No encontramos lugares turísticos para este destino.</div>
      )}
      {places.length > 0 && (
        <div className="tn-place-results" data-testid="list-tourist-places">
          <div className="tn-place-results-heading">
            <span>Lugares turísticos</span>
            <small>OpenStreetMap</small>
          </div>
          <div className="tn-place-list">
            {places.slice(0, 4).map((place, index) => (
              <button key={place.id} type="button" className="tn-place-item" onClick={() => onPlaceSelect(place)}>
                <span className="tn-place-number">{index + 1}</span>
                <span><strong>{place.name}</strong><small>{place.category}</small></span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="tn-map-source">TravelNow — Descubre lugares, actividades y experiencias</div>
      <div className="tn-map-credit">Mapa: OpenStreetMap</div>
      <button className="tn-ai-fab" type="button" onClick={onOpenAI} data-testid="button-map-ai" aria-label="Abrir asistente de TravelNow">
        <div><Sparkles size={17} strokeWidth={1.7} /><span>Tu viaje,<br />aquí</span><small>asistente</small></div>
      </button>
    </section>
  );
}

function AssistantPanel({ open, onClose, destination, placesReady, places, onPlaceSelect }: { open: boolean; onClose: () => void; destination: string; placesReady: boolean; places: TouristPlace[]; onPlaceSelect: (place: TouristPlace) => void }) {
  const [selected, setSelected] = useState<Preference[]>([]);
  const [recommended, setRecommended] = useState(false);
  const [aiRecommendedPlace, setAiRecommendedPlace] = useState<TouristPlace | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', text: 'Puedo ayudarte a enfocar la búsqueda. Pregúntame por una idea, un ritmo o una forma de explorar.' },
  ]);

  const togglePreference = (preference: Preference) => {
    setRecommended(false);
    setSelected((current) => current.includes(preference) ? current.filter((item) => item !== preference) : [...current, preference]);
  };
  

  const submitChat = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', text: trimmed },
      { id: Date.now() + 1, role: 'assistant', text: 'Lo tendré en cuenta. La conexión a destinos y recomendaciones estará disponible en una próxima versión.' },
    ]);
    setChatInput('');
  };

  return (
    <aside className={`tn-panel ${open ? '' : 'is-closed'}`} aria-label="Asistente de TravelNow">
      <div className="tn-panel-header">
        <div>
          <div className="tn-eyebrow">TravelNow / guía inteligente</div>
          <h1>¿Qué quieres hacer?</h1>
          <p>Combina tus ganas de hoy. No necesitas tener el destino decidido.</p>
        </div>
        <button className="tn-mobile-ai-close" type="button" onClick={onClose} data-testid="button-close-ai" aria-label="Cerrar asistente"><X size={17} /></button>
      </div>
      <div className="tn-preferences">
        <p className="tn-section-label">Elige una o varias</p>
        <div className="tn-preference-list">
          {preferences.map((preference) => {
            const isSelected = selected.includes(preference.id);
            return (
              <button
                key={preference.id}
                className={`tn-preference ${isSelected ? 'is-selected' : ''}`}
                type="button"
                onClick={() => togglePreference(preference.id)}
                data-testid={`button-preference-${preference.id}`}
                aria-pressed={isSelected}
              >
                {preference.label}<Check className="tn-preference-check" size={17} />
              </button>
            );
          })}
        </div>
      </div>
      <button className="tn-recommend" type="button" disabled={!selected.length} onClick={() => setRecommended(true)} data-testid="button-recommend">
        Recomiéndame
      </button>
      <p className="tn-recommend-note">Tus preferencias se pueden combinar para afinar la dirección.</p>
      {recommended && (
        <div className="tn-recommendation" data-testid="status-recommendation">
          <strong>{destination ? `Ideas para “${destination}”` : 'Ideas para tu próxima salida'}</strong>
          <span className="tn-demo-label">Vista de demostración · verifica horarios y disponibilidad antes de salir.</span>
          <div className="tn-recommendation-list">
            {selected.map((preference) => (
              <div className="tn-recommendation-card" key={preference}>
                <span>{preferences.find((item) => item.id === preference)?.label}</span>
                <small>{recommendationCopy[preference]}</small>
              </div>
            ))}
            {places.slice(0, 3).map((place) => (
              <div className="tn-recommendation-place" key={place.id}>
                <div>
                  <strong>{place.name}</strong>
                  <small>{place.category}</small>
                </div>
                <button type="button" onClick={() => onPlaceSelect(place)}>Ver en el mapa</button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="tn-chat">
        <div className="tn-chat-heading">
          <p className="tn-section-label">Habla con TravelNow</p>
          <span className="tn-chat-state"><i /> vista previa</span>
        </div>
        <div className="tn-chat-messages" aria-live="polite" data-testid="list-chat-messages">
          {messages.map((message) => (
            <div className={`tn-message ${message.role === 'user' ? 'user' : ''}`} key={message.id} data-testid={`message-chat-${message.id}`}>{message.text}</div>
          ))}
        </div>
        <form className="tn-chat-form" onSubmit={submitChat}>
          <MessageCircle size={16} color="#8ba09b" aria-hidden="true" />
          <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} data-testid="input-chat" placeholder="Escribe una pregunta..." aria-label="Pregunta para TravelNow" />
          <button className="tn-chat-send" type="submit" data-testid="button-send-chat" aria-label="Enviar pregunta"><Send size={15} /></button>
        </form>
      </div>
      <div className="tn-capabilities">
        <p className="tn-section-label">Próximamente</p>
        <div className="tn-capability-grid">
          {capabilities.map(({ label, icon: Icon }) => (
            <div className="tn-capability" key={label} data-testid={`status-capability-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon size={17} strokeWidth={1.7} />
               <span>{label}<small>{label === 'Lugares turísticos' && placesReady ? 'OpenStreetMap conectado' : 'No conectado aún'}</small></span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Home() {
  const [query, setQuery] = useState('');
  const [searchedDestination, setSearchedDestination] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [alternativeTiles, setAlternativeTiles] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [layersActive, setLayersActive] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<TouristPlace | null>(null);
  const [aiRecommendedPlace, setAiRecommendedPlace] = useState<TouristPlace | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const placesQuery = searchedDestination.trim();
  const placesRequest = useSearchTouristPlaces(
    { destination: placesQuery, limit: 8 },
    {
      query: {
        queryKey: getSearchTouristPlacesQueryKey({ destination: placesQuery, limit: 8 }),
        enabled: layersActive && placesQuery.length >= 2,
        retry: false,
      },
    },
  );
  const demoPlaces = getDemoPlaces(searchedDestination);
  const livePlaces = placesRequest.data ?? [];
  const demoPlaceIds = new Set(demoPlaces.map((place) => place.name.toLocaleLowerCase()));
  const places = [
    ...demoPlaces,
    ...livePlaces.filter((place) => !demoPlaceIds.has(place.name.toLocaleLowerCase())),
  ].slice(0, 12);

  const handleSearchSubmit = async (value: string) => {
    const nextQuery = value.trim();
    setQuery(nextQuery);
    setSearchError(null);
    setSelectedPlace(null);
    if (nextQuery.length < 2) {
      setSearchError('Escribe al menos dos caracteres para buscar un destino.');
      return;
    }

    setSearchedDestination(nextQuery);
    setLayersActive(true);

    try {
      const destination = await queryClient.fetchQuery({
        queryKey: getGeocodeDestinationQueryKey({ destination: nextQuery }),
        queryFn: () => geocodeDestination({ destination: nextQuery }),
      });
      const center: [number, number] = [destination.latitude, destination.longitude];
      setMapCenter(center);
      setMapZoom(12);
      mapRef.current?.flyTo(center, 12, { duration: 0.8 });
    } catch {
      setSearchError(`No encontramos “${nextQuery}”. Prueba con una ciudad, país o lugar diferente.`);
    }
  };

  const handlePlaceSelect = (place: TouristPlace) => {
    const center: [number, number] = [place.latitude, place.longitude];
    setSelectedPlace(place);
    setMapCenter(center);
    setMapZoom(16);
    mapRef.current?.flyTo(center, 16, { duration: 0.8 });
  };

  const handleLayers = () => {
    setSelectedPlace(null);
    setAlternativeTiles((current) => !current);
    setLayersActive((current) => !current);
  };

  const handleLocation = () => {
    setLocationNote(null);
    if (!navigator.geolocation) {
      setLocationNote('Tu navegador no permite usar la ubicación.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const center: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(center);
        setMapCenter(center);
        setMapZoom(15);
        mapRef.current?.flyTo(center, 15, { duration: 0.8 });
        setLocationNote('Mapa centrado en tu ubicación.');
      },
      (error) => {
        setLocationNote(
          error.code === error.PERMISSION_DENIED
            ? 'Permite la ubicación en tu navegador para centrar el mapa.'
            : 'No pudimos obtener tu ubicación. Intenta de nuevo.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <main className="travelnow-app">
      <header className="tn-topbar">
        <div className="tn-brand">
          <div className="tn-brand-mark"><Compass size={19} strokeWidth={2.1} /></div>
          <span className="tn-brand-word">TravelNow</span>
          <span className="tn-brand-note">decide your next now</span>
        </div>
        <div className="tn-top-actions">
          <button className="tn-utility" type="button" onClick={handleLocation} data-testid="button-location" aria-label="Activar ubicación">
            <Navigation size={15} /><span>{locationNote ? 'Ubicación lista' : 'Mi ubicación'}</span>
          </button>
          <button className="tn-utility" type="button" onClick={() => setPanelOpen((current) => !current)} data-testid="button-toggle-ai" aria-label={panelOpen ? 'Cerrar asistente' : 'Abrir asistente'}>
            <PanelRight size={15} /><span>{panelOpen ? 'Ocultar guía' : 'Abrir guía'}</span>
          </button>
        </div>
      </header>
      <div className={`tn-layout ${panelOpen ? '' : 'is-panel-closed'}`}>
         <MapSurface
           query={query}
           onSearch={setQuery}
           onSearchSubmit={handleSearchSubmit}
           layersActive={layersActive}
           onLayers={handleLayers}
           onZoom={(direction) => {
             if (direction === 'in') mapRef.current?.zoomIn();
             else mapRef.current?.zoomOut();
           }}
           onLocate={handleLocation}
           onOpenAI={() => setPanelOpen(true)}
           onPlaceSelect={handlePlaceSelect}
           recommendedPlace={aiRecommendedPlace}
           places={places}
           placesLoading={placesRequest.isLoading}
           placesError={Boolean(placesRequest.error)}
           mapCenter={mapCenter}
           mapZoom={mapZoom}
           userLocation={userLocation}
           alternativeTiles={alternativeTiles}
           onMapReady={(map) => { mapRef.current = map; }}
           onMapMove={setMapCenter}
           onMapZoom={setMapZoom}
           locationNote={locationNote}
           searchError={searchError}
         />
         {selectedPlace && (
           <div className="tn-place-detail" data-testid="status-selected-place">
             <button type="button" onClick={() => setSelectedPlace(null)} aria-label="Cerrar detalle del lugar"><X size={15} /></button>
             <span className="tn-section-label">Lugar turístico</span>
             <strong>{selectedPlace.name}</strong>
             <small>{selectedPlace.category}{selectedPlace.address ? ` · ${selectedPlace.address}` : ''}</small>
             <em>Fuente: {selectedPlace.source}</em>
           </div>
         )}
         <AssistantPanel open={panelOpen} onClose={() => setPanelOpen(false)} destination={searchedDestination || query} placesReady={places.length > 0} places={places} onPlaceSelect={handlePlaceSelect} />
      </div>
       <span className="sr-only" data-testid="status-map-zoom">Nivel de mapa: {mapZoom.toFixed(1)}</span>
    </main>
  );
}

function Router() {
  return (
    <ErrorBoundary resetKey={useLocation()[0]}>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;