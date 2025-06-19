import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Image, TouchableOpacity, Animated, Modal, Dimensions, Alert, ScrollView } from "react-native"; // Ajout de ScrollView
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
import DuelInvitationModal from '../components/DuelInvitationModal';
import SocialLocationService from '../services/SocialLocationService';
import UserMarker from '../components/UserMarker';
import { EXPO_PUBLIC_BACKEND_URL } from '@env';

SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('window');

// --- CONSTANTES ET FONCTIONS UTILITAIRES (déplacées en dehors du composant) ---
const QUIZ_STATES = {
  LOCKED: 'locked',
  UNLOCKED: 'unlocked',
  COMPLETED: 'completed',
  PERFECT: 'perfect'
};

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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

const getStateDescription = (state) => {
  switch (state) {
    case QUIZ_STATES.LOCKED: return "🔒 Quiz verrouillé - Approche-toi !";
    case QUIZ_STATES.UNLOCKED: return "🎮 Quiz débloqué - À toi de jouer !";
    case QUIZ_STATES.COMPLETED: return "⭐ Quiz terminé - Bonne tentative !";
    case QUIZ_STATES.PERFECT: return "🏆 Quiz parfait - Félicitations !";
    default: return "🔒 Quiz verrouillé";
  }
};

function calculateUserTotalScore(userData) {
  const completedQuizzes = userData?.completedQuizzes || {};
  return Object.values(completedQuizzes).reduce((total, quiz) => {
    return total + (quiz.score || 0);
  }, 0);
}
// --- FIN CONSTANTES ET FONCTIONS UTILITAIRES ---

// --- COMPOSANT AURORA BACKGROUND (inchangé) ---
const AuroraBackground = () => {
  const [isReady, setIsReady] = useState(false);
  const blobs = useRef([]);

  useEffect(() => {
    if (!isReady) {
      blobs.current = [...Array(6)].map(() => ({
        translateX: new Animated.Value(Math.random() * width),
        translateY: new Animated.Value(Math.random() * height),
        scale: new Animated.Value(0.5 + Math.random()),
        opacity: new Animated.Value(0.2 + Math.random() * 0.3),
        duration: 5000 + Math.random() * 5000,
      }));
      setIsReady(true);
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady && blobs.current.length > 0) {
      blobs.current.forEach(blob => {
        const animateBlob = () => {
          Animated.loop(
            Animated.parallel([
              Animated.timing(blob.translateX, { toValue: Math.random() * width, duration: blob.duration, useNativeDriver: true }),
              Animated.timing(blob.translateY, { toValue: Math.random() * height, duration: blob.duration, useNativeDriver: true }),
              Animated.timing(blob.scale, { toValue: 0.8 + Math.random() * 0.7, duration: blob.duration, useNativeDriver: true }),
              Animated.timing(blob.opacity, { toValue: 0.2 + Math.random() * 0.3, duration: blob.duration, useNativeDriver: true }),
            ])
          ).start();
        };
        animateBlob();
      });
    }
  }, [isReady]);

  const auroraColors = [
    'rgba(255, 152, 0, 0.2)',
    'rgba(255, 112, 67, 0.2)',
    'rgba(255, 204, 128, 0.2)',
    'rgba(255, 240, 200, 0.2)',
    'rgba(255, 224, 178, 0.2)',
  ];

  if (!isReady) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {blobs.current.map((blob, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            width: width * 0.6,
            height: width * 0.6,
            borderRadius: width * 0.3,
            backgroundColor: auroraColors[index % auroraColors.length],
            transform: [
              { translateX: blob.translateX },
              { translateY: blob.translateY },
              { scale: blob.scale }
            ],
            opacity: blob.opacity,
          }}
        />
      ))}
    </View>
  );
};

