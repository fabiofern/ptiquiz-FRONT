import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import BackgroundLocationService from '../services/BackgroundLocationService';

const LocationDebugComponent = () => {
    const [serviceStatus, setServiceStatus] = useState('Arrêté');
    const [lastLocation, setLastLocation] = useState(null);
    const [locationHistory, setLocationHistory] = useState([]);
    const [stats, setStats] = useState({
        totalUpdates: 0,
        positionsToday: 0,
        notificationSentToday: false
    });

    useEffect(() => {
        // Écoute les mises à jour de position
        const subscription = BackgroundLocationService.onLocationUpdate((location) => {
            console.log('🎯 Nouvelle position reçue:', location);
            setLastLocation(location);

            // Ajoute à l'historique (garde seulement les 10 dernières)
            setLocationHistory(prev => [
                {
                    ...location,
                    timestamp: new Date().toLocaleTimeString()
                },
                ...prev.slice(0, 9)
            ]);
        });

        // Écoute les mises à jour de statut
        const statusSubscription = BackgroundLocationService.onStatusChange((status) => {
            console.log('📊 Statut service:', status);
            setServiceStatus(status.isTracking ? 'Actif' : 'Arrêté');

            if (status.stats) {
                setStats(prev => ({
                    ...prev,
                    ...status.stats
                }));
            }
        });

        // Charge les stats initiales
        const initialStats = BackgroundLocationService.getStats();
        setStats(initialStats);
        setServiceStatus(initialStats.isTracking ? 'Actif' : 'Arrêté');

        return () => {
            subscription?.remove();
            statusSubscription?.remove();
        };
    }, []);

    const handleStartService = async () => {
        try {
            const started = await BackgroundLocationService.startTracking();
            if (started) {
                Alert.alert('✅ Service démarré', 'Le tracking de position est maintenant actif');
            } else {
                Alert.alert('❌ Erreur', 'Impossible de démarrer le service');
            }
        } catch (error) {
            Alert.alert('❌ Erreur', error.message);
        }
    };

    const handleStopService = async () => {
        try {
            await BackgroundLocationService.stopTracking();
            Alert.alert('⏹️ Service arrêté', 'Le tracking de position est maintenant inactif');
        } catch (error) {
            Alert.alert('❌ Erreur', error.message);
        }
    };

    const handleGetCurrentLocation = async () => {
        try {
            const location = await BackgroundLocationService.getCurrentLocation();
            if (location) {
                Alert.alert('📍 Position actuelle',
                    `Lat: ${location.latitude.toFixed(6)}\nLon: ${location.longitude.toFixed(6)}`);
            }
        } catch (error) {
            Alert.alert('❌ Erreur', error.message);
        }
    };

    const handleForceCheck = async () => {
        try {
            Alert.alert('🔍', 'Vérification forcée démarrée...');
            await BackgroundLocationService.forceCheckNow();
            Alert.alert('✅', 'Vérification forcée terminée');
        } catch (error) {
            Alert.alert('❌ Erreur', error.message);
        }
    };

    const handleClearHistory = () => {
        setLocationHistory([]);
        setStats({ totalUpdates: 0, positionsToday: 0, notificationSentToday: false });
    };

    return (
        <ScrollView style={styles.container}>
            <BlurView intensity={20} style={styles.card}>
                <Text style={styles.title}>🔧 Debug Géolocalisation</Text>

                {/* Statut du service */}
                <View style={styles.statusContainer}>
                    <Text style={styles.label}>Statut du service:</Text>
                    <Text style={[
                        styles.status,
                        { color: serviceStatus === 'Actif' ? '#4ade80' : '#f87171' }
                    ]}>
                        {serviceStatus}
                    </Text>
                </View>

                {/* Boutons de contrôle */}
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.startButton]}
                        onPress={handleStartService}
                    >
                        <Text style={styles.buttonText}>▶️ Démarrer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.stopButton]}
                        onPress={handleStopService}
                    >
                        <Text style={styles.buttonText}>⏹️ Arrêter</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.button, styles.locationButton]}
                    onPress={handleGetCurrentLocation}
                >
                    <Text style={styles.buttonText}>📍 Position actuelle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.forceButton]}
                    onPress={handleForceCheck}
                >
                    <Text style={styles.buttonText}>🔍 Force vérification</Text>
                </TouchableOpacity>

                {/* Statistiques */}
                <View style={styles.statsContainer}>
                    <Text style={styles.sectionTitle}>📊 Statistiques</Text>
                    <Text style={styles.stat}>Positions aujourd'hui: {stats.positionsToday || 0}</Text>
                    <Text style={styles.stat}>Total mises à jour: {stats.totalUpdates || 0}</Text>
                    <Text style={styles.stat}>Mode actuel: {stats.currentMode || 'inconnu'}</Text>
                    <Text style={styles.stat}>Notification envoyée: {stats.notificationSentToday ? 'Oui' : 'Non'}</Text>
                    <Text style={styles.stat}>Service initialisé: {stats.isInitialized ? 'Oui' : 'Non'}</Text>
                </View>

                {/* Dernière position */}
                {lastLocation && (
                    <View style={styles.locationContainer}>
                        <Text style={styles.sectionTitle}>📍 Dernière position</Text>
                        <Text style={styles.locationText}>
                            Lat: {lastLocation.latitude?.toFixed(6)}
                        </Text>
                        <Text style={styles.locationText}>
                            Lon: {lastLocation.longitude?.toFixed(6)}
                        </Text>
                        <Text style={styles.locationText}>
                            Précision: {lastLocation.accuracy?.toFixed(0)}m
                        </Text>
                        <Text style={styles.locationText}>
                            Mode: {lastLocation.mode || 'inconnu'}
                        </Text>
                    </View>
                )}

                {/* Historique */}
                {locationHistory.length > 0 && (
                    <View style={styles.historyContainer}>
                        <View style={styles.historyHeader}>
                            <Text style={styles.sectionTitle}>📋 Historique</Text>
                            <TouchableOpacity onPress={handleClearHistory}>
                                <Text style={styles.clearButton}>🗑️ Vider</Text>
                            </TouchableOpacity>
                        </View>

                        {locationHistory.slice(0, 5).map((location, index) => (
                            <View key={index} style={styles.historyItem}>
                                <Text style={styles.historyTime}>{location.timestamp}</Text>
                                <Text style={styles.historyCoords}>
                                    {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </BlurView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(26, 26, 46, 0.1)',
    },
    card: {
        margin: 20,
        padding: 20,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 20,
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        padding: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10,
    },
    label: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
    status: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    startButton: {
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        borderColor: '#4ade80',
        borderWidth: 1,
    },
    stopButton: {
        backgroundColor: 'rgba(248, 113, 113, 0.2)',
        borderColor: '#f87171',
        borderWidth: 1,
    },
    locationButton: {
        backgroundColor: 'rgba(157, 78, 221, 0.2)',
        borderColor: '#9d4edd',
        borderWidth: 1,
        marginBottom: 15,
    },
    forceButton: {
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
        borderColor: '#ffc107',
        borderWidth: 1,
        marginBottom: 20,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 10,
    },
    statsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    stat: {
        fontSize: 14,
        color: '#e0e7ff',
        marginBottom: 5,
    },
    locationContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    locationText: {
        fontSize: 14,
        color: '#e0e7ff',
        marginBottom: 3,
    },
    historyContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 15,
        borderRadius: 10,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    clearButton: {
        color: '#f87171',
        fontSize: 14,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    historyTime: {
        fontSize: 12,
        color: '#9ca3af',
    },
    historyCoords: {
        fontSize: 12,
        color: '#e0e7ff',
    },
});

export default LocationDebugComponent;