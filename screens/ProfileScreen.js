import React, { useState, useEffect, useRef } from 'react'; // Ajout de useRef
import { // Ajout de Dimensions et Animated
    StyleSheet, View, SafeAreaView, Text, TouchableOpacity,
    ScrollView, Image, Alert, ActivityIndicator, Dimensions, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useDispatch, useSelector } from 'react-redux';
import { resetUser } from '../redux/userSlice';
import { RewardsService, MEDALS, TROPHIES, TITLES } from '../services/RewardsService';
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
// import { Modal } from 'react-native'; // Modal est déjà importé via React Native.
// import LocationDebugComponent from '../components/LocationDebugComponent'; // Ce composant n'est pas fourni

SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('window'); // Dimensions de l'écran

// --- NOUVEAU COMPOSANT : FOND DYNAMIQUE "AURORA" ---
const AuroraBackground = () => {
    // État pour savoir si les animations sont initialisées
    const [isReady, setIsReady] = useState(false);

    // Initialisation des valeurs animées dans un useRef qui s'exécute une seule fois
    const blobs = useRef([]);

    // Initialiser les Animated.Value une seule fois après le premier rendu
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

            // Démarrer les animations immédiatement après l'initialisation
            blobs.current.forEach(blob => {
                const animateBlob = () => {
                    Animated.loop(
                        Animated.parallel([
                            Animated.timing(blob.translateX, {
                                toValue: Math.random() * width,
                                duration: blob.duration,
                                useNativeDriver: true,
                            }),
                            Animated.timing(blob.translateY, {
                                toValue: Math.random() * height,
                                duration: blob.duration,
                                useNativeDriver: true,
                            }),
                            Animated.timing(blob.scale, {
                                toValue: 0.8 + Math.random() * 0.7,
                                duration: blob.duration,
                                useNativeDriver: true,
                            }),
                            Animated.timing(blob.opacity, {
                                toValue: 0.2 + Math.random() * 0.3,
                                duration: blob.duration,
                                useNativeDriver: true,
                            }),
                        ])
                    ).start();
                };
                animateBlob();
            });
        }
    }, [isReady]); // Déclencher une seule fois


    // Couleurs de la palette "Rayon de Soleil" avec opacité faible
    const auroraColors = [
        'rgba(255, 152, 0, 0.2)',
        'rgba(255, 112, 67, 0.2)',
        'rgba(255, 204, 128, 0.2)',
        'rgba(255, 240, 200, 0.2)',
        'rgba(255, 224, 178, 0.2)',
    ];

    if (!isReady) {
        return null; // Ne rien rendre tant que les animations ne sont pas prêtes
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
// --- FIN DU COMPOSANT FOND DYNAMIQUE "AURORA" ---


export default function ProfileScreen({ navigation }) {
    const URL = process.env.EXPO_PUBLIC_BACKEND_URL
    const dispatch = useDispatch();
    const { userData, isLoggedIn } = useSelector((state) => state.user);
    const [refreshKey, setRefreshKey] = useState(0);

    // Chargement des polices (assurez-vous que tous les fichiers sont dans assets/fonts)
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

    // Force le rafraîchissement quand on focus sur l'écran
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setRefreshKey(prev => prev + 1);
        });
        return unsubscribe;
    }, [navigation]);

    // Si les polices ne sont pas encore chargées ou non connecté, ne rien rendre ou afficher un message simple
    if (!loaded) {
        return null;
    }

    if (!isLoggedIn || !userData) {
        return (
            <LinearGradient
                // Dégradé de couleurs pour le fond : Rayon de Soleil
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


    // CALCUL DU SCORE TOTAL RÉEL (points obtenus, pas total possible)
    const calculateUserTotalScore = () => {
        const completedQuizzes = userData?.completedQuizzes || {};
        return Object.values(completedQuizzes).reduce((total, quiz) => {
            return total + (quiz.score || 0);
        }, 0);
    };

    // STATISTIQUES MISES À JOUR
    const stats = {
        totalQuizzes: Object.keys(userData.completedQuizzes || {}).length,
        perfectQuizzes: Object.values(userData.completedQuizzes || {})
            .filter(quiz => quiz.percentage === 100).length,
        excellentQuizzes: Object.values(userData.completedQuizzes || {})
            .filter(quiz => quiz.percentage >= 80 && quiz.percentage < 100).length,
        totalScore: calculateUserTotalScore(), // Score réel obtenu
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

    // RANG BASÉ SUR LE SCORE ET LES PERFORMANCES
    const getUserRank = () => {
        const { perfectQuizzes, totalQuizzes, averageScore } = stats;

        if (perfectQuizzes >= 10 && averageScore >= 95) {
            return { rank: 'Maître Suprême', icon: '👑', color: '#FFD700' }; // Or
        } else if (perfectQuizzes >= 5 && averageScore >= 90) {
            return { rank: 'Expert', icon: '🏆', color: '#C0C0C0' }; // Argent
        } else if (totalQuizzes >= 10 && averageScore >= 80) {
            return { rank: 'Avancé', icon: '⭐', color: '#CD7F32' }; // Bronze
        } else if (totalQuizzes >= 5 && averageScore >= 70) {
            return { rank: 'Intermédiaire', icon: '🌟', color: '#FF9800' }; // Orange vibrant
        } else if (totalQuizzes >= 3) {
            return { rank: 'Novice', icon: '🌱', color: '#4CAF50' }; // Vert
        } else {
            return { rank: 'Débutant', icon: '🎯', color: '#9E9E9E' }; // Gris
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

    // Cette fonction ne devrait pas être un composant React
    // Elle renvoie une View stylisée pour être utilisée dans la ScrollView
    const renderRewardItem = (rewardId, rewardData, type) => (
        <View key={rewardId} style={styles.rewardItemInner}> {/* Modifié pour le style interne */}
            <Text style={styles.rewardIcon}>{rewardData.icon}</Text>
            <View style={styles.rewardInfo}>
                <Text style={styles.rewardName}>{rewardData.name}</Text>
                <Text style={styles.rewardDesc}>{rewardData.description}</Text>
                <Text style={styles.rewardPoints}>+{rewardData.points} points</Text>
            </View>
        </View>
    );


    // PERFORMANCE PAR COULEUR
    const getPerformanceColor = (percentage) => {
        if (percentage === 100) return '#4CAF50'; // Vert (Parfait)
        if (percentage >= 80) return '#FF9800'; // Orange (Excellent)
        if (percentage >= 70) return '#64B5F6'; // Bleu (Bon) - Couleur de la palette Rayon de Soleil
        return '#F44336'; // Rouge (Besoin d'amélioration)
    };

    return (
        <LinearGradient
            // Dégradé de couleurs pour le fond : Rayon de Soleil
            colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Le fond dynamique Aurora est ici, derrière le reste du contenu */}
            <AuroraBackground />

            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                    {/* EN-TÊTE PROFIL AMÉLIORÉ (Liquid Glass Wrapper) */}
                    <View style={styles.profileHeaderWrapper}>
                        <BlurView intensity={50} tint="light" style={styles.profileHeaderBlur}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={avatarImages[userData.avatar] || avatarImages['avatar01.png']}
                                    style={styles.avatar}
                                />

                                {/* Badge de rang (Liquid Glass Wrapper) */}
                                {/* <View style={[styles.rankBadgeWrapper, { backgroundColor: userRank.color + '30', borderColor: userRank.color + '80' }]}>
                                    <BlurView intensity={30} tint="light" style={styles.rankBadgeBlur}>
                                        <Text style={[styles.rankIcon, { color: userRank.color }]}>{userRank.icon}</Text>
                                        <Text style={[styles.rankText, { color: userRank.color }]}>
                                            {userRank.rank}
                                        </Text>
                                    </BlurView>
                                </View> */}

                                {/* Titre actuel (Liquid Glass Wrapper) */}
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
                            <Text style={styles.totalScore}>🏆 {stats.totalScore} points obtenus</Text>
                            <Text style={styles.averageScore}>📊 Moyenne: {stats.averageScore}%</Text>
                        </BlurView>
                    </View>

                    {/* STATISTIQUES DÉTAILLÉES (Liquid Glass Wrapper) */}
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
                                        <Text style={[styles.statNumber, { color: '#FF7043' }]}> {/* Couleur Rayon de Soleil */}
                                            {stats.medals + stats.trophies + stats.titles}
                                        </Text>
                                        <Text style={styles.statLabel}>Récompenses</Text>
                                    </BlurView>
                                </View>
                            </View>
                        </BlurView>
                    </View>

                    {/* HISTORIQUE DES QUIZ RÉCENTS (Liquid Glass Wrapper) */}
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

                    {/* Prochaine récompense (Liquid Glass Wrapper) */}
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
                                                    { width: `${nextReward.percentage}%`, backgroundColor: '#FF9800' } // Couleur de la palette
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

                    {/* MÉDAILLES (Liquid Glass Wrapper) */}
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

                    {/* COUPES (Liquid Glass Wrapper) */}
                    <View style={styles.rewardsContainerWrapper}> {/* Réutilise le wrapper car même style */}
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

                    {/* TITRES (Liquid Glass Wrapper) */}
                    <View style={styles.rewardsContainerWrapper}> {/* Réutilise le wrapper */}
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

                    {/* Toutes les récompenses disponibles (Liquid Glass Wrapper) */}
                    <View style={styles.allRewardsContainerWrapper}>
                        <BlurView intensity={50} tint="light" style={styles.allRewardsContainerBlur}>
                            <Text style={styles.sectionTitle}>🎁 TOUTES LES RÉCOMPENSES</Text>

                            {/* Médailles disponibles */}
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
                                        </BlurView>
                                    </View>
                                );
                            })}

                            {/* Coupes disponibles */}
                            <Text style={styles.subSectionTitle}>Coupes à débloquer (80%+ requis):</Text>
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
                                        </BlurView>
                                    </View>
                                );
                            })}

                            {/* Titres disponibles */}
                            <Text style={styles.subSectionTitle}>Titres à débloquer (100% requis):</Text>
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
                                        </BlurView>
                                    </View>
                                );
                            })}
                        </BlurView>
                    </View>
                    <TouchableOpacity style={styles.logoutButtonWrapper} onPress={handleLogout}>
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
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#FF7043',
        textAlign: 'center',
    },

    // En-tête profil (Wrapper)
    profileHeaderWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 30,
        elevation: 40,
    },
    profileHeaderBlur: {
        flex: 1, // S'assure que BlurView remplit le wrapper
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Très transparent
        padding: 20,
        alignItems: 'center',
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
        borderColor: '#FF9800',
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    // Badge de rang (Wrapper)
    rankBadgeWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginTop: 8,
        borderWidth: 1.5,
        shadowColor: 'rgba(255, 255, 255, 0.5)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 5,
        overflow: 'hidden', // Ajout ici
    },
    rankBadgeBlur: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)', // Couleur de fond via JS
    },
    rankIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    rankText: {
        fontSize: 14,
        fontFamily: "Fustat-ExtraBold.ttf",
    },
    // Titre actuel (Wrapper)
    titleBadgeWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginTop: 5,
        borderWidth: 1.5,
        shadowColor: 'rgba(255, 255, 255, 0.5)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 5,
        overflow: 'hidden', // Ajout ici
    },
    titleBadgeBlur: {
        flex: 1,
        backgroundColor: 'rgba(255, 112, 67, 0.2)', // Couleur de fond via JS
    },
    titleIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    titleText: {
        fontSize: 14,
        fontFamily: "Fustat-SemiBold.ttf",
    },
    username: {
        fontSize: 28,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF7043',
        marginBottom: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    email: {
        fontSize: 16,
        fontFamily: "Fustat-Regular.ttf",
        color: '#4a4a4a',
        marginBottom: 8,
    },
    totalScore: {
        fontSize: 20,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#FF9800',
        marginBottom: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.05)',
        textShadowOffset: { width: 0.5, height: 0.5 },
        textShadowRadius: 1,
    },
    averageScore: {
        fontSize: 16,
        fontFamily: "Fustat-Regular.ttf",
        color: '#4a4a4a',
    },

    // Quiz récents (Wrapper)
    recentQuizzesContainerWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.8)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 20,
    },
    recentQuizzesContainerBlur: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 15,
    },
    recentQuizzesScrollContent: {
        paddingHorizontal: 5,
    },
    recentQuizzesRow: {
        flexDirection: 'row',
    },
    // Item de quiz récent (Wrapper)
    recentQuizItemWrapper: {
        borderRadius: 15,
        marginRight: 15,
        minWidth: 130,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
        overflow: 'hidden', // Ajout ici
    },
    recentQuizItemBlur: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        padding: 15,
        alignItems: 'center',
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
        fontFamily: 'Fustat-ExtraBold.ttf',
        fontSize: 14,
    },
    recentQuizName: {
        fontSize: 13,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#4a4a4a',
        textAlign: 'center',
        marginBottom: 5,
    },
    recentQuizScore: {
        fontSize: 11,
        fontFamily: "Fustat-Regular.ttf",
        color: '#666',
        marginBottom: 5,
    },
    recentQuizBadge: {
        fontSize: 18,
    },

    // Statistiques (Wrapper)
    statsContainerWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.8)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 20,
    },
    statsContainerBlur: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF7043',
        marginBottom: 15,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        gap: 10,
    },
    // Item de statistique (Wrapper)
    statItemWrapper: {
        width: '47%',
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
        overflow: 'hidden', // Ajout ici
    },
    statItemBlur: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        padding: 15,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 30,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF9800',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 13,
        fontFamily: "Fustat-Regular.ttf",
        color: '#4a4a4a',
        textAlign: 'center',
    },

    // Prochaine récompense (Wrapper)
    nextRewardContainerWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.8)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 20,
    },
    nextRewardContainerBlur: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20,
    },
    nextRewardItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextRewardIcon: {
        fontSize: 35,
        marginRight: 15,
    },
    nextRewardInfo: {
        flex: 1,
    },
    nextRewardName: {
        fontSize: 18,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#FF7043',
        marginBottom: 10,
    },
    progressBar: {
        height: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 5,
        marginBottom: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    progressText: {
        fontSize: 13,
        fontFamily: "Fustat-Regular.ttf",
        color: '#4a4a4a',
        textAlign: 'right',
    },

    // Conteneurs de récompenses (Médailles, Coupes, Titres) (Wrapper)
    rewardsContainerWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.8)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 20,
    },
    rewardsContainerBlur: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20,
    },
    rewardsScrollContent: {
        paddingHorizontal: 5,
    },
    rewardsRow: {
        flexDirection: 'row',
    },
    // Item de récompense (Wrapper)
    rewardItemWrapper: {
        borderRadius: 15,
        marginRight: 15,
        minWidth: 150,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
        overflow: 'hidden', // Ajout ici
    },
    rewardItemBlur: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        padding: 15,
        alignItems: 'center',
    },
    rewardIcon: {
        fontSize: 45,
        marginBottom: 10,
    },
    rewardInfo: {
        alignItems: 'center',
    },
    rewardName: {
        fontSize: 16,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#4a4a4a',
        textAlign: 'center',
        marginBottom: 5,
    },
    rewardDesc: {
        fontSize: 12,
        fontFamily: "Fustat-Regular.ttf",
        color: '#666',
        textAlign: 'center',
        marginBottom: 5,
        lineHeight: 16,
    },
    rewardPoints: {
        fontSize: 13,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#FF9800',
    },
    noRewardsText: {
        fontSize: 14,
        fontFamily: "Fustat-Regular.ttf",
        color: '#4a4a4a',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 20,
    },

    // Titres (grille)
    titlesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        gap: 15,
    },
    // Item de titre (Wrapper)
    titleItemWrapper: {
        borderRadius: 15,
        width: '47%',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
        overflow: 'hidden', // Ajout ici
    },
    titleItemBlur: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        padding: 15,
        alignItems: 'center',
    },
    currentTitleItemBlur: { // Appliqué au BlurView interne
        borderColor: '#FF7043',
        shadowColor: '#FF7043',
        shadowRadius: 15,
        elevation: 15,
    },
    titleItemIcon: {
        fontSize: 35,
        marginBottom: 5,
    },
    titleItemName: {
        fontSize: 15,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#4a4a4a',
        textAlign: 'center',
        marginBottom: 5,
    },
    prestigeLevel: {
        flexDirection: 'row',
        marginTop: 5,
    },
    prestigeStar: {
        fontSize: 14,
        marginHorizontal: 1,
    },
    currentTitleLabel: {
        fontSize: 10,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF7043',
        marginTop: 5,
    },

    // Toutes les récompenses disponibles (Wrapper)
    allRewardsContainerWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.8)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 20,
    },
    allRewardsContainerBlur: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 20,
    },
    subSectionTitle: {
        fontSize: 16,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#FF9800',
        marginTop: 15,
        marginBottom: 10,
        textAlign: 'left',
    },
    // Item de récompense disponible (Wrapper)
    availableRewardItemWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 15,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: 'rgba(0, 0, 0, 0.05)',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        overflow: 'hidden', // Ajout ici
    },
    availableRewardItemBlur: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        flexDirection: 'row', // Pour que le contenu soit flex
        alignItems: 'center',
        paddingRight: 10, // Pour éviter que l'icône de badge ne soit coupée
    },
    unlockedRewardItemBlur: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderColor: 'rgba(255, 240, 200, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.5)',
        shadowRadius: 10,
        elevation: 8,
    },
    availableRewardIcon: {
        fontSize: 28,
        marginRight: 10,
    },
    availableRewardInfo: {
        flex: 1,
    },
    availableRewardName: {
        fontSize: 14,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#4a4a4a',
    },
    unlockedRewardName: {
        color: '#FF7043',
    },
    availableRewardDesc: {
        fontSize: 12,
        fontFamily: "Fustat-Regular.ttf",
        color: '#666',
    },
    unlockedBadge: {
        fontSize: 20,
        marginLeft: 10,
    },

    // Bouton de déconnexion (Wrapper)
    logoutButtonWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%',
        height: 60,
        borderRadius: 30,
        marginTop: 10,
        marginBottom: 50,
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1.8,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.9)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 25,
        overflow: 'hidden', // Ajout ici
    },
    logoutText: {
        fontSize: 20,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF7043',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },

    // Bouton Debug (Wrapper)
    debugButtonWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%',
        height: 60,
        borderRadius: 30,
        marginTop: 20,
        alignSelf: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1.8,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.9)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 25,
        overflow: 'hidden', // Ajout ici
    },
    debugButtonText: {
        fontSize: 20,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#64B5F6',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
});
