import React, { useState, useEffect } from 'react'; // Ajout useEffect
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'; // Ajout ActivityIndicator
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { updateLocationPermissions } from '../redux/userSlice';
import { BlurView } from 'expo-blur'; // Import BlurView
import { useFonts } from "expo-font"; // Import pour les polices
import * as SplashScreen from "expo-splash-screen"; // Import pour le splash screen

SplashScreen.preventAutoHideAsync(); // Garde le splash screen visible

export default function PermissionScreen({ navigation }) {
    const dispatch = useDispatch();
    const { userData } = useSelector((state) => state.user);
    const [isLoading, setIsLoading] = useState(false);

    // Chargement des polices
    const [loaded] = useFonts({
        "Fustat-ExtraBold.ttf": require("../assets/fonts/Fustat-ExtraBold.ttf"),
        "Fustat-Regular.ttf": require("../assets/fonts/Fustat-Regular.ttf"),
        "Fustat-SemiBold.ttf": require("../assets/fonts/Fustat-SemiBold.ttf"),
    });

    // Cacher l'écran de splash une fois les polices chargées
    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    // Ne pas rendre la page tant que les polices ne sont pas chargées
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

                // SAUVEGARDER EN BASE DE DONNÉES
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

                    // METTRE À JOUR REDUX
                    dispatch(updateLocationPermissions({
                        foreground: true,
                        background: false
                    }));

                    // ALLER À LA MAP
                    navigation.navigate('MainApp'); // Utilisation de 'MainApp' pour la cohérence
                } else {
                    console.error("❌ Erreur sauvegarde permissions:", data.error);
                    // Continuer quand même vers Map si la sauvegarde échoue
                    navigation.navigate('MainApp'); // Utilisation de 'MainApp' pour la cohérence
                }

            } else {
                Alert.alert(
                    'Permission refusée',
                    'Tu peux continuer sans géolocalisation',
                    [{ text: 'Continuer', onPress: () => navigation.navigate('MainApp') }] // Utilisation de 'MainApp'
                );
            }
        } catch (error) {
            console.error('Erreur géolocalisation:', error);
            navigation.navigate('MainApp'); // Utilisation de 'MainApp'
        } finally {
            setIsLoading(false);
        }
    };

    // La fonction savePermissionsToBackend est maintenant intégrée dans requestLocationPermission
    // pour éviter la redondance et s'assurer que Redux et le backend sont mis à jour ensemble.
    // Vous pouvez la supprimer si elle n'est pas appelée ailleurs.
    /*
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
    */

    return (
        <LinearGradient
            // Dégradé de couleurs pour le fond : Rayon de Soleil
            colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={styles.safeAreaPusher} /> {/* Espace pour SafeAreaView */}

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
                        <ActivityIndicator size="small" color="#FF7043" /> // Couleur du Rayon de Soleil
                    ) : (
                        <Text style={styles.buttonText}>Autoriser la géolocalisation</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => navigation.navigate('MainApp')} // Utilisation de 'MainApp'
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
    safeAreaPusher: { // Pour pousser le contenu vers le bas et respecter la SafeArea
        position: 'absolute',
        top: 0,
        height: 50, // Hauteur arbitraire, ajustez si nécessaire
        width: '100%',
    },
    // Nouveau style pour le contenu "Liquid Glass"
    glassContent: {
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingVertical: 40, // Plus de padding
        borderRadius: 30, // Coins arrondis
        width: '90%', // Prend plus de largeur
        // Cœur du style "Liquid Glass"
        backgroundColor: 'rgba(255, 255, 255, 0.08)', // Très translucide
        borderWidth: 3, // Bordure épaisse
        borderColor: 'rgba(255, 255, 255, 0.8)', // Bordure blanche lumineuse

        // Lueur et ombre pour le volume
        shadowColor: 'rgba(255, 240, 200, 1)', // Lueur teintée pour Rayon de Soleil
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 40, // Grande lueur
        elevation: 60, // Forte élévation pour un effet de bulle
        overflow: 'hidden', // Important pour BlurView
    },
    emoji: {
        fontSize: 80,
        marginBottom: 20,
        // Optionnel: légère ombre pour le faire "flotter"
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    title: {
        fontSize: 32,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: "#FF7043", // Rose corail de la palette Rayon de Soleil
        textAlign: 'center',
        marginBottom: 15, // Marge ajustée
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 16, // Taille légèrement réduite pour la lisibilité
        fontFamily: "Fustat-Regular.ttf", // Police régulière pour le corps de texte
        color: "#4a4a4a", // Gris foncé de la palette Rayon de Soleil
        textAlign: 'center',
        lineHeight: 22, // Hauteur de ligne pour une meilleure lecture
        marginBottom: 40,
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%', // Plus large
        height: 68,
        borderRadius: 35,
        marginVertical: 15,
        // Style "Liquid Glass" pour le bouton
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fond translucide
        borderWidth: 1.8,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.9)', // Lueur teintée Rayon de Soleil
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 25,
    },
    buttonDisabled: {
        opacity: 0.6, // Conserve l'opacité pour l'état désactivé
    },
    buttonText: {
        fontSize: 22, // Taille ajustée
        fontFamily: "Fustat-ExtraBold.ttf",
        color: "#FF9800", // Orange vif de la palette Rayon de Soleil
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    skipButton: {
        padding: 10,
        marginTop: 10, // Marge pour l'espacement
    },
    skipText: {
        fontSize: 16,
        fontFamily: "Fustat-SemiBold.ttf", // Police SemiBold
        color: "#4a4a4a", // Gris foncé de la palette Rayon de Soleil
        textDecorationLine: 'underline',
        opacity: 0.8, // Légèrement moins opaque
    },
});
