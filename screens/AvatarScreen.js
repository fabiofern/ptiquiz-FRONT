import React, { useState, useEffect, useRef } from "react";
import {
    StyleSheet,
    View,
    SafeAreaView,
    TextInput,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
    Dimensions,
    Animated,
} from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from "react-redux"; // ← Ajout useSelector
import { updateUser } from "../redux/userSlice"; // ← IMPORT MANQUANT !

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get("window");

export default function AvatarScreen({ navigation }) {
    const dispatch = useDispatch();

    // ← Récupérer les données existantes du store
    const userData = useSelector(state => state.user.userData);

    const [loaded] = useFonts({
        "Fustat-ExtraBold.ttf": require("../assets/fonts/Fustat-ExtraBold.ttf"),
    });

    useEffect(() => {
        if (loaded) SplashScreen.hideAsync();
    }, [loaded]);

    if (!loaded) return null;

    const [signUpUsername, setSignUpUsername] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState(null);

    const images = [
        require("../assets/avatars/avatar01.png"),
        require("../assets/avatars/avatar02.png"),
        require("../assets/avatars/avatar03.png"),
    ];

    // Dans AvatarScreen.js - modifiez handleRegister :

    const handleRegister = async () => {
        if (!selectedAvatar || signUpUsername.trim() === "") {
            alert("Choisis un avatar et un pseudo !");
            return;
        }

        try {
            console.log("💾 Sauvegarde profil en base...");

            // 🎯 SAUVEGARDER EN BASE DE DONNÉES
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/updateProfil`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: userData.token,
                    username: signUpUsername.trim(),
                    avatar: selectedAvatar
                }),
            });

            const data = await response.json();

            if (data.result) {
                console.log("✅ Profil sauvé en base");

                // 🎯 METTRE À JOUR REDUX
                dispatch(updateUser({
                    userData: {
                        ...userData,
                        avatar: selectedAvatar,
                        username: signUpUsername.trim()
                    }
                }));

                // 🎯 ALLER À PERMISSION SCREEN
                navigation.navigate('PermissionScreen');
            } else {
                alert("Erreur sauvegarde profil");
                console.error("❌ Erreur backend:", data.error);
            }

        } catch (error) {
            console.error("❌ Erreur réseau:", error);
            alert("Erreur de connexion");
        }
    };

    return (
        <LinearGradient
            colors={['#eeddfd', '#d5c3f3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView />

            <View style={styles.avatarContainer}>
                <Text style={styles.text}>Personnalise</Text>
                <Text style={styles.subtitle}>ton profil</Text>
                <FlatList
                    data={images}
                    horizontal
                    keyExtractor={(_, index) => index.toString()}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carousel}
                    renderItem={({ item }) => (
                        <AnimatedAvatar
                            image={item}
                            selected={selectedAvatar === item}
                            onPress={() => setSelectedAvatar(item)}
                        />
                    )}
                />
            </View>

            <TextInput
                placeholder="Ton pseudo"
                placeholderTextColor="#636773"
                style={styles.input}
                onChangeText={setSignUpUsername}
                value={signUpUsername}
            />

            <TouchableOpacity onPress={handleRegister} style={styles.button}>
                <Text style={styles.textButton}>C'est parti !</Text>
            </TouchableOpacity>
        </LinearGradient>
    );
}

const AnimatedAvatar = ({ image, selected, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: selected ? 1.2 : 1,
            useNativeDriver: true,
        }).start();
    }, [selected]);

    return (
        <TouchableOpacity onPress={onPress}>
            <Animated.Image
                source={image}
                style={[
                    styles.image,
                    selected && styles.selectedImage,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#85CAE4",
        alignItems: "center",
    },
    avatarContainer: {
        width: "100%",
        height: "70%",
        alignItems: "center",
    },
    text: {
        fontSize: 40,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: "#fb7a68",
        paddingTop: 80,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 40,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: "#fb7a68",
        marginBottom: 20,
        marginTop: -25,
    },
    carousel: {
        paddingHorizontal: 15,
        alignItems: "center",
    },
    image: {
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: 55,
        marginHorizontal: 15,
        elevation: 3,
    },
    selectedImage: {
        borderWidth: 3,
        borderColor: "white",
    },
    input: {
        width: "80%",
        height: 70,
        backgroundColor: "#F0F0F0",
        borderRadius: 33,
        marginTop: 10,
        paddingLeft: 20,
        fontSize: 15,
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '80%',
        height: 72,
        backgroundColor: '#e9d8f9',
        margin: 15,
        borderRadius: 33,
        shadowColor: '#000',
        shadowOffset: { width: 6, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
    },
    textButton: {
        fontSize: 24,
        fontFamily: "Fustat-ExtraBold.ttf",
        alignItems: 'center',
        alignContent: 'flex-end',
        justifyContent: 'center',
        color: "#333",
        padding: 10,
    },
    input: {
        width: "80%",
        height: 70,
        backgroundColor: "#F0F0F0",
        borderRadius: 33,
        marginTop: 10,
        paddingLeft: 20,
        fontSize: 15,
        fontFamily: "Fustat-Regular.ttf", // ✅ Mets une font lisible et non stylisée ici
        color: "#000" // ✅ Assure-toi aussi d'avoir une couleur visible
    }

});