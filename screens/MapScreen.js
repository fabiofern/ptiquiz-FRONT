import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);

  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(true);
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#009EBA" />
        <Text style={styles.loaderText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (locationError || !userLocation) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorMessage}>
          Autorisation de géolocalisation refusée ou indisponible.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={userLocation} />
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#85CAE4",
  },
  loaderText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: "#FF6347",
    textAlign: "center",
    padding: 20,
  },
});
