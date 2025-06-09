// services/RewardsService.js
import { store } from '../redux/store';
import { updateUser, unlockReward } from '../redux/userSlice';

// 🏅 MÉDAILLES - Par thème (5 quiz parfaits)
const MEDALS = {
    HISTOIRE: {
        id: 'medal_histoire',
        name: 'Historien Amateur',
        description: '5 quiz Histoire réussis à 100%',
        icon: '🏛️',
        requirement: { theme: 'Histoire', perfectCount: 5 },
        points: 100
    },
    ARCHITECTURE: {
        id: 'medal_architecture',
        name: 'Architecte Visionnaire',
        description: '5 quiz Architecture réussis à 100%',
        icon: '🏗️',
        requirement: { theme: 'Architecture', perfectCount: 5 },
        points: 100
    },
    ART: {
        id: 'medal_art',
        name: 'Critique d\'Art',
        description: '5 quiz Art réussis à 100%',
        icon: '🎨',
        requirement: { theme: 'Art', perfectCount: 5 },
        points: 100
    },
    RELIGION: {
        id: 'medal_religion',
        name: 'Théologien',
        description: '5 quiz Religion réussis à 100%',
        icon: '⛪',
        requirement: { theme: 'Religion', perfectCount: 5 },
        points: 100
    },
    LITTERATURE: {
        id: 'medal_litterature',
        name: 'Lettré Accompli',
        description: '5 quiz Littérature réussis à 100%',
        icon: '📚',
        requirement: { theme: 'Littérature', perfectCount: 5 },
        points: 100
    },
    GEOGRAPHIE: {
        id: 'medal_geographie',
        name: 'Géographe Expert',
        description: '5 quiz Géographie réussis à 100%',
        icon: '🗺️',
        requirement: { theme: 'Géographie', perfectCount: 5 },
        points: 100
    }
};

// 🏆 COUPES - Par ville/zone (tous les quiz d'un thème)
const TROPHIES = {
    PARIS_HISTOIRE: {
        id: 'trophy_paris_histoire',
        name: 'Maître de l\'Histoire Parisienne',
        description: 'Tous les quiz Histoire de Paris réussis',
        icon: '🏆',
        requirement: { city: 'Paris', theme: 'Histoire', allCompleted: true },
        points: 300
    },
    PARIS_ARCHITECTURE: {
        id: 'trophy_paris_architecture',
        name: 'Architecte de Paris',
        description: 'Tous les quiz Architecture de Paris réussis',
        icon: '🏆',
        requirement: { city: 'Paris', theme: 'Architecture', allCompleted: true },
        points: 300
    },
    PARIS_COMPLET: {
        id: 'trophy_paris_complet',
        name: 'Conquérant de Paris',
        description: 'TOUS les quiz de Paris réussis',
        icon: '🏆',
        requirement: { city: 'Paris', allCompleted: true },
        points: 500
    }
};

// 👑 TITRES - Accomplissements extraordinaires
const TITLES = {
    DETECTIVE: {
        id: 'title_detective',
        name: 'Détective',
        description: 'Résoudre 25 quiz parfaits',
        icon: '🕵️',
        requirement: { totalPerfect: 25 },
        points: 200,
        prestigeLevel: 1
    },
    ERUDIT: {
        id: 'title_erudit',
        name: 'L\'Érudit',
        description: 'Obtenir 3 médailles de thèmes différents',
        icon: '🎓',
        requirement: { medalsCount: 3 },
        points: 300,
        prestigeLevel: 2
    },
    SAVANT: {
        id: 'title_savant',
        name: 'Le Savant',
        description: 'Obtenir toutes les médailles',
        icon: '🧙‍♂️',
        requirement: { medalsCount: 6 }, // Toutes les médailles
        points: 500,
        prestigeLevel: 3
    },
    EXPLORATEUR: {
        id: 'title_explorateur',
        name: 'Grand Explorateur',
        description: 'Débloquer 50 quiz différents',
        icon: '🧭',
        requirement: { unlockedCount: 50 },
        points: 250,
        prestigeLevel: 1
    },
    CONQUERANT: {
        id: 'title_conquerant',
        name: 'Conquérant Suprême',
        description: 'Obtenir toutes les coupes',
        icon: '👑',
        requirement: { trophiesCount: 3 }, // Toutes les coupes
        points: 1000,
        prestigeLevel: 4
    },
    LEGENDE: {
        id: 'title_legende',
        name: 'Légende Vivante',
        description: 'Obtenir tous les titres précédents',
        icon: '⭐',
        requirement: { titlesCount: 4 }, // Tous les autres titres
        points: 2000,
        prestigeLevel: 5
    }
};

