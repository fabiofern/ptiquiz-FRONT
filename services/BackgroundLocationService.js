import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { EXPO_PUBLIC_BACKEND_URL } from '@env';

const LOCATION_TASK_NAME = 'background-location-task';
const STORAGE_KEYS = {
    USER_INFO: '@tiquiz_user_info',
    DAILY_POSITIONS: '@tiquiz_daily_positions',
    LAST_CHECK_DATE: '@tiquiz_last_check_date',
    NOTIFICATION_SENT_TODAY: '@tiquiz_notification_today'
};
const URL = EXPO_PUBLIC_BACKEND_URL
// 📱 CONFIGURATION DES NOTIFICATIONS
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

class BackgroundLocationService {
    constructor() {
        this.isInitialized = false;
        this.isTracking = false;
        this.userInfo = null;
        this.dailyPositions = []; // Stockage local des positions du jour
        this.eventListeners = {
            onLocationUpdate: [],
            onStatusChange: [],
            onQuizDiscovered: []
        };
        this.stats = {
            totalUpdates: 0,
            positionsToday: 0,
            lastUpdate: null,
            lastBatchCheck: null
        };

        // 🎯 CONFIGURATION ADAPTATIVE SIMPLE
        this.config = {
            foreground: {
                accuracy: Location.Accuracy.High,
                timeInterval: 30000,  // 30 secondes
                distanceInterval: 10, // 10 mètres
            },
            background: {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 600000, // 10 minutes
                distanceInterval: 50, // 50 mètres
            }
        };

        this.currentMode = 'foreground';
        this.notificationSentToday = false;
    }

    // 🔧 INITIALISATION DU SERVICE
    async initialize() {
        try {
            console.log('🔧 Initialisation BackgroundLocationService optimisé...');

            // Vérifie les permissions
            const hasLocationPermissions = await this.checkLocationPermissions();
            if (!hasLocationPermissions) {
                console.log('⚠️ Permissions géolocalisation refusées');
                return false;
            }

            const hasNotificationPermissions = await this.setupNotifications();
            if (!hasNotificationPermissions) {
                console.log('⚠️ Permissions notifications refusées');
            }

            // Restaure les données
            await this.restoreUserData();
            await this.restoreDailyPositions();
            await this.checkNotificationStatus();

            // Configure la tâche en arrière-plan
            this.setupBackgroundTask();

            // Programme la vérification quotidienne 18h
            await this.scheduleDailyBatchCheck();

            this.isInitialized = true;
            console.log('✅ BackgroundLocationService optimisé initialisé');
            return true;

        } catch (error) {
            console.error('❌ Erreur initialisation BackgroundLocationService:', error);
            return false;
        }
    }

    // 📱 CONFIGURATION DES NOTIFICATIONS
    async setupNotifications() {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('⚠️ Permissions notifications refusées');
                return false;
            }

