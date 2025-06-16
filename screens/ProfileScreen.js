import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, SafeAreaView, Text, TouchableOpacity,
    ScrollView, Image, Alert, ActivityIndicator, Dimensions, Animated, Modal, TextInput, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useDispatch, useSelector } from 'react-redux';
import { resetUser, updateUser } from '../redux/userSlice';
import { RewardsService, MEDALS, TROPHIES, TITLES } from '../services/RewardsService';
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { EXPO_PUBLIC_BACKEND_URL } from '@env';

SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('window');

const AuroraBackground = () => {
    const [isReady, setIsReady] = useState(false);
    const blobs = useRef([]);

    useEffect(() => {
        if (!isReady) {
            blobs.current = [...Array(6)].map(() => ({
                translateX: new Animated.Value(Math.random() * width),
                translateY: new Animated.Value(Math.random() * height),
                scale: new Animated.Value(0.5 + Math.random()),
                opacity: new Animated.Value(0.2 + Math.random() * 0.3),
                duration: 5000 + Math.random() * 5000,
            }));
            setIsReady(true);

            blobs.current.forEach(blob => {
                const animateBlob = () => {
                    Animated.loop(
                        Animated.parallel([
                            Animated.timing(blob.translateX, { toValue: Math.random() * width, duration: blob.duration, useNativeDriver: true }),
                            Animated.timing(blob.translateY, { toValue: Math.random() * height, duration: blob.duration, useNativeDriver: true }),
                            Animated.timing(blob.scale, { toValue: 0.8 + Math.random() * 0.7, duration: blob.duration, useNativeDriver: true }),
                            Animated.timing(blob.opacity, { toValue: 0.2 + Math.random() * 0.3, duration: blob.duration, useNativeDriver: true }),
                        ])
                    ).start();
                };
                animateBlob();
            });
        }
    }, [isReady]);

    const auroraColors = [
        'rgba(255, 152, 0, 0.2)',
        'rgba(255, 112, 67, 0.2)',
        'rgba(255, 204, 128, 0.2)',
        'rgba(255, 240, 200, 0.2)',
        'rgba(255, 224, 178, 0.2)',
    ];

    if (!isReady) {
        return null;
    }

    return (
        <View style={StyleSheet.absoluteFillObject}>
            {blobs.current.map((blob, index) => (
                <Animated.View
                    key={index}
                    style={{
                        position: 'absolute',
                        width: width * 0.6,
                        height: width * 0.6,
                        borderRadius: width * 0.3,
                        backgroundColor: auroraColors[index % auroraColors.length],
                        transform: [
                            { translateX: blob.translateX },
                            { translateY: blob.translateY },
                            { scale: blob.scale }
                        ],
                        opacity: blob.opacity,
                    }}
                />
            ))}
        </View>
    );
};

