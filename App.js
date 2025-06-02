import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FontAwesome from "react-native-vector-icons/FontAwesome"; // https://oblador.github.io/react-native-vector-icons/#FontAwesome

import MapScreen from './screens/MapScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileScreen from './screens/ProfileScreen';
import AvatarScreen from './screens/AvatarScreen'
import ScenarioScreen from './screens/ScenarioScreen'
import StartGameScreen from './screens/StartGameScreen'
import EndScreen from './screens/EndScreen'

import { Provider } from "react-redux";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist"; // Persistor
import { PersistGate } from "redux-persist/integration/react";
import AsyncStorage from "@react-native-async-storage/async-storage"; // AsyncStorage

import user from "./reducers/users";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// const TabNavigator = () => {
// 	return (
// 		<Tab.Navigator
// 			screenOptions={({ route }) => ({
// 				tabBarIcon: ({ color, size }) => {
// 					switch (route.name) {
// 						case "TabScreen1":
// 							return <FontAwesome name={"home"} size={size} color={color} />;
// 						case "TabScreen2":
// 							return <FontAwesome name={"user"} size={size} color={color} />;
// 					}
// 				},
// 				tabBarActiveTintColor: "#2196f3",
// 				tabBarInactiveTintColor: "gray",
// 				headerShown: false,
// 			})}
// 		>
// 			<Tab.Screen name="TabScreen1" component={TabScreen1} />
// 			<Tab.Screen name="TabScreen2" component={TabScreen2} />
// 		</Tab.Navigator>
// 	);
// };

// Redux Persist Configuration
const persistedReducers = persistReducer(
	{
		key: "expojs-starter",
		storage: AsyncStorage,
		blacklist: [], // Add reducers that you don't want to persist
		whitelist: ["user"], // Add reducers that you want to persist
	},
	combineReducers({ user })
);

const store = configureStore({
	reducer: persistedReducers,
	middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});

const persistor = persistStore(store);

export default function App() {

	//   const [loaded] = useFonts({
	//     "Fustat-Bold.ttf": require("./assets/fonts/Fustat-Bold.ttf"),
	//     "Fustat-ExtraBold.ttf": require("./assets/fonts/Fustat-ExtraBold.ttf"),
	//     "Fustat-ExtraLight.ttf": require("./assets/fonts/Fustat-ExtraLight.ttf"),
	//     "Fustat-Light.ttf": require("./assets/fonts/Fustat-Light.ttf"),
	//     "Fustat-Medium.ttf": require("./assets/fonts/Fustat-Medium.ttf"),
	//     "Fustat-Regular.ttf": require("./assets/fonts/Fustat-Regular.ttf"),
	//     "Fustat-SemiBold.ttf": require("./assets/fonts/Fustat-SemiBold.ttf"),
	//     "Homenaje-Regular.ttf": require("./assets/fonts/Homenaje-Regular.ttf"),
	//     "PressStart2P-Regular.ttf": require("./assets/fonts/PressStart2P-Regular.ttf"),
	//     "Righteous-Regular.ttf": require("./assets/fonts/Righteous-Regular.ttf"),
	//     "Goldman-Regular.ttf": require("./assets/fonts/Goldman-Regular.ttf"),
	//     "Goldman-Bold.ttf": require("./assets/fonts/Goldman-Bold.ttf"),
	//     "FugazOne-Regular.ttf": require("./assets/fonts/FugazOne-Regular.ttf"),
	//     "Exo2-SemiBold.ttf": require("./assets/fonts/Exo2-SemiBold.ttf"),
	//     "Exo2-Regular.ttf": require("./assets/fonts/Exo2-Regular.ttf"),
	//     "Exo2-Medium.ttf": require("./assets/fonts/Exo2-Medium.ttf"),
	//     "Exo2-ExtraBold.ttf": require("./assets/fonts/Exo2-ExtraBold.ttf"),
	//     "Exo2-Bold.ttf": require("./assets/fonts/Exo2-Bold.ttf"),
	//     "Exo2-Black.ttf": require("./assets/fonts/Exo2-Black.ttf"),
	//     "Doto-Regular.ttf": require("./assets/fonts/Doto-Regular.ttf"),
	//     "Doto-Bold.ttf": require("./assets/fonts/Doto-Bold.ttf"),
	//     "Doto-Black.ttf": require("./assets/fonts/Doto-Black.ttf"),
	//   });

	//   useEffect(() => {
	//     // cacher l'écran de démarrage si la police est chargée ou s'il y a une erreur
	//     if (loaded) {
	//       SplashScreen.hideAsync();
	//     }
	//   }, [loaded]);

	//   // Retourner null tant que la police n'est pas chargée
	//   if (!loaded) {
	//     return null;
	//   }

	return (
		<Provider store={store}>
			<NavigationContainer>
				<Stack.Navigator screenOptions={{ headerShown: false }}>
					<Stack.Screen name="Home" component={LoginScreen} />
					<Stack.Screen name="Avatar" component={AvatarScreen} />
					<Stack.Screen name="Map" component={MapScreen} />
					<Stack.Screen name="Scenario" component={ScenarioScreen} />
					<Stack.Screen name="StartGame" component={StartGameScreen} />
					<Stack.Screen name="End" component={EndScreen} />
					<Stack.Screen name="Profil" component={ProfileScreen} />
				</Stack.Navigator>
			</NavigationContainer>
		</Provider>
	);
}