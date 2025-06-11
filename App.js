import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PersistGate } from 'redux-persist/integration/react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useSelector } from 'react-redux';
import { store, persistor } from './redux/store';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { View, Text, Platform, ActivityIndicator, AppState } from 'react-native';
import { BlurView } from 'expo-blur';

// Import du service de géolocalisation
import BackgroundLocationService from './services/BackgroundLocationService';

// Imports d'écrans
import LoginScreen from './screens/LoginScreen';
import AvatarScreen from './screens/AvatarScreen';
import PermissionScreen from './screens/PermissionScreen';
import MapScreen from './screens/MapScreen';
import ProfileScreen from './screens/ProfileScreen';
import QuizScreen from './screens/QuizScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 🎨 COMPOSANT CUSTOM POUR LA TAB BAR
const CustomTabBar = ({ state, descriptors, navigation }) => {
	return (
		<View style={{
			position: 'absolute',
			bottom: 25,
			left: 20,
			right: 20,
			height: 70,
			borderRadius: 25,
			overflow: 'hidden',
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 10 },
			shadowOpacity: 0.25,
			shadowRadius: 20,
			elevation: 15,
		}}>
			<BlurView
				intensity={Platform.OS === 'ios' ? 80 : 50}
				style={{
					flex: 1,
					flexDirection: 'row',
					backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.9)',
					borderWidth: 1,
					borderColor: 'rgba(255, 255, 255, 0.3)',
					borderRadius: 25,
				}}
			>
				{state.routes.map((route, index) => {
					const { options } = descriptors[route.key];
					const label =
						options.tabBarLabel !== undefined
							? options.tabBarLabel
							: options.title !== undefined
								? options.title
								: route.name;

					const isFocused = state.index === index;

					const onPress = () => {
						const event = navigation.emit({
							type: 'tabPress',
							target: route.key,
							canPreventDefault: true,
						});

						if (!isFocused && !event.defaultPrevented) {
							navigation.navigate(route.name);
						}
					};

					const getIconConfig = (routeName) => {
						switch (routeName) {
							case 'Map':
								return {
									icon: 'map-o',
									activeColor: '#85CAE4',
									activeGradient: ['#85CAE4', '#5BB3D8'],
									label: 'Carte'
								};
							case 'Quiz':
								return {
									icon: 'gamepad',
									activeColor: '#fb7a68',
									activeGradient: ['#fb7a68', '#f06292'],
									label: 'Quiz'
								};
							case 'Profile':
								return {
									icon: 'user',
									activeColor: '#9C27B0',
									activeGradient: ['#9C27B0', '#7B1FA2'],
									label: 'Profil'
								};
							default:
								return {
									icon: 'circle',
									activeColor: '#fb7a68',
									activeGradient: ['#fb7a68', '#f06292'],
									label: routeName
								};
						}
					};

					const iconConfig = getIconConfig(route.name);

					return (
						<View
							key={route.key}
							style={{
								flex: 1,
								alignItems: 'center',
								justifyContent: 'center',
								paddingVertical: 8,
							}}
							onTouchStart={onPress}
						>
							{isFocused && (
								<View style={{
									position: 'absolute',
									top: 6,
									width: 40,
									height: 3,
									backgroundColor: iconConfig.activeColor,
									borderRadius: 2,
									shadowColor: iconConfig.activeColor,
									shadowOffset: { width: 0, height: 0 },
									shadowOpacity: 0.8,
									shadowRadius: 4,
									elevation: 5,
								}} />
							)}

							{isFocused && (
								<View style={{
									position: 'absolute',
									width: 50,
									height: 50,
									borderRadius: 25,
									backgroundColor: `${iconConfig.activeColor}15`,
									borderWidth: 1,
									borderColor: `${iconConfig.activeColor}30`,
								}} />
							)}

							<FontAwesome
								name={iconConfig.icon}
								size={isFocused ? 26 : 22}
								color={isFocused ? iconConfig.activeColor : '#666'}
								style={{
									marginBottom: 2,
									textShadowColor: isFocused ? iconConfig.activeColor : 'transparent',
									textShadowOffset: { width: 0, height: 0 },
									textShadowRadius: isFocused ? 8 : 0,
								}}
							/>

							<Text style={{
								fontSize: 11,
								fontWeight: isFocused ? '700' : '500',
								color: isFocused ? iconConfig.activeColor : '#666',
								textShadowColor: isFocused ? iconConfig.activeColor : 'transparent',
								textShadowOffset: { width: 0, height: 0 },
								textShadowRadius: isFocused ? 4 : 0,
							}}>
								{iconConfig.label}
							</Text>
						</View>
					);
				})}
			</BlurView>
		</View>
	);
};

