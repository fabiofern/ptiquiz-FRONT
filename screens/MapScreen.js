import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Image, TouchableOpacity } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../redux/userSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

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

  // 🎯 STYLE DE CARTE CUSTOM TIQUIZ
  const mapCustomStyle = [
    {
      "featureType": "all",
      "elementType": "geometry",
      "stylers": [{ "color": "#f5f5f5" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#85CAE4" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#fb7a68" }, { "weight": 0.5 }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#d5c3f3" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#eeddfd" }]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#4a3b79" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#3a2e6b" }]
    }
  ];

  // 🆕 Fonction pour récupérer les quiz depuis l'API
  const fetchQuizFromAPI = async () => {
    try {
      setApiLoading(true);
      console.log('📡 Récupération des quiz depuis l\'API...');

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

  const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 🎯 Calcul du score total utilisateur (points obtenus)
  const calculateUserTotalScore = () => {
    const completedQuizzes = userData?.completedQuizzes || {};
    return Object.values(completedQuizzes).reduce((total, quiz) => {
      return total + (quiz.score || 0);
    }, 0);
  };

  // 🎯 UNE SEULE fonction getQuizState
  const getQuizState = (quiz) => {
    if (!userLocation) return QUIZ_STATES.LOCKED;

    const quizId = quiz._id?.$oid || quiz._id;
    const completedQuiz = userData?.completedQuizzes?.[quizId];

    if (completedQuiz) {
      return completedQuiz.percentage === 100 ? QUIZ_STATES.PERFECT : QUIZ_STATES.COMPLETED;
    }

    const isUnlocked = userData?.unlockedQuizzes?.includes(quizId);
    return isUnlocked ? QUIZ_STATES.UNLOCKED : QUIZ_STATES.LOCKED;
  };

  const getPinColor = (state) => {
    switch (state) {
      case QUIZ_STATES.LOCKED: return '#F44336';      // Rouge
      case QUIZ_STATES.UNLOCKED: return '#FF9800';    // Orange
      case QUIZ_STATES.COMPLETED: return '#2196F3';   // Bleu
      case QUIZ_STATES.PERFECT: return '#4CAF50';     // Vert
      default: return '#F44336';
    }
  };

  const getStateIcon = (state) => {
    switch (state) {
      case QUIZ_STATES.LOCKED: return '🔒';
      case QUIZ_STATES.UNLOCKED: return '🎯';
      case QUIZ_STATES.COMPLETED: return '⭐';
      case QUIZ_STATES.PERFECT: return '🏆';
      default: return '🔒';
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
      case QUIZ_STATES.UNLOCKED: return "🎯 Quiz débloqué - À toi de jouer !";
      case QUIZ_STATES.COMPLETED: return "⭐ Quiz terminé - Bonne tentative !";
      case QUIZ_STATES.PERFECT: return "🏆 Quiz parfait - Félicitations !";
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

  // 🎨 CUSTOM MARKER COMPONENT
  const CustomMarker = ({ quiz }) => {
    const state = getQuizState(quiz);
    const color = getPinColor(state);
    const icon = getStateIcon(state);

    return (
      <View style={[styles.customMarker, { backgroundColor: color }]}>
        <Text style={styles.markerIcon}>{icon}</Text>
        {state === QUIZ_STATES.UNLOCKED && (
          <View style={styles.pulseOuter}>
            <View style={[styles.pulseInner, { backgroundColor: color }]} />
          </View>
        )}
      </View>
    );
  };

  // Loading states
  if (isLoading || apiLoading) {
    return (
      <LinearGradient
        colors={['#eeddfd', '#d5c3f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loaderContainer}
      >
        <ActivityIndicator size="large" color="#fb7a68" />
        <Text style={styles.loaderText}>
          {isLoading ? 'Localisation en cours...' : 'Chargement des quiz...'}
        </Text>
      </LinearGradient>
    );
  }

  if (!hasLocationPermission) {
    return (
      <LinearGradient
        colors={['#eeddfd', '#d5c3f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loaderContainer}
      >
        <Text style={styles.errorMessage}>
          ❌ Géolocalisation non autorisée
        </Text>
        <Text style={styles.warningMessage}>
          Va dans Permissions pour l'activer !
        </Text>
      </LinearGradient>
    );
  }

  if (locationError || !userLocation) {
    return (
      <LinearGradient
        colors={['#eeddfd', '#d5c3f3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loaderContainer}
      >
        <Text style={styles.errorMessage}>
          ⚠️ Impossible d'obtenir ta position
        </Text>
        <Text style={styles.warningMessage}>
          Vérifie que la géolocalisation est activée
        </Text>
      </LinearGradient>
    );
  }

  const totalScore = calculateUserTotalScore();
  const unlockedCount = quizLocations.filter(quiz => isQuizUnlocked(quiz)).length;

  return (
    <View style={styles.container}>
      {/* 🗺️ CARTE AVEC STYLE CUSTOM */}
      <MapView
        ref={mapRef}
        style={styles.map}
        customMapStyle={mapCustomStyle}
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
        {/* 📍 Pin de l'utilisateur stylé */}
        <Marker
          coordinate={userLocation}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.userMarker}>
            <LinearGradient
              colors={['#85CAE4', '#5BB3D8']}
              style={styles.userMarkerGradient}
            >
              <FontAwesome name="user" size={16} color="white" />
            </LinearGradient>
            <View style={styles.userMarkerPulse} />
          </View>
        </Marker>

        {/* 🎯 Pins des quiz avec markers custom */}
        {quizLocations.map((quiz) => (
          <Marker
            key={quiz._id}
            coordinate={quiz.coordinate}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => handleQuizPress(quiz)}
          >
            <CustomMarker quiz={quiz} />
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
                <Text style={[
                  styles.calloutState,
                  { color: getPinColor(getQuizState(quiz)) }
                ]}>
                  {getStateDescription(getQuizState(quiz))}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* 🎨 HEADER GLASSMORPHISM STYLÉ */}
      <BlurView intensity={80} style={styles.headerOverlay}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>🎯 TiQuiz</Text>
            <Text style={styles.headerSubtitle}>
              {unlockedCount}/{quizLocations.length} quiz débloqués
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Text style={styles.scoreValue}>{totalScore}</Text>
          </View>
        </View>
      </BlurView>

      {/* 🎭 LÉGENDE DES COULEURS */}
      <BlurView intensity={80} style={styles.legendOverlay}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
            <Text style={styles.legendText}>Verrouillé</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>Débloqué</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.legendText}>Terminé</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Parfait</Text>
          </View>
        </View>
      </BlurView>

      {/* 📱 CARTE INFO DÉTAILLÉE */}
      {selectedPoint && (
        <BlurView intensity={90} style={[
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
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{selectedPoint.name}</Text>
            <Text style={styles.infoDescription}>{selectedPoint.descriptionLieu}</Text>
            <Text style={[
              styles.infoState,
              { color: getPinColor(selectedPoint.state) }
            ]}>
              {getStateDescription(selectedPoint.state)}
            </Text>
            <Text style={styles.infoBadge}>🏅 {selectedPoint.badgeDebloque}</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedPoint(null)}
          >
            <FontAwesome name="times" size={16} color="white" />
          </TouchableOpacity>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // Loading states
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    fontSize: 18,
    color: "#4a3b79",
    fontWeight: "600",
    marginTop: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 18,
    color: "#4a3b79",
    textAlign: "center",
    padding: 20,
    fontWeight: "700",
  },
  warningMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    padding: 10,
    marginTop: 10,
  },

  // Header overlay
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c1d53',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#4a3b79',
    fontWeight: '500',
  },
  headerRight: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#4a3b79',
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fb7a68',
  },

  // Legend overlay
  legendOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  legendItem: {
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#2c1d53',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Custom markers
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerIcon: {
    fontSize: 16,
    color: 'white',
  },
  pulseOuter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 152, 0, 0.3)',
    zIndex: -1,
  },
  pulseInner: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    top: 5,
    left: 5,
    opacity: 0.5,
  },

  // User marker
  userMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(133, 202, 228, 0.3)',
    zIndex: -1,
  },

  // Info card
  infoCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  imageSide: {
    width: 80,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
    flexShrink: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    color: '#2c1d53',
  },
  infoDescription: {
    fontSize: 13,
    color: '#4a3b79',
    marginBottom: 8,
  },
  infoState: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fb7a68',
  },
  closeButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  // Callout
  calloutContainer: {
    width: 280,
    padding: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    color: '#2c1d53',
  },
  calloutArrondissement: {
    fontSize: 12,
    color: '#85CAE4',
    fontWeight: '600',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 13,
    color: '#4a3b79',
    marginBottom: 8,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  calloutInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  calloutDifficulty: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  calloutPopularity: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  calloutBadge: {
    fontSize: 11,
    color: '#fb7a68',
    fontWeight: '600',
    marginBottom: 6,
  },
  calloutState: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
});