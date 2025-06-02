// Composants
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ImageBackground,
  Text,
  Modal,
  Pressable,
  Animated,
  ActivityIndicator,
} from "react-native";
import { TouchableWithoutFeedback } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Map
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

// Icones
import FontAwesome from "react-native-vector-icons/FontAwesome";

// Etats & Redux
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addUserToStore } from "../reducers/users";

import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useIsFocused } from "@react-navigation/native";

SplashScreen.preventAutoHideAsync();

// URL back
const URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// distances d'entré dans le périmètre d'un jeu
const PROXIMITY_THRESHOLD = 100;

// calcule de la distance entre l'utilisateur et un jeu
const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function MapScreen({ navigation }) {
  const [loaded] = useFonts({
    "Fustat-Bold.ttf": require("../assets/fonts/Fustat-Bold.ttf"),
    "Fustat-ExtraBold.ttf": require("../assets/fonts/Fustat-ExtraBold.ttf"),
    "Fustat-ExtraLight.ttf": require("../assets/fonts/Fustat-ExtraLight.ttf"),
    "Fustat-Light.ttf": require("../assets/fonts/Fustat-Light.ttf"),
    "Fustat-Medium.ttf": require("../assets/fonts/Fustat-Medium.ttf"),
    "Fustat-Regular.ttf": require("../assets/fonts/Fustat-Regular.ttf"),
    "Fustat-SemiBold.ttf": require("../assets/fonts/Fustat-SemiBold.ttf"),
    "Homenaje-Regular.ttf": require("../assets/fonts/Homenaje-Regular.ttf"),
    "FugazOne-Regular.ttf": require("../assets/fonts/FugazOne-Regular.ttf"),
    "Exo2-ExtraBold.ttf": require("../assets/fonts/Exo2-ExtraBold.ttf"),
  });
  const isFocused = useIsFocused();
  useEffect(() => {
    // cacher l'écran de démarrage si la police est chargée ou s'il y a une erreur
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Retourner null tant que la police n'est pas chargée

  // État pour la position de l'utilisateur
  const [userLocation, setUserLocation] = useState({
    latitude: 0,
    longitude: 0,
  });

  // États pour l'affichage de la modale
  const [modalInfo, setModalInfo] = useState(false);
  const [modalExpanded, setModalExpanded] = useState(false);
  const [quizzData, setQuizzData] = useState([]);


  // États pour l'affichage des markers et des infos dans la modale
  const [scenariosData, setScenariosData] = useState([]);
  const [modalGameName, setModalGameName] = useState("");
  const [modalGameDuration, setModalGameDuration] = useState("");
  const [modalGameInfo, setModalGameInfo] = useState("");
  const [modalGameTheme, setModalGameTheme] = useState("");
  const [passageaujeu, setPassageaujeu] = useState(false);

  const [selectedScenario, setSelectedScenario] = useState(null);
  const [modalChoice, setModalChoice] = useState(false);

  const [isUserNear, setIsUserNear] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [geolocationError, setGeolocationError] = useState(false);
  const [fadeIn, setFadeIn] = useState(new Animated.Value(0));
  const [response, setResponse] = useState("");


  const userRedux = useSelector((state) => state.users.value);

  const dispatch = useDispatch();

  const mapRef = useRef(null);

  const newFormatAvatar = userRedux.avatar.includes("/upload/")
    ? userRedux.avatar.replace("/upload/", "/upload/w_230,h_230,r_30/")
    : userRedux.avatar;

  const gameMarker = {
    scenario: require("../assets/pinGameok.png"),
  };

  const choosenScenario = (data) => {
    console.log("data =>", data);
    dispatch(
      addUserToStore({
        scenario: data.scenario,
        scenarioID: data.scenarioID,
      })
    );
  };

  useEffect(() => {
    if (userRedux.scenarioID && userRedux.userID) {
      fetch(
        `${URL}/scenarios/createSession/${userRedux.scenarioID}/${userRedux.userID}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId: userRedux.scenarioID,
            userId: userRedux.userID,
            restart: response,
          }),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          console.log("log de creation de session", data.validatedEpreuves);
          if (data.validatedEpreuves == 0 || data.validatedEpreuves == null) {
            console.log("zero etape fini");
            navigation.navigate("Scenario");
          } else if (data.validatedEpreuves !== 0) {
            setModalInfo(false);
            setModalExpanded(false);
            setModalChoice(true);
            console.log(" quelques etapes finis modal affichee ");
            if (response === true) {
              console.log("reponse true envoi au scenario");
              setResponse("");
              navigation.navigate("Scenario");
            } else if (response === false) {
              console.log("reponse false envoi au ingame screens");
              setResponse("");
              navigation.navigate(`Ingame${data.validatedEpreuves + 1}`);
            }
          }
        });
    }
  }, [userRedux, response]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted" && isFocused) {
        Location.watchPositionAsync({ distanceInterval: 10 }, (loc) => {
          setUserLocation(loc.coords);
          setIsLoading(false);
          setGeolocationError(false);

          Animated.timing(fadeIn, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }).start();
        });
      } else {
        setIsLoading(false);
        setGeolocationError(true);
      }
    })();
  }, [isFocused]);

  // Récupération des données du scénario depuis la BDD
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch(`${URL}/api/quizz`);
        const data = await response.json();
        setQuizzData(data);
        console.log("quizzData reçu :", data);
      } catch (error) {
        console.error("Erreur de récupération des quizz :", error);
      }
    };

    isFocused && fetchQuizzes();
  }, [isFocused]);


  const goProfil = () => {
    navigation.navigate("Profil");
  };


  const recenterMapOnPinUser = () => {
    const { latitude, longitude } = userLocation;
    mapRef.current.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.008,
      },
      1000
    );
  };

  if (!loaded) {
    return null;
  }

  return isLoading || geolocationError ? (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#009EBA" />
        <Text style={styles.loaderText}>Chargement...</Text>
      </View>
    </SafeAreaView>
  ) : (
    <SafeAreaView style={{ flex: 1 }}>
      <Animated.View style={[styles.mapContainer, { opacity: fadeIn }]}>
        <View style={styles.container}>
          <View style={styles.mapContainer2}>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{
                latitude: userLocation.latitude || 48.866667,
                longitude: userLocation.longitude || 2.333333,
                latitudeDelta: 0.01,
                longitudeDelta: 0.008,
              }}
            >
              {userLocation && (
                <Marker
                  coordinate={userLocation}
                  image={{ uri: newFormatAvatar }}
                  onPress={() => navigation.navigate("Profil")}
                />
              )}

              {quizzData.map((quiz, i) => (
                <Marker
                  key={`quiz-${i}`}
                  coordinate={{
                    latitude: parseFloat(quiz.location.latitude),
                    longitude: parseFloat(quiz.location.longitude),
                  }}
                  image={require("../assets/pinGameok.png")} // ou autre icône si tu veux différencier
                  onPress={() => {
                    setModalGameName(quiz.name);
                    setModalInfo(true);
                  }}
                />
              ))}

            </MapView>
          </View>
        </View>

        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/imgsAventure/LogoXw.png")}
            style={styles.logo}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={recenterMapOnPinUser}>
            <FontAwesome name="map-marker" size={42} color="#85CAE4" />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonProfilContainer}>
          <TouchableOpacity onPress={goProfil}>
            <FontAwesome name="user-circle-o" size={42} color="#85CAE4" />
          </TouchableOpacity>
        </View>

        {modalChoice && (
          <Modal visible={modalChoice} animationType="fade" transparent>
            <TouchableWithoutFeedback
              onPress={() => {
                setModalChoice(false);
              }}
            >
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                  <Text style={styles.modalTitle}>{modalGameName}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setResponse(false);
                      setModalChoice(false);
                    }}
                    style={styles.modalButton}
                  >
                    <Text style={styles.modalButtonText}>
                      Reprendre ma partie
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setResponse(true);
                      setModalChoice(false);
                    }}
                    style={styles.modalButton}
                  >
                    <Text style={styles.modalButtonText}>Recommencer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

        {modalInfo && (
          <Modal visible={modalInfo} animationType="fade" transparent>
            <TouchableWithoutFeedback
              onPress={() => {
                setModalInfo(false);
                setModalExpanded(false);
              }}
            >
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                  <Text style={styles.modalTitle}>{modalGameName}</Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Fustat-ExtraBold.ttf",
  },
  btnBackground: {
    width: "100%",
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  imageBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#85CAE4",
  },

  mapContainer2: {
    alignSelf: "center",
    height: "96%",
    width: "94%",
    borderRadius: 30,
    overflow: "hidden",
  },

  map: {
    flex: 1,
    height: "100%",
    width: "100%",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    width: "80%",
    height: "40%",
    backgroundColor: "#37474F",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  modalButton: {
    width: "90%",
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF8527",
    padding: 10,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 20,
    elevation: 3,
  },

  modal: {
    direction: "row",
    justifyContent: "space-between",
  },

  logoContainer: {
    position: "absolute",
    alignSelf: "center",
    width: 110,
    height: 80,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: "#85CAE4",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "white",
  },

  logo: {
    width: "65%",
    height: "70%",
  },

  buttonContainer: {
    position: "absolute",
    bottom: 60,
    right: 0,
    flex: 1,
    width: 72,
    height: 72,
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },

  buttonProfilContainer: {
    position: "absolute",
    bottom: 160,
    right: 0,
    flex: 1,
    width: 72,
    height: 72,
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },

  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  modalView: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 30,
    width: "80%",
    // height: "50%",
    padding: 18,
    elevation: 3,
  },

  expandedModal: {},

  modalTitle: {
    fontFamily: "Exo2-ExtraBold.ttf",
    fontSize: 36,
    lineHeight: 40,
    color: "#009EBA",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  modalInfoText: {
    fontFamily: "Fustat-Regular.ttf",
    fontSize: 14,
    lineHeight: 20,
    color: "#636773",
    padding: 10,
    textAlign: "left",
  },

  modalTheme: {
    fontFamily: "Fustat-ExtraBold.ttf",
    fontSize: 14,
    lineHeight: 16,
    color: "#636773",
    textAlign: "left",
  },

  additionalInfo: {
    fontFamily: "Fustat-ExtraBold.ttf",
    fontSize: 14,
    lineHeight: 16,
    color: "#636773",
    textAlign: "left",
    marginBottom: 20,
  },

  startGameButton: {
    width: "90%",
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF8527",
    padding: 10,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 20,
    elevation: 3,
  },

  startGameButtonText: {
    fontFamily: "Fustat-ExtraBold.ttf",
    color: "white",
    fontSize: 18,
  },

  textGoAventure: {
    color: "#FF8527",
    fontFamily: "Fustat-ExtraBold.ttf",
    fontSize: 18,
    lineHeight: 20,
    textAlign: "center",
    padding: 10,
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
  },
  errorMessage: {
    fontSize: 20,
    color: "#FF6347", // Couleur rouge pour l'erreur
    fontWeight: "bold",
  },
  mapContainer: {
    flex: 1,
    backgroundColor: "white",
  },
});
