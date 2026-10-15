"use client";

import React, { useEffect, useRef, useState } from "react";

interface LeafletMapProps {
  polygonCoordinates?: [number, number][]; // [longitude, latitude]
  polygonLabel?: string;
  polygonDetails?: string;
  markerPosition?: [number, number]; // [longitude, latitude]
  accuracyMeters?: number;
  height?: string;
  zoom?: number;
  interactive?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  polygonCoordinates,
  polygonLabel,
  polygonDetails,
  markerPosition,
  accuracyMeters = 10,
  height = "360px",
  zoom = 15,
  interactive = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [tileError, setTileError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    let mounted = true;

    // Load Leaflet dynamically on client-side only
    import("leaflet").then((L) => {
      if (!mounted || !mapContainerRef.current) return;

      // Clean up previous instance if exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Default center: Ea Yông, Krông Pắc, Đắk Lắk
      const defaultCenter: [number, number] = [12.6789, 108.1234];
      const centerLat = markerPosition ? markerPosition[1] : polygonCoordinates?.[0] ? polygonCoordinates[0][1] : defaultCenter[0];
      const centerLng = markerPosition ? markerPosition[0] : polygonCoordinates?.[0] ? polygonCoordinates[0][0] : defaultCenter[1];

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: false
      });
      mapInstanceRef.current = map;

      // OpenStreetMap Tile Layer with fallback listener
      const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      });

      tileLayer.on("tileerror", () => {
        if (mounted) setTileError(true);
      });

      tileLayer.addTo(map);

      // Draw Polygon if coordinates provided
      let polyLayer: any = null;
      if (polygonCoordinates && polygonCoordinates.length >= 3) {
        // Leaflet expects [latitude, longitude]
        const latLngs = polygonCoordinates.map((coord) => [coord[1], coord[0]] as [number, number]);
        polyLayer = L.polygon(latLngs, {
          color: "#0D4E35",
          weight: 3,
          fillColor: "#165D40",
          fillOpacity: 0.25,
          dashArray: "4, 4"
        }).addTo(map);
        if (polygonLabel) {
          polyLayer.bindPopup(`<strong>${polygonLabel}</strong>${polygonDetails ? `<br>${polygonDetails}` : ""}`);
        }
      }

      // Draw Marker if position provided
      if (markerPosition) {
        const markerLatLng: [number, number] = [markerPosition[1], markerPosition[0]];
        const customIcon = L.divIcon({
          className: "bats-map-pin",
          html: `<div style="background-color: #C44745; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        L.marker(markerLatLng, { icon: customIcon })
          .bindPopup(`<b>Vị trí GPS ghi nhận</b><br>Tọa độ: ${markerPosition[1].toFixed(6)}, ${markerPosition[0].toFixed(6)}<br>Độ chính xác: ±${accuracyMeters}m`)
          .addTo(map);

        L.circle(markerLatLng, {
          radius: accuracyMeters,
          color: "#2775D6",
          weight: 1,
          fillColor: "#2775D6",
          fillOpacity: 0.15
        }).addTo(map);
      }

      // Fit bounds if polygon exists
      if (polyLayer) {
        map.fitBounds(polyLayer.getBounds(), { padding: [24, 24] });
      }
    });

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, polygonCoordinates, polygonLabel, polygonDetails, markerPosition, accuracyMeters, zoom, interactive]);

  if (!isClient) {
    return (
      <div style={{ height, backgroundColor: "#F3F4EE", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px", border: "1px solid #E2E8DF", color: "#68766C" }}>
        <span>Đang khởi tạo bản đồ số BATS...</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: "12px", overflow: "hidden", border: "1px solid #E2E8DF" }}>
      {/* Leaflet CSS inline import */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {tileError && (
        <div style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          backgroundColor: "#FFF6E6",
          border: "1px solid #A76B10",
          color: "#A76B10",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          zIndex: 1000,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
        }}>
          ⚠️ Máy chủ bản đồ ngoài tuyến (Offline / Tile fallback active) — Polygon và Marker vẫn hiển thị chính xác.
        </div>
      )}
    </div>
  );
};
