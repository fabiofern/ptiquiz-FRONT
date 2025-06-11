import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, SafeAreaView, TextInput, Text, Modal, TouchableOpacity,
    Image, Animated, Dimensions
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { BlurView } from 'expo-blur';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../redux/userSlice';

SplashScreen.preventAutoHideAsync();

const URL = process.env.EXPO_PUBLIC_BACKEND_URL;
// Dimensions de l'écran (lecture directe, mais les valeurs Animated.Value seront initialisées dans useEffect)
const { width, height } = Dimensions.get('window');

// --- NOUVEAU COMPOSANT : FOND DYNAMIQUE "AURORA" ---
const AuroraBackground = () => {
    // État pour savoir si les animations sont initialisées
    const [isReady, setIsReady] = useState(false);

    // Initialisation des valeurs animées dans un useRef qui s'exécute une seule fois
    // Utilisez un objet pour stocker les références aux Animated.Value
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
        }
    }, [isReady]); // Déclencher une seule fois


    // Démarrer les animations une fois que les blobs sont prêts
    useEffect(() => {
        if (isReady && blobs.current.length > 0) {
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
    }, [isReady]); // Déclencher quand isReady devient true

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


export default function LoginScreen({ navigation }) {

    // Redux
    const dispatch = useDispatch();
    const { loading, isLoggedIn } = useSelector((state) => state.user);

    // Chargement des polices
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

    // Cacher l'écran de splash une fois les polices chargées
    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    // États pour la visibilité des mots de passe
    const [showPasswordConnection, setShowPasswordConnection] = useState(true);
    const [showPassword, setShowPassword] = useState(true);
    const [showPassword2, setShowPassword2] = useState(true);

    // États pour la visibilité des modals
    const [modalSignUp, setmodalSignUp] = useState(false);
    const [modalLogIn, setmodalLogIn] = useState(false);

    // États pour les données des formulaires
    const [signUpPassword, setSignUpPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [logInPassword, setLogInPassword] = useState('');
    const [email, setEmail] = useState('');
    const [checkEmail, setcheckEmail] = useState(false); // État pour la validation de l'email

    // Ne pas rendre la page tant que les polices ne sont pas chargées
    if (!loaded) {
        return null;
    }

    // Fonction d'inscription (Sign Up)
    function signUP() {
        console.log("Tentative d'inscription avec :", { email, signUpPassword, confirmPassword });

        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!pattern.test(email.trim())) {
            setcheckEmail(true);
            return;
        }

        if (!email.trim() || !signUpPassword.trim() || !confirmPassword.trim()) {
            console.warn("Veuillez remplir tous les champs.");
            return;
        }

        if (signUpPassword !== confirmPassword) {
            console.warn("Les mots de passe ne correspondent pas.");
            return;
        }

        // Démarrer l'indicateur de chargement Redux
        dispatch(updateUser({ loading: true }));

        fetch(`${URL}/users/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase(), password: signUpPassword.trim() }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.result) {
                    // Sauvegarder les données utilisateur dans Redux
                    dispatch(updateUser({
                        loading: false,
                        isLoggedIn: true,
                        userData: {
                            token: data.token,
                            userID: data._id,
                            email: email.trim().toLowerCase()
                        }
                    }));

                    console.log(data._id)
                    setSignUpPassword('');
                    setEmail('');
                    setmodalSignUp(false);
                    console.log("Inscription réussie :", email);
                    navigation.navigate('Avatar'); // Naviguer après inscription
                } else {
                    dispatch(updateUser({ loading: false }));
                    console.warn('utilisateur deja present');
                }
            })
            .catch(error => {
                dispatch(updateUser({ loading: false }));
                console.error("LoginScreen : Erreur lors de l'inscription :", error);
            });
    }

    // Fonction de vérification d'email pour l'input
    function mailcheck(value) {
        setEmail(value);
        setcheckEmail(false); // Réinitialiser le message d'erreur d'email
    }

    // Fonction de connexion (Log In)
    function logIN() {
        console.log("Tentative de connection avec :", { email, logInPassword, });

        if (!email.trim() || !logInPassword.trim()) {
            console.warn("Veuillez remplir tous les champs.");
            return;
        }

        // Démarrer l'indicateur de chargement Redux
        dispatch(updateUser({ loading: true }));

        fetch(`${URL}/users/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase(), password: logInPassword.trim() }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.result) {
                    // Logique de navigation intelligente basée sur le profil et les permissions
                    const hasProfile = data.avatar && data.username;
                    const hasLocationPermissions = data.locationPermissions?.foreground;

                    console.log('🔍 État utilisateur après connexion:', {
                        hasProfile,
                        hasLocationPermissions,
                        avatar: data.avatar,
                        username: data.username,
                        locationPermissions: data.locationPermissions
                    });

                    // Sauvegarder les données utilisateur dans Redux
                    dispatch(updateUser({
                        loading: false,
                        isLoggedIn: true,
                        userData: {
                            token: data.token,
                            avatar: data.avatar,
                            username: data.username,
                            userID: data._id,
                            email: email.trim().toLowerCase(),
                            score: data.score || 0,
                            completedQuizzes: data.completedQuizzes || {},
                            unlockedQuizzes: data.unlockedQuizzes || [],
                            locationPermissions: data.locationPermissions || null,
                            rewards: data.rewards || { medals: [], trophies: [], titles: [] },
                            statistics: data.statistics || {
                                totalQuizzesCompleted: 0,
                                perfectQuizzes: 0,
                                streakDays: 0,
                                lastPlayDate: null
                            }
                        }
                    }));

                    setEmail('');
                    setLogInPassword('');
                    setmodalLogIn(false);
                    console.log("Connexion réussie :", email);

                    // Navigation conditionnelle
                    if (!hasProfile) {
                        console.log('➡️ Navigation vers Avatar (pas de profil)');
                        navigation.navigate('Avatar');
                    } else if (!hasLocationPermissions) {
                        console.log('➡️ Navigation vers PermissionScreen (pas de permissions)');
                        navigation.navigate('PermissionScreen');
                    } else {
                        console.log('➡️ Navigation vers Map (tout configuré)');
                        navigation.navigate('MainApp');
                    }

                } else {
                    dispatch(updateUser({ loading: false }));
                    console.warn("Nom d'utilisateur ou mot de passe incorrect.");
                }
            })
            .catch(error => {
                dispatch(updateUser({ loading: false }));
                console.error("Erreur de connexion :", error);
            });
    };

    return (
        <View style={styles.generalContainer}>
            <LinearGradient
                // Dégradé de couleurs pour le fond : Rayon de Soleil
                colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
            >
                {/* Le fond dynamique Aurora est ici, derrière le reste du contenu */}
                <AuroraBackground />

                <SafeAreaView />
                {/* Conteneur principal pour les boutons de connexion/inscription */}
                {!modalLogIn && !modalSignUp && (
                    <View style={styles.signContainer}>
                        <Image source={require('../assets/ddd.png')} style={styles.logo} />
                        <TouchableOpacity style={styles.button} onPress={() => setmodalLogIn(true)}>
                            <Text style={styles.textButton}>Se connecter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => setmodalSignUp(true)}>
                            <Text style={styles.textButton}>S'inscrire</Text>
                        </TouchableOpacity>

                        {/* Debug Redux - Peut être supprimé */}
                        {/* <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
                            État: {isLoggedIn ? 'Connecté' : 'Déconnecté'}
                        </Text> */}
                    </View>
                )}

                {/* Modal de connexion */}
                {modalLogIn && (
                    <Modal visible={modalLogIn} animationType="slide" transparent>
                        <View style={styles.centeredView}>
                            <BlurView intensity={50} tint="light" style={styles.glass}>
                                <Text style={styles.textModalTitle}>Connexion</Text>
                                {/* Email input dans un inp1 View pour le style */}
                                <View style={styles.inp1}>
                                    <TextInput
                                        placeholder="Email"
                                        placeholderTextColor={styles.placeholderTextColor.color}
                                        style={styles.textInput}
                                        onChangeText={setEmail}
                                        value={email}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                                <View style={styles.inp1}>
                                    <TextInput
                                        placeholder="Mot de passe"
                                        placeholderTextColor={styles.placeholderTextColor.color}
                                        style={styles.textInput}
                                        secureTextEntry={showPasswordConnection}
                                        onChangeText={setLogInPassword}
                                        value={logInPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPasswordConnection(!showPasswordConnection)}>
                                        <FontAwesome name={showPasswordConnection ? 'eye' : 'eye-slash'} color={'#636773'} size={20} />
                                    </TouchableOpacity>
                                </View>
                                {/* Message d'erreur email, si pertinent pour cette modal */}
                                {checkEmail && <Text style={styles.textErrorMessage}>Email invalide</Text>}

                                <TouchableOpacity
                                    style={[styles.button, loading && { opacity: 0.5 }]}
                                    onPress={logIN}
                                    activeOpacity={0.8}
                                    disabled={loading}
                                >
                                    <Text style={styles.textButton}>
                                        {loading ? 'Connexion...' : 'Se connecter'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setmodalLogIn(false)} activeOpacity={0.8}>
                                    <Text style={styles.closeTextButton}>Fermer</Text>
                                </TouchableOpacity>
                            </BlurView>
                        </View>
                    </Modal>
                )}

                {/* Modal d'inscription */}
                {modalSignUp && (
                    <Modal visible={modalSignUp} animationType="slide" transparent>
                        <View style={styles.centeredView}>
                            <BlurView intensity={50} tint="light" style={styles.glass}>
                                <Text style={styles.textModalTitle}>Inscription</Text>
                                {/* Email input dans un inp1 View pour le style */}
                                <View style={styles.inp1}>
                                    <TextInput
                                        placeholder="Email"
                                        placeholderTextColor={styles.placeholderTextColor.color}
                                        style={styles.textInput}
                                        onChangeText={mailcheck}
                                        value={email}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                                {checkEmail && <Text style={styles.textErrorMessage}>Email invalide</Text>}

                                <View style={styles.inp1}>
                                    <TextInput
                                        placeholder="Mot de passe"
                                        placeholderTextColor={styles.placeholderTextColor.color}
                                        style={styles.textInput}
                                        secureTextEntry={showPassword}
                                        onChangeText={setSignUpPassword}
                                        value={signUpPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <FontAwesome name={showPassword ? 'eye' : 'eye-slash'} color={'#636773'} size={20} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.inp1}>
                                    <TextInput
                                        placeholder="Confirmer le mot de passe"
                                        placeholderTextColor={styles.placeholderTextColor.color}
                                        style={styles.textInput}
                                        secureTextEntry={showPassword2}
                                        onChangeText={setConfirmPassword}
                                        value={confirmPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword2(!showPassword2)}>
                                        <FontAwesome name={showPassword2 ? 'eye' : 'eye-slash'} color={'#636773'} size={20} />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    style={[styles.button, loading && { opacity: 0.5 }]}
                                    onPress={signUP}
                                    activeOpacity={0.8}
                                    disabled={loading}
                                >
                                    <Text style={styles.textButton}>
                                        {loading ? 'Inscription...' : 'S\'inscrire'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setmodalSignUp(false)} activeOpacity={0.8}>
                                    <Text style={styles.closeTextButton}>Fermer</Text>
                                </TouchableOpacity>
                            </BlurView>
                        </View>
                    </Modal>
                )}
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    generalContainer: {
        flex: 1,
    },
    signContainer: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
        height: '90%',
        color: "white",
    },
    logo: {
        height: 350,
        width: 350,
        marginBottom: 40,
        resizeMode: 'contain',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 15,
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '80%',
        height: 68,
        borderRadius: 35,
        marginVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1.8,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.9)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 25,
    },
    textButton: {
        fontSize: 26,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF9800', // Adapté à la palette Rayon de Soleil
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    closeTextButton: {
        fontSize: 20,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF7043', // Adapté à la palette Rayon de Soleil
        marginTop: 15,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    glass: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%',
        padding: 45,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: 'rgba(255, 240, 200, 1)', // Lueur teintée pour Rayon de Soleil
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 40,
        elevation: 60,
        overflow: 'hidden', // Ensures content is clipped by border radius
    },
    textModalTitle: {
        fontFamily: "Fustat-SemiBold.ttf",
        fontSize: 38,
        color: '#FF7043', // Adapté à la palette Rayon de Soleil
        marginBottom: 50,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    inp1: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '95%',
        height: 65,
        borderRadius: 35,
        marginVertical: 10,
        paddingLeft: 25,
        paddingRight: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: 'rgba(0, 0, 0, 0.18)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 15,
    },
    textInput: {
        flex: 1,
        fontSize: 18,
        fontFamily: "Fustat-Regular.ttf",
        color: '#4a4a4a',
    },
    placeholderTextColor: {
        color: 'rgba(74, 74, 74, 0.6)',
    },
    textErrorMessage: {
        color: '#e74c3c',
        fontSize: 14,
        fontFamily: "Fustat-Regular.ttf",
        marginTop: 5,
        marginBottom: 10,
        alignSelf: 'flex-start',
        marginLeft: '5%',
    },
});