export default function MapScreen({ navigation }) {
  const URL = EXPO_PUBLIC_BACKEND_URL;
  const dispatch = useDispatch();
  const { userData, isLoggedIn } = useSelector((state) => state.user);

  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [quizLocations, setQuizLocations] = useState([]);
  const [apiLoading, setApiLoading] = useState(true);

  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [socialTracking, setSocialTracking] = useState(false);
  const [socialVisible, setSocialVisible] = useState(false);
  const [showSocialUsers, setShowSocialUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const [duelInvitation, setDuelInvitation] = useState(null);
  const [showDuelModal, setShowDuelModal] = useState(false);

  // --- NOUVEAUX ÉTATS POUR LA MODALE D'INFO QUIZ ---
  const [showQuizInfoModal, setShowQuizInfoModal] = useState(false);
  const [selectedQuizForInfo, setSelectedQuizForInfo] = useState(null);

  const mapRef = useRef(null);
  const hasLocationPermission = userData?.locationPermissions?.foreground;

  // Chargement des polices (inchangé)
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

  // ✅ FONCTION getQuizState (CORRIGÉE POUR UTILISER quiz.coordinate)
  const getQuizState = useCallback((quiz) => {
    if (!userLocation) return QUIZ_STATES.LOCKED;

    const quizId = quiz._id;
    const completedQuiz = userData?.completedQuizzes?.[quizId];

    if (completedQuiz) {
      return completedQuiz.percentage === 100 ? QUIZ_STATES.PERFECT : QUIZ_STATES.COMPLETED;
    }

    const isUnlocked = userData?.unlockedQuizzes?.includes(quizId);

    // Vérifier la proximité en utilisant quiz.coordinate
    if (!isUnlocked && quiz.coordinate?.latitude && quiz.coordinate?.longitude) {
      const distance = getDistanceInMeters(
        userLocation.latitude,
        userLocation.longitude,
        quiz.coordinate.latitude,
        quiz.coordinate.longitude
      );
      const UNLOCK_RADIUS_METERS = 100;
      if (distance <= UNLOCK_RADIUS_METERS) {
        return QUIZ_STATES.UNLOCKED;
      }
    }

    return isUnlocked ? QUIZ_STATES.UNLOCKED : QUIZ_STATES.LOCKED;
  }, [userLocation, userData?.unlockedQuizzes, userData?.completedQuizzes]);

  // Handlers (inchangés sauf handleQuizPress)
  const handleUserPress = (user) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const closeUserProfile = () => {
    setShowUserProfile(false);
    setTimeout(() => {
      setSelectedUser(null);
    }, 300);
  };

  // --- MODIFICATION DE handleQuizPress POUR OUVRIR LA MODALE ---
  const handleQuizPress = (quiz) => {
    setSelectedQuizForInfo(quiz); // Stocker le quiz cliqué
    setShowQuizInfoModal(true);   // Ouvrir la modale d'infos
  };

  // --- NOUVEAU HANDLER POUR LANÇER LE QUIZ DEPUIS LA MODALE ---
  const launchQuizFromModal = (quiz) => {
    setShowQuizInfoModal(false); // Fermer la modale d'infos
    const state = getQuizState(quiz);

    if (state === QUIZ_STATES.UNLOCKED) {
      navigation.navigate('MainApp', {
        screen: 'Quiz',
        params: { quizId: quiz._id, quizData: quiz },
      });
    } else {
      // Si le quiz n'est plus débloqué au moment du clic sur le bouton (rare, mais possible)
      // ou si l'utilisateur essaie de lancer un quiz déjà terminé sans permission
      Alert.alert(
        "Action impossible",
        "Ce quiz n'est pas jouable actuellement. Rapprochez-vous ou vérifiez son statut.",
        [{ text: "OK" }]
      );
    }
  };

  // Composants de pins (inchangés)
  const CustomPin = React.memo(({ quiz }) => {
    const state = getQuizState(quiz);
    const color = getPinColor(state);
    const icon = getStateIcon(state);
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (state === QUIZ_STATES.UNLOCKED) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
          ])
        ).start();
      } else {
        pulseAnim.setValue(0);
        pulseAnim.stopAnimation();
      }
    }, [state, pulseAnim]);

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
        {state === QUIZ_STATES.UNLOCKED && (
          <Animated.View style={[
            styles.pulseAnimation,
            { backgroundColor: color + '50', transform: [{ scale: pulseScale }], opacity: pulseOpacity }
          ]} />
        )}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)']}
          style={styles.customPin}
        >
          <FontAwesome name={icon} size={20} color={color} />
        </LinearGradient>
        <View style={[styles.pinBottom, { backgroundColor: color, borderColor: 'rgba(255, 255, 255, 0.8)' }]} />
      </View>
    );
  });

  const UserPin = () => {
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }, [pulseAnim]);

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
          <FontAwesome name="user" size={16} color="#FF7043" />
        </LinearGradient>
      </View>
    );
  };

  // useEffects (inchangés)
  useEffect(() => {
    const initAndStartSocialTracking = async () => {
      if (!userData?.userID || !isLoggedIn || !userLocation) return;
      if (socialTracking) return;

      try {
        SocialLocationService.apiBaseUrl = URL;
        SocialLocationService.onLocationUpdate = (result) => {
          if (result && result.success) {
            setNearbyUsers(result.nearbyUsers || []);
            setSocialVisible(result.isVisible);
          }
        };
        SocialLocationService.onDuelInvitation = (invitation) => {
          setDuelInvitation(invitation);
          setShowDuelModal(true);
        };

        const success = await SocialLocationService.startLocationTracking(userData.userID);
        if (success) {
          setSocialTracking(true);
        }
      } catch (error) {
        console.error('❌ Erreur tracking social:', error);
      }
    };

    initAndStartSocialTracking();

    return () => {
      if (socialTracking) {
        SocialLocationService.cleanup();
        setSocialTracking(false);
      }
    };
  }, [userData?.userID, isLoggedIn, userLocation, socialTracking]);

  const fetchQuizFromAPI = async () => {
    try {
      setApiLoading(true);
      console.log('📡 Récupération des quiz depuis l\'API à:', `${URL}/quizz`);
      const response = await fetch(`${URL}/quizz`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP lors de la récupération des quiz:', response.status, errorText);
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Réponse API quiz (brute):', data);

      if (data.result && data.quiz) {
        const validQuizzes = data.quiz.filter(q => {
          const isValid = q.coordinate &&
            typeof q.coordinate.latitude === 'number' &&
            typeof q.coordinate.longitude === 'number' &&
            !isNaN(q.coordinate.latitude) &&
            !isNaN(q.coordinate.longitude);
          if (!isValid) {
            console.warn('⚠️ Quiz ignoré (coordonnées invalides):', q.name, q.coordinate);
          }
          return isValid;
        }).map(q => ({
          ...q,
          questionCount: q.quiz?.length || 5,
          totalPoints: q.quiz ? q.quiz.reduce((sum, qItem) => sum + (qItem.points || 0), 0) : 0
        }));

        setQuizLocations(validQuizzes);
        console.log(`📍 ${validQuizzes.length} quiz valides chargés et filtrés.`);
        console.log('📋 Premiers quiz validés (pour debug):', validQuizzes.slice(0, 3).map(q => ({ name: q.name, coords: q.coordinate })));
      } else {
        console.warn('⚠️ API n\'a pas renvoyé result: true ou data.quiz est vide/nul:', data);
      }
    } catch (error) {
      console.error('❌ Erreur générale lors de la récupération des quiz:', error);
      Alert.alert("Erreur de chargement", "Impossible de charger les quiz. Vérifiez votre connexion et le serveur.");
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const initializeUserLocation = async () => {
      try {
        setApiLoading(true);

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError(true);
          dispatch(updateUser({ userData: { ...userData, locationPermissions: { foreground: false } } }));
          setIsLoading(false);
          setApiLoading(false);
          return;
        }

        dispatch(updateUser({ userData: { ...userData, locationPermissions: { foreground: true } } }));

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 10000,
        });

        if (location) {
          setUserLocation(location.coords);
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Erreur géolocalisation:', error);
        setLocationError(true);
        setIsLoading(false);
      } finally {
        setApiLoading(false);
      }
    };

    initializeUserLocation();
    fetchQuizFromAPI();
  }, [isLoggedIn, userData?.userID, dispatch, URL]);

  // UN SEUL useEffect pour l'API de déverrouillage et de mise à jour de la position sociale (inchangé)
  useEffect(() => {
    if (!userLocation || !userData?.userID || quizLocations.length === 0) return;

    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`${URL}/users/unlock/${userData.userID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userLatitude: userLocation.latitude,
            userLongitude: userLocation.longitude,
            unlockedQuizzesIds: userData.unlockedQuizzes
          }),
        });

        const data = await response.json();
        console.log('✅ Full backend response for /unlock/:userId:', JSON.stringify(data, null, 2));
        if (data.result) {
          dispatch(updateUser({
            userData: {
              ...userData,
              unlockedQuizzes: data.user.unlockedQuizzes,
              rewards: data.user.rewards || userData.rewards
            }
          }));

          if (data.newUnlockedCount > 0) {
            Alert.alert(
              "Nouveau Quiz Débloqué !",
              `Un nouveau quiz a été débloqué près de toi : ${data.unlockedQuizNames.join(', ')} !`,
              [{ text: "Super !" }]
            );
          }

          if (data.nearbyUsers) {
            setNearbyUsers(data.nearbyUsers);
            if (typeof data.isVisible !== 'undefined') {
              setSocialVisible(data.isVisible);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erreur mise à jour position:', error);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [userLocation, userData?.userID, quizLocations.length, dispatch, URL]);

  // Calcul des statistiques pour l'affichage (simplifié)
  const totalScore = calculateUserTotalScore(userData);

  // Écrans de chargement et d'erreur (inchangés)
  if (!loaded) {
    return null;
  }
  if (isLoading || apiLoading) {
    return (
      <LinearGradient
        colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loaderContainer}
      >
        <AuroraBackground />
        <ActivityIndicator size="large" color="#FF7043" />
        <Text style={styles.loaderText}>
          {isLoading ? 'Localisation en cours...' : 'Chargement des quiz et joueurs...'}
        </Text>
      </LinearGradient>
    );
  }

  if (!hasLocationPermission) {
    return (
      <LinearGradient
        colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loaderContainer}
      >
        <AuroraBackground />
        <Text style={styles.errorMessage}>
          ❌ Géolocalisation non autorisée
        </Text>
        <Text style={styles.warningMessage}>
          Va dans les paramètres de l'application pour l'activer !
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={() => navigation.navigate('PermissionScreen')}>
          <Text style={styles.permissionButtonText}>Aller aux Permissions</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (locationError || !userLocation) {
    return (
      <LinearGradient
        colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loaderContainer}
      >
        <AuroraBackground />
        <Text style={styles.errorMessage}>
          ⚠️ Impossible d'obtenir ta position
        </Text>
        <Text style={styles.warningMessage}>
          Vérifie que le GPS est activé sur ton appareil.
        </Text>
      </LinearGradient>
    );
  }

  // --- COMPOSANT MODALE D'INFORMATION SUR LE QUIZ ---
  const QuizInfoModal = ({ quiz, visible, onClose, onLaunchQuiz }) => {
    if (!quiz) return null;

    const state = getQuizState(quiz); // Obtenir l'état du quiz
    const pinColor = getPinColor(state); // Couleur associée à l'état
    const stateDescription = getStateDescription(state); // Description de l'état

    // Vérifier si le quiz est déjà complété à 100%
    const isPerfectlyCompleted = state === QUIZ_STATES.PERFECT;

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <BlurView intensity={70} tint="dark" style={styles.modalOverlay}>
          <BlurView intensity={90} tint="light" style={styles.quizInfoModalContent}>
            <ScrollView contentContainerStyle={styles.quizInfoScrollViewContent}>
              {/* Image du quiz */}
              {quiz.image && (
                <Image source={{ uri: quiz.image }} style={styles.quizInfoImage} />
              )}

              {/* Titre et détails */}
              <Text style={styles.quizInfoTitle}>{quiz.name}</Text>
              <Text style={styles.quizInfoSubtitle}>
                📍 {quiz.arrondissement} ({quiz.ville}) • {quiz.themeLieu}
              </Text>
              <Text style={styles.quizInfoDescription}>{quiz.descriptionLieu}</Text>

              {/* Infos clés */}
              <View style={styles.quizInfoStatsRow}>
                <View style={styles.quizInfoStatItem}>
                  <Text style={styles.quizInfoStatLabel}>Questions</Text>
                  <Text style={styles.quizInfoStatValue}>{quiz.questionCount ?? 0}</Text>
                </View>
                <View style={styles.quizInfoStatItem}>
                  <Text style={styles.quizInfoStatLabel}>Points</Text>
                  <Text style={styles.quizInfoStatValue}>{quiz.totalPoints ?? 0}</Text>
                </View>
                <View style={styles.quizInfoStatItem}>
                  <Text style={styles.quizInfoStatLabel}>Difficulté</Text>
                  <Text style={styles.quizInfoStatValue}>{quiz.difficulteGlobale}</Text>
                </View>
                <View style={styles.quizInfoStatItem}>
                  <Text style={styles.quizInfoStatLabel}>Temps Est.</Text>
                  <Text style={styles.quizInfoStatValue}>{quiz.tempsEstime}</Text>
                </View>
              </View>

              {/* État du quiz */}
              <Text style={[styles.quizInfoState, { color: pinColor }]}>
                {stateDescription}
                {isPerfectlyCompleted && ` - Ton score: ${userData?.completedQuizzes?.[quiz._id]?.percentage ?? 0}%`}
              </Text>

              {/* Fun Fact et Conseil de visite */}
              {quiz.funFact && (
                <Text style={styles.quizInfoFunFact}>💡 Fun Fact: {quiz.funFact}</Text>
              )}
              {quiz.conseilVisite && (
                <Text style={styles.quizInfoConseil}>✨ Conseil: {quiz.conseilVisite}</Text>
              )}

              {/* Bouton d'action */}
              <TouchableOpacity
                style={[
                  styles.quizInfoActionButton,
                  { backgroundColor: state === QUIZ_STATES.UNLOCKED ? '#4CAF50' : '#FF9800' }, // Vert pour Lancer, Orange pour Verrouillé/Terminé
                  (state === QUIZ_STATES.LOCKED || isPerfectlyCompleted) && { opacity: 0.7 } // Moins d'opacité si non jouable ou parfait
                ]}
                onPress={() => onLaunchQuiz(quiz)}
                disabled={state === QUIZ_STATES.LOCKED || isPerfectlyCompleted} // Désactiver si verrouillé ou déjà parfait
              >
                <Text style={styles.quizInfoActionButtonText}>
                  {state === QUIZ_STATES.UNLOCKED ? 'Lancer le Quiz 🚀' :
                    state === QUIZ_STATES.LOCKED ? 'Quiz Verrouillé 🔒' :
                      isPerfectlyCompleted ? 'Quiz Parfait ! 🎉' :
                        'Rejouer le Quiz 💪'}
                </Text>
              </TouchableOpacity>

              {/* Bouton de fermeture */}
              <TouchableOpacity style={styles.quizInfoCloseButton} onPress={onClose}>
                <Text style={styles.quizInfoCloseButtonText}>Fermer</Text>
              </TouchableOpacity>
            </ScrollView>
          </BlurView>
        </BlurView>
      </Modal>
    );
  };
  // --- FIN COMPOSANT MODALE D'INFORMATION SUR LE QUIZ ---


  return (
    <View style={styles.container}>
      <AuroraBackground />
      {/* ENCADREMENT TIQUIZ GLASSMORPHISM */}
      <BlurView intensity={80} style={styles.headerFrame}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.tiquizTitle}>🎯 TiQuiz</Text>
              {/* Le sous-titre est maintenant un message général et simplifié */}
              <Text style={styles.headerSubtitle}>
                Explore les quiz autour de toi !
              </Text>
              {/* 🌍 INDICATEUR SOCIAL (inchangé) */}
              <View style={styles.socialIndicator}>
                <Text style={styles.socialText}>
                  {socialVisible ? '👁️' : '👻'} {nearbyUsers.length} joueurs dans la zone
                </Text>
                {/* <Text style={styles.lastUpdateText}>
                  Dernière MàJ: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text> */}
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{totalScore}</Text>
              <TouchableOpacity
                style={styles.socialToggle}
                onPress={() => setShowSocialUsers(!showSocialUsers)}
              >
                <FontAwesome
                  name={showSocialUsers ? "users" : "user"}
                  size={14}
                  color={showSocialUsers ? "#4CAF50" : "#999"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </BlurView>

      {/* CARTE */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : undefined}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Pin utilisateur custom */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <UserPin />
          </Marker>
        )}


        {/* 👥 UTILISATEURS SOCIAUX */}
// Dans MapScreen.js, à l'intérieur du MapView
        {showSocialUsers && nearbyUsers.map((user) => {
          // AJOUTEZ CETTE VÉRIFICATION STRICTE DIRECTEMENT DANS LE MAP
          if (!user || !user.location || typeof user.location.latitude !== 'number' || typeof user.location.longitude !== 'number') {
            console.warn('⚠️ MapScreen: Marqueur utilisateur ignoré à cause de coordonnées invalides/manquantes:', user);
            return null; // Retourne null pour ne pas rendre ce marqueur
          }

          // Exclure l'utilisateur connecté lui-même des "joueurs à proximité"
          if (user.id === userData.userID) {
            return null;
          }

          // Si toutes les vérifications passent, le marqueur peut être rendu
          return (
            <UserMarker
              key={user.id} // La clé est essentielle
              user={user}
              onPress={() => handleUserPress(user)}
            // Le composant UserMarker s'occupe déjà de prendre les coordonnées de user.location
            // Donc, vous n'avez pas besoin de passer la prop 'coordinate' explicitement ici.
            // Le UserMarker lira user.location.latitude et user.location.longitude directement depuis l'objet 'user'.
            // Si vous avez absolument besoin de la passer, assurez-vous qu'elle est correcte :
            // coordinate={{ latitude: user.location.latitude, longitude: user.location.longitude }}
            />
          );
        })}


        {quizLocations.map((quiz) => {
          // Simplifié car backend envoie déjà des nombres directement dans quiz.coordinate
          if (!quiz.coordinate || typeof quiz.coordinate.latitude !== 'number' || typeof quiz.coordinate.longitude !== 'number' || isNaN(quiz.coordinate.latitude) || isNaN(quiz.coordinate.longitude)) {
            console.warn('⚠️ Marker ignoré (coordonnées invalides):', quiz.name, quiz.coordinate);
            return null; // Ne pas rendre ce marqueur
          }
          // console.log('✅ Rendu du quiz:', quiz.name, quiz.coordinate); // Décommenter pour un log par marqueur

          return (
            <Marker
              key={quiz._id}
              coordinate={quiz.coordinate}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => handleQuizPress(quiz)} // Ouvre la modale d'infos
            >
              <CustomPin quiz={quiz} />
              <Callout tooltip>
                <BlurView intensity={70} tint="dark" style={styles.calloutBlurContainer}>
                  <View style={styles.calloutInnerContainer}>
                    <Text style={styles.calloutTitle}>{quiz.name}</Text>
                    <Text style={styles.calloutArrondissement}>
                      📍 {quiz.arrondissement} • {quiz.themeLieu}
                    </Text>
                    <Text style={styles.calloutDescription} numberOfLines={2}>
                      {quiz.descriptionLieu}
                    </Text>
                    <Text style={styles.calloutInfo}>
                      📚 {quiz.questionCount ?? 0} questions • 🏆 {quiz.totalPoints ?? 0} pts
                    </Text>
                    <Text style={styles.calloutDifficulty}>
                      Difficulté: {quiz.difficulteGlobale} • ⏱️ {quiz.tempsEstime}
                    </Text>
                    <Text style={styles.calloutPopularity}>
                      ⭐ {quiz.popularite}/5 {quiz.accessible ? '• ♿ Accessible' : ''}
                    </Text>
                    {quiz.badgeDebloque && (
                      <Text style={styles.calloutBadge}>
                        🏅 {quiz.badgeDebloque}
                      </Text>
                    )}
                    <Text style={[
                      styles.calloutState,
                      { color: getPinColor(getQuizState(quiz)) }
                    ]}>
                      {getStateDescription(getQuizState(quiz))}
                    </Text>
                  </View>
                </BlurView>
              </Callout>
            </Marker>
          )
        })}
      </MapView>

      {/* LÉGENDE (inchangée) */}
      <BlurView intensity={80} style={styles.legendFrame}>
        <LinearGradient
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
            {showSocialUsers && (
              <View style={styles.legendItem}>
                <FontAwesome name="users" size={12} color="#9C27B0" />
                <Text style={styles.legendText}>Joueurs</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </BlurView>

      {/* MODAL DE PROFIL UTILISATEUR (inchangé) */}
      {selectedUser && (
        <Modal
          visible={showUserProfile}
          transparent={true}
          animationType="fade"
          onRequestClose={closeUserProfile}
        >
          <BlurView intensity={70} tint="dark" style={styles.modalOverlay}>
            <BlurView intensity={90} tint="light" style={styles.userProfileModalContent}>
              <View style={styles.profileHeaderModal}>
                <View style={styles.profileAvatarContainerModal}>
                  {selectedUser.avatar ? (
                    <Image source={{ uri: selectedUser.avatar }} style={styles.profileAvatarModal} />
                  ) : (
                    <View style={[styles.profileAvatarModal, styles.defaultAvatarLargeModal]}>
                      <Text style={styles.profileAvatarTextModal}>
                        {selectedUser.username ? selectedUser.username.charAt(0).toUpperCase() : '?'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.profileInfoModal}>
                  <Text style={styles.profileUsernameModal}>{selectedUser.username}</Text>
                  <Text style={styles.profileTitleModal}>{selectedUser.achievements?.title || 'Aventurier TiQuiz'}</Text>

                  {selectedUser.duelStats && (
                    <View style={styles.duelRankContainerModal}>
                      <Text style={styles.duelRankIconModal}>
                        {selectedUser.duelStats.rank === 'Champion Légendaire' ? '👑' :
                          selectedUser.duelStats.rank === 'Maître Duelliste' ? '⚔️' :
                            selectedUser.duelStats.rank === 'Guerrier Expérimenté' ? '🛡️' :
                              selectedUser.duelStats.rank === 'Combattant' ? '⚡' :
                                selectedUser.duelStats.rank === 'Apprenti Guerrier' ? '🗡️' : '🛡️'}
                      </Text>
                      <Text style={styles.duelRankTextModal}>{selectedUser.duelStats?.rank || 'Recrue'}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.closeButtonModal} onPress={closeUserProfile}>
                  <FontAwesome name="times" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <LinearGradient
                colors={selectedUser.achievements?.trophy?.includes('Diamant') ? ['#B9F2FF', '#00BCD4'] :
                  selectedUser.achievements?.trophy?.includes('Or') ? ['#FFD700', '#FFA500'] :
                    selectedUser.achievements?.trophy?.includes('Argent') ? ['#C0C0C0', '#A0A0A0'] :
                      selectedUser.achievements?.trophy?.includes('Bronze') ? ['#CD7F32', '#A0522D'] :
                        ['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.mainTrophyContainerModal}
              >
                <Text style={styles.trophyIconLargeModal}>
                  {selectedUser.achievements?.trophy?.includes('Diamant') ? '💎' :
                    selectedUser.achievements?.trophy?.includes('Or') ? '🥇' :
                      selectedUser.achievements?.trophy?.includes('Argent') ? '🥈' :
                        selectedUser.achievements?.trophy?.includes('Bronze') ? '🥉' :
                          selectedUser.achievements?.trophy?.includes('Feu') ? '🔥' :
                            selectedUser.achievements?.trophy?.includes('Éclair') ? '⚡' :
                              selectedUser.achievements?.trophy?.includes('Étoile') ? '⭐' : '🎯'}
                </Text>
                <Text style={styles.trophyTitleModal}>{selectedUser.achievements?.trophy || 'Explorateur TiQuiz'}</Text>
              </LinearGradient>

              <Text style={styles.sectionTitleModal}>🎯 Statistiques Quiz</Text>
              <View style={styles.statsGridModal}>
                <View style={styles.statCardModal}>
                  <Text style={styles.statNumberModal}>{selectedUser.achievements?.totalBadges || 0}</Text>
                  <Text style={styles.statLabelModal}>Badges</Text>
                </View>
                <View style={styles.statCardModal}>
                  <Text style={styles.statNumberModal}>{selectedUser.achievements?.perfectQuizzes || 0}</Text>
                  <Text style={styles.statLabelModal}>Quiz Parfaits</Text>
                </View>
                <View style={styles.statCardModal}>
                  <Text style={styles.statNumberModal}>{selectedUser.achievements?.bestStreak || 0}</Text>
                  <Text style={styles.statLabelModal}>Meilleur Streak</Text>
                </View>
              </View>

              {selectedUser.duelStats && (
                <>
                  <Text style={styles.sectionTitleModal}>⚔️ Statistiques Duels</Text>
                  <View style={styles.statsGridModal}>
                    <View style={styles.statCardModal}>
                      <Text style={[styles.statNumberModal, { color: '#4CAF50' }]}>
                        {selectedUser.duelStats.victories || 0}
                      </Text>
                      <Text style={styles.statLabelModal}>Victoires</Text>
                    </View>
                    <View style={styles.statCardModal}>
                      <Text style={[styles.statNumberModal, { color: '#F44336' }]}>
                        {selectedUser.duelStats.defeats || 0}
                      </Text>
                      <Text style={styles.statLabelModal}>Défaites</Text>
                    </View>
                    <View style={styles.statCardModal}>
                      <Text style={[styles.statNumberModal, { color: '#FF9800' }]}>
                        {selectedUser.duelStats.winRate || 0}%
                      </Text>
                      <Text style={styles.statLabelModal}>Taux Victoire</Text>
                    </View>
                  </View>

                  {selectedUser.duelStats.vsYou && selectedUser.duelStats.vsYou.length > 0 && (
                    <View style={styles.duelHistorySectionModal}>
                      <Text style={styles.sectionTitleModal}>🥊 Vos Affrontements</Text>
                      <View style={styles.duelHistoryContainerModal}>
                        <View style={styles.duelSummaryModal}>
                          <Text style={styles.duelSummaryTextModal}>
                            Victoires: {selectedUser.duelStats.vsYou.filter(d => d.winner === selectedUser.id).length} -
                            {selectedUser.duelStats.vsYou.filter(d => d.winner === userData.userID).length}
                          </Text>
                        </View>

                        <View style={styles.recentDuelsContainerModal}>
                          {selectedUser.duelStats.vsYou.slice(0, 3).map((duel, index) => (
                            <View key={index} style={styles.duelHistoryItemModal}>
                              <View style={[
                                styles.duelResultDotModal,
                                { backgroundColor: duel.winner === selectedUser.id ? '#F44336' : '#4CAF50' }
                              ]} />
                              <Text style={styles.duelHistoryTextModal}>
                                {duel.playerScore} - {duel.opponentScore}
                              </Text>
                              <Text style={styles.duelHistoryDateModal}>
                                {new Date(duel.date).toLocaleDateString()}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  )}
                </>
              )}

              {selectedUser.badges && selectedUser.badges.length > 0 && (
                <View style={styles.badgesSectionModal}>
                  <Text style={styles.sectionTitleModal}>🏅 Derniers Badges</Text>
                  <View style={styles.badgesContainerModal}>
                    {selectedUser.badges.slice(0, 6).map((badge, index) => (
                      <View key={index} style={styles.badgeChipModal}>
                        <Text style={styles.badgeEmojiModal}>🏅</Text>
                        <Text style={styles.badgeNameModal}>{badge.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.actionsRowModal}>
                <TouchableOpacity
                  style={[styles.actionButtonModal, styles.duelButtonModal]}
                  onPress={() => {
                    closeUserProfile();
                    SocialLocationService.sendDuelInvitation(userData.userID, selectedUser.id);
                  }}
                >
                  <FontAwesome name="bolt" size={16} color="#fff" />
                  <Text style={[styles.actionTextModal, { color: '#fff' }]}>Défier ⚔️</Text>
                </TouchableOpacity>

                {selectedUser.canReceiveMessages && (
                  <TouchableOpacity style={styles.actionButtonModal}>
                    <FontAwesome name="comments" size={16} color="#4A90E2" />
                    <Text style={styles.actionTextModal}>Message</Text>
                  </TouchableOpacity>
                )}
              </View>
            </BlurView>
          </BlurView>
        </Modal>
      )}

      {/* Modal d'invitation de duel (inchangé) */}
      <DuelInvitationModal
        visible={showDuelModal}
        onClose={() => setShowDuelModal(false)}
        challengerData={duelInvitation?.challenger}
        duelId={duelInvitation?.duelId}
        onAccept={(duel) => {
          setShowDuelModal(false);
          console.log("Duel accepté, navigation vers le jeu:", duel);
        }}
        onDecline={() => {
          setShowDuelModal(false);
          console.log("Duel décliné.");
          setDuelInvitation(null);
        }}
      />
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
  calloutBlurContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    width: 320,
    height: 'auto',
    padding: 10,
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
  // 🌍 NOUVEAUX STYLES SOCIAUX
  socialIndicator: {
    marginTop: 2,
  },
  socialText: {
    fontSize: 10,
    fontFamily: "Fustat-Regular.ttf",
    color: '#9C27B0',
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
  socialToggle: {
    marginTop: 4,
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  // Legend frame (Liquid Glass)
  legendFrame: {
    position: 'absolute',
    bottom: 100,
    left: 15,
    right: 15,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
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
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
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
    backgroundColor: '#FF7043', // Orange pour l'utilisateur
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    overflow: 'hidden',
  },
  userPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  // 🌍 STYLE POUR LES MARQUEURS SOCIAUX
  socialUserMarker: {
    // S'intègre avec le style liquid glass existant
  },

  // Callout styling (Optimisé pour la lisibilité)
  calloutContainer: {
    width: 280,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    overflow: 'hidden',
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

  // Styles pour le Modal de profil utilisateur (Social Map)
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Arrière-plan semi-transparent pour l'overlay
  },
  userProfileModalContent: {
    width: '90%',
    borderRadius: 25,
    padding: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fond translucide pour l'effet verre
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  profileHeaderModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatarContainerModal: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 152, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  profileAvatarModal: {
    width: 70,
    height: 70,
    borderRadius: 35,
    resizeMode: 'cover',
  },
  defaultAvatarLargeModal: {
    backgroundColor: '#FFB74D',
  },
  profileAvatarTextModal: {
    fontFamily: "Fustat-ExtraBold.ttf",
    fontSize: 36,
    color: '#fff',
  },
  profileInfoModal: {
    flex: 1,
  },
  profileUsernameModal: {
    fontFamily: "Fustat-ExtraBold.ttf",
    fontSize: 26,
    color: '#FF7043',
    marginBottom: 3,
  },
  profileTitleModal: {
    fontFamily: "Fustat-SemiBold.ttf",
    fontSize: 16,
    color: '#4a4a4a',
  },
  closeButtonModal: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  duelRankContainerModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  duelRankIconModal: {
    fontSize: 16,
    marginRight: 5,
  },
  duelRankTextModal: {
    fontFamily: "Fustat-Bold.ttf",
    fontSize: 14,
    color: '#FF9800',
  },
  mainTrophyContainerModal: {
    width: '100%',
    height: 100,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  trophyIconLargeModal: {
    fontSize: 40,
    marginBottom: 5,
  },
  trophyTitleModal: {
    fontFamily: "Fustat-ExtraBold.ttf",
    fontSize: 20,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sectionTitleModal: {
    fontFamily: "Fustat-Bold.ttf",
    fontSize: 18,
    color: '#FF7043',
    marginBottom: 15,
    marginTop: 15,
    textAlign: 'center',
  },
  statsGridModal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statCardModal: {
    width: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statNumberModal: {
    fontFamily: "Fustat-ExtraBold.ttf",
    fontSize: 24,
    color: '#4a4a4a',
  },
  statLabelModal: {
    fontFamily: "Fustat-Regular.ttf",
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  duelHistorySectionModal: {
    marginBottom: 20,
  },
  duelHistoryContainerModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  duelSummaryModal: {
    alignItems: 'center',
    marginBottom: 10,
  },
  duelSummaryTextModal: {
    fontFamily: "Fustat-SemiBold.ttf",
    fontSize: 16,
    color: '#4a4a4a',
  },
  recentDuelsContainerModal: {},
  duelHistoryItemModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  duelResultDotModal: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  duelHistoryTextModal: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Fustat-Regular.ttf",
    color: '#333',
  },
  duelHistoryDateModal: {
    fontSize: 11,
    fontFamily: "Fustat-Regular.ttf",
    color: '#999',
  },
  badgesSectionModal: {
    marginBottom: 20,
  },
  badgesContainerModal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badgeChipModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  badgeEmojiModal: {
    fontSize: 16,
    marginRight: 5,
  },
  badgeNameModal: {
    fontSize: 13,
    color: '#FF7043',
    fontWeight: '600',
  },
  actionsRowModal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButtonModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 120,
    justifyContent: 'center',
  },
  actionTextModal: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  duelButtonModal: {
    backgroundColor: '#FF7043',
    borderColor: '#FF9800',
  },

  // --- NOUVEAUX STYLES POUR LA MODALE D'INFORMATION SUR LE QUIZ ---
  quizInfoModalContent: {
    width: '90%',
    maxHeight: '85%', // Pour permettre le défilement
    borderRadius: 25,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fond translucide
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
  },
  quizInfoScrollViewContent: {
    flexGrow: 1, // Permet le défilement si le contenu dépasse
    alignItems: 'center', // Centrer le contenu horizontalement
  },
  quizInfoImage: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    marginBottom: 15,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  quizInfoTitle: {
    fontFamily: "Fustat-ExtraBold.ttf",
    fontSize: 26,
    color: '#FF7043',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  quizInfoSubtitle: {
    fontFamily: "Fustat-SemiBold.ttf",
    fontSize: 15,
    color: '#FF9800',
    textAlign: 'center',
    marginBottom: 10,
  },
  quizInfoDescription: {
    fontFamily: "Fustat-Regular.ttf",
    fontSize: 14,
    color: '#4a4a4a',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  quizInfoStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  quizInfoStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quizInfoStatLabel: {
    fontFamily: "Fustat-Regular.ttf",
    fontSize: 11,
    color: '#666',
    marginBottom: 3,
  },
  quizInfoStatValue: {
    fontFamily: "Fustat-Bold.ttf",
    fontSize: 16,
    color: '#4a4a4a',
  },
  quizInfoState: {
    fontFamily: "Fustat-Bold.ttf",
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  quizInfoFunFact: {
    fontFamily: "Fustat-Regular.ttf",
    fontSize: 13,
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 10,
  },
  quizInfoConseil: {
    fontFamily: "Fustat-Regular.ttf",
    fontSize: 13,
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  quizInfoActionButton: {
    width: '80%',
    paddingVertical: 15,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  quizInfoActionButtonText: {
    fontFamily: "Fustat-ExtraBold.ttf",
    fontSize: 18,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  quizInfoCloseButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  quizInfoCloseButtonText: {
    fontFamily: "Fustat-SemiBold.ttf",
    fontSize: 16,
    color: '#FF7043',
  },
});