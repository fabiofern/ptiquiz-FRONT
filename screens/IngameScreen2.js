import React, { useEffect, useState, useRef } from "react";
import { ImageBackground } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
    StyleSheet,
    View,
    SafeAreaView,
    Text,
    Modal,
    TouchableOpacity,
    Animated,
    Vibration
} from 'react-native';
import { Camera, CameraType, CameraView } from 'expo-camera';
import { useNavigation } from "@react-navigation/native";
const useIsFocused = require('@react-navigation/native').useIsFocused;
const URL = process.env.EXPO_PUBLIC_BACKEND_URL
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { counterEvent } from "react-native/Libraries/Performance/Systrace";

SplashScreen.preventAutoHideAsync();


export default function IngameScreen2({ navigation }) {
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


    const userRedux = useSelector((state) => state.users.value)

    const isFocused = useIsFocused();

    const cameraRef = useRef(null);
    const [indice1, setIndice1] = useState('');
    const [indice2, setIndice2] = useState('');
    const [indice3, setIndice3] = useState('');
    const [hasPermission, setHasPermission] = useState(false);
    const [indiceModal2, setIndicemodal2] = useState(false);
    const [indiceModal3, setIndicemodal3] = useState(false);

    const [scanned1, setScanned1] = useState(false);
    const [scanned2, setScanned2] = useState(false);
    const [scanned3, setScanned3] = useState(false);
    const [SCORE, setSCORE] = useState(500);

    const [modalreveal, setModalreveal] = useState(false);
    const [indiceModal, setIndicemodal] = useState(false);

    const [game2, setGame2] = useState(false);
    const [flashColor, setFlashColor] = useState("transparent");

    const [goodQRcode1, setGoodQRcode1] = useState('https://qr.codes/vUIYq1');
    const [goodQRcode2, setGoodQRcode2] = useState('https://qr.codes/FBPR2y');
    const [goodQRcode3, setGoodQRcode3] = useState('https://qr-code.click/i/67bf284e705af');

    const flashAnim = useRef(new Animated.Value(0)).current;

    const flashScreen = (color) => {
        flashAnim.setValue(1);
        setFlashColor(color);
        Animated.timing(flashAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false
        }).start();
    };


    const shadowAnim = useRef(new Animated.Value(10)).current;


    useEffect(() => {
        fetch(`${URL}/scenarios/etapes/${userRedux.scenarioID}/${userRedux.userID}`)
            .then(response => response.json())
            .then(data => {
                console.log(data)
                setGoodQRcode1(data.expectedAnswer1);
                setGoodQRcode3(data.expectedAnswer3);
                setGoodQRcode2(data.expectedAnswer2);
                setIndice1(data.indice1)
                setIndice2(data.indice2)
                setIndice3(data.indice3);
            })
            .catch((error) => {
                console.error('Error:', error.message);
            });
    }, [userRedux.userID, userRedux.scenarioID]);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shadowAnim, { toValue: 30, duration: 1000, useNativeDriver: false }),
                Animated.timing(shadowAnim, { toValue: 10, duration: 1000, useNativeDriver: false }),
            ])
        ).start();
    }, []);

    const animatedStyle = {
        shadowRadius: shadowAnim,
        shadowOpacity: shadowAnim.interpolate({
            inputRange: [10, 20],
            outputRange: [0.5, 1],
        }),
    };


    const [isScanning, setIsScanning] = useState(true);

    const scanQR = (data) => {
        if (!isScanning) return;

        console.log("QR Code Data:", data);

        if (!scanned1 && data === goodQRcode1) {
            flashScreen("green");
            setScanned1(true);
            setIsScanning(false);
            setTimeout(() => setIsScanning(true), 1500);
        } else if (!scanned2 && scanned1 && data === goodQRcode2) {
            flashScreen("green");
            setScanned2(true);
            setIsScanning(false);
            setTimeout(() => setIsScanning(true), 1500);
        } else if (!scanned3 && scanned1 && scanned2 && data === goodQRcode3) {
            flashScreen("green");
            setScanned3(true);
            setIsScanning(false);
            setTimeout(() => {
                setModalreveal(true);
                setIsScanning(true);
            }, 1000);
        } else {
            flashScreen("red");
            setScanned1(false);
            setScanned2(false);
            setScanned3(false);
            Vibration.vibrate();
            setIsScanning(false);
            setTimeout(() => setIsScanning(true), 2000);
        }
    };



    function INDICE() {
        setSCORE(prevScore => prevScore - 100)
        if (indiceModal === true) setIndicemodal(false);
        if (indiceModal2 === true) setIndicemodal2(false);
        if (indiceModal3 === true) setIndicemodal3(false);
    }



    useEffect(() => {
        (async () => {
            const result = await Camera.requestCameraPermissionsAsync();
            setHasPermission(result && result?.status === 'granted');
        })();
    }, []);

    if (!hasPermission) {
        return <View />;
    }

    const passageau3 = () => {
        setGame2(true);

        setTimeout(() => {
            console.log("game2 status", game2, "score", SCORE);

            fetch(`${URL}/scenarios/ValidedAndScore/${userRedux.scenarioID}/${userRedux.userID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ score: SCORE, result: true }),
            })
                .then(response => response.json())
                .then(data => {
                    console.log("Score mis à jour dans la base de données", data);
                    navigation.replace("Ingame3");
                })
                .catch(error => {
                    console.error('Erreur lors de la requête:', error);
                });

        }, 1000);

        setModalreveal(false);
    };


    if (!isFocused) return null;
    if (!loaded) {
        return null;
    }

    return (

        isFocused && (
            <View style={styles.container} >
                <ImageBackground source={require('../assets/imgsAventure/FondAventure01X.png')} resizeMode='stretch' style={styles.imageBackground}>
                    <View style={styles.VideoContainer}>
                        <View style={styles.cadrevideo}>
                            <ImageBackground source={require('../assets/imgsAventure/MmodaleVX.png')} resizeMode='stretch' style={styles.CameraViews}>
                                <View style={styles.CameraView} >
                                    {hasPermission && (
                                        <CameraView
                                            onBarcodeScanned={({ data }) => scanQR(data)}
                                            style={styles.Camera}
                                            ref={cameraRef}
                                        />
                                    )}
                                </View >
                            </ImageBackground>
                        </View>
                    </View>
                    <View style={styles.lightContainer}>
                        <View style={styles.light}>
                            <ImageBackground
                                source={scanned1
                                    ? require('../assets/imgsAventure/LumVX.png') 
                                    : require('../assets/imgsAventure/lumRX.png') 
                                }
                                resizeMode='stretch'
                                style={styles.lightimg}
                            />
                        </View>
                        <View style={styles.light}>
                            <ImageBackground
                                source={scanned2
                                    ? require('../assets/imgsAventure/LumVX.png')  
                                    : require('../assets/imgsAventure/lumRX.png')  
                                }
                                resizeMode='stretch'
                                style={styles.lightimg}
                            />
                        </View>
                        <View style={styles.light} >
                            <ImageBackground
                                source={scanned3
                                    ? require('../assets/imgsAventure/LumVX.png') 
                                    : require('../assets/imgsAventure/lumRX.png')  
                                }
                                resizeMode='stretch'
                                style={styles.lightimg}
                            />
                        </View>
                    </View>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity onPress={() => setIndicemodal(true)} style={styles.button}>
                            <ImageBackground source={require('../assets/imgsAventure/IndiceX.png')} resizeMode='stretch' style={styles.indice} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIndicemodal2(true)} style={styles.button}>
                            <ImageBackground source={require('../assets/imgsAventure/IndiceX.png')} resizeMode='stretch' style={styles.indice} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIndicemodal3(true)} style={styles.button}>
                            <ImageBackground source={require('../assets/imgsAventure/IndiceX.png')} resizeMode='stretch' style={styles.indice} />
                        </TouchableOpacity>
                    </View>


                    <Animated.View style={[styles.flashOverlay, {
                        opacity: flashAnim,
                        backgroundColor: flashColor
                    }]} pointerEvents="none"/>
                    {
                        indiceModal && (
                            <Modal visible={indiceModal} animationType="fade" transparent>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <ImageBackground source={require('../assets/imgsAventure/PmodaleX.png')} resizeMode='stretch' style={styles.indicemodal} >
                                            <TouchableOpacity onPress={INDICE} style={styles.modal}>
                                                <Text style={styles.textButton}>{indice1}</Text>
                                            </TouchableOpacity>
                                        </ImageBackground>
                                    </View>
                                </View>
                            </Modal>
                        )
                    }
                    {
                        indiceModal2 && (
                            <Modal visible={indiceModal2} animationType="fade" transparent>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <ImageBackground source={require('../assets/imgsAventure/PmodaleX.png')} resizeMode='stretch' style={styles.indicemodal} >
                                            <TouchableOpacity onPress={INDICE} style={styles.modal}>
                                                <Text style={styles.textButton}>{indice2}</Text>
                                            </TouchableOpacity>
                                        </ImageBackground>
                                    </View>
                                </View>
                            </Modal>
                        )
                    }
                    {
                        indiceModal3 && (
                            <Modal visible={indiceModal3} animationType="fade" transparent>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <ImageBackground source={require('../assets/imgsAventure/PmodaleX.png')} resizeMode='stretch' style={styles.indicemodal} >
                                            <TouchableOpacity onPress={INDICE} style={styles.modal}>
                                                <Text style={styles.textButton}>{indice3}</Text>
                                            </TouchableOpacity>
                                        </ImageBackground>
                                    </View>
                                </View>
                            </Modal>
                        )
                    }
                    {
                        modalreveal && (
                            <Modal visible={modalreveal} animationType="fade" transparent>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <ImageBackground source={require('../assets/imgsAventure/PmodaleX.png')} resizeMode='stretch' style={styles.indicemodal} >
                                            <TouchableOpacity onPress={passageau3} style={styles.modalefin}>
                                                <Text style={styles.textButton}>Triangulation réussie !</Text>
                                                <Text style={styles.textButton}>La capsule a été localisée.</Text>
                                            </TouchableOpacity>
                                        </ImageBackground>
                                    </View>
                                </View>
                            </Modal>
                        )
                    }
                </ImageBackground>
            </View >
        ))
}


const styles = StyleSheet.create({
    indicemodal: {
        width: '100%',
        height: '100%',
    },
    modalefin: {
        width: '90%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modal: {
        width: '80%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicemodal: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    indice: {
        width: '100%',
        height: '100%',
    },
    button: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',


    },
    buttonContainer: {
        width: '100%',
        height: '10%',
        justifyContent: 'space-around',
        alignItems: 'center',
        flexDirection: 'row',
        paddingRight: 20,
    },
    lightimg: {
        width: '100%',
        height: '100%',
    },
    VideoContainer: {
        margintop: 20,
        width: '100%',
        height: '60%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    CameraViews: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cadrevideo: {
        width: '80%',
        height: '80%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageBackground: {
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',

    },
    CameraView: {
        width: '92%',
        height: '93%',
        position: 'absolute',
        borderRadius: 60,
        overflow: 'hidden'
    },
    Camera: {
        width: '100%',
        height: '100%',
    },
    lightContainer: {
        width: '100%',
        height: '25%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',

    },
    light: {
        width: 100,
        height: 100,
        borderRadius: 50,

        elevation: 10,
    },
    flashOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalView: {
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 2,
            height: 4,
        },
        width: 350,
        height: 350,
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    textButton: {
        color: "#72BF11",
        fontSize: 22,
        fontFamily: "PressStart2P-Regular.ttf",
        lineHeight: 40,
        textAlign: 'center',
    },
});
