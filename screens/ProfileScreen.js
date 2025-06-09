import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, SafeAreaView, Text, TouchableOpacity,
    ScrollView, Image, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useDispatch, useSelector } from 'react-redux';
import { resetUser } from '../redux/userSlice';
import { RewardsService, MEDALS, TROPHIES, TITLES } from '../services/RewardsService';
import { Modal } from 'react-native'; // si pas déjà importé
import LocationDebugComponent from '../components/LocationDebugComponent';

export default function ProfileScreen({ navigation }) {
    const URL = process.env.EXPO_PUBLIC_BACKEND_URL
    const dispatch = useDispatch();
    const { userData, isLoggedIn } = useSelector((state) => state.user);
    const [refreshKey, setRefreshKey] = useState(0);

    // 🎯 Forcer le rafraîchissement quand on focus sur l'écran
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setRefreshKey(prev => prev + 1);
        });
        return unsubscribe;
    }, [navigation]);

    if (!isLoggedIn || !userData) {
        return (
            <LinearGradient
                colors={['#eeddfd', '#d5c3f3']}
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
        'avatar1': require('../assets/avatars/avatar01.png'),
        'avatar2': require('../assets/avatars/avatar02.png'),
        'avatar3': require('../assets/avatars/avatar03.png'),
        // Ajoutez d'autres avatars selon vos besoins
    };

    // 🎯 CALCUL DU SCORE TOTAL RÉEL (points obtenus, pas total possible)
    const calculateUserTotalScore = () => {
        const completedQuizzes = userData?.completedQuizzes || {};
        return Object.values(completedQuizzes).reduce((total, quiz) => {
            return total + (quiz.score || 0);
        }, 0);
    };

    // 🎯 STATISTIQUES MISES À JOUR
    const stats = {
        totalQuizzes: Object.keys(userData.completedQuizzes || {}).length,
        perfectQuizzes: Object.values(userData.completedQuizzes || {})
            .filter(quiz => quiz.percentage === 100).length,
        excellentQuizzes: Object.values(userData.completedQuizzes || {})
            .filter(quiz => quiz.percentage >= 80 && quiz.percentage < 100).length,
        totalScore: calculateUserTotalScore(), // 🎯 Score réel obtenu
        averageScore: Object.keys(userData.completedQuizzes || {}).length > 0
            ? Math.round(Object.values(userData.completedQuizzes || {})
                .reduce((sum, quiz) => sum + (quiz.percentage || 0), 0) /
                Object.keys(userData.completedQuizzes || {}).length)
            : 0,
        unlockedQuizzes: (userData.unlockedQuizzes || []).length,
        medals: (userData.rewards?.medals || []).length,
        trophies: (userData.rewards?.trophies || []).length,
        titles: (userData.rewards?.titles || []).length
    };

    // 🎯 RANG BASÉ SUR LE SCORE ET LES PERFORMANCES
    const getUserRank = () => {
        const { perfectQuizzes, totalQuizzes, averageScore } = stats;

        if (perfectQuizzes >= 10 && averageScore >= 95) {
            return { rank: 'Maître Suprême', icon: '👑', color: '#FFD700' };
        } else if (perfectQuizzes >= 5 && averageScore >= 90) {
            return { rank: 'Expert', icon: '🏆', color: '#C0C0C0' };
        } else if (totalQuizzes >= 10 && averageScore >= 80) {
            return { rank: 'Avancé', icon: '⭐', color: '#CD7F32' };
        } else if (totalQuizzes >= 5 && averageScore >= 70) {
            return { rank: 'Intermédiaire', icon: '🌟', color: '#4CAF50' };
        } else if (totalQuizzes >= 3) {
            return { rank: 'Novice', icon: '🌱', color: '#2196F3' };
        } else {
            return { rank: 'Débutant', icon: '🎯', color: '#9E9E9E' };
        }
    };

    const userRank = getUserRank();

    // Titre actuel
    const currentTitle = RewardsService.getCurrentTitle(userData);

    // Prochaine récompense
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

    const renderRewardItem = (rewardId, rewardData, type) => (
        <View key={rewardId} style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>{rewardData.icon}</Text>
            <View style={styles.rewardInfo}>
                <Text style={styles.rewardName}>{rewardData.name}</Text>
                <Text style={styles.rewardDesc}>{rewardData.description}</Text>
                <Text style={styles.rewardPoints}>+{rewardData.points} points</Text>
            </View>
        </View>
    );

    // 🎯 PERFORMANCE PAR COULEUR
    const getPerformanceColor = (percentage) => {
        if (percentage === 100) return '#4CAF50'; // Vert
        if (percentage >= 80) return '#FF9800'; // Orange
        if (percentage >= 70) return '#2196F3'; // Bleu
        return '#F44336'; // Rouge
    };

    return (
        <LinearGradient
            colors={['#eeddfd', '#d5c3f3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                    {/* 🎯 EN-TÊTE PROFIL AMÉLIORÉ */}
                    <BlurView intensity={50} style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={avatarImages[userData.avatar] || avatarImages['avatar1']}
                                style={styles.avatar}
                            />

                            {/* 🎯 Badge de rang */}
                            <View style={[styles.rankBadge, { backgroundColor: userRank.color + '20' }]}>
                                <Text style={styles.rankIcon}>{userRank.icon}</Text>
                                <Text style={[styles.rankText, { color: userRank.color }]}>
                                    {userRank.rank}
                                </Text>
                            </View>

                            {/* Titre actuel */}
                            {currentTitle && (
                                <View style={styles.titleBadge}>
                                    <Text style={styles.titleIcon}>{currentTitle.icon}</Text>
                                    <Text style={styles.titleText}>{currentTitle.name}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.username}>{userData.username}</Text>
                        <Text style={styles.email}>{userData.email}</Text>
                        <Text style={styles.totalScore}>🏆 {stats.totalScore} points obtenus</Text>
                        <Text style={styles.averageScore}>📊 Moyenne: {stats.averageScore}%</Text>
                    </BlurView>

                    {/* 🎯 STATISTIQUES DÉTAILLÉES */}
                    <BlurView intensity={50} style={styles.statsContainer}>
                        <Text style={styles.sectionTitle}>📊 STATISTIQUES DÉTAILLÉES</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.totalQuizzes}</Text>
                                <Text style={styles.statLabel}>Quiz terminés</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
                                    {stats.perfectQuizzes}
                                </Text>
                                <Text style={styles.statLabel}>Quiz parfaits (100%)</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statNumber, { color: '#FF9800' }]}>
                                    {stats.excellentQuizzes}
                                </Text>
                                <Text style={styles.statLabel}>Quiz excellents (80-99%)</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statNumber, { color: '#2196F3' }]}>
                                    {stats.averageScore}%
                                </Text>
                                <Text style={styles.statLabel}>Score moyen</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.unlockedQuizzes}</Text>
                                <Text style={styles.statLabel}>Quiz débloqués</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={[styles.statNumber, { color: '#9C27B0' }]}>
                                    {stats.medals + stats.trophies + stats.titles}
                                </Text>
                                <Text style={styles.statLabel}>Récompenses</Text>
                            </View>
                        </View>
                    </BlurView>

                    {/* 🎯 HISTORIQUE DES QUIZ RÉCENTS */}
                    {Object.keys(userData.completedQuizzes || {}).length > 0 && (
                        <BlurView intensity={50} style={styles.recentQuizzesContainer}>
                            <Text style={styles.sectionTitle}>📚 QUIZ RÉCENTS</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.recentQuizzesRow}>
                                    {Object.values(userData.completedQuizzes || {})
                                        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                                        .slice(0, 5)
                                        .map((quiz, index) => (
                                            <View key={index} style={styles.recentQuizItem}>
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
                                            </View>
                                        ))
                                    }
                                </View>
                            </ScrollView>
                        </BlurView>
                    )}

                    {/* Prochaine récompense */}
                    {nextReward && (
                        <BlurView intensity={50} style={styles.nextRewardContainer}>
                            <Text style={styles.sectionTitle}>🎯 PROCHAINE RÉCOMPENSE</Text>
                            <View style={styles.nextRewardItem}>
                                <Text style={styles.nextRewardIcon}>{nextReward.icon}</Text>
                                <View style={styles.nextRewardInfo}>
                                    <Text style={styles.nextRewardName}>{nextReward.name}</Text>
                                    <View style={styles.progressBar}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                { width: `${nextReward.percentage}%` }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>
                                        {nextReward.current}/{nextReward.required}
                                    </Text>
                                </View>
                            </View>
                        </BlurView>
                    )}

                    {/* 🏅 MÉDAILLES */}
                    <BlurView intensity={50} style={styles.rewardsContainer}>
                        <Text style={styles.sectionTitle}>🏅 MÉDAILLES ({stats.medals})</Text>
                        {stats.medals > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.rewardsRow}>
                                    {(userData.rewards?.medals || []).map(medalId => {
                                        const medal = Object.values(MEDALS).find(m => m.id === medalId);
                                        return medal ? renderRewardItem(medalId, medal, 'medal') : null;
                                    })}
                                </View>
                            </ScrollView>
                        ) : (
                            <Text style={styles.noRewardsText}>
                                Réussis 5 quiz avec au moins 80% dans un même thème pour débloquer ta première médaille !
                            </Text>
                        )}
                    </BlurView>

                    {/* 🏆 COUPES */}
                    <BlurView intensity={50} style={styles.rewardsContainer}>
                        <Text style={styles.sectionTitle}>🏆 COUPES ({stats.trophies})</Text>
                        {stats.trophies > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.rewardsRow}>
                                    {(userData.rewards?.trophies || []).map(trophyId => {
                                        const trophy = Object.values(TROPHIES).find(t => t.id === trophyId);
                                        return trophy ? renderRewardItem(trophyId, trophy, 'trophy') : null;
                                    })}
                                </View>
                            </ScrollView>
                        ) : (
                            <Text style={styles.noRewardsText}>
                                Termine tous les quiz d'un thème dans une ville avec au moins 80% pour gagner une coupe !
                            </Text>
                        )}
                    </BlurView>

                    {/* 👑 TITRES */}
                    <BlurView intensity={50} style={styles.rewardsContainer}>
                        <Text style={styles.sectionTitle}>👑 TITRES ({stats.titles})</Text>
                        {stats.titles > 0 ? (
                            <View style={styles.titlesGrid}>
                                {(userData.rewards?.titles || []).map(titleId => {
                                    const title = Object.values(TITLES).find(t => t.id === titleId);
                                    if (!title) return null;

                                    return (
                                        <View key={titleId} style={[
                                            styles.titleItem,
                                            currentTitle?.id === titleId && styles.currentTitleItem
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

                    {/* Toutes les récompenses disponibles */}
                    <BlurView intensity={50} style={styles.allRewardsContainer}>
                        <Text style={styles.sectionTitle}>🎁 TOUTES LES RÉCOMPENSES</Text>

                        {/* Médailles disponibles */}
                        <Text style={styles.subSectionTitle}>Médailles à débloquer (80%+ requis):</Text>
                        {Object.values(MEDALS).map(medal => {
                            const isUnlocked = (userData.rewards?.medals || []).includes(medal.id);
                            return (
                                <View key={medal.id} style={[
                                    styles.availableRewardItem,
                                    isUnlocked && styles.unlockedRewardItem
                                ]}>
                                    <Text style={styles.availableRewardIcon}>
                                        {isUnlocked ? medal.icon : '🔒'}
                                    </Text>
                                    <View style={styles.availableRewardInfo}>
                                        <Text style={[
                                            styles.availableRewardName,
                                            isUnlocked && styles.unlockedRewardName
                                        ]}>
                                            {medal.name}
                                        </Text>
                                        <Text style={styles.availableRewardDesc}>
                                            {medal.description}
                                        </Text>
                                    </View>
                                    {isUnlocked && (
                                        <Text style={styles.unlockedBadge}>✅</Text>
                                    )}
                                </View>
                            );
                        })}

                        {/* Coupes disponibles */}
                        <Text style={styles.subSectionTitle}>Coupes à débloquer (80%+ requis):</Text>
                        {Object.values(TROPHIES).map(trophy => {
                            const isUnlocked = (userData.rewards?.trophies || []).includes(trophy.id);
                            return (
                                <View key={trophy.id} style={[
                                    styles.availableRewardItem,
                                    isUnlocked && styles.unlockedRewardItem
                                ]}>
                                    <Text style={styles.availableRewardIcon}>
                                        {isUnlocked ? trophy.icon : '🔒'}
                                    </Text>
                                    <View style={styles.availableRewardInfo}>
                                        <Text style={[
                                            styles.availableRewardName,
                                            isUnlocked && styles.unlockedRewardName
                                        ]}>
                                            {trophy.name}
                                        </Text>
                                        <Text style={styles.availableRewardDesc}>
                                            {trophy.description}
                                        </Text>
                                    </View>
                                    {isUnlocked && (
                                        <Text style={styles.unlockedBadge}>✅</Text>
                                    )}
                                </View>
                            );
                        })}

                        {/* Titres disponibles */}
                        <Text style={styles.subSectionTitle}>Titres à débloquer (100% requis):</Text>
                        {Object.values(TITLES).map(title => {
                            const isUnlocked = (userData.rewards?.titles || []).includes(title.id);
                            return (
                                <View key={title.id} style={[
                                    styles.availableRewardItem,
                                    isUnlocked && styles.unlockedRewardItem
                                ]}>
                                    <Text style={styles.availableRewardIcon}>
                                        {isUnlocked ? title.icon : '🔒'}
                                    </Text>
                                    <View style={styles.availableRewardInfo}>
                                        <Text style={[
                                            styles.availableRewardName,
                                            isUnlocked && styles.unlockedRewardName
                                        ]}>
                                            {title.name}
                                        </Text>
                                        <Text style={styles.availableRewardDesc}>
                                            {title.description}
                                        </Text>
                                        <View style={styles.prestigeLevel}>
                                            {Array.from({ length: title.prestigeLevel }, (_, i) => (
                                                <Text key={i} style={styles.prestigeStar}>⭐</Text>
                                            ))}
                                        </View>
                                    </View>
                                    {isUnlocked && (
                                        <Text style={styles.unlockedBadge}>✅</Text>
                                    )}
                                </View>
                            );
                        })}
                    </BlurView>
                    {/* BOUTON DEBUG - UNIQUEMENT EN DÉVELOPPEMENT */}
                    {__DEV__ && (
                        <TouchableOpacity
                            style={styles.debugButton}
                            onPress={() => setShowDebugModal(true)}
                        >
                            <Text style={styles.debugButtonText}>🔧 Debug Géolocalisation</Text>
                        </TouchableOpacity>
                    )}
                    {/* Bouton déconnexion */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Déconnexion</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    errorText: {
        fontSize: 18,
        color: '#ff6b6b',
        textAlign: 'center',
        fontWeight: '600',
    },

    // En-tête profil
    profileHeader: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#fb7a68',
    },
    rankBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    rankIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    rankText: {
        fontSize: 14,
        fontWeight: '700',
    },
    titleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 122, 104, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginTop: 5,
    },
    titleIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    titleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fb7a68',
    },
    username: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2c1d53',
        marginBottom: 5,
    },
    email: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    totalScore: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fb7a68',
        marginBottom: 5,
    },
    averageScore: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4a3b79',
    },

    // Quiz récents
    recentQuizzesContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    recentQuizzesRow: {
        flexDirection: 'row',
        paddingHorizontal: 5,
    },
    recentQuizItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 15,
        padding: 15,
        marginRight: 15,
        alignItems: 'center',
        minWidth: 120,
    },
    performanceIndicator: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    performancePercentage: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    recentQuizName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2c1d53',
        textAlign: 'center',
        marginBottom: 5,
    },
    recentQuizScore: {
        fontSize: 11,
        color: '#666',
        marginBottom: 5,
    },
    recentQuizBadge: {
        fontSize: 16,
    },

    // Statistiques
    statsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2c1d53',
        marginBottom: 15,
        textAlign: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statItem: {
        width: '48%',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        marginBottom: 10,
    },
    statNumber: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fb7a68',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        fontWeight: '500',
    },

    // Prochaine récompense
    nextRewardContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    nextRewardItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextRewardIcon: {
        fontSize: 30,
        marginRight: 15,
    },
    nextRewardInfo: {
        flex: 1,
    },
    nextRewardName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c1d53',
        marginBottom: 10,
    },
    progressBar: {
        height: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 4,
        marginBottom: 5,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fb7a68',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
    },

    // Récompenses
    rewardsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    rewardsRow: {
        flexDirection: 'row',
        paddingHorizontal: 5,
    },
    rewardItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 15,
        padding: 15,
        marginRight: 15,
        alignItems: 'center',
        minWidth: 140,
    },
    rewardIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    rewardInfo: {
        alignItems: 'center',
    },
    rewardName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2c1d53',
        textAlign: 'center',
        marginBottom: 5,
    },
    rewardDesc: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 5,
        lineHeight: 16,
    },
    rewardPoints: {
        fontSize: 12,
        color: '#fb7a68',
        fontWeight: '600',
    },
    noRewardsText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 20,
    },

    // Titres
    titlesGrid: {
        gap: 10,
    },
    titleItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    currentTitleItem: {
        borderColor: '#fb7a68',
        backgroundColor: 'rgba(251, 122, 104, 0.1)',
    },
    titleItemIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    titleItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c1d53',
        marginBottom: 5,
    },
    prestigeLevel: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    prestigeStar: {
        fontSize: 12,
    },
    currentTitleLabel: {
        fontSize: 10,
        color: '#fb7a68',
        fontWeight: '700',
        backgroundColor: 'rgba(251, 122, 104, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },

    // Toutes les récompenses
    allRewardsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    subSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4a3b79',
        marginTop: 15,
        marginBottom: 10,
    },
    availableRewardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    unlockedRewardItem: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderColor: '#4CAF50',
        borderWidth: 1,
    },
    availableRewardIcon: {
        fontSize: 24,
        marginRight: 12,
        width: 30,
        textAlign: 'center',
    },
    availableRewardInfo: {
        flex: 1,
    },
    availableRewardName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 2,
    },
    unlockedRewardName: {
        color: '#2c1d53',
    },
    availableRewardDesc: {
        fontSize: 12,
        color: '#888',
        lineHeight: 16,
    },
    unlockedBadge: {
        fontSize: 20,
        marginLeft: 10,
    },

    // Bouton déconnexion
    logoutButton: {
        backgroundColor: '#ff6b6b',
        borderRadius: 15,
        padding: 15,
        alignItems: 'center',
        marginTop: 20,
    },
    logoutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});