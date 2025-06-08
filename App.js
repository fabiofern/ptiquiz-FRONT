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
import MapScreen from './screens/MapScreen';
import ProfileScreen from './screens/ProfileScreen';
import QuizScreen from './screens/QuizScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation principale (après connexion)
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

// Navigation d'authentification
function AuthStack() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Login" component={LoginScreen} />
			<Stack.Screen name="Avatar" component={AvatarScreen} />
		</Stack.Navigator>
	);
}

// Navigation conditionnelle
function AppNavigator() {
	const { isLoggedIn, userData } = useSelector((state) => state.user);

	// Si pas connecté → Auth Stack
	if (!isLoggedIn) {
		return <AuthStack />;
	}

	// Si connecté mais pas d'avatar/username → Avatar Screen
	if (!userData?.username || !userData?.avatar) {
		return (
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				<Stack.Screen name="Avatar" component={AvatarScreen} />
			</Stack.Navigator>
		);
	}

	// Si tout est OK → Main App
	return <MainTabNavigator />;
}

// Version DEV avec tabs pour tout (gardez celle-ci pour le développement)
function DevTabNavigator() {
	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: '#fb7a68',
				tabBarInactiveTintColor: '#999',
				tabBarStyle: {
					backgroundColor: '#ffffff',
					height: 70,
					paddingBottom: 10,
					paddingTop: 5,
				},
				tabBarLabelStyle: {
					fontSize: 10,
					fontWeight: '600',
				},
			}}
		>
			<Tab.Screen
				name="Login"
				component={LoginScreen}
				options={{
					tabBarIcon: ({ color, size }) => (
						<FontAwesome name="sign-in" size={size} color={color} />
					),
				}}
			/>
			<Tab.Screen
				name="Avatar"
				component={AvatarScreen}
				options={{
					tabBarIcon: ({ color, size }) => (
						<FontAwesome name="user-circle" size={size} color={color} />
					),
				}}
			/>
			<Tab.Screen
				name="Map"
				component={MapScreen}
				options={{
					tabBarIcon: ({ color, size }) => (
						<FontAwesome name="map-o" size={size} color={color} />
					),
				}}
			/>
			<Tab.Screen
				name="Quiz"
				component={QuizScreen}
				options={{
					tabBarIcon: ({ color, size }) => (
						<FontAwesome name="gamepad" size={size} color={color} />
					),
				}}
			/>
			<Tab.Screen
				name="Profile"
				component={ProfileScreen}
				options={{
					tabBarIcon: ({ color, size }) => (
						<FontAwesome name="user" size={size} color={color} />
					),
				}}
			/>
		</Tab.Navigator>
	);
}

export default function App() {
	// 🔧 DEV MODE - Changez cette variable pour basculer
	const DEV_MODE = true; // ← Mettez false pour la version finale

	return (
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<NavigationContainer>
					{DEV_MODE ? <DevTabNavigator /> : <AppNavigator />}
				</NavigationContainer>
			</PersistGate>
		</Provider>
	);
}