export class RewardsService {

    // Vérifier tous les accomplissements après un quiz
    static checkAllRewards(userData) {
        const newRewards = [];

        // Vérifier médailles
        newRewards.push(...this.checkMedals(userData));

        // Vérifier coupes
        newRewards.push(...this.checkTrophies(userData));

        // Vérifier titres
        newRewards.push(...this.checkTitles(userData));

        return newRewards;
    }

    // 🏅 Vérifier médailles
    static checkMedals(userData) {
        const newMedals = [];
        const userMedals = userData.rewards?.medals || [];
        const completedQuizzes = userData.completedQuizzes || {};

        Object.values(MEDALS).forEach(medal => {
            if (userMedals.includes(medal.id)) return; // Déjà obtenue

            // Compter les quiz parfaits du thème
            const perfectCount = Object.values(completedQuizzes).filter(quiz =>
                quiz.percentage === 100 &&
                this.getQuizTheme(quiz) === medal.requirement.theme
            ).length;

            if (perfectCount >= medal.requirement.perfectCount) {
                newMedals.push(medal);
            }
        });

        return newMedals;
    }

    // 🏆 Vérifier coupes
    static checkTrophies(userData) {
        const newTrophies = [];
        const userTrophies = userData.rewards?.trophies || [];
        const completedQuizzes = userData.completedQuizzes || {};

        Object.values(TROPHIES).forEach(trophy => {
            if (userTrophies.includes(trophy.id)) return; // Déjà obtenue

            if (this.checkTrophyRequirement(trophy.requirement, completedQuizzes)) {
                newTrophies.push(trophy);
            }
        });

        return newTrophies;
    }

    // 👑 Vérifier titres
    static checkTitles(userData) {
        const newTitles = [];
        const userTitles = userData.rewards?.titles || [];
        const userMedals = userData.rewards?.medals || [];
        const userTrophies = userData.rewards?.trophies || [];
        const completedQuizzes = userData.completedQuizzes || {};
        const unlockedQuizzes = userData.unlockedQuizzes || [];

        Object.values(TITLES).forEach(title => {
            if (userTitles.includes(title.id)) return; // Déjà obtenu

            if (this.checkTitleRequirement(title.requirement, {
                completedQuizzes,
                unlockedQuizzes,
                userMedals,
                userTrophies,
                userTitles
            })) {
                newTitles.push(title);
            }
        });

        return newTitles;
    }

    // Vérifier condition de coupe
    static checkTrophyRequirement(requirement, completedQuizzes) {
        // Pour l'instant, simulé - vous adapterez avec vos vraies données de quiz
        const parisQuizzes = this.getQuizzesByCity('Paris');

        if (requirement.allCompleted && !requirement.theme) {
            // Tous les quiz de la ville
            return parisQuizzes.every(quiz =>
                Object.keys(completedQuizzes).includes(quiz.id)
            );
        }

        if (requirement.theme && requirement.allCompleted) {
            // Tous les quiz du thème dans la ville
            const themeQuizzes = parisQuizzes.filter(quiz =>
                this.getQuizTheme(quiz) === requirement.theme
            );
            return themeQuizzes.every(quiz =>
                Object.keys(completedQuizzes).includes(quiz.id)
            );
        }

        return false;
    }

