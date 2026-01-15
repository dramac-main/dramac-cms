"use client";

import { useNode } from "@craftjs/core";
import { MapSettings } from "../settings/map-settings";
import { MapPin } from "lucide-react";

interface MapProps {
  address?: string;
  zoom?: number;
  height?: number;
  style?: "roadmap" | "satellite";
}

export function Map({
  address = "",
  zoom = 14,
  height = 400,
  style = "roadmap",
}: MapProps) {
  const { connectors: { connect, drag } } = useNode();

  if (!address) {
    return (
      <div
        ref={(ref) => { if (ref) connect(drag(ref)); }}
        style={{
          height: `${height}px`,
          backgroundColor: "#e5e7eb",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
        }}
      >
        <MapPin style={{ width: "48px", height: "48px", marginBottom: "8px" }} />
        <span>Add an address to display a map</span>
      </div>
    );
  }

  // Use OpenStreetMap embed (free, no API key required)
  const encodedAddress = encodeURIComponent(address);
  const _mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-0.1,-0.1,0.1,0.1&layer=${style === "satellite" ? "hot" : "mapnik"}&marker=51.5,-0.1`;
  
  // Alternative: Use Google Maps embed (requires address geocoding)
  const googleMapsUrl = `https://maps.google.com/maps?q=${encodedAddress}&z=${zoom}&output=embed`;

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        height: `${height}px`,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <iframe
        src={googleMapsUrl}
        width="100%"
        height="100%"
        style={{ border: "none" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Map of ${address}`}
      />
    </div>
  );
}

Map.craft = {
  displayName: "Map",
  props: {
    address: "",
    zoom: 14,
    height: 400,
    style: "roadmap",
  },
  related: {
    settings: MapSettings,
  },
};
