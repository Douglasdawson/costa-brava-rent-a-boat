import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { BoatRoute } from "@shared/routesData";
import { BLANES_PORT } from "@shared/routesData";
import { useLanguage } from "@/hooks/use-language";

// Fix default marker icon issue with webpack/vite
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface RouteMapProps {
  routes: BoatRoute[];
  selectedRouteId: string | null;
  onRouteSelect: (id: string) => void;
}

function FitBoundsToRoute({ route }: { route: BoatRoute | null }) {
  const map = useMap();

  useEffect(() => {
    if (route) {
      const bounds = L.latLngBounds(
        route.coordinates.map((c) => [c.lat, c.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([BLANES_PORT.lat, BLANES_PORT.lng], 12);
    }
  }, [route, map]);

  return null;
}

export default function RouteMap({ routes, selectedRouteId, onRouteSelect }: RouteMapProps) {
  const { language } = useLanguage();
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || null;

  return (
    <MapContainer
      center={[BLANES_PORT.lat, BLANES_PORT.lng]}
      zoom={12}
      className="w-full h-[400px] sm:h-[500px] rounded-lg z-0"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBoundsToRoute route={selectedRoute} />

      {/* Port marker */}
      <Marker position={[BLANES_PORT.lat, BLANES_PORT.lng]}>
        <Popup>
          <strong>Puerto de Blanes</strong>
          <br />
          Punto de salida
        </Popup>
      </Marker>

      {/* Route polylines */}
      {routes.map((route) => {
        const isSelected = route.id === selectedRouteId;
        const desc = route.descriptions[language] || route.descriptions.es;
        const positions = route.coordinates.map(
          (c) => [c.lat, c.lng] as [number, number]
        );

        return (
          <Polyline
            key={route.id}
            positions={positions}
            pathOptions={{
              color: route.color,
              weight: isSelected ? 5 : 3,
              opacity: isSelected ? 1 : selectedRouteId ? 0.3 : 0.7,
            }}
            eventHandlers={{
              click: () => onRouteSelect(route.id),
            }}
          >
            <Popup>
              <strong>{desc.name}</strong>
              <br />
              {route.distance} - {route.estimatedTime}
            </Popup>
          </Polyline>
        );
      })}

      {/* End point marker for selected route */}
      {selectedRoute && selectedRoute.coordinates.length > 1 && (
        <Marker
          position={[
            selectedRoute.coordinates[selectedRoute.coordinates.length - 1].lat,
            selectedRoute.coordinates[selectedRoute.coordinates.length - 1].lng,
          ]}
        >
          <Popup>
            <strong>
              {(selectedRoute.descriptions[language] || selectedRoute.descriptions.es).name}
            </strong>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
