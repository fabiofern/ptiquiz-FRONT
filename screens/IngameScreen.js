import React, { useEffect, useState, useRef, useCallback } from "react";
import { StyleSheet, View, SafeAreaView, Button, TextInput, Text, Modal, TouchableOpacity, ImageBackground } from 'react-native';
import { CameraView, CameraType, FlashMode } from 'expo-camera';
import _FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import Video from 'expo-video';

import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';

import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();
const URL = process.env.EXPO_PUBLIC_BACKEND_URL

export default function IngameScreen1({ navigation }) {
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


    const isFocused = useIsFocused();
    const userRedux = useSelector((state) => state.users.value)
    const [video1, setVideo1] = useState(true);
    const [video2, setVideo2] = useState(false);
    const [video3, setVideo3] = useState(false);
    const [video4, setVideo4] = useState(false);
    const dispatch = useDispatch();
    const [JoVideo, setJoVideo] = useState(false);
    const [frequence1, setFrequence1] = useState('');
    const [frequence2, setFrequence2] = useState('');
    const [frequence3, setFrequence3] = useState('');
    const [game1, setGame1] = useState(false);
    const [indice1, setIndice1] = useState('');
    const [indice2, setIndice2] = useState('');
    const [indice3, setIndice3] = useState('');
    const [goodFrequence1, setGoodFrequence1] = useState('')
    const [goodFrequence2, setGoodFrequence2] = useState('')
    const [goodFrequence3, setGoodFrequence3] = useState('')
    const [indiceused1, setIndiceused1] = useState(false)
    const [indiceused2, setIndiceused2] = useState(false)
    const [indiceused3, setIndiceused3] = useState(false)
    const [showInputs, setShowInputs] = useState(true);
    const [modalFinVisible, setModalFinVisible] = useState(false);
    const [modalout, setmodalout] = useState(false);
    const [modal2out, setmodal2out] = useState(false)
    const [indicemodal1, setIndicemodal1] = useState(false)
    const [indicemodal2, setIndicemodal2] = useState(false)
    const [indicemodal3, setIndicemodal3] = useState(false)
    const [showfinalbutton, setShowfinalbutton] = useState(false)
    const { lastvideo, setLastvideo } = useState(false)
    const [SCORE, setSCORE] = useState(500)

    const [lightColor, setLightColor] = useState("yellow");


    const videoSource =
        video1 ? ('https://res.cloudinary.com/dpyozodnm/video/upload/v1741889839/Video_1_eb3qp7.mp4') :
            video2 ? ('https://res.cloudinary.com/dpyozodnm/video/upload/v1741889839/Video_2_ywowhj.mp4') :
                video3 ? ('https://res.cloudinary.com/dpyozodnm/video/upload/v1741889839/Video_3_ruqtiy.mp4') :
                    video4 ? ('https://res.cloudinary.com/dpyozodnm/video/upload/v1741889840/jojo_lroxkm.mp4') :
                        null

    const player = useVideoPlayer(videoSource, (player) => {
        player.play();
        player.loop = true
    });


    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
    useEffect(() => {
        if (frequence1.length >= goodFrequence1.length) {
            if (frequence1 === goodFrequence1) {
                setLightColor("green")
            } else {
                setLightColor("red")
                setmodalout(true);
            }
        }
    }, [frequence1]);

    useEffect(() => {
        if (frequence2.length >= goodFrequence2.length) {
            if (frequence2 === goodFrequence2) {
                setLightColor("green")
            } else {
                setLightColor("red")
                setmodalout(true);
            }
        }
    }, [frequence2]);

    useEffect(() => {
        if (frequence3.length >= goodFrequence3.length) {
            if (frequence3 === goodFrequence3) {
                setLightColor("green")
            } else {
                setLightColor("red")
                setmodalout(true);
            }
        }
    }, [frequence3]);


    useEffect(() => {
        fetch(`${URL}/scenarios/etapes/${userRedux.scenarioID}/${userRedux.userID}`)
            .then(response => response.json())
            .then(data => {
                console.log("retour fetch ", data);
                setGoodFrequence1(data.expectedAnswer1);
                setGoodFrequence2(data.expectedAnswer2);
                setGoodFrequence3(data.expectedAnswer3);
                setIndice1(data.indice1);
                setIndice2(data.indice2);
                setIndice3(data.indice3);
                setSCORE(data.score);
            })
            .catch((error) => {
                console.error('Error:', error.message);
            });
    }, [userRedux.userID, userRedux.scenarioID, isFocused])



    function testInput1(value) {
        setFrequence1(value);
        if (value === goodFrequence1) {
            setVideo1(false);
            setVideo2(true);
        }
    }

    function testInput2(value) {
        setFrequence2(value);
        if (value === goodFrequence2 && video1 === false) {
            setVideo2(false);
            setVideo3(true);
        }
    }

    function testInput3(value) {
        setFrequence3(value);
        if (value === goodFrequence3 && video2 === false) {
            setVideo3(false);
            setVideo4(true);
        }
    }
    useEffect(() => {
        if (
            frequence1.length >= 2 &&
            frequence2.length >= 2 &&
            frequence3.length >= 2 &&
            frequence1 === goodFrequence1 &&
            frequence2 === goodFrequence2 &&
            frequence3 === goodFrequence3 &&
            showInputs
        ) {
            setShowInputs(false);
            setJoVideo(false);
            setShowfinalbutton(true)
        }
    }, [frequence3])

    const penaliserScore = () => {
        setSCORE(prevScore => {
            const newScore = prevScore - 100;
            console.log("Pénalité appliquée, nouveau score :", newScore);
            return newScore;
        });

        setTimeout(() => {
            console.log("Score après mise à jour réelle :", SCORE);
        }, 100);
    };


    const finalButton = () => {
        setGame1(true);

        setTimeout(() => {
            console.log("Score final envoyé au backend :", SCORE);

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
                    setJoVideo(false);
                    navigation.replace("Ingame2");
                })
                .catch(error => {
                    console.error('Erreur lors de la requête:', error);
                });
        }, 200);
    };


    if (!loaded) {
        return null;
    }


    return (
        <View style={styles.container}>
            <ImageBackground source={require('../assets/imgsAventure/FondAventure01X.png')} resizeMode='stretch' style={styles.imageBackground}>

                <SafeAreaView />

                {game1 === false && (
                    <View style={styles.container}>



                        <View style={styles.contentContainer}>
                            <View style={styles.videoContainer}>
                                <ImageBackground source={require('../assets/imgsAventure/modaleVideoX.png')} resizeMode='stretch' style={styles.videobackground}>

                                    <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture />
                                    <View style={styles.controlsContainer}>
                                    </View>
                                </ImageBackground>
                            </View>

                        </View>
                        {showInputs && (
                            <View style={styles.inputContainer}>




                                <View style={styles.inputandindice}>
                                    <View style={styles.light}>
                                        <ImageBackground

                                            source={frequence1 === goodFrequence1
                                                ? require('../assets/imgsAventure/InputVX.png')
                                                : frequence1 && frequence1.length >= goodFrequence1.length
                                                    ? require('../assets/imgsAventure/InputRX.png')
                                                    : require('../assets/imgsAventure/InputOffX.png')
                                            }
                                            resizeMode='stretch'
                                            style={styles.btnimgbckgrnd}
                                        >
                                            <TextInput
                                                placeholderTextColor={'black'}
                                                style={styles.inp1}
                                                placeholder="Entrez la 1ere Fréquence"
                                                onChangeText={(value) => testInput1(value)}
                                                value={frequence1}
                                            />
                                        </ImageBackground>
                                    </View>
                                    <TouchableOpacity onPress={() => { setIndicemodal1(true) }} style={styles.indicebutton}>
                                        <ImageBackground source={require('../assets/imgsAventure/IndiceX.png')} resizeMode='stretch' style={styles.indiceX}>
                                        </ImageBackground>
                                    </TouchableOpacity>
                                </View>



                                <View style={styles.inputandindice}>
                                    <View style={styles.light}>
                                        <ImageBackground
                                            source={frequence2 === goodFrequence2
                                                ? require('../assets/imgsAventure/InputVX.png')
                                                : frequence2 && frequence2.length >= goodFrequence2.length
                                                    ? require('../assets/imgsAventure/InputRX.png')
                                                    : require('../assets/imgsAventure/InputOffX.png')
                                            }
                                            resizeMode='stretch'
                                            style={styles.btnimgbckgrnd}
                                        >
                                            <TextInput
                                                placeholderTextColor={'black'}
                                                style={styles.inp1}
                                                placeholder="Entrez la Fréquence 2.0"
                                                onChangeText={(value) => testInput2(value)}
                                                value={frequence2}
                                            />
                                        </ImageBackground>
                                    </View>
                                    <TouchableOpacity onPress={() => { setIndicemodal2(true) }} style={styles.indicebutton}>
                                        <ImageBackground source={require('../assets/imgsAventure/IndiceX.png')} resizeMode='stretch' style={styles.indiceX}>
                                        </ImageBackground>
                                    </TouchableOpacity>
                                </View>


                                <View style={styles.inputandindice}>
                                    <View style={styles.light}>
                                        <ImageBackground
                                            source={frequence3 === goodFrequence3
                                                ? require('../assets/imgsAventure/InputVX.png')
                                                : frequence3 && frequence3.length >= goodFrequence3.length
                                                    ? require('../assets/imgsAventure/InputRX.png')
                                                    : require('../assets/imgsAventure/InputOffX.png')
                                            }
                                            resizeMode='stretch'
                                            style={styles.btnimgbckgrnd}
                                        >
                                            <TextInput
                                                placeholderTextColor={'black'}
                                                style={styles.inp1}
                                                placeholder="Entrez la 3eme Fréquence"
                                                onChangeText={(value) => testInput3(value)}
                                                value={frequence3}
                                            />
                                        </ImageBackground>
                                    </View>
                                    <TouchableOpacity onPress={() => { setIndicemodal3(true) }} style={styles.indicebutton}>
                                        <ImageBackground source={require('../assets/imgsAventure/IndiceX.png')} resizeMode='stretch' style={styles.indiceX}>
                                        </ImageBackground>
                                    </TouchableOpacity>
                                </View>

                            </View>
                        )}
                        {showfinalbutton && (
                            <View style={styles.inputContainer}>
                                <View style={styles.finalbuttonbox}>
                                    <ImageBackground resizeMode="stretch" source={require('../assets/imgsAventure/Sonar.png')} style={styles.finalbuttonBackground}>
                                        <TouchableOpacity onPress={() => finalButton()} style={styles.buttonfin}>
                                            <Text style={styles.textButton}>Declenche le scanner QRCODIQUE</Text>
                                        </TouchableOpacity>
                                    </ImageBackground>
                                </View>
                            </View>)}
                        {modalout && (
                            <Modal visible={modalout} animationType="fade" transparent>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <ImageBackground resizeMode="stretch" source={require('../assets/imgsAventure/modaleSimpleX.png')} style={styles.modaleBackground}>
                                            <TouchableOpacity onPress={() => setmodalout(false)} style={styles.button}>
                                                <Text style={styles.textButton}>Mauvaise fréquence</Text>
                                            </TouchableOpacity>
                                        </ImageBackground>
                                    </View>
                                </View>
                            </Modal>
                        )}
                        {modal2out && (
                            <Modal visible={modal2out} animationType="fade" transparent>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <ImageBackground source={require('../assets/imgsAventure/modaleSimpleX.png')} style={styles.modaleBackground}>
                                            <TouchableOpacity onPress={() => setmodal2out(false)} style={styles.button}>
                                                <Text style={styles.textButton}>Bon code, mauvais endroit...</Text>
                                            </TouchableOpacity>
                                        </ImageBackground>
                                    </View>
                                </View>
                            </Modal>
                        )} {indicemodal1 && (
                            <Modal visible={indicemodal1} animationType="fade" transparent>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <ImageBackground resizeMode="stretch" source={require('../assets/imgsAventure/modaleSimpleX.png')} style={styles.modaleBackground}>
                                            <TouchableOpacity onPress={() => { setIndicemodal1(false); penaliserScore() }} style={styles.button}>
                                                <Text style={styles.textButton}>{indice1}</Text>
                                            </TouchableOpacity>
                                        </ImageBackground>
                                    </View>
                                </View>
                            </Modal>
                        )}{indicemodal2 && (
                            <Modal visible={indicemodal2} animationType="fade" transparent>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <ImageBackground resizeMode="stretch" source={require('../assets/imgsAventure/modaleSimpleX.png')} style={styles.modaleBackground}>
                                            <TouchableOpacity onPress={() => { setIndicemodal2(false); penaliserScore() }} style={styles.button}>
                                                <Text style={styles.textButton}>{indice2}</Text>
                                            </TouchableOpacity>
                                        </ImageBackground>
                                    </View>
                                </View>
                            </Modal>
                        )}{indicemodal3 && (
                            <Modal visible={indicemodal3} animationType="fade" transparent>
                                <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <ImageBackground resizeMode="stretch" source={require('../assets/imgsAventure/modaleSimpleX.png')} style={styles.modaleBackground}>
                                            <TouchableOpacity onPress={() => { setIndicemodal3(false); penaliserScore() }} style={styles.button}>
                                                <Text style={styles.textButton}>{indice3}</Text>
                                            </TouchableOpacity>
                                        </ImageBackground>
                                    </View>
                                </View>
                            </Modal>
                        )}
                    </View>
                )
                }
            </ImageBackground >
        </View >
    );
}


