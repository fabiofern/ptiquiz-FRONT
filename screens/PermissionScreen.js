import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { updateLocationPermissions } from '../redux/userSlice';
import { BlurView } from 'expo-blur';
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { EXPO_PUBLIC_BACKEND_URL } from '@env';

SplashScreen.preventAutoHideAsync();

export default function PermissionScreen({ navigation }) {
    //    const URL = "https://ptiquiz-back.fly.dev"
    const URL = EXPO_PUBLIC_BACKEND_URL;
    ; const dispatch = useDispatch();
    const { userData } = useSelector((state) => state.user);
    const [isLoading, setIsLoading] = useState(false);

    const [loaded] = useFonts({
        "Fustat-ExtraBold.ttf": require("../assets/fonts/Fustat-ExtraBold.ttf"),
        "Fustat-Regular.ttf": require("../assets/fonts/Fustat-Regular.ttf"),
        "Fustat-SemiBold.ttf": require("../assets/fonts/Fustat-SemiBold.ttf"),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

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

                const response = await fetch(`${URL}/users/locationPermissions`, {
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

                    dispatch(updateLocationPermissions({
                        foreground: true,
                        background: false
                    }));

                    navigation.navigate('MainApp');
                } else {
                    console.error("❌ Erreur sauvegarde permissions:", data.error);
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

    return (
        <LinearGradient
            colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={styles.safeAreaPusher} />

            <BlurView intensity={50} tint="light" style={styles.glassContent}>
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
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FF7043" />
                    ) : (
                        <Text style={styles.buttonText}>Autoriser la géolocalisation</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => navigation.navigate('MainApp')}
                >
                    <Text style={styles.skipText}>Plus tard</Text>
                </TouchableOpacity>
            </BlurView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeAreaPusher: {
        position: 'absolute',
        top: 0,
        height: 50,
        width: '100%',
    },
    glassContent: {
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 40,
        borderRadius: 30,
        width: '90%',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: 'rgba(255, 240, 200, 1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 40,
        elevation: 60,
        overflow: 'hidden',
    },
    emoji: {
        fontSize: 80,
        marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    title: {
        fontSize: 32,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: "#FF7043",
        textAlign: 'center',
        marginBottom: 15,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: "Fustat-Regular.ttf",
        color: "#4a4a4a",
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%',
        height: 68,
        borderRadius: 35,
        marginVertical: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1.8,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.9)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 25,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 22,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: "#FF9800",
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    skipButton: {
        padding: 10,
        marginTop: 10,
    },
    skipText: {
        fontSize: 16,
        fontFamily: "Fustat-SemiBold.ttf",
        color: "#4a4a4a",
        textDecorationLine: 'underline',
        opacity: 0.8,
    },
});