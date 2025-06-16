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
    Dimensions, // Import Dimensions
    Animated, // Import Animated
} from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "../redux/userSlice";
import { EXPO_PUBLIC_BACKEND_URL } from '@env';

SplashScreen.preventAutoHideAsync();

const URL = EXPO_PUBLIC_BACKEND_URL 

const { width, height } = Dimensions.get("window"); // Get screen dimensions

// --- NOUVEAU COMPOSANT : FOND DYNAMIQUE "AURORA" ---
const AuroraBackground = () => {
    // État pour savoir si les animations sont initialisées
    const [isReady, setIsReady] = useState(false);
    
    // Initialisation des valeurs animées dans un useRef qui s'exécute une seule fois
    const blobs = useRef([]);

    // Initialiser les Animated.Value une seule fois après le premier rendu
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

            // Démarrer les animations immédiatement après l'initialisation
            blobs.current.forEach(blob => {
                const animateBlob = () => {
                    Animated.loop(
                        Animated.parallel([
                            Animated.timing(blob.translateX, {
                                toValue: Math.random() * width,
                                duration: blob.duration,
                                useNativeDriver: true,
                            }),
                            Animated.timing(blob.translateY, {
                                toValue: Math.random() * height,
                                duration: blob.duration,
                                useNativeDriver: true,
                            }),
                            Animated.timing(blob.scale, {
                                toValue: 0.8 + Math.random() * 0.7,
                                duration: blob.duration,
                                useNativeDriver: true,
                            }),
                            Animated.timing(blob.opacity, {
                                toValue: 0.2 + Math.random() * 0.3,
                                duration: blob.duration,
                                useNativeDriver: true,
                            }),
                        ])
                    ).start();
                };
                animateBlob();
            });
        }
    }, [isReady]); // Déclencher une seule fois


    // Couleurs de la palette "Rayon de Soleil" avec opacité faible
    const auroraColors = [
        'rgba(255, 152, 0, 0.2)',
        'rgba(255, 112, 67, 0.2)',
        'rgba(255, 204, 128, 0.2)',
        'rgba(255, 240, 200, 0.2)',
        'rgba(255, 224, 178, 0.2)',
    ];

    if (!isReady) {
        return null; // Ne rien rendre tant que les animations ne sont pas prêtes
    }

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
// --- FIN DU COMPOSANT FOND DYNAMIQUE "AURORA" ---

