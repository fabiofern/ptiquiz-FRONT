// 1. PermissionScreen.js - Page dédiée (recommandé)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { updateLocationPermissions } from '../redux/userSlice';
// import PermissionScreen from './screens/PermissionScreen';

export default function PermissionScreen({ navigation }) {
    const dispatch = useDispatch();
    const { userData } = useSelector((state) => state.user);
    const [isLoading, setIsLoading] = useState(false);
    // Dans PermissionScreen.js - modifiez requestLocationPermission :

    const requestLocationPermission = async () => {
        setIsLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                    timeout: 10000,
                });

                console.log('✅ Géolocalisation OK');

                // 🎯 SAUVEGARDER EN BASE DE DONNÉES
                const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/locationPermissions`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: userData.token,
                        foreground: true,
                        background: false
                    }),
                });

                const data = await response.json();

                if (data.result) {
                    console.log("✅ Permissions sauvées en base");

                    // 🎯 METTRE À JOUR REDUX
                    dispatch(updateLocationPermissions({
                        foreground: true,
                        background: false
                    }));

                    // 🎯 ALLER À LA MAP
                    navigation.navigate('MainApp');
                } else {
                    console.error("❌ Erreur sauvegarde permissions:", data.error);
                    // Continuer quand même vers Map
                    navigation.navigate('MainApp');
                }

            } else {
                Alert.alert(
                    'Permission refusée',
                    'Tu peux continuer sans géolocalisation',
                    [{ text: 'Continuer', onPress: () => navigation.navigate('MainApp') }]
                );
            }
        } catch (error) {
            console.error('Erreur géolocalisation:', error);
            navigation.navigate('MainApp');
        } finally {
            setIsLoading(false);
        }
    };

    const savePermissionsToBackend = async (permissions) => {
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/locationPermissions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: userData.token,
                    foreground: true,
                    background: false
                }),
            });

            const data = await response.json();

            if (data.result) {
                console.log('✅ Permissions sauvées en base');
            } else {
                console.error('❌ Erreur sauvegarde permissions:', data.error);
            }
        } catch (error) {
            console.error('❌ Erreur réseau:', error);
        }
    };

    return (
        <LinearGradient
            colors={['#eeddfd', '#d5c3f3']}
            style={styles.container}
        >
            <View style={styles.content}>
                <Text style={styles.emoji}>📍</Text>
                <Text style={styles.title}>Trouve les quiz près de toi !</Text>
                <Text style={styles.subtitle}>
                    Autorise la géolocalisation pour débloquer automatiquement
                    les quiz quand tu passes près des monuments parisiens
                </Text>

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={requestLocationPermission}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {isLoading ? 'Vérification...' : 'Autoriser la géolocalisation'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => navigation.navigate('Map')}
                >
                    <Text style={styles.skipText}>Plus tard</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

// 2. Modifiez AvatarScreen.js - Navigation vers permission
const handleRegister = () => {
    if (!selectedAvatar || signUpUsername.trim() === "") {
        alert("Choisis un avatar et un pseudo !");
        return;
    } else {
        console.log("Pseudo :", signUpUsername);
        console.log("Avatar sélectionné :", selectedAvatar);

        dispatch(updateUser({
            isLoggedIn: true,
            userData: {
                ...userData,
                avatar: selectedAvatar,
                username: signUpUsername.trim()
            }
        }));

        // 🎯 Navigation vers la page de permission
        navigation.navigate('PermissionScreen');
    }
};

// 3. Alternative : Directement dans AvatarScreen (plus rapide)
const handleRegisterWithLocation = async () => {
    if (!selectedAvatar || signUpUsername.trim() === "") {
        alert("Choisis un avatar et un pseudo !");
        return;
    }

    // Sauvegarder le profil
    dispatch(updateUser({
        isLoggedIn: true,
        userData: {
            ...userData,
            avatar: selectedAvatar,
            username: signUpUsername.trim()
        }
    }));

    // Demander la géolocalisation directement
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
            await Location.getCurrentPositionAsync({}); // Test
            dispatch(updateLocationPermissions({ foreground: true }));
            console.log('✅ Géolocalisation OK');
        }
    } catch (error) {
        console.log('⚠️ Pas de géolocalisation, mais on continue');
    }

    navigation.navigate('Map');
};

// 4. Ajoutez dans votre Navigator
// App.js ou Navigation.js

function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Avatar">
                <Stack.Screen name="Avatar" component={AvatarScreen} />
                <Stack.Screen
                    name="PermissionScreen"
                    component={PermissionScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen name="Map" component={MapScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    emoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: "#fb7a68",
        textAlign: 'center',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 18,
        color: "#666",
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#e9d8f9',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.2,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 18,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: "#333",
    },
    skipButton: {
        padding: 10,
    },
    skipText: {
        fontSize: 16,
        color: "#999",
        textDecorationLine: 'underline',
    },
});