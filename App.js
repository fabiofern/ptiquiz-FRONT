import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PersistGate } from 'redux-persist/integration/react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useSelector } from 'react-redux';
import { store, persistor } from './redux/store';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// Imports d'écrans
import LoginScreen from './screens/LoginScreen';
import AvatarScreen from './screens/AvatarScreen';
import PermissionScreen from './screens/PermissionScreen';
import MapScreen from './screens/MapScreen';
import ProfileScreen from './screens/ProfileScreen';
import QuizScreen from './screens/QuizScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation avec onglets (quand tout est configuré)
function MainTabNavigator() {
	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: '#fb7a68',
				tabBarInactiveTintColor: '#999',
				tabBarStyle: {
					backgroundColor: '#ffffff',
					borderTopWidth: 0,
					elevation: 10,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: -2 },
					shadowOpacity: 0.1,
					shadowRadius: 4,
					height: 80,
					paddingBottom: 10,
					paddingTop: 10,
				},
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: '600',
				},
			}}
		>
			<Tab.Screen
				name="Map"
				component={MapScreen}
				options={{
					tabBarLabel: 'Carte',
					tabBarIcon: ({ color, size }) => (
						<FontAwesome name="map-o" size={size} color={color} />
					),
				}}
			/>
			<Tab.Screen
				name="Quiz"
				component={QuizScreen}
				options={{
					tabBarLabel: 'Quiz',
					tabBarIcon: ({ color, size }) => (
						<FontAwesome name="gamepad" size={size} color={color} />
					),
				}}
			/>
			<Tab.Screen
				name="Profile"
				component={ProfileScreen}
				options={{
					tabBarLabel: 'Profil',
					tabBarIcon: ({ color, size }) => (
						<FontAwesome name="user" size={size} color={color} />
					),
				}}
			/>
		</Tab.Navigator>
	);
}

// 🎯 NAVIGATION PRINCIPALE - SIMPLE ET CLAIRE
function AppNavigator() {
	const { isLoggedIn, userData } = useSelector((state) => state.user);

	console.log('🔍 État utilisateur:', {
		isLoggedIn,
		hasUsername: !!userData?.username,
		hasAvatar: !!userData?.avatar,
		hasLocationPermissions: !!userData?.locationPermissions?.foreground
	});

	// ✅ TOUTES LES SCREENS DANS UNE STACK - NAVIGATION CONDITIONNELLE AUTOMATIQUE
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Login" component={LoginScreen} />
			<Stack.Screen name="Avatar" component={AvatarScreen} />
			<Stack.Screen name="PermissionScreen" component={PermissionScreen} />
			<Stack.Screen name="MainApp" component={MainTabNavigator} />
		</Stack.Navigator>
	);
}

export default function App() {
	return (
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<NavigationContainer>
					<AppNavigator />
				</NavigationContainer>
			</PersistGate>
		</Provider>
	);
}