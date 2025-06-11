
import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Image, TouchableOpacity, Animated } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../redux/userSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function MapScreen() {
  const URL = process.env.EXPO_PUBLIC_BACKEND_URL
  const dispatch = useDispatch();
  const { userData, isLoggedIn } = useSelector((state) => state.user);

  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [quizLocations, setQuizLocations] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);

  const mapRef = useRef(null);
  const hasLocationPermission = userData?.locationPermissions?.foreground;

  // Chargement des polices
  const [loaded] = useFonts({
    "Fustat-Bold.ttf": require("../assets/fonts/Fustat-Bold.ttf"),
    "Fustat-ExtraBold.ttf": require("../assets/fonts/Fustat-ExtraBold.ttf"),
    "Fustat-Regular.ttf": require("../assets/fonts/Fustat-Regular.ttf"),
    "Fustat-SemiBold.ttf": require("../assets/fonts/Fustat-SemiBold.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Si les polices ne sont pas encore chargées, ne rien rendre
  if (!loaded) {
    return null;
  }

  // États possibles d'un quiz
  const QUIZ_STATES = {
    LOCKED: 'locked',
    UNLOCKED: 'unlocked',
    COMPLETED: 'completed',
    PERFECT: 'perfect'
  };

  // Fonction pour récupérer les quiz depuis l'API
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
        // Si la réponse n'est pas OK (statut 4xx ou 5xx), tentez de lire comme texte
        const errorText = await response.text();
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.result && data.quiz) {
        setQuizLocations(data.quiz);
        console.log(`📍 ${data.quiz.length} quiz chargés depuis l\'API`);
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

  // Calcul du score total utilisateur
  const calculateUserTotalScore = () => {
    const completedQuizzes = userData?.completedQuizzes || {};
    return Object.values(completedQuizzes).reduce((total, quiz) => {
      return total + (quiz.score || 0);
    }, 0);
  };

  // UNE SEULE fonction getQuizState
  const getQuizState = (quiz) => {
    if (!userLocation) return QUIZ_STATES.LOCKED;

    const quizId = quiz._id;
    const completedQuiz = userData?.completedQuizzes?.[quizId];

    if (completedQuiz) {
      // Utiliser le pourcentage pour déterminer si c'est parfait
      return completedQuiz.percentage === 100 ? QUIZ_STATES.PERFECT : QUIZ_STATES.COMPLETED;
    }

    const isUnlocked = userData?.unlockedQuizzes?.includes(quizId);
    return isUnlocked ? QUIZ_STATES.UNLOCKED : QUIZ_STATES.LOCKED;
  };

  const getPinColor = (state) => {
    switch (state) {
      case QUIZ_STATES.LOCKED: return '#F44336';
      case QUIZ_STATES.UNLOCKED: return '#FF9800';
      case QUIZ_STATES.COMPLETED: return '#2196F3';
      case QUIZ_STATES.PERFECT: return '#4CAF50';
      default: return '#F44336';
    }
  };

  const getStateIcon = (state) => {
    switch (state) {
      case QUIZ_STATES.LOCKED: return 'lock';
      case QUIZ_STATES.UNLOCKED: return 'gamepad';
      case QUIZ_STATES.COMPLETED: return 'star';
      case QUIZ_STATES.PERFECT: return 'trophy';
      default: return 'lock';
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
      case QUIZ_STATES.UNLOCKED: return "🎮 Quiz débloqué - À toi de jouer !";
      case QUIZ_STATES.COMPLETED: return "⭐ Quiz terminé - Bonne tentative !";
      case QUIZ_STATES.PERFECT: return "🏆 Quiz parfait - Félicitations !";
      default: return "🔒 Quiz verrouillé";
    }
  };

  const handleQuizPress = (quiz) => {
    const state = getQuizState(quiz);

    if (state === QUIZ_STATES.UNLOCKED) {
      console.log('🎮 Quiz débloqué!');
      // Navigation vers QuizScreen
    } else if (state === QUIZ_STATES.LOCKED) {
      console.log('🔒 Quiz verrouillé');
    }
  };

  // COMPOSANT PIN PERSONNALISÉ (avec animation)
  const CustomPin = ({ quiz }) => {
    const state = getQuizState(quiz);
    const color = getPinColor(state);
    const icon = getStateIcon(state);

    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (state === QUIZ_STATES.UNLOCKED) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else {
        pulseAnim.setValue(0);
        pulseAnim.stopAnimation();
      }
    }, [state]);

    const pulseScale = pulseAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 1.2, 0.8],
    });

    const pulseOpacity = pulseAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.2, 0.6],
    });

    return (
      <View style={styles.customPinContainer}>
        {/* Animation pulse pour les quiz débloqués */}
        {state === QUIZ_STATES.UNLOCKED && (
          <Animated.View style={[
            styles.pulseAnimation,
            { backgroundColor: color + '50', transform: [{ scale: pulseScale }], opacity: pulseOpacity }
          ]} />
        )}

        {/* Pin principal en "liquid glass" */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)']}
          style={styles.customPin}
        >
          {/* FontAwesome est maintenant enfant direct de LinearGradient */}
          <FontAwesome name={icon} size={20} color={color} />
        </LinearGradient>

        {/* Petit indicateur en bas */}
        <View style={[styles.pinBottom, { backgroundColor: color, borderColor: 'rgba(255, 255, 255, 0.8)' }]} />
      </View>
    );
  };

  // PIN UTILISATEUR CUSTOM (avec animation)
  const UserPin = () => {
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const pulseScale = pulseAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.9, 1.1, 0.9],
    });

    const pulseOpacity = pulseAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 0.3, 0.8],
    });

    return (
      <View style={styles.userPinContainer}>
        <Animated.View style={[
          styles.userPulse,
          { backgroundColor: 'rgba(255, 152, 0, 0.3)', transform: [{ scale: pulseScale }], opacity: pulseOpacity }
        ]} />
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)']}
          style={styles.userPin}
        >
          {/* FontAwesome est maintenant enfant direct de LinearGradient */}
          <FontAwesome name="user" size={16} color="#FF7043" />
        </LinearGradient>
      </View>
    );
  };

  // Chargement des quiz depuis l'API
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

  // UN SEUL useEffect pour l'API de déverrouillage
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

        // Tente de lire la réponse comme JSON. Si ça échoue, lis comme texte.
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error('Réponse non-JSON:', text);
          throw new Error(`Erreur serveur: ${response.status} - ${text}`);
        }

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

  // Loading states avec style TiQuiz
  if (isLoading || apiLoading) {
    return (
      <LinearGradient
        // Dégradé de couleurs pour le fond : Rayon de Soleil
        colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loaderContainer}
      >
        <ActivityIndicator size="large" color="#FF7043" />
        <Text style={styles.loaderText}>
          {isLoading ? 'Localisation en cours...' : 'Chargement des quiz...'}
        </Text>
      </LinearGradient>
    );
  }

  if (!hasLocationPermission) {
    return (
      <LinearGradient
        // Dégradé de couleurs pour le fond : Rayon de Soleil
        colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
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
        // Dégradé de couleurs pour le fond : Rayon de Soleil
        colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
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
      {/* ENCADREMENT TIQUIZ GLASSMORPHISM */}
      <BlurView intensity={80} style={styles.headerFrame}>
        <LinearGradient
          // Dégradé translucide de la palette "Rayon de Soleil"
          colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.tiquizTitle}>🎯 TiQuiz</Text>
              <Text style={styles.headerSubtitle}>
                {unlockedCount}/{quizLocations.length} quiz débloqués
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{totalScore}</Text>
            </View>
          </View>
        </LinearGradient>
      </BlurView>

      {/* CARTE */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Pin utilisateur custom */}
        <Marker
          coordinate={userLocation}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <UserPin />
        </Marker>

        {/* Pins des quiz avec composants custom */}
        {quizLocations.map((quiz) => (
          <Marker
            key={quiz._id}
            coordinate={quiz.coordinate}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => handleQuizPress(quiz)}
          >
            <CustomPin quiz={quiz} />
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

      {/* LÉGENDE ÉLÉGANTE */}
      <BlurView intensity={80} style={styles.legendFrame}>
        <LinearGradient
          // Dégradé translucide de la palette "Rayon de Soleil"
          colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)']}
          style={styles.legendGradient}
        >
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <FontAwesome name="lock" size={12} color="#F44336" />
              <Text style={styles.legendText}>Verrouillé</Text>
            </View>
            <View style={styles.legendItem}>
              <FontAwesome name="gamepad" size={12} color="#FF9800" />
              <Text style={styles.legendText}>Débloqué</Text>
            </View>
            <View style={styles.legendItem}>
              <FontAwesome name="star" size={12} color="#2196F3" />
              <Text style={styles.legendText}>Terminé</Text>
            </View>
            <View style={styles.legendItem}>
              <FontAwesome name="trophy" size={12} color="#4CAF50" />
              <Text style={styles.legendText}>Parfait</Text>
            </View>
          </View>
        </LinearGradient>
      </BlurView>
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
    fontFamily: "Fustat-SemiBold.ttf",
    color: "#FF9800",
    marginTop: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 20,
    fontFamily: "Fustat-ExtraBold.ttf",
    color: "#FF7043",
    textAlign: "center",
    padding: 20,
  },
  warningMessage: {
    fontSize: 16,
    fontFamily: "Fustat-Regular.ttf",
    color: "#4a4a4a",
    textAlign: "center",
    padding: 10,
    marginTop: 10,
  },

  // Header frame TiQuiz (Liquid Glass)
  headerFrame: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    zIndex: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',

    // Effet de lueur et d'ombre pour le volume "liquid glass"
    shadowColor: 'rgba(255, 240, 200, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 30,
  },
  headerGradient: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  tiquizTitle: {
    fontSize: 22,
    fontFamily: "Fustat-ExtraBold.ttf",
    color: '#FF7043',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Fustat-Regular.ttf",
    color: '#4a4a4a',
  },
  headerRight: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    fontFamily: "Fustat-Regular.ttf",
    color: '#4a4a4a',
  },
  scoreValue: {
    fontSize: 18,
    fontFamily: "Fustat-ExtraBold.ttf",
    color: '#FF9800',
  },

  // Legend frame (Liquid Glass)
  legendFrame: {
    position: 'absolute',
    bottom: 40,
    left: 15,
    right: 15,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',

    // Effet de lueur et d'ombre pour le volume "liquid glass"
    shadowColor: 'rgba(255, 240, 200, 1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 20,
  },
  legendGradient: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    alignItems: 'center',
    flex: 1,
  },
  legendText: {
    fontSize: 10,
    fontFamily: "Fustat-SemiBold.ttf",
    color: '#4a4a4a',
    textAlign: 'center',
    marginTop: 4,
  },

  // Custom quiz pins (Liquid Glass Bubbles)
  customPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  customPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    // Ombre pour la profondeur de la bulle
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden', // Ajout de l'overflow ici
  },
  pinBottom: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: -4,
    borderWidth: 1.5,
  },
  pulseAnimation: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  // User pin (Liquid Glass Bubble)
  userPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    // Ombre pour la profondeur de la bulle
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden', // Ajout de l'overflow ici
  },
  userPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  // Callout styling (Optimisé pour la lisibilité)
  calloutContainer: {
    width: 280,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    // Optionnel: ajouter une légère ombre si supporté par Callout
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    overflow: 'hidden', // Ajout de l'overflow ici
  },
  calloutTitle: {
    fontSize: 18,
    fontFamily: "Fustat-ExtraBold.ttf",
    color: '#FF7043',
    marginBottom: 6,
  },
  calloutArrondissement: {
    fontSize: 13,
    fontFamily: "Fustat-SemiBold.ttf",
    color: '#FF9800',
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 14,
    fontFamily: "Fustat-Regular.ttf",
    color: '#4a4a4a',
    marginBottom: 8,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  calloutInfo: {
    fontSize: 12,
    fontFamily: "Fustat-Regular.ttf",
    color: '#666666',
    marginBottom: 4,
  },
  calloutDifficulty: {
    fontSize: 12,
    fontFamily: "Fustat-Regular.ttf",
    color: '#666666',
    marginBottom: 4,
  },
  calloutPopularity: {
    fontSize: 12,
    fontFamily: "Fustat-Regular.ttf",
    color: '#666666',
    marginBottom: 4,
  },
  calloutBadge: {
    fontSize: 13,
    fontFamily: "Fustat-SemiBold.ttf",
    color: '#FF7043',
    marginBottom: 6,
  },
  calloutState: {
    fontSize: 14,
    fontFamily: "Fustat-Bold.ttf",
    textAlign: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
