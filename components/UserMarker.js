import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';

const UserMarker = ({ user, onPress }) => {

    // 🏆 Icône de trophée simplifié
    const getTrophyIcon = (trophy) => {
        if (trophy.includes('Diamant')) return '💎';
        if (trophy.includes('Or')) return '🥇';
        if (trophy.includes('Argent')) return '🥈';
        if (trophy.includes('Bronze')) return '🥉';
        if (trophy.includes('Feu')) return '🔥';
        if (trophy.includes('Éclair')) return '⚡';
        if (trophy.includes('Étoile')) return '⭐';
        return '🎯';
    };

    return (
        <Marker
            coordinate={{
                latitude: user.coordinates.latitude,
                longitude: user.coordinates.longitude,
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
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.defaultAvatar]}>
                            <Text style={styles.avatarText}>
                                {user.username.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}

                    {/* 🏆 Petit badge trophée discret */}
                    <View style={styles.trophyBadge}>
                        <Text style={styles.trophyIcon}>
                            {getTrophyIcon(user.achievements.trophy)}
                        </Text>
                    </View>
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
        position: 'relative',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    defaultAvatar: {
        backgroundColor: '#4A90E2',
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