function MainTabNavigator() {
	return (
		<Tab.Navigator
			tabBar={(props) => <CustomTabBar {...props} />}
			screenOptions={{
				headerShown: false,
				tabBarHideOnKeyboard: true,
			}}
		>
			<Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: 'Carte' }} />
			<Tab.Screen name="Quiz" component={QuizScreen} options={{ tabBarLabel: 'Quiz' }} />
			<Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil' }} />
		</Tab.Navigator>
	);
}

// 🔧 COMPOSANT AVEC GESTION DU TRACKING
function AppNavigator() {
	const { isLoggedIn, userData } = useSelector((state) => state.user);
	const [locationServiceReady, setLocationServiceReady] = useState(false);

	// 📱 Référence pour suivre l'état de l'app
	const appState = useRef(AppState.currentState);
	const isTrackingActive = useRef(false);

	console.log('🔍 État utilisateur:', {
		isLoggedIn,
		hasUsername: !!userData?.username,
		hasAvatar: !!userData?.avatar,
		hasLocationPermissions: !!userData?.locationPermissions?.foreground
	});

	// 🎯 INITIALISATION DU SERVICE DE GÉOLOCALISATION
	useEffect(() => {
		async function initLocationService() {
			try {
				console.log('🔧 Initialisation du service de géolocalisation...');
				const initialized = await BackgroundLocationService.initialize();

				if (initialized) {
					console.log('✅ Service de géolocalisation initialisé avec succès');
				} else {
					console.log('⚠️ Service de géolocalisation non disponible');
				}

				setLocationServiceReady(true);
			} catch (error) {
				console.error('❌ Erreur initialisation service géolocalisation:', error);
				setLocationServiceReady(true);
			}
		}

		initLocationService();
	}, []);

	// 📱 GESTION DES ÉTATS DE L'APPLICATION (foreground/background)
	useEffect(() => {
		const handleAppStateChange = (nextAppState) => {
			console.log('📱 Changement état app:', appState.current, '->', nextAppState);

			if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
				// 🎯 App revient au premier plan
				console.log('🟢 App active - Mode premier plan');

				// Switch vers mode foreground si tracking actif
				if (isTrackingActive.current) {
					BackgroundLocationService.switchToMode('foreground');
				}

			} else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
				// 🎯 App passe en arrière-plan
				console.log('🟡 App en arrière-plan - Mode background');

				// Switch vers mode background si tracking actif
				if (isTrackingActive.current) {
					BackgroundLocationService.switchToMode('background');
				}
			}

			appState.current = nextAppState;
		};

		const subscription = AppState.addEventListener('change', handleAppStateChange);

		return () => {
			subscription?.remove();
		};
	}, []);

	// 🎯 GESTION AUTOMATIQUE DU TRACKING SELON L'ÉTAT DE CONNEXION
	useEffect(() => {
		// 🎯 ATTENDRE QUE LE SERVICE SOIT COMPLÈTEMENT PRÊT
		if (!locationServiceReady) {
			console.log('⏳ Service pas encore prêt, attente...');
			return;
		}

		const handleTracking = async () => {
			if (isLoggedIn && userData) {
				console.log('👤 Utilisateur connecté - Démarrage tracking PERMANENT');

				try {
					// Configure le service avec les infos utilisateur
					await BackgroundLocationService.setUserInfo({
						userId: userData.id || userData._id || 'user_' + Date.now(),
						username: userData.username || 'Anonymous'
					});

					// Démarre le tracking
					const started = await BackgroundLocationService.startTracking();
					if (started) {
						isTrackingActive.current = true;
						console.log('✅ Tracking géolocalisation actif en PERMANENT');
					} else {
						console.log('⚠️ Impossible de démarrer le tracking');
					}
				} catch (error) {
					console.error('❌ Erreur démarrage tracking:', error);
				}
			} else {
				console.log('🚪 Utilisateur déconnecté - Arrêt tracking');
				try {
					await BackgroundLocationService.stopTracking();
					isTrackingActive.current = false;
				} catch (error) {
					console.error('❌ Erreur arrêt tracking:', error);
				}
			}
		};

		handleTracking();
	}, [isLoggedIn, userData, locationServiceReady]); // 🎯 DÉPENDANCE SUR locationServiceReady

	// 🧹 NETTOYAGE LORS DE LA FERMETURE DE L'APP
	useEffect(() => {
		return () => {
			console.log('🧹 Nettoyage du service géolocalisation');
			BackgroundLocationService.cleanup();
		};
	}, []);

	// 📱 ÉCRAN DE CHARGEMENT
	if (!locationServiceReady) {
		return (
			<View style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: '#1a1a2e'
			}}>
				<ActivityIndicator size="large" color="#9d4edd" />
				<Text style={{ color: '#ffffff', marginTop: 20, fontSize: 16 }}>
					Initialisation de TiQuiz...
				</Text>
			</View>
		);
	}

	// ✅ NAVIGATION PRINCIPALE
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