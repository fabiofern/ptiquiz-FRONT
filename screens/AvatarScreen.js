import React, { useState, useEffect, useRef } from "react";
import {
    StyleSheet, View, SafeAreaView, TextInput, Text, TouchableOpacity,
    FlatList, Image, Dimensions, Animated
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { addUserToStore } from '../reducers/users';

import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get("window");
const URL = process.env.EXPO_PUBLIC_BACKEND_URL

export default function AvatarScreen({ navigation }) {

    const [loaded] = useFonts({
        "Fustat-Bold.ttf": require("../assets/fonts/Fustat-Bold.ttf"),
        "Fustat-ExtraBold.ttf": require("../assets/fonts/Fustat-ExtraBold.ttf"),
        "Fustat-ExtraLight.ttf": require("../assets/fonts/Fustat-ExtraLight.ttf"),
        "Fustat-Light.ttf": require("../assets/fonts/Fustat-Light.ttf"),
        "Fustat-Medium.ttf": require("../assets/fonts/Fustat-Medium.ttf"),
        "Fustat-Regular.ttf": require("../assets/fonts/Fustat-Regular.ttf"),
        "Fustat-SemiBold.ttf": require("../assets/fonts/Fustat-SemiBold.ttf"),
        "Homenaje-Regular.ttf": require("../assets/fonts/Homenaje-Regular.ttf"),
        "PressStart2P-Regular.ttf": require("../assets/fonts/PressStart2P-Regular.ttf"),
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

    const [signUpUsername, setSignUpUsername] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const userToken = useSelector((state) => state.users.value.token)
    const dispatch = useDispatch();
    // Images d'avatars avec un ID (Utilise des .png au lieu de .svg)
    const images = [
        'https://res.cloudinary.com/dpyozodnm/image/upload/v1741105220/avatar01_zdi0zf.png',
        'https://res.cloudinary.com/dpyozodnm/image/upload/v1741105220/avatar02_zrsv6f.png',
        'https://res.cloudinary.com/dpyozodnm/image/upload/v1741105220/avatar03_nyapav.png',
        'https://res.cloudinary.com/dpyozodnm/image/upload/v1741105220/avatar04_tka0gd.png',
        'https://res.cloudinary.com/dpyozodnm/image/upload/v1741105220/avatar05_fui9wm.png',
        'https://res.cloudinary.com/dpyozodnm/image/upload/v1741105220/avatar06_jrvz5x.png',
        'https://res.cloudinary.com/dpyozodnm/image/upload/v1741105220/avatar07_qr2sxd.png',
        'https://res.cloudinary.com/dpyozodnm/image/upload/v1741105220/avatar08_cd4udv.png',
        'https://res.cloudinary.com/dpyozodnm/image/upload/v1741105221/avatar09_bkdrx9.png',
        'https://res.cloudinary.com/dpyozodnm/image/upload/v1741105221/avatar10_nh5quw.png',
        'https://res.cloudinary.com/dpyozodnm/image/upload/v1741105222/avatar11_llbefo.png',
        'https://res.cloudinary.com/dpyozodnm/image/upload/v1741105222/avatar12_b24cyi.png',

    ];

    function register() {
        console.log('button clicked')

        if (!selectedAvatar || signUpUsername.trim() === "") {// VERIFIE SI LES CHAMPS SONT REMPLI ET EVITE UN ENVOI RDE REQUETE POUR RIEN
            alert("Choisissez un avatar et entrez un pseudo !");
            return;
        } else {
            fetch(`${URL}/users/updateProfil`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: userToken, username: signUpUsername, avatar: selectedAvatar })
            }).then(response => response.json())
                .then(data => {
                    console.log("Réponse API :", data); // AFFICHE LA REPONSE DU BACKEND
                    if (data.result) {
                        dispatch(addUserToStore({ token: userToken, username: signUpUsername, avatar: selectedAvatar }));// ENVCOI LES INFOS SI TOUT VA BIEN 
                        console.log("Utilisateur mis à jour :", signUpUsername);
                        navigation.navigate('Map');
                    } else {
                        console.log('Erreur de connexion API', data.error);
                        alert("Erreur $$$$: " + data.error);
                    }
                })
                .catch(error => {
                    console.error('Erreur mise à jour username', error);
                    alert("Erreur de connexion au serveur");
                });
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView />

            {/* Titre */}
            <View style={styles.avatarContainer}>
                <Text style={[styles.text, { paddingBottom: 20 }]}>Personnalise</Text>
                <Text style={{ fontSize: 32, fontFamily: "Fustat-ExtraBold.ttf", color: "white", margin: -35 }}>ton profil</Text>
                <FlatList
                    data={images}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carousel}
                    renderItem={({ item }) => <AnimatedAvatar uri={item} selected={selectedAvatar === item} onPress={() => setSelectedAvatar(item)} />}
                />
            </View>

            {/* Input et bouton */}
            <TextInput
                placeholderTextColor={'#636773'}
                style={styles.input}
                placeholder="Ton pseudo"
                onChangeText={setSignUpUsername}
                value={signUpUsername}
            />
            <TouchableOpacity onPress={register} style={styles.buttonLogOut}>
                <Text style={styles.textButtonLogOut}>C'est parti !</Text>
            </TouchableOpacity>
        </View>
    );
}

// composant animé pour l'image
const AnimatedAvatar = ({ uri, selected, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    // état pour zoomer sur les images
    useEffect(() => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <TouchableOpacity onPress={onPress}>
            <Animated.Image
                source={{ uri }}
                style={[
                    styles.image,
                    selected && styles.selectedImage,
                    { transform: [{ scale: selected ? 1.2 : scaleAnim }] }
                ]}
            />
        </TouchableOpacity>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#85CAE4',
        alignItems: 'center',
    },
    inputContainer: {
        // padding: 20,
        alignItems: 'center',
        width: '100%',
        height: '30%',
        backgroundColor: 'lightgrey',
        justifyContent: 'space-around',
        paddingBottom: 10
    },
    input: {
        // flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        height: 70,
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        margin: 12,
        paddingLeft: 20,
        fontSize: 15,
    },
    avatarContainer: {
        width: '100%',
        height: '70%',
        alignItems: 'center',
    },
    text: {
        fontSize: 32,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FFFFFF',
        paddingTop: 80,
        // paddingBottom: 30,

    },
    buttonLogOut: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '80%',
        height: 72,
        backgroundColor: '#FF8527',
        margin: 20,
        // marginTop: 50,
        borderRadius: 20,
        elevation: 3,
    },
    textButtonLogOut: {
        fontSize: 20,
        fontFamily: "Fustat-ExtraBold.ttf",
        alignItems: 'center',
        alignContent: 'flex-end',
        justifyContent: 'center',
        color: "white",
        padding: 10,
    },

    title: {
        width: '100%',
        height: '20%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'blue'
    },
    carousel: {
        paddingHorizontal: 15,
        alignItems: "center",
    },
    image: {
        width: width * 0.5, // Taille des avatars ajustée
        height: width * 0.5,
        borderRadius: 100, // Correcte au lieu de "50%"
        marginHorizontal: 30,
        elevation: 3
    },
    selectedImage: {
        borderWidth: 3,
        borderColor: "white",
    },
});