export default function AvatarScreen({ navigation }) {
    const dispatch = useDispatch();

    // Récupérer les données existantes du store
    const userData = useSelector(state => state.user.userData);

    const [loaded] = useFonts({
        "Fustat-ExtraBold.ttf": require("../assets/fonts/Fustat-ExtraBold.ttf"),
        "Fustat-Bold.ttf": require("../assets/fonts/Fustat-Bold.ttf"),
        "Fustat-Regular.ttf": require("../assets/fonts/Fustat-Regular.ttf"),
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
        require("../assets/avatars/avatar04.png"),
        require("../assets/avatars/avatar05.png"),
        require("../assets/avatars/avatar06.png"),
        require("../assets/avatars/avatar07.png"),
        require("../assets/avatars/avatar08.png"),
        require("../assets/avatars/avatar09.png"),
        require("../assets/avatars/avatar10.png"),
        require("../assets/avatars/avatar11.png"),
        require("../assets/avatars/avatar13.png"),
        require("../assets/avatars/avatar14.png"),
        require("../assets/avatars/avatar15.png"),
    ];

    const handleRegister = async () => {
        if (!selectedAvatar || signUpUsername.trim() === "") {
            console.warn("Veuillez choisir un avatar et un pseudo !");
            return;
        }

        try {
            console.log("💾 Sauvegarde profil en base...");

            // SAUVEGARDER EN BASE DE DONNÉES
            const response = await fetch(`${URL}/users/updateProfil`, {
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

                // METTRE À JOUR REDUX
                dispatch(updateUser({
                    userData: {
                        ...userData,
                        avatar: selectedAvatar,
                        username: signUpUsername.trim()
                    }
                }));

                // ALLER À PERMISSION SCREEN
                navigation.navigate('PermissionScreen');
            } else {
                console.error("❌ Erreur backend:", data.error);
                console.warn("Erreur lors de la sauvegarde du profil. Veuillez réessayer.");
            }

        } catch (error) {
            console.error("❌ Erreur réseau:", error);
            console.warn("Erreur de connexion. Veuillez vérifier votre réseau.");
        }
    };

    return (
        <LinearGradient
            // Dégradé de couleurs pour le fond : Rayon de Soleil
            colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Le fond dynamique Aurora est ici, derrière le reste du contenu */}
            <AuroraBackground />

            <SafeAreaView />

            <View style={styles.contentContainer}>
                <Text style={styles.titleText}>Personnalise</Text>
                <Text style={styles.subtitleText}>ton profil</Text>

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

                <TextInput
                    placeholder="Ton pseudo"
                    placeholderTextColor={styles.placeholderInput.color}
                    style={styles.input}
                    onChangeText={setSignUpUsername}
                    value={signUpUsername}
                />

                <TouchableOpacity onPress={handleRegister} style={styles.button}>
                    <Text style={styles.buttonText}>C'est parti !</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const AnimatedAvatar = ({ image, selected, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: selected ? 1.2 : 1,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
        }).start();

        Animated.timing(opacityAnim, {
            toValue: selected ? 0.5 : 1,
            duration: 200,
            useNativeDriver: true,
        }).start();

    }, [selected]);

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Animated.View style={[
                styles.avatarWrapper,
                selected && styles.selectedAvatarWrapper,
                { transform: [{ scale: scaleAnim }] }
            ]}>
                <Image
                    source={image}
                    style={styles.avatarImage}
                />
                {selected && (
                    <BlurView intensity={20} tint="light" style={styles.selectedAvatarGlow} />
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Le backgroundColor est géré par LinearGradient
        alignItems: "center",
        justifyContent: "center",
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
    },
    titleText: {
        fontSize: 45,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF7043',
        marginBottom: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    subtitleText: {
        fontSize: 45,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF9800',
        marginBottom: 40,
        marginTop: -10,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    carousel: {
        paddingHorizontal: width * 0.05,
        alignItems: "center",
        paddingVertical: 20,
    },
    avatarWrapper: {
        width: width * 0.45,
        height: width * 0.45,
        borderRadius: (width * 0.45) / 2,
        marginHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',

        // Style "Liquid Glass" pour l'avatar (non sélectionné)
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderRadius: (width * 0.45) / 2,
    },
    selectedAvatarWrapper: {
        // Style "Liquid Glass" pour l'avatar sélectionné
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 3,
        borderColor: 'rgba(255, 240, 200, 0.9)',

        // Lueur plus prononcée pour l'effet de sélection
        shadowColor: 'rgba(255, 240, 200, 1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 25,
    },
    selectedAvatarGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: (width * 0.45) / 2,
    },
    input: {
        width: "80%",
        height: 65,
        borderRadius: 35,
        marginVertical: 25,

        // Style "Liquid Glass" pour les inputs, adapté de LoginScreen
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.8)',

        // Ombres pour la profondeur et l'effet de "bulle"
        shadowColor: 'rgba(0, 0, 0, 0.18)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 15,

        paddingLeft: 25,
        fontSize: 18,
        fontFamily: "Fustat-Regular.ttf",
        color: "#4a4a4a",
    },
    placeholderInput: {
        color: 'rgba(74, 74, 74, 0.6)',
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '80%',
        height: 68,
        borderRadius: 35,
        marginVertical: 12,

        // Style "Liquid Glass" pour les boutons, adapté de LoginScreen
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1.8,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.9)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 25,
    },
    buttonText: {
        fontSize: 26,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF9800',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
});
