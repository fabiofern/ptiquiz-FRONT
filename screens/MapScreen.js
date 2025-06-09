import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Image, TouchableOpacity } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../redux/userSlice';

export default function MapScreen() {
  const URL = process.env.EXPO_PUBLIC_BACKEND_URL
  const dispatch = useDispatch();
  const { userData, isLoggedIn } = useSelector((state) => state.user);

  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [quizLocations, setQuizLocations] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);

  const mapRef = useRef(null);
  const hasLocationPermission = userData?.locationPermissions?.foreground;

  // États possibles d'un quiz
  const QUIZ_STATES = {
    LOCKED: 'locked',
    UNLOCKED: 'unlocked',
    COMPLETED: 'completed',
    PERFECT: 'perfect'
  };

  // 🆕 Fonction pour récupérer les quiz depuis l'API
  const fetchQuizFromAPI = async () => {
    try {
      setApiLoading(true);
      console.log('📡 Récupération des quiz depuis l\'API...');

      // ⚠️ REMPLACE PAR TON IP !
      const response = await fetch(`${URL}/quizz`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.result && data.quiz) {
        setQuizLocations(data.quiz);
        console.log(`📍 ${data.quiz.length} quiz chargés depuis l'API`);
      } else {
        console.log('❌ Aucun quiz trouvé dans l\'API');
      }
    } catch (error) {
      console.error('❌ Erreur récupération quiz API:', error);
    } finally {
      setApiLoading(false);
    }
  };


  const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {// Haversine formula to calculate distance between two coordinates
    const R = 6371e3;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 🎯 UNE SEULE fonction getQuizState
  const getQuizState = (quiz) => {
    if (!userLocation) return QUIZ_STATES.LOCKED;

    const quizId = quiz._id;
    const completedQuiz = userData?.completedQuizzes?.[quizId];

    if (completedQuiz) {
      return completedQuiz.score === quiz.totalPoints ? QUIZ_STATES.PERFECT : QUIZ_STATES.COMPLETED;
    }

    // Utiliser SEULEMENT les données de Redux (qui viennent de l'API)
    const isUnlocked = userData?.unlockedQuizzes?.includes(quizId);
    return isUnlocked ? QUIZ_STATES.UNLOCKED : QUIZ_STATES.LOCKED;
  };

  const getPinColor = (state) => {
    switch (state) {
      case QUIZ_STATES.LOCKED: return '#FF6B6B';
      case QUIZ_STATES.UNLOCKED: return '#FFD93D';
      case QUIZ_STATES.COMPLETED: return '#6BCF7F';
      case QUIZ_STATES.PERFECT: return '#4ECDC4';
      default: return '#FF6B6B';
    }
  };

  const getMarkerColor = (quiz) => {
    const state = getQuizState(quiz);
    return getPinColor(state);
  };

  const isQuizUnlocked = (quiz) => {
    const state = getQuizState(quiz);
    return state === QUIZ_STATES.UNLOCKED || state === QUIZ_STATES.COMPLETED || state === QUIZ_STATES.PERFECT;
  };

  const getStateDescription = (state) => {
    switch (state) {
      case QUIZ_STATES.LOCKED: return "🔒 Quiz verrouillé - Approche-toi !";
      case QUIZ_STATES.UNLOCKED: return "🟡 Quiz débloqué - À toi de jouer !";
      case QUIZ_STATES.COMPLETED: return "🔵 Quiz terminé - Bonne tentative !";
      case QUIZ_STATES.PERFECT: return "🟢 Quiz parfait - Félicitations !";
      default: return "🔒 Quiz verrouillé";
    }
  };

  const handleQuizPress = (quiz) => {
    const state = getQuizState(quiz);

    if (state === QUIZ_STATES.UNLOCKED) {
      console.log('🎮 Quiz débloqué! Prêt à jouer au quiz:', quiz.name);
      // TODO: Navigation vers QuizScreen
    } else if (state === QUIZ_STATES.LOCKED) {
      const distance = userLocation ? getDistanceInMeters(
        userLocation.latitude,
        userLocation.longitude,
        quiz.coordinate.latitude,
        quiz.coordinate.longitude
      ) : 999;

      console.log(`🔒 Quiz verrouillé "${quiz.name}" - Distance: ${Math.round(distance)}m`);
    } else {
      setSelectedPoint({
        ...quiz,
        state: state
      });
    }
  };

  // 🧪 Fonction de test API
  const testUnlockAPI = async () => {
    if (!userData?.userID || !userLocation) {
      console.log('❌ Pas d\'userID ou de position pour test');
      return;
    }

    try {
      console.log('🧪 Test API unlock...');
      const response = await fetch(`${URL}/quizz/unlock/${userData.userID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userLatitude: userLocation.latitude,
          userLongitude: userLocation.longitude
        })
      });
      const data = await response.json();
      console.log('🧪 Test API result:', data);
    } catch (error) {
      console.error('🧪 Test API error:', error);
    }
  };

  // 🆕 Chargement des quiz depuis l'API
  useEffect(() => {
    fetchQuizFromAPI();
  }, []);

  // Initialisation géolocalisation
  useEffect(() => {
    if (!isLoggedIn) return;

    const initializeLocation = async () => {
      try {
        console.log('🎯 Initialisation MapScreen...');

        if (!hasLocationPermission) {
          console.log('❌ Pas de permission en Redux');
          setLocationError(true);
          setIsLoading(false);
          return;
        }

        console.log('✅ Permission Redux OK, récupération position...');

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 10000,
        });

        if (location) {
          console.log('✅ Position obtenue:', location.coords);
          setUserLocation(location.coords);
        }

        setIsLoading(false);

      } catch (error) {
        console.error('❌ Erreur géolocalisation MapScreen:', error);
        setLocationError(true);
        setIsLoading(false);
      }
    };

    initializeLocation();
  }, [isLoggedIn, hasLocationPermission]);

  // 🎯 UN SEUL useEffect pour l'API de déverrouillage
  useEffect(() => {
    if (!userLocation || !userData?.userID || quizLocations.length === 0) return;

    const checkUnlocksViaAPI = async () => {
      try {
        console.log('🗺️ Vérification déverrouillages via API...');
        console.log('📍 Position:', userLocation.latitude, userLocation.longitude);

        const response = await fetch(`${URL}/quizz/unlock/${userData.userID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userLatitude: userLocation.latitude,
            userLongitude: userLocation.longitude
          }),
        });

        const data = await response.json();
        console.log('📊 Réponse API unlock:', data);

        if (data.result) {
          if (data.newUnlocked > 0) {
            // Mettre à jour Redux avec la réponse API
            dispatch(updateUser({
              userData: {
                ...userData,
                unlockedQuizzes: data.unlockedQuizzes
              }
            }));

            console.log(`🎉 ${data.newUnlocked} nouveau(x) quiz débloqué(s) !`);
            console.log('📋 Quiz proches:', data.nearbyQuiz);
          } else {
            console.log('ℹ️ Aucun nouveau quiz à débloquer');
          }

          // Synchroniser Redux avec l'API même si pas de nouveaux
          if (data.unlockedQuizzes.length !== userData.unlockedQuizzes?.length) {
            dispatch(updateUser({
              userData: {
                ...userData,
                unlockedQuizzes: data.unlockedQuizzes
              }
            }));
            console.log('🔄 Redux synchronisé avec API');
          }
        }
      } catch (error) {
        console.error('❌ Erreur vérification déverrouillages:', error);
      }
    };

    checkUnlocksViaAPI();
  }, [userLocation, userData?.userID, quizLocations.length]);

  // Loading states
  if (isLoading || apiLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#fb7a68" />
        <Text style={styles.loaderText}>
          {isLoading ? 'Localisation en cours...' : 'Chargement des quiz...'}
        </Text>
      </SafeAreaView>
    );
  }

  if (!hasLocationPermission) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorMessage}>
          ❌ Géolocalisation non autorisée
        </Text>
        <Text style={styles.warningMessage}>
          Va dans Permissions pour l'activer !
        </Text>
      </SafeAreaView>
    );
  }

  if (locationError || !userLocation) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorMessage}>
          ⚠️ Impossible d'obtenir ta position
        </Text>
        <Text style={styles.warningMessage}>
          Vérifie que la géolocalisation est activée
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={() => {
          if (selectedPoint) setSelectedPoint(null);
        }}
      >
        {/* Pin de l'utilisateur */}
        <Marker
          coordinate={userLocation}
          title="Ma position"
          description="Tu es ici !"
          pinColor="#007AFF"
        />

        {/* Pins des quiz avec couleurs selon l'état */}
        {quizLocations.map((quiz) => (
          <Marker
            key={quiz._id}
            coordinate={quiz.coordinate}
            pinColor={getMarkerColor(quiz)}
            onPress={() => handleQuizPress(quiz)}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>
                  {quiz.name}
                </Text>
                <Text style={styles.calloutArrondissement}>
                  📍 {quiz.arrondissement} • {quiz.themeLieu}
                </Text>
                <Text style={styles.calloutDescription}>
                  {quiz.descriptionLieu}
                </Text>
                <Text style={styles.calloutInfo}>
                  📚 {quiz.questionCount} questions • 🏆 {quiz.totalPoints} pts
                </Text>
                <Text style={styles.calloutDifficulty}>
                  Difficulté: {quiz.difficulteGlobale} • ⏱️ {quiz.tempsEstime}
                </Text>
                <Text style={styles.calloutPopularity}>
                  ⭐ {quiz.popularite}/5 {quiz.accessible ? '• ♿ Accessible' : ''}
                </Text>
                <Text style={styles.calloutBadge}>
                  🏅 {quiz.badgeDebloque}
                </Text>
                {isQuizUnlocked(quiz) ? (
                  <Text style={styles.calloutUnlocked}>✅ Quiz débloqué !</Text>
                ) : (
                  <Text style={styles.calloutLocked}>🔒 Approchez-vous pour débloquer</Text>
                )}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Info overlay */}
      <View style={styles.infoOverlay}>
        <Text style={styles.infoText}>
          📍 {quizLocations.length} quiz disponibles
        </Text>
        <Text style={styles.infoSubtext}>
          🔓 {quizLocations.filter(quiz => isQuizUnlocked(quiz)).length} débloqués
        </Text>
      </View>

      {/* Boutons de test */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={testUnlockAPI}
      >
        <Text style={styles.refreshText}>🧪</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.refreshButton, { bottom: 160 }]}
        onPress={fetchQuizFromAPI}
      >
        <Text style={styles.refreshText}>🔄</Text>
      </TouchableOpacity>

      {/* Carte info */}
      {selectedPoint && (
        <View style={[
          styles.infoCard,
          { borderLeftColor: getPinColor(selectedPoint.state) }
        ]}>
          {selectedPoint.image && selectedPoint.image.startsWith('http') && (
            <Image
              source={{ uri: selectedPoint.image }}
              style={styles.imageSide}
              resizeMode="cover"
            />
          )}
          <View style={styles.infoText}>
            <Text style={styles.title}>{selectedPoint.name}</Text>
            <Text style={styles.description}>{selectedPoint.descriptionLieu}</Text>
            <Text style={[
              styles.stateText,
              { color: getPinColor(selectedPoint.state) }
            ]}>
              {getStateDescription(selectedPoint.state)}
            </Text>
            <Text style={styles.badge}>🏅 {selectedPoint.badgeDebloque}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Styles identiques (pas changés)
const styles = StyleSheet.create({
  map: { flex: 1 },
  imageSide: { width: 100, height: 150, borderRadius: 10, marginRight: 12 },
  infoText: { flex: 1, flexShrink: 1 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#85CAE4" },
  loaderText: { fontSize: 20, color: "#fff", fontWeight: "bold", marginTop: 10 },
  errorMessage: { fontSize: 16, color: "#FF6347", textAlign: "center", padding: 20, fontWeight: "bold" },
  warningMessage: { fontSize: 14, color: "#FF8C00", textAlign: "center", padding: 10, marginTop: 10 },
  infoCard: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#f6836c', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 5, borderLeftWidth: 4 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 6, color: '#fff' },
  description: { fontSize: 14, color: '#fff' },
  stateText: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  badge: { marginTop: 10, fontWeight: '600', color: '#fff', fontSize: 12 },
  calloutContainer: { width: 250, padding: 12 },
  calloutTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6, color: '#333' },
  calloutArrondissement: { fontSize: 12, color: '#007AFF', fontWeight: '600', marginBottom: 3 },
  calloutDescription: { fontSize: 14, color: '#666', marginBottom: 6, fontStyle: 'italic' },
  calloutInfo: { fontSize: 13, color: '#888', marginBottom: 4 },
  calloutDifficulty: { fontSize: 12, color: '#888', marginBottom: 4 },
  calloutPopularity: { fontSize: 11, color: '#888', marginBottom: 3 },
  calloutBadge: { fontSize: 11, color: '#FF6B35', fontWeight: '600', marginBottom: 5 },
  calloutUnlocked: { fontSize: 13, color: '#4CAF50', fontWeight: 'bold' },
  calloutLocked: { fontSize: 13, color: '#FF5722', fontWeight: 'bold' },
  infoOverlay: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  refreshButton: { position: 'absolute', bottom: 100, right: 20, backgroundColor: '#007AFF', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  refreshText: { fontSize: 20 },
  infoSubtext: { fontSize: 12, color: '#666', marginTop: 2 }
});