// redux/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isLoggedIn: false,
    userData: {
        token: null,
        secureToken: null,
        userID: null,
        email: null,
        username: null,
        avatar: null,
        score: 0,
        completedQuizzes: {}, // { quizId: { score, totalPoints, percentage, badge, completedAt } }
        unlockedQuizzes: [], // [quizId1, quizId2, ...]
        locationPermissions: null, // { foreground: boolean, background: boolean }
        rewards: {
            medals: [], // [medalId1, medalId2, ...]
            trophies: [], // [trophyId1, trophyId2, ...]
            titles: [] // [titleId1, titleId2, ...]
        },
        statistics: {
            totalQuizzesCompleted: 0,
            perfectQuizzes: 0,
            streakDays: 0,
            lastPlayDate: null
        }
    },
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        // Action unique pour tout modifier
        updateUser: (state, action) => {
            return { ...state, ...action.payload };
        },

        // Action pour reset complet
        resetUser: (state) => {
            return initialState;
        },

        // Actions spécifiques pour les quiz
        unlockQuiz: (state, action) => {
            const quizId = action.payload;
            if (!state.userData.unlockedQuizzes.includes(quizId)) {
                state.userData.unlockedQuizzes.push(quizId);
            }
        },

        unlockMultipleQuizzes: (state, action) => {
            const quizIds = action.payload; // Array de quiz IDs
            quizIds.forEach(quizId => {
                if (!state.userData.unlockedQuizzes.includes(quizId)) {
                    state.userData.unlockedQuizzes.push(quizId);
                }
            });
        },

        completeQuiz: (state, action) => {
            const { quizId, score, totalPoints, badge } = action.payload;
            const percentage = Math.round((score / totalPoints) * 100);

            // Ajouter le quiz complété
            state.userData.completedQuizzes[quizId] = {
                score,
                totalPoints,
                percentage,
                badge,
                completedAt: new Date().toISOString()
            };

            // Ajouter les points au score total
            state.userData.score += score;

            // Mettre à jour les statistiques
            state.userData.statistics.totalQuizzesCompleted += 1;
            if (percentage === 100) {
                state.userData.statistics.perfectQuizzes += 1;
            }
            state.userData.statistics.lastPlayDate = new Date().toISOString();
        },

        unlockReward: (state, action) => {
            const { type, rewardId } = action.payload; // type: 'medal', 'trophy', 'title'

            if (type === 'medal' && !state.userData.rewards.medals.includes(rewardId)) {
                state.userData.rewards.medals.push(rewardId);
            } else if (type === 'trophy' && !state.userData.rewards.trophies.includes(rewardId)) {
                state.userData.rewards.trophies.push(rewardId);
            } else if (type === 'title' && !state.userData.rewards.titles.includes(rewardId)) {
                state.userData.rewards.titles.push(rewardId);
            }
        },

        updateLocationPermissions: (state, action) => {
            state.userData.locationPermissions = action.payload;
        },

        // Actions pour la progression
        addPoints: (state, action) => {
            state.userData.score += action.payload;
        },

        removePoints: (state, action) => {
            state.userData.score = Math.max(0, state.userData.score - action.payload);
        },
    },
});

export const {
    updateUser,
    resetUser,
    unlockQuiz,
    unlockMultipleQuizzes,
    completeQuiz,
    unlockReward,
    updateLocationPermissions,
    addPoints,
    removePoints,
} = userSlice.actions;

export default userSlice.reducer;