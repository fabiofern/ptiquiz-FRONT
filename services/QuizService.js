// services/QuizService.js - Services pour gérer les quiz débloqués
import { EXPO_PUBLIC_BACKEND_URL } from '@env';
const API_BASE_URL = 'http://192.168.2.16:3000'; // Remplace par ton IP
const URL = EXPO_PUBLIC_BACKEND_URL
export class QuizService {

    // 🗺️ Récupérer tous les quiz avec leurs états pour MapScreen
    static async getQuizMapStatus(userId) {
        try {
            console.log('📊 Récupération statut quiz pour map...');

            const response = await fetch(`${URL}/quizz/map-status/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.result) {
                console.log(`✅ ${data.quiz.length} quiz récupérés avec statuts`);
                return {
                    success: true,
                    quiz: data.quiz,
                    userStats: data.userStats
                };
            } else {
                throw new Error(data.error || 'Erreur récupération quiz map');
            }
        } catch (error) {
            console.error('❌ Erreur getQuizMapStatus:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 🔓 Débloquer les quiz basés sur la position
    static async unlockQuizByPosition(userId, userLatitude, userLongitude, forceUnlockAll = false) {
        try {
            console.log('🔍 Vérification déverrouillages à la position:', userLatitude, userLongitude);

            const response = await fetch(`${URL}/quizz/unlock/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userLatitude,
                    userLongitude,
                    forceUnlockAll
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.result) {
                if (data.newUnlocked > 0) {
                    console.log(`🎉 ${data.newUnlocked} nouveau(x) quiz débloqué(s) !`);
                }
                return {
                    success: true,
                    newUnlocked: data.newUnlocked,
                    unlockedQuizzes: data.unlockedQuizzes,
                    nearbyQuiz: data.nearbyQuiz,
                    message: data.message
                };
            } else {
                throw new Error(data.error || 'Erreur déverrouillage');
            }
        } catch (error) {
            console.error('❌ Erreur unlockQuizByPosition:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 🎮 Récupérer les quiz débloqués pour QuizScreen
    static async getUnlockedQuiz(userId) {
        try {
            console.log('📚 Récupération quiz débloqués...');

            const response = await fetch(`${URL}/quizz/unlocked/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.result) {
                console.log(`✅ ${data.quiz.length} quiz débloqués récupérés`);
                return {
                    success: true,
                    quiz: data.quiz,
                    userStats: data.userStats
                };
            } else {
                throw new Error(data.error || 'Erreur récupération quiz débloqués');
            }
        } catch (error) {
            console.error('❌ Erreur getUnlockedQuiz:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 🏆 Sauvegarder le résultat d'un quiz complété
    static async completeQuiz(userId, quizId, score, totalPoints, percentage, answers = []) {
        try {
            console.log('💾 Sauvegarde résultat quiz:', { userId, quizId, score, totalPoints });

            const response = await fetch(`${URL}/quizz/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    quizId,
                    score,
                    totalPoints,
                    percentage,
                    answers,
                    completedAt: new Date().toISOString()
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.result) {
                console.log('✅ Quiz sauvegardé avec succès');
                return {
                    success: true,
                    completionData: data.completionData,
                    newTotalScore: data.newTotalScore,
                    message: data.message
                };
            } else {
                throw new Error(data.error || 'Erreur sauvegarde quiz');
            }
        } catch (error) {
            console.error('❌ Erreur completeQuiz:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 🎯 Vérifier la proximité pour un quiz spécifique
    static async checkQuizProximity(userId, quizId, latitude, longitude) {
        try {
            const response = await fetch(
                `${URL}/quizz/check-proximity/${userId}/${quizId}?latitude=${latitude}&longitude=${longitude}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.result) {
                return {
                    success: true,
                    quiz: data.quiz
                };
            } else {
                throw new Error(data.error || 'Erreur test proximité');
            }
        } catch (error) {
            console.error('❌ Erreur checkQuizProximity:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 🔄 Synchroniser la position et débloquer automatiquement
    static async syncPositionAndUnlock(userId, userLatitude, userLongitude) {
        try {
            // D'abord débloquer les quiz proches
            const unlockResult = await this.unlockQuizByPosition(userId, userLatitude, userLongitude);

            if (!unlockResult.success) {
                return unlockResult;
            }

            // Puis récupérer le statut mis à jour pour la map
            const mapStatusResult = await this.getQuizMapStatus(userId);

            return {
                success: true,
                newUnlocked: unlockResult.newUnlocked,
                nearbyQuiz: unlockResult.nearbyQuiz,
                quizMapData: mapStatusResult.success ? mapStatusResult.quiz : [],
                userStats: mapStatusResult.success ? mapStatusResult.userStats : null,
                message: unlockResult.message
            };
        } catch (error) {
            console.error('❌ Erreur syncPositionAndUnlock:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 🧪 Débloquer tous les quiz (pour tests)
    static async unlockAllQuiz(userId) {
        return await this.unlockQuizByPosition(userId, null, null, true);
    }
}

// Fonctions utilitaires
export const QuizUtils = {
    // Calculer distance entre deux points
    getDistanceInMeters: (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const toRad = (x) => (x * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    // Couleur selon le statut
    getStatusColor: (status) => {
        switch (status) {
            case 'locked': return '#FF6B6B';
            case 'unlocked': return '#FFD93D';
            case 'completed': return '#6BCF7F';
            case 'perfect': return '#4ECDC4';
            default: return '#FF6B6B';
        }
    },

    // Description selon le statut
    getStatusDescription: (status) => {
        switch (status) {
            case 'locked': return "🔒 Quiz verrouillé - Approche-toi !";
            case 'unlocked': return "🟡 Quiz débloqué - À toi de jouer !";
            case 'completed': return "🔵 Quiz terminé - Bonne tentative !";
            case 'perfect': return "🟢 Quiz parfait - Félicitations !";
            default: return "🔒 Quiz verrouillé";
        }
    }
};