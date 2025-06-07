import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FontAwesome from "react-native-vector-icons/FontAwesome";

import MapScreen from './screens/MapScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import AvatarScreen from './screens/AvatarScreen';

import { Provider } from "react-redux";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import { PersistGate } from "redux-persist/integration/react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import user from "./reducers/users";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 🧩 Tab Navigator temporaire
const TabNavigator = () => {
	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				tabBarIcon: ({ color, size }) => {
					switch (route.name) {
						case 'Login':
							return <FontAwesome name="sign-in" size={size} color={color} />;
						case "Map":
							return <FontAwesome name="map" size={size} color={color} />;
						case "Avatar":
							return <FontAwesome name="user-circle" size={size} color={color} />;
						case "Profil":
							return <FontAwesome name="id-card" size={size} color={color} />;
					}
				},
				tabBarActiveTintColor: "#2196f3",
				tabBarInactiveTintColor: "gray",
				headerShown: false,
			})}
		>
			<Tab.Screen name="Login" component={LoginScreen} />
			<Tab.Screen name="Map" component={MapScreen} />
			<Tab.Screen name="Avatar" component={AvatarScreen} />
			<Tab.Screen name="Profil" component={ProfileScreen} />
		</Tab.Navigator>
	);
};

// Redux persist config
const persistedReducers = persistReducer(
	{
		key: "expojs-starter",
		storage: AsyncStorage,
		whitelist: ["user"],
	},
	combineReducers({ user })
);

const store = configureStore({
	reducer: persistedReducers,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({ serializableCheck: false }),
});

const persistor = persistStore(store);

// 🎯 App principale
export default function App() {
	return (
		<Provider store={store}>
			<NavigationContainer>
				<TabNavigator />
			</NavigationContainer>
		</Provider>
	);
}

/* <Stack.Navigator screenOptions={{ headerShown: false }}>
	<Stack.Screen name="Login" component={LoginScreen} />
	<Stack.Screen name="Main" component={TabNavigator} />
</Stack.Navigator> */