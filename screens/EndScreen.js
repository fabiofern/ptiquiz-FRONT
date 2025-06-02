import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, FlatList, ScrollView, ImageBackground, Animated, Easing, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { addUserToStore, userLogout } from '../reducers/users'
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LottieView from "lottie-react-native";

const URL = process.env.EXPO_PUBLIC_BACKEND_URL

export default function EndScreen({ navigation }) {
    const dispatch = useDispatch();
    const userRedux = useSelector((state) => state.users.value)
    const username = userRedux.username
    const [validated, setValidated] = useState('true')
    const [conclusionScenario, setConclusionScenario] = useState('')
    const [conclucionscenariofailed, setconclucionscenariofailed] = useState('')
    const [score, setScore] = useState(0)
    const confettiRef = useRef(null);
    const rocketRef = useRef(null);

    //RECUPERATION DONNEES SCENARIO
    useEffect(() => {
        fetch(`${URL}/scenarios/${userRedux.scenario}`)
            .then(response => response.json())
            .then(data => {
                // console.log(data);
                setConclusionScenario(data.conclusionScenario)
                setconclucionscenariofailed(data.conclusionScenarioFailed)
                    // setValidated(data.sessions)
                    .catch((error) => {
                        console.error('Error:', error);
                    })
            });
    }, [])

    //ANIMATION LOTTIEFILES
    useEffect(() => {
        if (validated) {
            confettiRef.current?.play();
            rocketRef.current?.play();
        }
    }, [validated]);


    // ANIMATION TEXT
    const [textHeight, setTextHeight] = useState(0); // Stocke la hauteur du texte
    const boxHeight = 100; // Hauteur fixe de la boîte contenant le texte
    const lineHeight = 50; // Hauteur approximative d'une ligne de texte
    const translateY = useRef(new Animated.Value(0)).current; // On démarre à 0

    const duration = 35000; // Durée du défilement

    useEffect(() => {
        if (textHeight > 0) {
            translateY.setValue(boxHeight + lineHeight); // Position initiale : texte en bas de la boîte
            Animated.loop(
                Animated.timing(translateY, {
                    toValue: -textHeight, // Défilement vers le haut
                    duration: duration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [textHeight]); // Attendre d'avoir la hauteur du texte


    return (
        <View style={styles.container}>
            <SafeAreaView />
            <ImageBackground source={require('../assets/imgsAventure/FondAventure01X.png')}
                style={{ width: '100%', height: '100%', position: 'absolute' }} />
            <LottieView ref={confettiRef} source={require('../assets/Animation_confetti.json')}
                style={styles.confetti}
                loop={false}
                speed={0.8}
            />
            <LottieView ref={rocketRef} source={require('../assets/Animation_rocket.json')}
                style={styles.rocket}
                loop={false}
                speed={0.6}
            />
            <View style={styles.titleBox}>
                <ImageBackground source={require('../assets/imgsAventure/modaleSimpleX.png')}
                    resizeMode="stretch" style={styles.ImageModalContent}>
                    {validated ? <Text style={styles.textTitle}>BRAVO !!!</Text>
                        : <Text style={styles.textTitle}>Dommage {username}, vous n'avez pas réussi à nous sauver à temps...</Text>}
                    {validated ? <Text style={styles.textTitle}>Mission Accomplie {username} !</Text>
                        : <Text style={styles.textTitle}>Dommage {username}, vous n'avez pas réussi à nous sauver à temps...</Text>}
                </ImageBackground>
            </View>

            <View style={styles.conclusionBox}>
                <Animated.View style={{ transform: [{ translateY }] }}>
                    <Text onLayout={(event) => setTextHeight(event.nativeEvent.layout.height)} style={styles.textConclusion}>
                        {validated ? conclusionScenario : conclucionscenariofailed}
                    </Text>
                </Animated.View>
            </View>

            <View style={styles.buttonContainer}>
                <View style={styles.pointsBox}>
                    {validated && <Text style={styles.textPoints}>Vous avez gagné :</Text>}
                    {validated && <Text style={styles.textPointsTotal}> {userRedux.scoreSession} points !</Text>}
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('Map')}>
                    <View style={styles.button}>
                        <ImageBackground source={require('../assets/imgsAventure/bbtnOffX.png')} style={styles.ImageButton}>
                            <Text style={styles.textButton}>Retour à l'accueil</Text>
                        </ImageBackground>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        // backgroundColor: 'green',
        justifyContent: "center",
        alignItems: 'center'
    },

    titleBox: { //Title Box
        flex: 1,
        width: 300,
        height: 300,
        // backgroundColor: 'green',
        justifyContent: "center",
        alignItems: 'center',
        marginTop: 15,
    },
    ImageModalContent: {
        width: "100%",
        height: "95%",
        alignItems: "center",
        justifyContent: "center",
    },

    textTitle: {
        width: '80%',
        fontFamily: 'PressStart2P-Regular.ttf',
        fontSize: 25,
        color: '#72BF11',
        textAlign: 'center',
        lineHeight: 40,
    },

    conclusionBox: { //Conclusion Box
        flex: 1,
        width: '80%',
        height: 100,
        overflow: 'hidden', // Masque le texte dépassant
        justifyContent: 'center',
    },
    textConclusion: {
        fontFamily: 'Goldman-Bold.ttf',
        textAlign: 'justify',
        fontSize: 24,
        color: 'white',
        textAlign: 'center',
        position: 'absolute', // Permet d'appliquer `translateY`
    },

    pointsBox: { //Points Box
        flex: 1,
        width: '100%',
        height: '50%',
        // backgroundColor: 'yellow',
        justifyContent: "center",
        alignItems: 'center'
    },
    textPoints: {
        fontFamily: 'Goldman-Regular.ttf',
        fontSize: 25,
        color: 'white',
        textAlign: 'center',
        marginTop: 25,
    },
    textPointsTotal: {
        fontFamily: 'Goldman-Regular.ttf',
        fontSize: 50,
        color: 'white',
        textAlign: 'center',
        marginTop: -16,
    },

    buttonContainer: { //Button Container
        flex: 1,
        width: '100%',
        // backgroundColor: 'red',
        justifyContent: "center",
        alignItems: 'center'
    },
    button: {
        alignItems: 'center',
        height: 100,
        width: '50%',
    },
    ImageButton: {
        width: 280,
        height: 80,
        alignItems: "center",
        justifyContent: "center",
    },

    textButton: {
        fontFamily: 'Goldman-Regular.ttf',
        fontSize: 25,
        color: "white",
        textAlign: "center",
        width: "100%",
    },

    confetti: {  // Animation
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    rocket: {
        position: 'absolute',
        top: 275,
        // backgroundColor: 'blue',
        width: 300,
        height: 300,
    },
})