const styles = StyleSheet.create({
    finalbuttonbox: {
        width: 330,
        height: 330,
        justifyContent: 'center',
        alignItems: 'center',
    },
    finalbuttonBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modaleBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    containerup: {
    },
    indiceX: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicebutton: {
        borderRadius: "50%",
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputandindice: {
        width: '100%',
        height: '33%',
        flexDirection: 'row',

        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    btnimgbckgrnd: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {

        width: '100%',
        height: '50%',
        alignItems: 'center',
        justifyContent: 'center',

    },

    videoContainer: {

        width: 350,
        height: 350,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videobackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '89%',
        height: "90%",
        borderRadius: 70

    },
    light: {
        width: '80%',
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',

    },


    buttonfin: {
        width: '70%',
        height: '70%',
        justifyContent: 'center',
        alignItems: 'center',

    },


    indicebutton: {

        borderRadius: "50%",
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlsContainer: {
    },

    textButton: {
        color: "white",
        fontSize: 22,
        fontFamily: "PressStart2P-Regular.ttf",
        lineHeight: 40,
        textAlign: 'center',

    },
    button: {
        width: '70%',
        height: '70%',
        justifyContent: 'center',
        alignItems: 'center'
    },

    imageBackground: {
        flex: 1,
        width: '100%',
        resizeMode: 'stretch',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal1: {
        flex: 1,
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',

    },

    inputContainer: {
        height: '50%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 30,

    },
    input1: {
        width: "80%",
        height: '20%',
        backgroundColor: '#1b3815',

        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center'
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
    input2: {
        width: "80%",
        height: '20%',

        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center'
    },
    input3: {
        width: "80%",
        height: '20%',

        borderColor: 'black',
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text1: {
        color: '#8aec54'
    },
    inp1: {
        color: "black",
        fontSize: 11,
        fontFamily: "PressStart2P-Regular.ttf",
        textAlign: 'center',
    }
})
