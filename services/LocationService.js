// services/LocationService.js
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { store } from '../redux/store';
import { updateUser } from '../redux/userSlice';

const LOCATION_TASK_NAME = 'background-location-task';

// Tâche en arrière-plan
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
    if (error) {
        console.error('Erreur géolocalisation:', error);
        return;
    }

    if (data) {
        const { locations } = data;
        const location = locations[0];

        if (location) {
            // Vérifier les quiz à débloquer
            checkNearbyQuizzes(location.coords);
        }
    }
});

// Fonction pour vérifier les quiz proches
const checkNearbyQuizzes = (userCoords) => {
    const state = store.getState();
    const { userData } = state.user;

    if (!userData) return;

    // Vos points de quiz (importez-les depuis votre fichier)
    const quizPoints = [
        // ... votre array de quiz
    ];

    const unlockedQuizzes = userData.unlockedQuizzes || [];
    const newUnlocked = [];

    quizPoints.forEach((quiz) => {
        const distance = getDistanceInMeters(
            userCoords.latitude,
            userCoords.longitude,
            parseFloat(quiz.location.latitude),
            parseFloat(quiz.location.longitude)
        );

        // Débloquer si moins de 100m et pas déjà débloqué
        if (distance < 100 && !unlockedQuizzes.includes(quiz._id.$oid)) {
            newUnlocked.push(quiz._id.$oid);
        }
    });

    // Sauvegarder les nouveaux quiz débloqués
    if (newUnlocked.length > 0) {
        store.dispatch(updateUser({
            userData: {
                ...userData,
                unlockedQuizzes: [...unlockedQuizzes, ...newUnlocked]
            }
        }));

        // Notification optionnelle
        showUnlockNotification(newUnlocked.length);
    }
};

// Calcul de distance
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Notification de déverrouillage
const showUnlockNotification = (count) => {
    // Vous pouvez utiliser expo-notifications ici
    console.log(`🎉 ${count} nouveau(x) quiz débloqué(s) !`);
};

// Service principal
export class LocationService {
    static async requestPermissions() {
        try {
            // Demander permissions foreground
            const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

            if (foregroundStatus !== 'granted') {
                throw new Error('Permission géolocalisation refusée');
            }

            // Demander permissions background
            const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

            if (backgroundStatus !== 'granted') {
                console.warn('Permission géolocalisation en arrière-plan refusée');
                // L'app peut fonctionner mais avec moins de fonctionnalités
            }

            return {
                foreground: foregroundStatus === 'granted',
                background: backgroundStatus === 'granted'
            };

        } catch (error) {
            console.error('Erreur permissions:', error);
            return { foreground: false, background: false };
        }
    }

    static async startBackgroundLocation() {
        try {
            // Vérifier si déjà en cours
            const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);

            if (isRegistered) {
                await this.stopBackgroundLocation();
            }

            // Démarrer le suivi
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 30000, // 30 secondes
                distanceInterval: 50, // 50 mètres
                foregroundService: {
                    notificationTitle: 'TiQuizz actif',
                    notificationBody: 'Recherche de quiz à proximité...',
                    notificationColor: '#fb7a68',
                },
            });

            console.log('🗺️ Géolocalisation en arrière-plan activée');

        } catch (error) {
            console.error('Erreur démarrage géolocalisation:', error);
        }
    }

    static async stopBackgroundLocation() {
        try {
            const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);

            if (isRegistered) {
                await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
                console.log('🛑 Géolocalisation en arrière-plan arrêtée');
            }
        } catch (error) {
            console.error('Erreur arrêt géolocalisation:', error);
        }
    }

    static async getCurrentLocation() {
        try {
            return await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
        } catch (error) {
            console.error('Erreur position actuelle:', error);
            return null;
        }
    }
}