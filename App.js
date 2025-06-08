import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Tes imports d'écrans
import LoginScreen from './screens/LoginScreen';
import AvatarScreen from './screens/AvatarScreen';
import MapScreen from './screens/MapScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack pour chaque écran
function LoginStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen name="LoginScreen" component={LoginScreen} />
		</Stack.Navigator>
	);
}

function AvatarStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen name="AvatarScreen" component={AvatarScreen} />
		</Stack.Navigator>
	);
}

function MapStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen name="MapScreen" component={MapScreen} />
		</Stack.Navigator>
	);
}

function ProfileStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen name="ProfileScreen" component={ProfileScreen} />
		</Stack.Navigator>
	);
}

export default function App() {
	return (
		<NavigationContainer>
			<Tab.Navigator>
				<Tab.Screen name="Login" component={LoginStack} />
				<Tab.Screen name="Avatar" component={AvatarStack} />
				<Tab.Screen name="Map" component={MapStack} />
				<Tab.Screen name="Profile" component={ProfileStack} />
			</Tab.Navigator>
		</NavigationContainer>
	);
}