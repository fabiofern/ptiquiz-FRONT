import { StyleSheet, View, SafeAreaView, Button, TextInput, Text, Modal, TouchableOpacity, Image } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { BlurView } from 'expo-blur';
import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../redux/userSlice';

SplashScreen.preventAutoHideAsync();

const URL = process.env.EXPO_PUBLIC_BACKEND_URL

export default function LoginScreen({ navigation }) {

    // Redux
    const dispatch = useDispatch();
    const { loading, isLoggedIn } = useSelector((state) => state.user);

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
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    const [showPasswordConnection, setShowPasswordConnection] = useState(true);
    const [showPassword, setShowPassword] = useState(true);
    const [showPassword2, setShowPassword2] = useState(true);

    const [modalSignUp, setmodalSignUp] = useState(false);
    const [modalLogIn, setmodalLogIn] = useState(false);

    const [signUpPassword, setSignUpPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [logInUsername, setLogInUsername] = useState('');
    const [logInPassword, setLogInPassword] = useState('');
    const [email, setEmail] = useState('');
    const [checkEmail, setcheckEmail] = useState(false);

    if (!loaded) {
        return null;
    }

    function signUP() {
        console.log("Tentative d'inscription avec :", { email, signUpPassword, confirmPassword });

        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!pattern.test(email.trim())) {
            setcheckEmail(true);
            return;
        }

        if (!email.trim() || !signUpPassword.trim() || !confirmPassword.trim()) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        if (signUpPassword !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas.");
            return;
        }

        // Démarrer le loading
        dispatch(updateUser({ loading: true }));

        fetch(`${URL}/users/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase(), password: signUpPassword.trim() }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.result) {
                    // Sauvegarder dans Redux
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
                    navigation.navigate('Avatar');
                } else {
                    dispatch(updateUser({ loading: false }));
                    alert('utilisateur deja present');
                }
            })
            .catch(error => {
                dispatch(updateUser({ loading: false }));
                console.error("LoginScreen : Erreur lors de l'inscription :", error);
            });
    }

    function mailcheck(value) {
        setEmail(value);
        setcheckEmail(false)
    }

    function logIN() {
        console.log("Tentative de connection avec :", { email, logInPassword, });

        if (!email.trim() || !logInPassword.trim()) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        // Démarrer le loading
        dispatch(updateUser({ loading: true }));

        fetch(`${URL}/users/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase(), password: logInPassword.trim().toLowerCase() }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.result) {
                    // Sauvegarder dans Redux
                    dispatch(updateUser({
                        loading: false,
                        isLoggedIn: true,
                        userData: {
                            token: data.token,
                            avatar: data.avatar,
                            username: data.username,
                            userID: data._id,
                            email: email.trim().toLowerCase()
                        }
                    }));

                    setEmail('');
                    setLogInPassword('');
                    setmodalLogIn(false);
                    console.log("Connexion réussie :", email);
                    navigation.navigate('Map');
                } else {
                    dispatch(updateUser({ loading: false }));
                    alert("Nom d'utilisateur ou mot de passe incorrect.");
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
                colors={['#eeddfd', '#d5c3f3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
            >
                <SafeAreaView />
                {!modalLogIn && !modalSignUp && (
                    <View style={styles.signContainer}>
                        <Image source={require('../assets/ddd.png')} style={styles.logo} />
                        <TouchableOpacity style={styles.button} onPress={() => setmodalLogIn(true)}>
                            <Text style={styles.textButton}>Se connecter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => setmodalSignUp(true)}>
                            <Text style={styles.textButton}>S'inscrire</Text>
                        </TouchableOpacity>

                        {/* Debug Redux - Tu peux supprimer après */}
                        <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>
                            État: {isLoggedIn ? 'Connecté' : 'Déconnecté'}
                        </Text>
                    </View>
                )}

                {modalLogIn && (
                    <Modal visible={modalLogIn} animationType="slide" transparent>
                        <View style={styles.centeredView}>
                            <BlurView intensity={50} tint="light" style={styles.glass}>
                                <Text style={{ fontFamily: "Fustat-SemiBold.ttf", fontSize: 35, color: '#fb7a68', paddingBottom: 60 }}>Connexion</Text>
                                <TextInput
                                    placeholderTextColor={'#636773'}
                                    fontSize={15}
                                    style={styles.inp1}
                                    placeholder="Email"
                                    onChangeText={setEmail}
                                    value={email}
                                />
                                <View style={styles.inp1}>
                                    <TextInput
                                        placeholderTextColor={'#636773'}
                                        fontSize={15}
                                        placeholder="Mot de passe"
                                        secureTextEntry={showPasswordConnection ? true : false}
                                        onChangeText={setLogInPassword}
                                        value={logInPassword}
                                    />
                                    {checkEmail && <Text>Email invalide</Text>}
                                    <TouchableOpacity onPress={() => setShowPasswordConnection(!showPasswordConnection)}>
                                        <FontAwesome name={showPasswordConnection ? 'eye' : 'eye-slash'} color={'#636773'} size={20} paddingRight={20} />
                                    </TouchableOpacity>
                                </View>
                                <TouchableOpacity
                                    style={[styles.button, loading && { opacity: 0.5 }]}
                                    onPress={logIN}
                                    activeOpacity={0.8}
                                    disabled={loading}
                                >
                                    <Text style={[styles.textButton]}>
                                        {loading ? 'Connexion...' : 'Se connecter'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setmodalLogIn(false)} activeOpacity={0.8}>
                                    <Text style={styles.textButton}>Fermer</Text>
                                </TouchableOpacity>
                            </BlurView>
                        </View>
                    </Modal>
                )}

                {modalSignUp && (
                    <Modal visible={modalSignUp} animationType="slide" transparent>
                        <View style={styles.centeredView}>
                            <BlurView intensity={50} tint="light" style={styles.glass}>
                                <Text style={{ fontFamily: "Fustat-SemiBold.ttf", fontSize: 35, paddingBottom: 50, color: '#fb7a68' }}>Inscription</Text>
                                <TextInput
                                    placeholderTextColor={'#636773'}
                                    fontSize={15}
                                    style={styles.inp1}
                                    placeholder="Email"
                                    onChangeText={mailcheck}
                                    value={email}
                                />
                                {checkEmail && <Text>Email invalide</Text>}

                                <View style={styles.inp1}>
                                    <TextInput
                                        placeholderTextColor={'#636773'}
                                        style={{ fontSize: 15 }}
                                        placeholder="Mot de passe"
                                        secureTextEntry={showPassword ? true : false}
                                        onChangeText={setSignUpPassword}
                                        value={signUpPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        <FontAwesome name={showPassword ? 'eye' : 'eye-slash'} color={'#636773'} size={20} paddingRight={12} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.inp1}>
                                    <TextInput
                                        placeholderTextColor={'#636773'}
                                        style={{ fontSize: 15 }}
                                        placeholder="Confirmer le mot de passe"
                                        secureTextEntry={showPassword2 ? true : false}
                                        onChangeText={setConfirmPassword}
                                        value={confirmPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword2(!showPassword2)}>
                                        <FontAwesome name={showPassword2 ? 'eye' : 'eye-slash'} color={'#636773'} size={20} paddingRight={12} />
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
                                    <Text style={styles.textButton}>Fermer</Text>
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
    glass: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '80%',
        padding: 20,
        borderRadius: 33,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 6, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
    },

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
        color: "",
        padding: 10,
    },
    closeTextButton: {
        fontSize: 20,
        fontFamily: "Fustat-ExtraBold.ttf",
        alignItems: 'center',
        alignContent: 'flex-end',
        justifyContent: 'center',
        color: "#85CAE4",
        padding: 10,
    },
    loginButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%',
        height: 72,
        backgroundColor: '#FF8527',
        margin: 20,
        marginTop: 50,
        borderRadius: 20,
        elevation: 3,
    },
    textLoginButton: {
        fontSize: 20,
        fontFamily: "Fustat-ExtraBold.ttf",
        alignItems: 'center',
        alignContent: 'flex-end',
        justifyContent: 'center',
        color: "white",
        padding: 10,
    },
    signupButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%',
        height: 72,
        backgroundColor: '#FF8527',
        margin: 20,
        marginTop: 50,
        borderRadius: 20,
        elevation: 3,
    },
    textsignupButton: {
        fontFamily: "Fustat-ExtraBold.ttf",
        fontSize: 20,
        alignItems: 'center',
        alignContent: 'flex-end',
        justifyContent: 'center',
        color: "white",
        padding: 10,
    },

    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalViewLogin: {
        backgroundColor: '#FFFFFF',
        width: '90%',
        paddingTop: 30,
        paddingBottom: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
        elevation: 3,
    },
    modalViewsignup: {
        // backgroundColor: 'black',
        width: '90%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
        paddingTop: 30,
        paddingBottom: 30,
        elevation: 3,
    },
    inp1: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '90%',
        height: 70,
        backgroundColor: '#F0F0F0',
        borderRadius: 33,
        margin: 12,
        paddingLeft: 20
    },
    logo: {
        height: 180,
        width: 180,
        marginBottom: 150,
        justifyContent: 'center',
        aligItems: 'center',
        resizeMode: 'contain',
        alignSelf: 'center',
        elevation: 3,
    },
});