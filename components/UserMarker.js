// components/UserMarker.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';

const UserMarker = ({ user, onPress }) => {

    // 🏆 Icône de trophée simplifié
    const getTrophyIcon = (trophy) => {
        if (trophy && trophy.includes('Diamant')) return '💎';
        if (trophy && trophy.includes('Or')) return '🥇';
        if (trophy && trophy.includes('Argent')) return '🥈';
        if (trophy && trophy.includes('Bronze')) return '🥉';
        if (trophy && trophy.includes('Feu')) return '🔥';
        if (trophy && trophy.includes('Éclair')) return '⚡';
        if (trophy && trophy.includes('Étoile')) return '⭐';
        return '🎯';
    };

    // Keep this vital check at the top
    if (!user || !user.location || typeof user.location.latitude !== 'number' || typeof user.location.longitude !== 'number') {
        console.warn("⚠️ UserMarker: Coordonnées de l'utilisateur invalides ou manquantes. User:", user);
        return null;
    }

    return (
        <Marker
            coordinate={{
                latitude: user.location.latitude,
                longitude: user.location.longitude,
            }}
        >
            {/* 🎯 AVATAR CLIQUABLE - TouchableOpacity autour de l'avatar */}
            <TouchableOpacity
                style={styles.avatarMarker}
                onPress={() => onPress && onPress(user)}
                activeOpacity={0.7}
            >
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
                    style={styles.avatarContainer}
                >
                    {user.avatar ? (
                        // MODIFIED: Added a background color for Image for better visibility/debugging
                        <Image source={{ uri: user.avatar }} style={[styles.avatar, { backgroundColor: '#ccc' }]} />
                    ) : (
                        <View style={[styles.avatar, styles.defaultAvatar]}>
                            <Text style={styles.avatarText}>
                                {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                            </Text>
                        </View>
                    )}

                    {/* 🏆 Petit badge trophée discret */}
                    {/* Ensure user.achievements and user.achievements.trophy exist before trying to render */}
                    {user.achievements && user.achievements.trophy && (
                        <View style={styles.trophyBadge}>
                            <Text style={styles.trophyIcon}>
                                {getTrophyIcon(user.achievements.trophy)}
                            </Text>
                        </View>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </Marker>
    );
};

const styles = StyleSheet.create({
    // 🗺️ MARKER MINIMALISTE
    avatarMarker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
        position: 'relative', // Keep this for trophy badge positioning
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        // Ensure the image itself is visible within its container
        resizeMode: 'cover', // Added: Ensures the image covers the area,
        //       can also use 'contain' or 'stretch' depending on desired effect
    },
    defaultAvatar: {
        backgroundColor: '#4A90E2', // Default color for initial
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: "Fustat-ExtraBold.ttf",
    },
    trophyBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: 'white',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.8)',
    },
    trophyIcon: {
        fontSize: 12,
    },
});

export default UserMarker;