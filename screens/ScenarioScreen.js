import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  ScrollView,
  ImageBackground,
  Image,
  TouchableOpacity
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { addUserToStore, userLogout } from "../reducers/users";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

const URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ScenarioScreen({ navigation }) {
  const [loaded] = useFonts({
    "PressStart2P-Regular.ttf": require("../assets/fonts/PressStart2P-Regular.ttf"),
    "Goldman-Regular.ttf": require("../assets/fonts/Goldman-Regular.ttf"),
    "Goldman-Bold.ttf": require("../assets/fonts/Goldman-Bold.ttf"),
  });

  useEffect(() => {
    // cacher l'écran de démarrage si la police est chargée ou s'il y a une erreur
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Retourner null tant que la police n'est pas chargée
  if (!loaded) {
    return null;
  }

  const dispatch = useDispatch();
  const userRedux = useSelector((state) => state.users.value);
  const scenarioUpdated = encodeURIComponent(userRedux.scenario); /// fonction remplacant tous les caracteres speciaux pour les rendre comprehensibles par le fetch

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulte, setdifficulte] = useState("");
  const [theme, setTheme] = useState("");
  const [duree, setDuree] = useState("");
  const [buttonImage, setButtonImage] = useState(
    require("../assets/imgsAventure/btnOffX.png")
  );

  useEffect(() => {
    console.log("Redux state:", userRedux);
    console.log("scenario updates avant fetch", scenarioUpdated);
    fetch(`${URL}/scenarios/${scenarioUpdated}`)
      .then((response) => response.json())
      .then((data) => {
        // console.log(data);
        setTitle(data.name);
        setDescription(data.descriptionScenario);
        setdifficulte(data.difficulte);
        setTheme(data.theme);
        setDuree(data.duree);
        // console.log(data.difficulte)
        // console.log(data)
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }, [userRedux]);

  const handleButtonPress = () => {
    setButtonImage(require("../assets/imgsAventure/btnOnX.png"));
    setTimeout(() => {
      setButtonImage(require("../assets/imgsAventure/btnOffX.png"));
      navigation.navigate("StartGame");
    }, 100); // Réinitialiser l'image après 100ms
  };

  return (<View style={{ flex: 1 }}>


    <View style={styles.container}>
      <ImageBackground source={require("../assets/imgsAventure/FondAventure01X.png")} style={styles.backgroundImage}>
        <SafeAreaView />
        <View style={styles.modaleContainer}>
          <ImageBackground
            source={require("../assets/imgsAventure/GmodaleX.png")}
            style={styles.modaleImg}
            resizeMode={"stretch"}
          >
            <View style={styles.textContainer}>
              <Text style={styles.textTitre}>{userRedux.scenario}</Text>

              <Text style={styles.textInfo}>
                {theme},  {duree}min,  {difficulte}
              </Text>

              <ScrollView style={styles.ScrollView}>
                <Text style={styles.textDescripiton}>{description}</Text>
              </ScrollView>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.buttonplace}>
            <TouchableOpacity style={styles.buttonImg} onPress={() => navigation.navigate('StartGame')}>
              <ImageBackground source={require('../assets/imgsAventure/bbtnOffX.png')} resizeMode='stretch' style={styles.buttonImg}>
                <Text style={styles.text}>GO !</Text>
              </ImageBackground>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonplace}>
            <TouchableOpacity style={styles.buttonImg} onPress={() => navigation.goBack()}>
              <ImageBackground source={require('../assets/imgsAventure/bbtnOffX.png')} resizeMode='stretch' style={styles.buttonImg}>
                <Text style={styles.text}>SORTIR</Text>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        </View>


      </ImageBackground>
    </View>
  </View>
  );
}

const styles = StyleSheet.create({
  text: {
    color: "white",
    fontFamily: "Goldman-Bold.ttf",
    fontSize: 20,
  },
  buttonplace: {
    width: '85%',
    height: 70,
    justifyContent: 'space-between',
    alignItems: 'center',

  },
  buttonContainer: {
    justifyContent: "space-around",
    alignItems: "center",
    height: "20%",
    width: "100%",
    marginBottom: 100,
  },

  container: {
    flex: 1,
    backgroundColor: "#484D5B",

  },

  backgroundImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  modaleContainer: {
    height: "65%",
    width: "86%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },

  modaleImg: {
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  textTitre: {
    fontFamily: "Goldman-Bold.ttf",
    lineHeight: 40,
    fontSize: 36,
    color: "white",
    marginTop: 50,
    marginLeft: 40,
    marginRight: 40,
  },

  textInfo: {
    color: "white",
    fontFamily: "Goldman-Regular.ttf",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    marginLeft: 40,
    marginRight: 40,
  },

  ScrollView: {
    height: 100,
    marginTop: 20,
    marginBottom: 90,
  },

  textDescripiton: {
    fontFamily: "PressStart2P-Regular.ttf",
    lineHeight: 20,
    fontSize: 13,
    color: "#72BF11",
    marginTop: 0,
    marginLeft: 40,
    marginRight: 40,
  },

  buttonStyle: {
    justifyContent: "center",
    alignItems: "center",
    height: "50%",
    width: "85%",
  },

  buttonImg: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%",
  },

  buttonText: {
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Goldman-Bold.ttf",
    color: "white",
    fontSize: 20,
  },
});