export default function ProfileScreen({ navigation }) {
    const URL = EXPO_PUBLIC_BACKEND_URL;
    const dispatch = useDispatch();
    const { userData, isLoggedIn } = useSelector((state) => state.user);
    const [refreshKey, setRefreshKey] = useState(0);

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [newUsername, setNewUsername] = useState(userData?.username || '');
    const [selectedAvatar, setSelectedAvatar] = useState(userData?.avatar || 'avatar01.png');
    const [isLoading, setIsLoading] = useState(false);

    const avatarSize = 60;
    const avatarMargin = 8;
    const modalPadding = 90;
    const availableWidth = width * 0.9 - modalPadding;
    const avatarTotalWidth = avatarSize + (avatarMargin * 2);
    const numColumns = Math.floor(availableWidth / avatarTotalWidth);

    const [loaded] = useFonts({
        "Fustat-Bold.ttf": require("../assets/fonts/Fustat-Bold.ttf"),
        "Fustat-ExtraBold.ttf": require("../assets/fonts/Fustat-ExtraBold.ttf"),
        "Fustat-Regular.ttf": require("../assets/fonts/Fustat-Regular.ttf"),
        "Fustat-SemiBold.ttf": require("../assets/fonts/Fustat-SemiBold.ttf"),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    useEffect(() => {
        if (isEditModalVisible) {
            setNewUsername(userData?.username || '');
            setSelectedAvatar(userData?.avatar || 'avatar01.png');
        }
    }, [userData, isEditModalVisible]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setRefreshKey(prev => prev + 1);
        });
        return unsubscribe;
    }, [navigation]);

    const handleSaveProfile = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${URL}/users/updateProfil`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: newUsername,
                    avatar: selectedAvatar,
                    userId: userData.userID
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Échec de la mise à jour du profil');
            }

            const updatedUserDataResponse = await response.json();

            dispatch(updateUser({ userData: { ...userData, username: newUsername, avatar: selectedAvatar } }));

            Alert.alert('Succès', 'Votre profil a été mis à jour !');
            setIsEditModalVisible(false);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du profil:', error);
            Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la mise à jour.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!loaded) {
        return null;
    }

    if (!isLoggedIn || !userData) {
        return (
            <LinearGradient
                colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={styles.center}>
                    <Text style={styles.errorText}>Veuillez vous connecter</Text>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    const avatarImages = {
        'avatar01.png': require('../assets/avatars/avatar01.png'),
        'avatar02.png': require('../assets/avatars/avatar02.png'),
        'avatar03.png': require('../assets/avatars/avatar03.png'),
        'avatar04.png': require('../assets/avatars/avatar04.png'),
        'avatar05.png': require('../assets/avatars/avatar05.png'),
        'avatar06.png': require('../assets/avatars/avatar06.png'),
        'avatar07.png': require('../assets/avatars/avatar07.png'),
        'avatar08.png': require('../assets/avatars/avatar08.png'),
        'avatar09.png': require('../assets/avatars/avatar09.png'),
        'avatar10.png': require('../assets/avatars/avatar10.png'),
        'avatar11.png': require('../assets/avatars/avatar11.png'),
        'avatar13.png': require('../assets/avatars/avatar13.png'),
        'avatar14.png': require('../assets/avatars/avatar14.png'),
        'avatar15.png': require('../assets/avatars/avatar15.png'),
    };

    const calculateUserTotalScore = () => {
        const completedQuizzes = userData?.completedQuizzes || {};
        return Object.values(completedQuizzes).reduce((total, quiz) => {
            return total + (quiz.score || 0);
        }, 0);
    };

    // NOUVELLE FONCTION - Calculer les statistiques de duels
    const calculateDuelStats = () => {
        const duelHistory = userData?.duelHistory || [];
        const duelsWon = duelHistory.filter(duel => duel.result === 'won').length;
        const duelsLost = duelHistory.filter(duel => duel.result === 'lost').length;
        const duelsDraw = duelHistory.filter(duel => duel.result === 'draw').length;

        const winRate = duelHistory.length > 0
            ? Math.round((duelsWon / duelHistory.length) * 100)
            : 0;

        return {
            totalDuels: duelHistory.length,
            duelsWon,
            duelsLost,
            duelsDraw,
            winRate,
            bestStreak: userData.bestDuelStreak || 0,
            currentStreak: userData.currentDuelStreak || 0,
            totalDuelPoints: duelHistory.reduce((total, duel) => total + (duel.points || 0), 0)
        };
    };

    const stats = {
        totalQuizzes: Object.keys(userData.completedQuizzes || {}).length,
        perfectQuizzes: Object.values(userData.completedQuizzes || {})
            .filter(quiz => quiz.percentage === 100).length,
        excellentQuizzes: Object.values(userData.completedQuizzes || {})
            .filter(quiz => quiz.percentage >= 80 && quiz.percentage < 100).length,
        totalScore: calculateUserTotalScore(),
        averageScore: Object.keys(userData.completedQuizzes || {}).length > 0
            ? Math.round(Object.values(userData.completedQuizzes || {})
                .reduce((sum, quiz) => sum + (quiz.percentage || 0), 0) /
                Object.keys(userData.completedQuizzes || {}).length)
            : 0,
        unlockedQuizzes: (userData.unlockedQuizzes || []).length,
        medals: (userData.rewards?.medals || []).length,
        trophies: (userData.rewards?.trophies || []).length,
        titles: (userData.rewards?.titles || []).length,
        // AJOUTER LES STATS DE DUELS
        ...calculateDuelStats()
    };

    const getUserRank = () => {
        const { perfectQuizzes, totalQuizzes, averageScore } = stats;

        if (perfectQuizzes >= 10 && averageScore >= 95) {
            return { rank: 'Maître Suprême', icon: '👑', color: '#FFD700' };
        } else if (perfectQuizzes >= 5 && averageScore >= 90) {
            return { rank: 'Expert', icon: '🏆', color: '#C0C0C0' };
        } else if (totalQuizzes >= 10 && averageScore >= 80) {
            return { rank: 'Avancé', icon: '⭐', color: '#CD7F32' };
        } else if (totalQuizzes >= 5 && averageScore >= 70) {
            return { rank: 'Intermédiaire', icon: '🌟', color: '#FF9800' };
        } else if (totalQuizzes >= 3) {
            return { rank: 'Novice', icon: '🌱', color: '#4CAF50' };
        } else {
            return { rank: 'Débutant', icon: '🎯', color: '#9E9E9E' };
        }
    };

    // NOUVELLE FONCTION - Obtenir le rang de duelliste
    const getDuelRank = () => {
        const { duelsWon, winRate, totalDuels } = stats;

        if (duelsWon >= 50 && winRate >= 90) {
            return { rank: 'Champion Légendaire', icon: '👑', color: '#FFD700' };
        } else if (duelsWon >= 25 && winRate >= 80) {
            return { rank: 'Maître Duelliste', icon: '⚔️', color: '#C0C0C0' };
        } else if (duelsWon >= 10 && winRate >= 70) {
            return { rank: 'Guerrier Expérimenté', icon: '🛡️', color: '#CD7F32' };
        } else if (duelsWon >= 5 && winRate >= 60) {
            return { rank: 'Combattant', icon: '⚡', color: '#FF9800' };
        } else if (totalDuels >= 3) {
            return { rank: 'Apprenti Guerrier', icon: '🗡️', color: '#4CAF50' };
        } else {
            return { rank: 'Recrue', icon: '🛡️', color: '#9E9E9E' };
        }
    };

    const userRank = getUserRank();
    const duelRank = getDuelRank(); // NOUVEAU
    const currentTitle = RewardsService.getCurrentTitle(userData);
    const nextReward = RewardsService.getNextRewardProgress(userData);

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Déconnexion', onPress: () => dispatch(resetUser()) }
            ]
        );
    };

    const getPerformanceColor = (percentage) => {
        if (percentage === 100) return '#4CAF50';
        if (percentage >= 80) return '#FF9800';
        if (percentage >= 70) return '#64B5F6';
        return '#F44336';
    };

    return (
        <LinearGradient
            colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <AuroraBackground />

            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                    <View style={styles.profileHeaderWrapper}>
                        <BlurView intensity={50} tint="light" style={styles.profileHeaderBlur}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={avatarImages[userData.avatar] || avatarImages['avatar01.png']}
                                    style={styles.avatar}
                                />

                                <TouchableOpacity
                                    style={styles.editProfileButton}
                                    onPress={() => setIsEditModalVisible(true)}
                                >
                                    <BlurView intensity={60} tint="light" style={styles.editProfileButtonBlur}>
                                        <Text style={styles.editProfileButtonText}>✏️ Modifier</Text>
                                    </BlurView>
                                </TouchableOpacity>

                                {currentTitle && (
                                    <View style={[styles.titleBadgeWrapper, { backgroundColor: 'rgba(255, 112, 67, 0.2)', borderColor: 'rgba(255, 112, 67, 0.7)' }]}>
                                        <BlurView intensity={30} tint="light" style={styles.titleBadgeBlur}>
                                            <Text style={[styles.titleIcon, { color: '#FF7043' }]}>{currentTitle.icon}</Text>
                                            <Text style={[styles.titleText, { color: '#FF7043' }]}>{currentTitle.name}</Text>
                                        </BlurView>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.username}>{userData.username}</Text>
                            <Text style={styles.email}>{userData.email}</Text>
                            <Text style={styles.totalScore}>🏆 {stats.totalScore + stats.totalDuelPoints} points obtenus</Text>
                            <Text style={styles.averageScore}>📊 Moyenne: {stats.averageScore}%</Text>
                        </BlurView>
                    </View>

                    <View style={styles.statsContainerWrapper}>
                        <BlurView intensity={50} tint="light" style={styles.statsContainerBlur}>
                            <Text style={styles.sectionTitle}>📊 STATISTIQUES DÉTAILLÉES</Text>
                            <View style={styles.statsGrid}>
                                <View style={styles.statItemWrapper}>
                                    <BlurView intensity={30} tint="light" style={styles.statItemBlur}>
                                        <Text style={styles.statNumber}>{stats.totalQuizzes}</Text>
                                        <Text style={styles.statLabel}>Quiz terminés</Text>
                                    </BlurView>
                                </View>
                                <View style={styles.statItemWrapper}>
                                    <BlurView intensity={30} tint="light" style={styles.statItemBlur}>
                                        <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                                            {stats.perfectQuizzes}
                                        </Text>
                                        <Text style={styles.statLabel}>Quiz parfaits (100%)</Text>
                                    </BlurView>
                                </View>
                                <View style={styles.statItemWrapper}>
                                    <BlurView intensity={30} tint="light" style={styles.statItemBlur}>
                                        <Text style={[styles.statNumber, { color: '#FF9800' }]}>
                                            {stats.excellentQuizzes}
                                        </Text>
                                        <Text style={styles.statLabel}>Quiz excellents (80-99%)</Text>
                                    </BlurView>
                                </View>
                                <View style={styles.statItemWrapper}>
                                    <BlurView intensity={30} tint="light" style={styles.statItemBlur}>
                                        <Text style={[styles.statNumber, { color: '#64B5F6' }]}>
                                            {stats.averageScore}%
                                        </Text>
                                        <Text style={styles.statLabel}>Score moyen</Text>
                                    </BlurView>
                                </View>
                                <View style={styles.statItemWrapper}>
                                    <BlurView intensity={30} tint="light" style={styles.statItemBlur}>
                                        <Text style={styles.statNumber}>{stats.unlockedQuizzes}</Text>
                                        <Text style={styles.statLabel}>Quiz débloqués</Text>
                                    </BlurView>
                                </View>
                                <View style={styles.statItemWrapper}>
                                    <BlurView intensity={30} tint="light" style={styles.statItemBlur}>
                                        <Text style={[styles.statNumber, { color: '#FF7043' }]}>
                                            {stats.medals + stats.trophies + stats.titles}
                                        </Text>
                                        <Text style={styles.statLabel}>Récompenses</Text>
                                    </BlurView>
                                </View>
                            </View>
                        </BlurView>
                    </View>

                    {/* NOUVELLE SECTION - STATISTIQUES DES DUELS */}
                    <View style={styles.statsContainerWrapper}>
                        <BlurView intensity={50} tint="light" style={styles.statsContainerBlur}>
                            <Text style={styles.sectionTitle}>⚔️ STATISTIQUES DES DUELS</Text>

                            {/* Rang de duelliste */}
                            <View style={styles.duelRankWrapper}>
                                <BlurView intensity={30} tint="light" style={styles.duelRankBlur}>
                                    <Text style={styles.duelRankIcon}>{duelRank.icon}</Text>
                                    <Text style={[styles.duelRankText, { color: duelRank.color }]}>
                                        {duelRank.rank}
                                    </Text>
                                </BlurView>
                            </View>

                            <View style={styles.statsGrid}>
                                <View style={styles.statItemWrapper}>
                                    <BlurView intensity={30} tint="light" style={styles.statItemBlur}>
                                        <Text style={styles.statNumber}>{stats.totalDuels}</Text>
                                        <Text style={styles.statLabel}>Duels joués</Text>
                                    </BlurView>
                                </View>

                                <View style={styles.statItemWrapper}>
                                    <BlurView intensity={30} tint="light" style={styles.statItemBlur}>
                                        <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                                            {stats.duelsWon}
                                        </Text>
                                        <Text style={styles.statLabel}>Victoires</Text>
                                    </BlurView>
                                </View>

                                <View style={styles.statItemWrapper}>
                                    <BlurView intensity={30} tint="light" style={styles.statItemBlur}>
                                        <Text style={[styles.statNumber, { color: '#F44336' }]}>
                                            {stats.duelsLost}
                                        </Text>
                                        <Text style={styles.statLabel}>Défaites</Text>
                                    </BlurView>
                                </View>

                                <View style={styles.statItemWrapper}>
                                    <BlurView intensity={30} tint="light" style={styles.statItemBlur}>
                                        <Text style={[styles.statNumber, { color: '#FF9800' }]}>
                                            {stats.winRate}%
                                        </Text>
                                        <Text style={styles.statLabel}>Taux de victoire</Text>
                                    </BlurView>
                                </View>

                                <View style={styles.statItemWrapper}>
                                    <BlurView intensity={30} tint="light" style={styles.statItemBlur}>
                                        <Text style={[styles.statNumber, { color: '#9C27B0' }]}>
                                            {stats.currentStreak}
                                        </Text>
                                        <Text style={styles.statLabel}>Série actuelle</Text>
                                    </BlurView>
                                </View>

                                <View style={styles.statItemWrapper}>
                                    <BlurView intensity={30} tint="light" style={styles.statItemBlur}>
                                        <Text style={[styles.statNumber, { color: '#FF5722' }]}>
                                            {stats.bestStreak}
                                        </Text>
                                        <Text style={styles.statLabel}>Meilleure série</Text>
                                    </BlurView>
                                </View>
                            </View>
                        </BlurView>
                    </View>

                    {Object.keys(userData.completedQuizzes || {}).length > 0 && (
                        <View style={styles.recentQuizzesContainerWrapper}>
                            <BlurView intensity={50} tint="light" style={styles.recentQuizzesContainerBlur}>
                                <Text style={styles.sectionTitle}>📚 QUIZ RÉCENTS</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentQuizzesScrollContent}>
                                    <View style={styles.recentQuizzesRow}>
                                        {Object.values(userData.completedQuizzes || {})
                                            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                                            .slice(0, 5)
                                            .map((quiz, index) => (
                                                <View key={index} style={styles.recentQuizItemWrapper}>
                                                    <BlurView intensity={30} tint="light" style={styles.recentQuizItemBlur}>
                                                        <View style={[
                                                            styles.performanceIndicator,
                                                            { backgroundColor: getPerformanceColor(quiz.percentage) }
                                                        ]}>
                                                            <Text style={styles.performancePercentage}>
                                                                {quiz.percentage}%
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.recentQuizName} numberOfLines={2}>
                                                            {quiz.name}
                                                        </Text>
                                                        <Text style={styles.recentQuizScore}>
                                                            {quiz.score}/{quiz.totalPoints} pts
                                                        </Text>
                                                        <Text style={styles.recentQuizBadge}>
                                                            {quiz.percentage === 100 ? '🏆' :
                                                                quiz.percentage >= 80 ? '⭐' :
                                                                    quiz.percentage >= 70 ? '👍' : '💪'}
                                                        </Text>
                                                    </BlurView>
                                                </View>
                                            ))
                                        }
                                    </View>
                                </ScrollView>
                            </BlurView>
                        </View>
                    )}

                    {/* NOUVELLE SECTION - DUELS RÉCENTS */}
                    {stats.totalDuels > 0 && (
                        <View style={styles.recentDuelsContainerWrapper}>
                            <BlurView intensity={50} tint="light" style={styles.recentDuelsContainerBlur}>
                                <Text style={styles.sectionTitle}>⚔️ DUELS RÉCENTS</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentDuelsScrollContent}>
                                    <View style={styles.recentDuelsRow}>
                                        {(userData.duelHistory || [])
                                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                                            .slice(0, 5)
                                            .map((duel, index) => (
                                                <View key={index} style={styles.recentDuelItemWrapper}>
                                                    <BlurView intensity={30} tint="light" style={styles.recentDuelItemBlur}>
                                                        <View style={[
                                                            styles.duelResultIndicator,
                                                            {
                                                                backgroundColor:
                                                                    duel.result === 'won' ? '#4CAF50' :
                                                                        duel.result === 'lost' ? '#F44336' : '#FF9800'
                                                            }
                                                        ]}>
                                                            <Text style={styles.duelResultText}>
                                                                {duel.result === 'won' ? 'W' :
                                                                    duel.result === 'lost' ? 'L' : 'D'}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.recentDuelOpponent} numberOfLines={1}>
                                                            vs {duel.opponentName}
                                                        </Text>
                                                        <Text style={styles.recentDuelScore}>
                                                            {duel.playerScore} - {duel.opponentScore}
                                                        </Text>
                                                        <Text style={styles.recentDuelPoints}>
                                                            {duel.result === 'won' ? '+' : ''}{duel.points || 0} pts
                                                        </Text>
                                                        <Text style={styles.recentDuelBadge}>
                                                            {duel.result === 'won' ? '🏆' :
                                                                duel.result === 'lost' ? '💪' : '🤝'}
                                                        </Text>
                                                    </BlurView>
                                                </View>
                                            ))
                                        }
                                    </View>
                                </ScrollView>
                            </BlurView>
                        </View>
                    )}

                    {nextReward && (
                        <View style={styles.nextRewardContainerWrapper}>
                            <BlurView intensity={50} tint="light" style={styles.nextRewardContainerBlur}>
                                <Text style={styles.sectionTitle}>🎯 PROCHAINE RÉCOMPENSE</Text>
                                <View style={styles.nextRewardItem}>
                                    <Text style={styles.nextRewardIcon}>{nextReward.icon}</Text>
                                    <View style={styles.nextRewardInfo}>
                                        <Text style={styles.nextRewardName}>{nextReward.name}</Text>
                                        <View style={styles.progressBar}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    { width: `${nextReward.percentage}%`, backgroundColor: '#FF9800' }
                                                ]}
                                            />
                                        </View>
                                        <Text style={styles.progressText}>
                                            {nextReward.current}/{nextReward.required}
                                        </Text>
                                    </View>
                                </View>
                            </BlurView>
                        </View>
                    )}

                    <View style={styles.rewardsContainerWrapper}>
                        <BlurView intensity={50} tint="light" style={styles.rewardsContainerBlur}>
                            <Text style={styles.sectionTitle}>🏅 MÉDAILLES ({stats.medals})</Text>
                            {stats.medals > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardsScrollContent}>
                                    <View style={styles.rewardsRow}>
                                        {(userData.rewards?.medals || []).map(medalId => {
                                            const medal = Object.values(MEDALS).find(m => m.id === medalId);
                                            return medal ? (
                                                <View key={medalId} style={styles.rewardItemWrapper}>
                                                    <BlurView intensity={30} tint="light" style={styles.rewardItemBlur}>
                                                        <Text style={styles.rewardIcon}>{medal.icon}</Text>
                                                        <View style={styles.rewardInfo}>
                                                            <Text style={styles.rewardName}>{medal.name}</Text>
                                                            <Text style={styles.rewardDesc}>{medal.description}</Text>
                                                            <Text style={styles.rewardPoints}>+{medal.points} points</Text>
                                                        </View>
                                                    </BlurView>
                                                </View>
                                            ) : null;
                                        })}
                                    </View>
                                </ScrollView>
                            ) : (
                                <Text style={styles.noRewardsText}>
                                    Réussis 5 quiz avec au moins 80% dans un même thème pour débloquer ta première médaille !
                                </Text>
                            )}
                        </BlurView>
                    </View>

                    <View style={styles.rewardsContainerWrapper}>
                        <BlurView intensity={50} tint="light" style={styles.rewardsContainerBlur}>
                            <Text style={styles.sectionTitle}>🏆 COUPES ({stats.trophies})</Text>
                            {stats.trophies > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardsScrollContent}>
                                    <View style={styles.rewardsRow}>
                                        {(userData.rewards?.trophies || []).map(trophyId => {
                                            const trophy = Object.values(TROPHIES).find(t => t.id === trophyId);
                                            return trophy ? (
                                                <View key={trophyId} style={styles.rewardItemWrapper}>
                                                    <BlurView intensity={30} tint="light" style={styles.rewardItemBlur}>
                                                        <Text style={styles.rewardIcon}>{trophy.icon}</Text>
                                                        <View style={styles.rewardInfo}>
                                                            <Text style={styles.rewardName}>{trophy.name}</Text>
                                                            <Text style={styles.rewardDesc}>{trophy.description}</Text>
                                                            <Text style={styles.rewardPoints}>+{trophy.points} points</Text>
                                                        </View>
                                                    </BlurView>
                                                </View>
                                            ) : null;
                                        })}
                                    </View>
                                </ScrollView>
                            ) : (
                                <Text style={styles.noRewardsText}>
                                    Termine tous les quiz d'un thème dans une ville avec au moins 80% pour gagner une coupe !
                                </Text>
                            )}
                        </BlurView>
                    </View>

                    <View style={styles.rewardsContainerWrapper}>
                        <BlurView intensity={50} tint="light" style={styles.rewardsContainerBlur}>
                            <Text style={styles.sectionTitle}>👑 TITRES ({stats.titles})</Text>
                            {stats.titles > 0 ? (
                                <View style={styles.titlesGrid}>
                                    {(userData.rewards?.titles || []).map(titleId => {
                                        const title = Object.values(TITLES).find(t => t.id === titleId);
                                        if (!title) return null;

                                        return (
                                            <View key={titleId} style={styles.titleItemWrapper}>
                                                <BlurView intensity={30} tint="light" style={[
                                                    styles.titleItemBlur,
                                                    currentTitle?.id === titleId && styles.currentTitleItemBlur
                                                ]}>
                                                    <Text style={styles.titleItemIcon}>{title.icon}</Text>
                                                    <Text style={styles.titleItemName}>{title.name}</Text>
                                                    <View style={styles.prestigeLevel}>
                                                        {Array.from({ length: title.prestigeLevel }, (_, i) => (
                                                            <Text key={i} style={styles.prestigeStar}>⭐</Text>
                                                        ))}
                                                    </View>
                                                    {currentTitle?.id === titleId && (
                                                        <Text style={styles.currentTitleLabel}>TITRE ACTUEL</Text>
                                                    )}
                                                </BlurView>
                                            </View>
                                        );
                                    })}
                                </View>
                            ) : (
                                <Text style={styles.noRewardsText}>
                                    Accomplis des exploits extraordinaires avec 100% pour débloquer des titres prestigieux !
                                </Text>
                            )}
                        </BlurView>
                    </View>

                    <View style={styles.allRewardsContainerWrapper}>
                        <BlurView intensity={50} tint="light" style={styles.allRewardsContainerBlur}>
                            <Text style={styles.sectionTitle}>🎁 TOUTES LES RÉCOMPENSES</Text>

                            <Text style={styles.subSectionTitle}>Médailles à débloquer (80%+ requis):</Text>
                            {Object.values(MEDALS).map(medal => {
                                const isUnlocked = (userData.rewards?.medals || []).includes(medal.id);
                                return (
                                    <View key={medal.id} style={styles.availableRewardItemWrapper}>
                                        <BlurView intensity={20} tint="light" style={[
                                            styles.availableRewardItemBlur,
                                            isUnlocked && styles.unlockedRewardItemBlur
                                        ]}>
                                            <Text style={styles.availableRewardIcon}>
                                                {isUnlocked ? medal.icon : '🔒'}
                                            </Text>
                                            <View style={styles.availableRewardInfo}>
                                                <Text style={styles.rewardName}>{medal.name}</Text>
                                                <Text style={styles.rewardDesc}>{medal.description}</Text>
                                                <Text style={styles.rewardPoints}>+{medal.points} points</Text>
                                            </View>
                                        </BlurView>
                                    </View>
                                );
                            })}
                            <Text style={styles.subSectionTitle}>Coupes à débloquer (100% d'un thème requis):</Text>
                            {Object.values(TROPHIES).map(trophy => {
                                const isUnlocked = (userData.rewards?.trophies || []).includes(trophy.id);
                                return (
                                    <View key={trophy.id} style={styles.availableRewardItemWrapper}>
                                        <BlurView intensity={20} tint="light" style={[
                                            styles.availableRewardItemBlur,
                                            isUnlocked && styles.unlockedRewardItemBlur
                                        ]}>
                                            <Text style={styles.availableRewardIcon}>
                                                {isUnlocked ? trophy.icon : '🔒'}
                                            </Text>
                                            <View style={styles.availableRewardInfo}>
                                                <Text style={styles.rewardName}>{trophy.name}</Text>
                                                <Text style={styles.rewardDesc}>{trophy.description}</Text>
                                                <Text style={styles.rewardPoints}>+{trophy.points} points</Text>
                                            </View>
                                        </BlurView>
                                    </View>
                                );
                            })}
                            <Text style={styles.subSectionTitle}>Titres à débloquer (exploits spécifiques):</Text>
                            {Object.values(TITLES).map(title => {
                                const isUnlocked = (userData.rewards?.titles || []).includes(title.id);
                                return (
                                    <View key={title.id} style={styles.availableRewardItemWrapper}>
                                        <BlurView intensity={20} tint="light" style={[
                                            styles.availableRewardItemBlur,
                                            isUnlocked && styles.unlockedRewardItemBlur
                                        ]}>
                                            <Text style={styles.availableRewardIcon}>
                                                {isUnlocked ? title.icon : '🔒'}
                                            </Text>
                                            <View style={styles.availableRewardInfo}>
                                                <Text style={styles.rewardName}>{title.name}</Text>
                                                <Text style={styles.rewardDesc}>{title.description}</Text>
                                                <Text style={styles.rewardPoints}>+{title.points} points</Text>
                                            </View>
                                        </BlurView>
                                    </View>
                                );
                            })}
                        </BlurView>
                    </View>

                    <View style={styles.actionsWrapper}>
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => setIsEditModalVisible(true)}
                        >
                            <BlurView intensity={30} tint="light" style={styles.settingsButtonBlur}>
                                <Text style={styles.settingsButtonText}>Paramètres</Text>
                            </BlurView>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <BlurView intensity={30} tint="light" style={styles.logoutButtonBlur}>
                                <Text style={styles.logoutButtonText}>Déconnexion</Text>
                            </BlurView>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </SafeAreaView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isEditModalVisible}
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <BlurView intensity={50} tint="light" style={styles.modalView}>
                        <ScrollView
                            contentContainerStyle={styles.modalContentContainer}
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.modalTitle}>Modifier le Profil</Text>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Nom d'utilisateur :</Text>
                                <TextInput
                                    style={styles.input}
                                    onChangeText={setNewUsername}
                                    value={newUsername}
                                    placeholder="Entrez votre nouveau nom d'utilisateur"
                                    placeholderTextColor="rgba(74, 74, 74, 0.6)"
                                    maxLength={20}
                                />
                            </View>

                            <View style={styles.avatarSectionContainer}>
                                <Text style={styles.inputLabel}>Choisir un avatar :</Text>

                                <View style={styles.currentAvatarContainer}>
                                    <Image
                                        source={avatarImages[selectedAvatar]}
                                        style={styles.currentSelectedAvatar}
                                    />
                                    <Text style={styles.currentAvatarText}>Avatar sélectionné</Text>
                                </View>

                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.avatarHorizontalScroll}
                                >
                                    {Object.keys(avatarImages).map((avatarFileName) => (
                                        <TouchableOpacity
                                            key={avatarFileName}
                                            style={[
                                                styles.avatarOptionFlat,
                                                selectedAvatar === avatarFileName && styles.selectedAvatarOptionFlat
                                            ]}
                                            onPress={() => setSelectedAvatar(avatarFileName)}
                                        >
                                            <Image
                                                source={avatarImages[avatarFileName]}
                                                style={styles.avatarOptionImageFlat}
                                            />
                                            {selectedAvatar === avatarFileName && (
                                                <View style={styles.selectedIndicator}>
                                                    <Text style={styles.checkIcon}>✓</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                            </View>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={handleSaveProfile}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#FF9800" />
                                    ) : (
                                        <Text style={styles.buttonText}>Sauvegarder</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </BlurView>
                </View>
            </Modal>

        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 20,
        color: '#FF7043',
    },
    profileHeaderWrapper: {
        width: '100%',
        maxWidth: 400,
        minHeight: 280,
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeaderBlur: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 25,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
        alignItems: 'center',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#FFCC80',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    username: {
        fontFamily: 'Fustat-ExtraBold.ttf',
        fontSize: 30,
        color: '#FF9800',
        marginBottom: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    email: {
        fontFamily: 'Fustat-Regular.ttf',
        fontSize: 16,
        color: '#666',
        marginBottom: 15,
    },
    totalScore: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 18,
        color: '#4a4a4a',
        marginBottom: 5,
    },
    averageScore: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 18,
        color: '#4a4a4a',
    },
    titleBadgeWrapper: {
        position: 'absolute',
        bottom: 0,
        left: -10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1.5,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    titleBadgeBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 20,
    },
    titleIcon: {
        fontSize: 20,
        marginRight: 5,
    },
    titleText: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 14,
    },
    sectionTitle: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 22,
        color: '#FF7043',
        marginBottom: 20,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    statsContainerWrapper: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    statsContainerBlur: {
        flex: 1,
        width: '100%',
        height: '100%',
        padding: 20,
        borderRadius: 25,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statItemWrapper: {
        width: '48%',
        aspectRatio: 1,
        marginBottom: 15,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    statItemBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 15,
    },
    statNumber: {
        fontFamily: 'Fustat-ExtraBold.ttf',
        fontSize: 28,
        color: '#FF9800',
        marginBottom: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    statLabel: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 14,
        color: '#4a4a4a',
        textAlign: 'center',
    },

    // NOUVEAUX STYLES POUR LES DUELS
    duelRankWrapper: {
        alignItems: 'center',
        marginBottom: 20,
    },
    duelRankBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    duelRankIcon: {
        fontSize: 24,
        marginRight: 10,
    },
    duelRankText: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 18,
    },

    // Styles pour l'historique des duels récents
    recentDuelsContainerWrapper: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    recentDuelsContainerBlur: {
        flex: 1,
        width: '100%',
        height: '100%',
        padding: 20,
        borderRadius: 25,
    },
    recentDuelsScrollContent: {
        paddingRight: 10,
    },
    recentDuelsRow: {
        flexDirection: 'row',
    },
    recentDuelItemWrapper: {
        width: 140,
        height: 160,
        borderRadius: 15,
        overflow: 'hidden',
        marginRight: 15,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentDuelItemBlur: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 15,
    },
    duelResultIndicator: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginBottom: 8,
        minWidth: 30,
        alignItems: 'center',
    },
    duelResultText: {
        fontFamily: 'Fustat-Bold.ttf',
        color: '#FFFFFF',
        fontSize: 16,
    },
    recentDuelOpponent: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 14,
        color: '#4a4a4a',
        textAlign: 'center',
        marginBottom: 5,
    },
    recentDuelScore: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 16,
        color: '#FF9800',
        marginBottom: 5,
    },
    recentDuelPoints: {
        fontFamily: 'Fustat-Regular.ttf',
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    recentDuelBadge: {
        fontSize: 20,
    },

    recentQuizzesContainerWrapper: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    recentQuizzesContainerBlur: {
        flex: 1,
        width: '100%',
        height: '100%',
        padding: 20,
        borderRadius: 25,
    },
    recentQuizzesScrollContent: {
        paddingRight: 10,
    },
    recentQuizzesRow: {
        flexDirection: 'row',
    },
    recentQuizItemWrapper: {
        width: 140,
        height: 140,
        borderRadius: 15,
        overflow: 'hidden',
        marginRight: 15,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentQuizItemBlur: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 15,
    },
    performanceIndicator: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginBottom: 8,
    },
    performancePercentage: {
        fontFamily: 'Fustat-Bold.ttf',
        color: '#FFFFFF',
        fontSize: 16,
    },
    recentQuizName: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 14,
        color: '#4a4a4a',
        textAlign: 'center',
        marginBottom: 5,
    },
    recentQuizScore: {
        fontFamily: 'Fustat-Regular.ttf',
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    recentQuizBadge: {
        fontSize: 20,
    },
    nextRewardContainerWrapper: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    nextRewardContainerBlur: {
        flex: 1,
        width: '100%',
        height: '100%',
        padding: 20,
        borderRadius: 25,
    },
    nextRewardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    nextRewardIcon: {
        fontSize: 40,
        marginRight: 15,
    },
    nextRewardInfo: {
        flex: 1,
    },
    nextRewardName: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 18,
        color: '#FF7043',
        marginBottom: 5,
    },
    progressBar: {
        height: 10,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 5,
        overflow: 'hidden',
        width: '100%',
        marginBottom: 5,
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    progressText: {
        fontFamily: 'Fustat-Regular.ttf',
        fontSize: 14,
        color: '#4a4a4a',
        textAlign: 'right',
    },
    rewardsContainerWrapper: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    rewardsContainerBlur: {
        flex: 1,
        width: '100%',
        height: '100%',
        padding: 20,
        borderRadius: 25,
    },
    rewardsScrollContent: {
        paddingRight: 10,
    },
    rewardsRow: {
        flexDirection: 'row',
    },
    rewardItemWrapper: {
        width: 150,
        height: 160,
        borderRadius: 15,
        overflow: 'hidden',
        marginRight: 15,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rewardItemBlur: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 15,
    },
    rewardIcon: {
        fontSize: 40,
        marginBottom: 5,
    },
    rewardInfo: {
        alignItems: 'center',
    },
    rewardName: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 16,
        color: '#4a4a4a',
        textAlign: 'center',
        marginBottom: 3,
    },
    rewardDesc: {
        fontFamily: 'Fustat-Regular.ttf',
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 5,
    },
    rewardPoints: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 12,
        color: '#4CAF50',
    },
    noRewardsText: {
        fontFamily: 'Fustat-Regular.ttf',
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingVertical: 10,
    },
    titlesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    titleItemWrapper: {
        width: '45%',
        aspectRatio: 1,
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 15,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleItemBlur: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRadius: 15,
    },
    currentTitleItemBlur: {
        borderColor: '#FF7043',
        borderWidth: 2,
        shadowColor: '#FF7043',
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    titleItemIcon: {
        fontSize: 35,
        marginBottom: 5,
    },
    titleItemName: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 14,
        color: '#4a4a4a',
        textAlign: 'center',
        marginBottom: 5,
    },
    prestigeLevel: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    prestigeStar: {
        fontSize: 14,
        color: '#FFD700',
        marginHorizontal: 1,
    },
    currentTitleLabel: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 10,
        color: '#FF7043',
        textAlign: 'center',
    },
    allRewardsContainerWrapper: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 30,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    allRewardsContainerBlur: {
        flex: 1,
        width: '100%',
        height: '100%',
        padding: 20,
        borderRadius: 25,
    },
    subSectionTitle: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 18,
        color: '#FF9800',
        marginTop: 15,
        marginBottom: 10,
        textAlign: 'center',
    },
    availableRewardItemWrapper: {
        width: '100%',
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    availableRewardItemBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
    },
    unlockedRewardItemBlur: {
        backgroundColor: 'rgba(144, 238, 144, 0.2)',
        borderColor: 'rgba(76, 175, 80, 0.7)',
    },
    availableRewardIcon: {
        fontSize: 30,
        marginRight: 15,
    },
    availableRewardInfo: {
        flex: 1,
    },
    logoutButton: {
        width: '100%',
        maxWidth: 250,
        borderRadius: 30,
        overflow: 'hidden',
        marginTop: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    logoutButtonBlur: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutButtonText: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 18,
        color: '#FF7043',
    },
    editProfileButton: {
        position: 'absolute',
        bottom: 0,
        right: -10,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    editProfileButtonBlur: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    editProfileButtonText: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 14,
        color: '#4a4a4a',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    modalView: {
        width: '90%',
        maxHeight: '85%',
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: 'rgba(255, 240, 200, 1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 40,
        elevation: 60,
        overflow: 'hidden',
    },
    modalContentContainer: {
        padding: 30,
        paddingBottom: 60,
        alignItems: 'center',
    },
    modalTitle: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 38,
        color: '#FF7043',
        marginTop: 10,
        marginBottom: 20,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    avatarSectionContainer: {
        width: '100%',
        minHeight: 400,
        maxHeight: 450,
        marginBottom: 20,
    },
    currentAvatarContainer: {
        alignItems: 'center',
        marginBottom: 15,
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 25,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: 'rgba(0, 0, 0, 0.18)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 15,
    },
    currentSelectedAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#FF7043',
        marginBottom: 8,
    },
    currentAvatarText: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 14,
        color: '#4a4a4a',
    },
    avatarFlatListContent: {
        minHeight: 20,
    },
    avatarRowStyle: {
        justifyContent: 'space-around',
        width: '100%',
    },
    avatarOptionFlat: {
        width: 155,
        height: 155,
        borderRadius: 100,
        margin: 8,
        borderWidth: 5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedAvatarOptionFlat: {
        borderColor: '#FF7043',
        borderWidth: 3,
        transform: [{ scale: 1.1 }],
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    avatarOptionImageFlat: {
        width: 150,
        height: 150,
        borderRadius: 100,
    },
    avatarHorizontalScroll: {
        paddingVertical: 10,
        paddingHorizontal: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedIndicator: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    checkIcon: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    inputContainer: {
        width: '95%',
        marginBottom: 15,
    },
    inputLabel: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 16,
        color: '#4a4a4a',
        marginBottom: 8,
        alignSelf: 'flex-start',
        marginLeft: '5%',
    },
    input: {
        width: '100%',
        height: 65,
        paddingHorizontal: 25,
        borderRadius: 35,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        fontFamily: 'Fustat-Regular.ttf',
        fontSize: 18,
        color: '#4a4a4a',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: 'rgba(0, 0, 0, 0.18)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 15,
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: 68,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1.8,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.9)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 25,
    },
    buttonText: {
        fontSize: 26,
        fontFamily: 'Fustat-ExtraBold.ttf',
        color: '#FF9800',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    actionsWrapper: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 60,
    },
    settingsButton: {
        width: '100%',
        maxWidth: 250,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    settingsButtonBlur: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsButtonText: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 18,
        color: '#4a4a4a',
    },
});