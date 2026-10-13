import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const Marker = ({ coordinate, onPress, pinColor = '#0f6b4b', title }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        padding: 6,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: pinColor,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        margin: 4,
      }}
    >
      <MaterialCommunityIcons name="solar-power" size={18} color={pinColor} />
      {title && (
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#1a1a2e', marginTop: 2 }}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export const Callout = ({ children }) => <>{children}</>;

const MapView = ({ style, region, initialRegion, children, showsUserLocation, showListingOverlay = true }) => {
  const mapRegion = region ?? initialRegion;
  const lat = mapRegion?.latitude ?? 6.9271;
  const lon = mapRegion?.longitude ?? 79.8612;
  const halfWidth = (mapRegion?.longitudeDelta ?? 0.1) / 2;
  const halfHeight = (mapRegion?.latitudeDelta ?? 0.06) / 2;

  // OpenStreetMap embed URL for web view
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - halfWidth}%2C${lat - halfHeight}%2C${lon + halfWidth}%2C${lat + halfHeight}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <View
      style={[
        {
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#e5e7eb',
          borderRadius: 12,
        },
        style,
      ]}
    >
      {/* Interactive OpenStreetMap Iframe on Web */}
      <iframe
        title="OpenStreetMap"
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight="0"
        marginWidth="0"
        src={osmUrl}
        style={{
          border: 0,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.85,
        }}
      />

      {/* Overlay with listing pin markers */}
      {showListingOverlay && <View
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          right: 10,
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderRadius: 12,
          padding: 8,
          borderWidth: 1,
          borderColor: '#e2e8f0',
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#0f6b4b', width: '100%', textAlign: 'center', marginBottom: 4 }}>
          📍 Tap a community seller below:
        </Text>
        {children}
      </View>}
    </View>
  );
};

export default MapView;