    // Vérifier condition de titre
    static checkTitleRequirement(requirement, data) {
        if (requirement.totalPerfect) {
            const perfectCount = Object.values(data.completedQuizzes)
                .filter(quiz => quiz.percentage === 100).length;
            return perfectCount >= requirement.totalPerfect;
        }

        if (requirement.medalsCount) {
            return data.userMedals.length >= requirement.medalsCount;
        }

        if (requirement.trophiesCount) {
            return data.userTrophies.length >= requirement.trophiesCount;
        }

        if (requirement.unlockedCount) {
            return data.unlockedQuizzes.length >= requirement.unlockedCount;
        }

        if (requirement.titlesCount) {
            return data.userTitles.length >= requirement.titlesCount;
        }

        return false;
    }

    // Utilitaires
    static getQuizTheme(quiz) {
        // Adapter selon votre structure de données
        return quiz.theme || 'Général';
    }

    static getQuizzesByCity(city) {
        // Retourner tous les quiz de la ville
        // Vous adapterez avec votre vraie liste de quiz
        return [];
    }

    // Appliquer les récompenses
    static applyRewards(newRewards) {
        const state = store.getState();
        const { userData } = state.user;

        if (newRewards.length === 0) return;

        const currentRewards = userData.rewards || {
            medals: [],
            trophies: [],
            titles: []
        };

        let totalNewPoints = 0;
        const newMedals = [];
        const newTrophies = [];
        const newTitles = [];

        newRewards.forEach(reward => {
            totalNewPoints += reward.points;

            if (Object.values(MEDALS).includes(reward)) {
                newMedals.push(reward.id);
            } else if (Object.values(TROPHIES).includes(reward)) {
                newTrophies.push(reward.id);
            } else if (Object.values(TITLES).includes(reward)) {
                newTitles.push(reward.id);
            }
        });

        // Mettre à jour Redux
        store.dispatch(updateUser({
            userData: {
                ...userData,
                score: userData.score + totalNewPoints,
                rewards: {
                    medals: [...currentRewards.medals, ...newMedals],
                    trophies: [...currentRewards.trophies, ...newTrophies],
                    titles: [...currentRewards.titles, ...newTitles]
                }
            }
        }));

        return newRewards;
    }

    // Obtenir le titre actuel le plus prestigieux
    static getCurrentTitle(userData) {
        const userTitles = userData.rewards?.titles || [];

        if (userTitles.length === 0) return null;

        // Trouver le titre avec le plus haut niveau de prestige
        let currentTitle = null;
        let maxPrestige = 0;

        Object.values(TITLES).forEach(title => {
            if (userTitles.includes(title.id) && title.prestigeLevel > maxPrestige) {
                maxPrestige = title.prestigeLevel;
                currentTitle = title;
            }
        });

        return currentTitle;
    }

    // Obtenir toutes les récompenses disponibles
    static getAllRewards() {
        return {
            medals: MEDALS,
            trophies: TROPHIES,
            titles: TITLES
        };
    }

    // Calculer progression vers prochaine récompense
    static getNextRewardProgress(userData) {
        // Logique pour calculer la progression vers la prochaine récompense
        // Retourne { type, name, current, required, percentage }

        const completedQuizzes = userData.completedQuizzes || {};
        const userRewards = userData.rewards || { medals: [], trophies: [], titles: [] };

        // Exemple : progression vers médaille Histoire
        const historyPerfect = Object.values(completedQuizzes).filter(quiz =>
            quiz.percentage === 100 && this.getQuizTheme(quiz) === 'Histoire'
        ).length;

        if (!userRewards.medals.includes('medal_histoire') && historyPerfect < 5) {
            return {
                type: 'medal',
                name: 'Historien Amateur',
                icon: '🏛️',
                current: historyPerfect,
                required: 5,
                percentage: (historyPerfect / 5) * 100
            };
        }

        return null;
    }
}

export { MEDALS, TROPHIES, TITLES };