import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPO_PUBLIC_BACKEND_URL } from '@env';

class SocialLocationService {
    constructor() {
        this.locationSubscription = null;
        this.lastKnownPosition = null;
        this.lastSentPosition = null;
        this.updateInterval = 5000; // 5 secondes pour le tracking local
        this.sendInterval = 30000; // 30 secondes pour l'envoi serveur
        this.minDistanceToSend = 100; // 100m minimum pour envoyer
        this.minSpeedChangeToSend = 5; // 5 km/h de différence minimum
        this.apiBaseUrl = EXPO_PUBLIC_BACKEND_URL;
        this.pendingUpdate = null;
        this.sendTimer = null;
        this.onLocationUpdate = null;

         if (!this.apiBaseUrl) {
      console.warn('⚠️⚠️⚠️⚠️⚠️ BACKEND_URL non défini dans .env ⚠️⚠️⚠️⚠️⚠️');
        }
    }

    // 📍 Initialiser le service de géolocalisation
    async initializeLocationService() {
        try {
            // Vérifier les permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Permission de géolocalisation refusée');
            }

            console.log('✅ Service de localisation sociale initialisé');
            return true;
        } catch (error) {
            console.error('❌ Erreur initialisation localisation:', error);
            return false;
        }
    }

    // 🚀 Démarrer le tracking en temps réel
    async startLocationTracking(userId) {
        try {
            if (this.locationSubscription) {
                this.stopLocationTracking();
            }

            console.log('🎯 Démarrage tracking pour user:', userId);

            // Timer d'envoi périodique (toutes les 30s)
            this.sendTimer = setInterval(() => {
                if (this.pendingUpdate) {
                    this.sendLocationUpdate(userId, this.pendingUpdate);
                    this.pendingUpdate = null;
                }
            }, this.sendInterval);

            this.locationSubscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: this.updateInterval,
                    distanceInterval: 20, // Mise à jour tous les 20m minimum
                },
                (location) => {
                    this.handleLocationUpdate(userId, location);
                }
            );

            return true;
        } catch (error) {
            console.error('❌ Erreur démarrage tracking:', error);
            return false;
        }
    }

    // 📍 Gérer les mises à jour de position (LOCAL, pas d'envoi systématique)
    async handleLocationUpdate(userId, location) {
        try {
            const { latitude, longitude, speed } = location.coords;

            // Calculer la vitesse si pas disponible
            let calculatedSpeed = speed || 0;
            if (!speed && this.lastKnownPosition) {
                calculatedSpeed = this.calculateSpeed(
                    this.lastKnownPosition,
                    { latitude, longitude, timestamp: location.timestamp }
                );
            }

            // Convertir en km/h
            const speedKmh = (calculatedSpeed || 0) * 3.6;

            const currentPosition = {
                latitude,
                longitude,
                speed: speedKmh,
                timestamp: location.timestamp
            };

            console.log(`📍 Position locale: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} - Vitesse: ${speedKmh.toFixed(1)} km/h`);

            // 🔥 DÉCIDER SI ON DOIT ENVOYER AU SERVEUR
            if (this.shouldSendUpdate(currentPosition)) {
                console.log('🌐 Envoi immédiat au serveur (changement significatif)');
                await this.sendLocationUpdate(userId, currentPosition);
                this.pendingUpdate = null;
            } else {
                // Stocker pour envoi différé
                this.pendingUpdate = currentPosition;
                console.log('⏳ Mise à jour en attente...');
            }

            this.lastKnownPosition = currentPosition;

        } catch (error) {
            console.error('❌ Erreur mise à jour position:', error);
        }
    }

    // 🤔 Décider si on doit envoyer la mise à jour
    shouldSendUpdate(currentPosition) {
        if (!this.lastSentPosition) return true; // Premier envoi

        const timeDiff = (currentPosition.timestamp - this.lastSentPosition.timestamp) / 1000;

        // Forcer l'envoi si plus de 2 minutes
        if (timeDiff > 120) return true;

        // Distance significative
        const distance = this.calculateDistance(
            this.lastSentPosition.latitude, this.lastSentPosition.longitude,
            currentPosition.latitude, currentPosition.longitude
        );

        if (distance > this.minDistanceToSend) return true;

        // Changement de vitesse significatif
        const speedDiff = Math.abs(currentPosition.speed - this.lastSentPosition.speed);
        if (speedDiff > this.minSpeedChangeToSend) return true;

        // Transition arrêt/mouvement importante
        const wasMoving = this.lastSentPosition.speed > 2;
        const isMoving = currentPosition.speed > 2;
        if (wasMoving !== isMoving) return true;

        return false; // Pas besoin d'envoyer
    }

    // 🌐 Envoyer la position au serveur (fonction renommée pour clarté)
    async sendLocationUpdate(userId, locationData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/users/location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                    speed: locationData.speed
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const result = await response.json();

            console.log(`🌍 ✅ Envoyé au serveur - Visible: ${result.isVisible}, SafePlace: ${result.inSafePlace}`);
            console.log(`👥 Utilisateurs à proximité: ${result.nearbyUsers.length}`);

            if (this.onLocationUpdate && typeof this.onLocationUpdate === 'function') {
                console.log('🔍 DEBUG - Appel du callback depuis le service');
                this.onLocationUpdate(result);
            } else {
                console.log('🔍 DEBUG - Pas de callback défini dans le service');
            }
            // Marquer comme envoyé
            this.lastSentPosition = {
                ...locationData,
                sentAt: Date.now()
            };

            return result;
        } catch (error) {
            console.error('❌ Erreur envoi serveur:', error);
            return { success: false, nearbyUsers: [] };
        }
    }

    // 🏠 Définir la Safe Place
    async setSafePlace(userId, address, coordinates) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/users/safe-place`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    address,
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('🏠 Safe Place définie:', result.safePlace.address);
                // Sauvegarder localement
                await AsyncStorage.setItem('userSafePlace', JSON.stringify(result.safePlace));
            }

            return result;
        } catch (error) {
            console.error('❌ Erreur définition Safe Place:', error);
            return { success: false };
        }
    }

    // 📍 Obtenir la position actuelle (one-shot)
    async getCurrentLocation() {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: location.timestamp
            };
        } catch (error) {
            console.error('❌ Erreur position actuelle:', error);
            return null;
        }
    }

    // ⚡ Calculer la vitesse entre deux points
    calculateSpeed(pos1, pos2) {
        const timeDiff = (pos2.timestamp - pos1.timestamp) / 1000; // secondes
        if (timeDiff === 0) return 0;

        const distance = this.calculateDistance(
            pos1.latitude, pos1.longitude,
            pos2.latitude, pos2.longitude
        );

        return distance / timeDiff; // m/s
    }

    // 📐 Calculer la distance entre deux points (formule haversine)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Rayon de la Terre en mètres
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance en mètres
    }

    // 📐 Convertir degrés en radians
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // ⏹️ Arrêter le tracking
    stopLocationTracking() {
        if (this.locationSubscription) {
            this.locationSubscription.remove();
            this.locationSubscription = null;
            console.log('⏹️ Tracking arrêté');
        }

        if (this.sendTimer) {
            clearInterval(this.sendTimer);
            this.sendTimer = null;
            console.log('⏹️ Timer d\'envoi arrêté');
        }
    }

    // 🧹 Nettoyer le service
    cleanup() {
        this.stopLocationTracking();
        this.lastKnownPosition = null;
        this.lastSentPosition = null;
        this.pendingUpdate = null;
        this.onLocationUpdate = null;
    }
}

// Export instance singleton
export default new SocialLocationService();