            console.log('✅ Permissions notifications accordées');
            return true;
        } catch (error) {
            console.error('❌ Erreur setup notifications:', error);
            return false;
        }
    }

    // 🎯 CONFIGURATION DE LA TÂCHE EN ARRIÈRE-PLAN
    setupBackgroundTask() {
        TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
            if (error) {
                console.error('❌ Erreur tâche géolocalisation:', error);
                return;
            }

            if (data) {
                const { locations } = data;
                console.log('📍 Nouvelles positions reçues:', locations?.length);

                // Traite et stocke chaque position SANS vérifier la BDD
                locations?.forEach(location => {
                    this.storeLocationOnly(location);
                });
            }
        });
    }

    // ⚙️ CHANGE LE MODE DE TRACKING
    async switchToMode(mode) {
        if (this.currentMode === mode || !this.isTracking) return;

        console.log(`🔄 Changement mode tracking: ${this.currentMode} -> ${mode}`);
        this.currentMode = mode;

        if (this.isTracking) {
            await this.stopLocationTracking();
            await this.startLocationTracking();
        }
    }

    // 🚀 DÉMARRE LE TRACKING
    async startTracking() {
        try {
            if (!this.isInitialized) {
                throw new Error('Service non initialisé');
            }

            if (this.isTracking) {
                console.log('⚠️ Tracking déjà actif');
                return true;
            }

            console.log(`🚀 Démarrage tracking SILENCIEUX mode: ${this.currentMode}`);

            const success = await this.startLocationTracking();
            if (success) {
                this.isTracking = true;
                this.notifyStatusChange({ isTracking: true, mode: this.currentMode });

                // 🎯 VÉRIFICATION IMMÉDIATE À L'OUVERTURE DE L'APP
                await this.checkTodayPositionsAgainstDatabase();
            }

            return success;

        } catch (error) {
            console.error('❌ Erreur démarrage tracking:', error);
            return false;
        }
    }

    // ⏹️ ARRÊTE LE TRACKING
    async stopTracking() {
        try {
            if (!this.isTracking) {
                console.log('⚠️ Tracking déjà arrêté');
                return;
            }

            console.log('⏹️ Arrêt du tracking');
            await this.stopLocationTracking();

            this.isTracking = false;
            this.notifyStatusChange({ isTracking: false });

        } catch (error) {
            console.error('❌ Erreur arrêt tracking:', error);
        }
    }

    // 📍 DÉMARRE LE TRACKING PHYSIQUE
    async startLocationTracking() {
        try {
            const config = this.config[this.currentMode];

            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: config.accuracy,
                timeInterval: config.timeInterval,
                distanceInterval: config.distanceInterval,
                foregroundService: {
                    notificationTitle: 'TiQuiz - Enregistrement silencieux',
                    notificationBody: 'Enregistrement de vos déplacements pour les quiz...',
                    notificationColor: '#9d4edd',
                },
                showsBackgroundLocationIndicator: false,
                deferredUpdatesInterval: config.timeInterval * 2,
            });

            console.log(`✅ Tracking silencieux démarré (${this.currentMode}):`, config);
            return true;

        } catch (error) {
            console.error('❌ Erreur démarrage location tracking:', error);
            return false;
        }
    }

    // ⏹️ ARRÊTE LE TRACKING PHYSIQUE
    async stopLocationTracking() {
        try {
            const isTaskDefined = TaskManager.isTaskDefined(LOCATION_TASK_NAME);
            if (isTaskDefined) {
                await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
                console.log('✅ Tracking location arrêté');
            }
        } catch (error) {
            console.error('❌ Erreur arrêt location tracking:', error);
        }
    }

    // 💾 STOCKE UNE POSITION SANS VÉRIFICATION BDD
    async storeLocationOnly(location) {
        try {
            const processedLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                timestamp: location.timestamp,
                mode: this.currentMode,
                storedAt: Date.now()
            };

            console.log('💾 Position stockée silencieusement');

            // Ajoute à la liste du jour
            this.dailyPositions.push(processedLocation);

            // Limite à 200 positions max par jour (économie mémoire)
            if (this.dailyPositions.length > 200) {
                this.dailyPositions = this.dailyPositions.slice(-200);
            }

            // Met à jour les stats
            this.stats.totalUpdates++;
            this.stats.positionsToday = this.dailyPositions.length;
            this.stats.lastUpdate = new Date().toISOString();

            // Sauvegarde en local
            await this.saveDailyPositions();

            // Notifie les écouteurs (pour debug UI)
            this.notifyLocationUpdate(processedLocation);

        } catch (error) {
            console.error('❌ Erreur stockage position:', error);
        }
    }

    // 🕕 PROGRAMME LA VÉRIFICATION QUOTIDIENNE ÉTALÉE SUR 8H
    async scheduleDailyBatchCheck() {
        try {
            // Annule les notifications précédentes
            await Notifications.cancelAllScheduledNotificationsAsync();

            // 🎯 CALCULE UN HORAIRE ALÉATOIRE POUR ÉTALER LA CHARGE SUR 8H
            const userId = this.userInfo?.userId || 'anonymous';
            const userHash = this.simpleHash(userId);

            // Étale entre 10h00 et 18h00 (8h de fenêtre = 480 minutes)
            const baseMinutes = 10 * 60; // 10h00 en minutes
            const randomOffset = userHash % 480; // 0-479 minutes (8h)
            const totalMinutes = baseMinutes + randomOffset;

            const hour = Math.floor(totalMinutes / 60);
            const minute = totalMinutes % 60;

            console.log(`⏰ Horaire personnalisé: ${hour}h${minute.toString().padStart(2, '0')} (fenêtre 10h-18h)`);

            // Programme pour tous les jours à l'horaire personnalisé
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🔍 Vérification TiQuiz',
                    body: 'Recherche de nouveaux quiz découverts aujourd\'hui...',
                    data: { type: 'daily_batch_check' },
                },
                trigger: {
                    hour: hour,
                    minute: minute,
                    repeats: true,
                },
            });

            console.log(`✅ Vérification quotidienne programmée pour ${hour}h${minute.toString().padStart(2, '0')} (étalement 8h)`);

            // Écoute les notifications pour déclencher la vérification
            Notifications.addNotificationReceivedListener(this.handleNotificationReceived.bind(this));

        } catch (error) {
            console.error('❌ Erreur programmation vérification quotidienne:', error);
        }
    }

    // 🔢 FONCTION DE HASH SIMPLE POUR RÉPARTITION
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertit en 32-bit integer
        }
        return Math.abs(hash);
    }

    // 🔔 GÈRE LA RÉCEPTION DE NOTIFICATION 18H
    async handleNotificationReceived(notification) {
        const data = notification.request.content.data;

        if (data?.type === 'daily_batch_check') {
            console.log('🕕 18h - Déclenchement vérification batch');
            await this.performDailyBatchCheck();
        }
    }

    // 🎯 VÉRIFICATION BATCH QUOTIDIENNE
    async performDailyBatchCheck() {
        try {
            console.log('🔍 Début vérification batch quotidienne...');

            if (this.dailyPositions.length === 0) {
                console.log('📍 Aucune position aujourd\'hui - pas de vérification');
                return;
            }

            if (this.notificationSentToday) {
                console.log('🔔 Notification déjà envoyée aujourd\'hui');
                return;
            }

            // Envoie toutes les positions du jour au backend pour vérification
            const discoveredQuiz = await this.checkPositionsAgainstDatabase(this.dailyPositions);

            if (discoveredQuiz && discoveredQuiz.length > 0) {
                console.log(`🎉 ${discoveredQuiz.length} nouveaux quiz découverts !`);

                // Envoie UNE SEULE notification
                await this.sendDailyDiscoveryNotification(discoveredQuiz);

                // Marque comme envoyé
                this.notificationSentToday = true;
                await this.markNotificationSent();

                // Notifie les écouteurs
                this.eventListeners.onQuizDiscovered.forEach(callback => {
                    callback(discoveredQuiz);
                });
            } else {
                console.log('😐 Aucun nouveau quiz découvert aujourd\'hui');
            }

            this.stats.lastBatchCheck = new Date().toISOString();

        } catch (error) {
            console.error('❌ Erreur vérification batch:', error);
        }
    }

    // 🎯 VÉRIFICATION IMMÉDIATE À L'OUVERTURE APP
    async checkTodayPositionsAgainstDatabase() {
        try {
            const today = new Date().toDateString();
            const lastCheckDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_CHECK_DATE);

            // Si déjà vérifié aujourd'hui, skip
            if (lastCheckDate === today) {
                console.log('✅ Positions déjà vérifiées aujourd\'hui');
                return;
            }

            console.log('🔍 Vérification immédiate à l\'ouverture app...');

            if (this.dailyPositions.length === 0) {
                console.log('📍 Aucune position à vérifier');
                return;
            }

            // Vérifie les positions contre la BDD
            const discoveredQuiz = await this.checkPositionsAgainstDatabase(this.dailyPositions);

            if (discoveredQuiz && discoveredQuiz.length > 0 && !this.notificationSentToday) {
                console.log(`🎉 Découverte immédiate: ${discoveredQuiz.length} quiz !`);

                await this.sendDailyDiscoveryNotification(discoveredQuiz);
                this.notificationSentToday = true;
                await this.markNotificationSent();
            }

            // Marque comme vérifié aujourd'hui
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECK_DATE, today);

        } catch (error) {
            console.error('❌ Erreur vérification immédiate:', error);
        }
    }

    // 🌐 VÉRIFIE LES POSITIONS CONTRE LA BDD
    async checkPositionsAgainstDatabase(positions) {
        try {
            if (!this.userInfo?.userId) {
                console.log('⚠️ Pas d\'userId pour vérification');
                return [];
            }

            console.log(`🔍 Vérification ${positions.length} positions contre BDD...`);

            const response = await fetch(`${URL}/api/quiz/check-batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.userInfo.token}`,
                },
                body: JSON.stringify({
                    userId: this.userInfo.userId,
                    positions: positions,
                    radius: 100 // 100 mètres de rayon
                }),
                timeout: 15000, // 15 secondes max
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Vérification BDD terminée');
                return result.discoveredQuiz || [];
            } else {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

        } catch (error) {
            console.error('❌ Erreur vérification BDD:', error);
            return [];
        }
    }

    // 🔔 ENVOIE LA NOTIFICATION QUOTIDIENNE (TOUJOURS APRÈS 18H)
    async sendDailyDiscoveryNotification(discoveredQuiz) {
        try {
            const quizCount = discoveredQuiz.length;
            const currentHour = new Date().getHours();

            // 🎯 NOTIFICATION TOUJOURS À PARTIR DE 18H MINIMUM
            let triggerTime = null; // Immédiat par défaut

            if (currentHour < 18) {
                // 🏠 DIFFÈRE À 18H-20H POUR INCITER À JOUER CHEZ SOI/TRANSPORTS
                const userId = this.userInfo?.userId || 'anonymous';
                const userHash = this.simpleHash(userId);

                // Étale entre 18h00 et 19h59 (2h de fenêtre pour les notifications)
                const notificationMinutes = 18 * 60 + (userHash % 120); // 18h00 à 19h59
                const notificationHour = Math.floor(notificationMinutes / 60);
                const notificationMinute = notificationMinutes % 60;

                const now = new Date();
                const scheduledTime = new Date(now);
                scheduledTime.setHours(notificationHour, notificationMinute, 0, 0);

                // Si l'heure est déjà passée aujourd'hui, programme pour demain
                if (scheduledTime <= now) {
                    scheduledTime.setDate(scheduledTime.getDate() + 1);
                }

                triggerTime = scheduledTime;
                console.log(`🏠 Notification différée à ${notificationHour}h${notificationMinute.toString().padStart(2, '0')} (heure de détente)`);
            } else {
                // Déjà 18h+ → notification immédiate
                console.log('🕕 18h+ → notification immédiate (heure parfaite pour jouer)');
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🎉 Nouveaux quiz découverts !',
                    body: quizCount === 1
                        ? `Un nouveau quiz vous attend ! Parfait pour se détendre 🏠`
                        : `${quizCount} nouveaux quiz vous attendent ! Parfait pour se détendre 🏠`,
                    data: {
                        type: 'daily_discovery',
                        quizCount,
                        quiz: discoveredQuiz,
                        suggestedTime: 'evening' // Indique que c'est pour le soir
                    },
                },
                trigger: triggerTime,
            });

            const notificationTime = triggerTime ?
                `à ${triggerTime.getHours()}h${triggerTime.getMinutes().toString().padStart(2, '0')}` :
                'immédiatement';
            console.log(`🔔 Notification "détente" programmée ${notificationTime}`);

        } catch (error) {
            console.error('❌ Erreur envoi notification quotidienne:', error);
        }
    }

    // 💾 SAUVEGARDE LES POSITIONS DU JOUR
    async saveDailyPositions() {
        try {
            const today = new Date().toDateString();
            const data = {
                date: today,
                positions: this.dailyPositions
            };

            await AsyncStorage.setItem(STORAGE_KEYS.DAILY_POSITIONS, JSON.stringify(data));
        } catch (error) {
            console.error('❌ Erreur sauvegarde positions:', error);
        }
    }

    // 🔄 RESTAURE LES POSITIONS DU JOUR
    async restoreDailyPositions() {
        try {
            const today = new Date().toDateString();
            const dataString = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_POSITIONS);

            if (dataString) {
                const data = JSON.parse(dataString);

                // Si c'est aujourd'hui, restaure les positions
                if (data.date === today) {
                    this.dailyPositions = data.positions || [];
                    this.stats.positionsToday = this.dailyPositions.length;
                    console.log(`🔄 ${this.dailyPositions.length} positions d'aujourd'hui restaurées`);
                } else {
                    // Nouveau jour, reset
                    this.dailyPositions = [];
                    await this.resetDailyData();
                    console.log('🆕 Nouveau jour - reset des positions');
                }
            }
        } catch (error) {
            console.error('❌ Erreur restauration positions:', error);
            this.dailyPositions = [];
        }
    }

    // 🆕 RESET DES DONNÉES QUOTIDIENNES
    async resetDailyData() {
        try {
            this.dailyPositions = [];
            this.notificationSentToday = false;
            this.stats.positionsToday = 0;

            await AsyncStorage.removeItem(STORAGE_KEYS.DAILY_POSITIONS);
            await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATION_SENT_TODAY);
            await AsyncStorage.removeItem(STORAGE_KEYS.LAST_CHECK_DATE);

            console.log('🆕 Données quotidiennes reset');
        } catch (error) {
            console.error('❌ Erreur reset données quotidiennes:', error);
        }
    }

    // 🔔 MARQUE NOTIFICATION COMME ENVOYÉE
    async markNotificationSent() {
        try {
            const today = new Date().toDateString();
            await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SENT_TODAY, today);
        } catch (error) {
            console.error('❌ Erreur marquage notification:', error);
        }
    }

    // 🔄 VÉRIFIE LE STATUT NOTIFICATION
    async checkNotificationStatus() {
        try {
            const today = new Date().toDateString();
            const lastNotificationDate = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SENT_TODAY);

            this.notificationSentToday = (lastNotificationDate === today);

        } catch (error) {
            console.error('❌ Erreur vérification statut notification:', error);
        }
    }

    // 🔐 VÉRIFIE LES PERMISSIONS - VERSION CORRIGÉE
    // 🔐 VÉRIFIE LES PERMISSIONS - VERSION PROPRE
    async checkLocationPermissions() {
        try {
            console.log('🔍 Vérification des permissions...');

            // 1. Vérification permission foreground
            let { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
            console.log('📱 Statut foreground:', foregroundStatus);

            if (foregroundStatus !== 'granted') {
                console.log('🔄 Demande permission foreground...');
                const { status } = await Location.requestForegroundPermissionsAsync();
                foregroundStatus = status;
                console.log('📱 Nouveau statut foreground:', foregroundStatus);
            }

            if (foregroundStatus !== 'granted') {
                console.log('⚠️ Permission foreground refusée');
                return false;
            }

            // 2. Vérification permission background
            let { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
            console.log('🌐 Statut background:', backgroundStatus);

            if (backgroundStatus !== 'granted') {
                console.log('🔄 Demande permission background...');
                const backgroundResult = await Location.requestBackgroundPermissionsAsync();
                backgroundStatus = backgroundResult.status;
                console.log('🌐 Nouveau statut background:', backgroundStatus);
            }

            // 3. Résultat final
            if (backgroundStatus === 'granted') {
                console.log('✅ Permissions géolocalisation accordées (TOUJOURS)');
                return true;
            } else if (foregroundStatus === 'granted') {
                console.log('⚠️ Seule permission foreground accordée (LIMITÉE)');
                return true; // On accepte même si pas background
            } else {
                console.log('❌ Aucune permission accordée');
                return false;
            }

        } catch (error) {
            console.error('❌ Erreur vérification permissions:', error);
            return false;
        }
    }

    // 👤 CONFIGURE LES INFOS UTILISATEUR
    async setUserInfo(userInfo) {
        this.userInfo = userInfo;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
        console.log('👤 Infos utilisateur configurées:', userInfo);
    }

    // 🔄 RESTAURE LES DONNÉES UTILISATEUR
    async restoreUserData() {
        try {
            const userDataString = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
            if (userDataString) {
                this.userInfo = JSON.parse(userDataString);
                console.log('🔄 Données utilisateur restaurées');
            }
        } catch (error) {
            console.error('❌ Erreur restauration user data:', error);
        }
    }

    // 📍 OBTIENT LA POSITION ACTUELLE
    async getCurrentLocation() {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
                timestamp: location.timestamp,
            };

        } catch (error) {
            console.error('❌ Erreur position actuelle:', error);
            return null;
        }
    }

    // 🎯 FORCE UNE VÉRIFICATION MAINTENANT (utile pour debug)
    async forceCheckNow() {
        try {
            console.log('🔧 Force vérification immédiate...');
            await this.performDailyBatchCheck();
        } catch (error) {
            console.error('❌ Erreur force check:', error);
        }
    }

    // 📊 STATISTIQUES
    getStats() {
        return {
            ...this.stats,
            positionsToday: this.dailyPositions.length,
            currentMode: this.currentMode,
            isTracking: this.isTracking,
            isInitialized: this.isInitialized,
            notificationSentToday: this.notificationSentToday
        };
    }

    // 📡 GESTION DES ÉCOUTEURS
    onLocationUpdate(callback) {
        this.eventListeners.onLocationUpdate.push(callback);
        return {
            remove: () => {
                const index = this.eventListeners.onLocationUpdate.indexOf(callback);
                if (index > -1) {
                    this.eventListeners.onLocationUpdate.splice(index, 1);
                }
            }
        };
    }

    onStatusChange(callback) {
        this.eventListeners.onStatusChange.push(callback);
        return {
            remove: () => {
                const index = this.eventListeners.onStatusChange.indexOf(callback);
                if (index > -1) {
                    this.eventListeners.onStatusChange.splice(index, 1);
                }
            }
        };
    }

    onQuizDiscovered(callback) {
        this.eventListeners.onQuizDiscovered.push(callback);
        return {
            remove: () => {
                const index = this.eventListeners.onQuizDiscovered.indexOf(callback);
                if (index > -1) {
                    this.eventListeners.onQuizDiscovered.splice(index, 1);
                }
            }
        };
    }

    // 📢 NOTIFICATIONS INTERNES
    notifyLocationUpdate(location) {
        this.eventListeners.onLocationUpdate.forEach(callback => {
            try {
                callback(location);
            } catch (error) {
                console.error('❌ Erreur callback location:', error);
            }
        });
    }

    notifyStatusChange(status) {
        this.eventListeners.onStatusChange.forEach(callback => {
            try {
                callback({
                    ...status,
                    stats: this.stats,
                    mode: this.currentMode
                });
            } catch (error) {
                console.error('❌ Erreur callback status:', error);
            }
        });
    }

    // 🧹 NETTOYAGE
    async cleanup() {
        try {
            console.log('🧹 Nettoyage BackgroundLocationService');
            await this.stopTracking();

            // Sauvegarde finale
            await this.saveDailyPositions();

            // Nettoie les écouteurs
            this.eventListeners.onLocationUpdate = [];
            this.eventListeners.onStatusChange = [];
            this.eventListeners.onQuizDiscovered = [];

            console.log('✅ Nettoyage terminé');

        } catch (error) {
            console.error('❌ Erreur nettoyage:', error);
        }
    }
}

// Instance singleton
const backgroundLocationService = new BackgroundLocationService();

export default backgroundLocationService;