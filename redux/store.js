// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import userReducer from './userSlice';

// Configuration de la persistance
const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    // Optionnel : choisir quels champs sauvegarder
    whitelist: ['isLoggedIn', 'userData', 'avatar'], // Ne sauvegarde que ces champs
    // blacklist: ['loading', 'error'], // Exclure ces champs (alternative)
};

// Créer le reducer persistant
const persistedUserReducer = persistReducer(persistConfig, userReducer);

// Configurer le store
export const store = configureStore({
    reducer: {
        user: persistedUserReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignorer ces actions de redux-persist
                ignoredActions: [
                    'persist/PERSIST',
                    'persist/REHYDRATE',
                    'persist/PAUSE',
                    'persist/PURGE',
                    'persist/REGISTER',
                ],
            },
        }),
});

// Créer le persistor
export const persistor = persistStore(store);

export default store;