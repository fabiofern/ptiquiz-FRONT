import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, Modal,
    Image, Animated, Dimensions, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const DuelResultsModal = ({
    visible,
    onClose,
    duelResult,
    challengerData,
    userScore,
    totalQuestions,
    timeElapsed,
    onPlayAgain,
    onBackToMap
}) => {
    const { userData } = useSelector((state) => state.user);

    // Animations
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const confettiAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;

    const [showConfetti, setShowConfetti] = useState(false);

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

    useEffect(() => {
        if (visible && duelResult) {
            // Animation d'entrée
            Animated.sequence([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                })
            ]).start();

            // Confettis si victoire
            if (isWinner()) {
                setShowConfetti(true);
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(confettiAnim, {
                            toValue: 1,
                            duration: 1000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(confettiAnim, {
                            toValue: 0,
                            duration: 1000,
                            useNativeDriver: true,
                        })
                    ]),
                    { iterations: 3 }
                ).start(() => setShowConfetti(false));
            }
        } else {
            scaleAnim.setValue(0);
            slideAnim.setValue(height);
            confettiAnim.setValue(0);
        }
    }, [visible, duelResult]);

    if (!duelResult) return null;

    const isWinner = () => {
        return duelResult.winner === userData.userID;
    };

    const getOpponentScore = () => {
        const myResults = duelResult.results[userData.userID];
        const opponentResults = Object.values(duelResult.results).find(
            result => result !== myResults
        );
        return opponentResults?.score || 0;
    };

    const getOpponentTime = () => {
        const myResults = duelResult.results[userData.userID];
        const opponentResults = Object.values(duelResult.results).find(
            result => result !== myResults
        );
        return opponentResults?.totalTime || 0;
    };

    const formatTime = (milliseconds) => {
        const seconds = Math.floor(milliseconds / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getResultMessage = () => {
        if (isWinner()) {
            const scoreDiff = userScore - getOpponentScore();
            if (scoreDiff >= 5) return "🔥 DOMINATION TOTALE !";
            if (scoreDiff >= 3) return "💪 VICTOIRE ÉCRASANTE !";
            if (scoreDiff >= 1) return "⭐ BELLE VICTOIRE !";
            return "🎯 VICTOIRE DE JUSTESSE !";
        } else if (userScore === getOpponentScore()) {
            return "🤝 MATCH NUL ÉPIQUE !";
        } else {
            const scoreDiff = getOpponentScore() - userScore;
            if (scoreDiff >= 5) return "😅 DÉFAITE CUISANTE...";
            if (scoreDiff >= 3) return "😔 DÉFAITE NETTE";
            if (scoreDiff >= 1) return "😞 DÉFAITE DE PEU";
            return "💔 DÉFAITE DE JUSTESSE";
        }
    };

    const getResultColor = () => {
        if (isWinner()) return '#4CAF50';
        if (userScore === getOpponentScore()) return '#FF9800';
        return '#F44336';
    };

    const getBonusPoints = () => {
        if (!isWinner()) return 0;
        const scoreDiff = userScore - getOpponentScore();
        if (scoreDiff >= 5) return 100;
        if (scoreDiff >= 3) return 75;
        if (scoreDiff >= 1) return 50;
        return 25;
    };

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.4)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />

                {/* Confettis */}
                {showConfetti && (
                    <View style={styles.confettiContainer}>
                        {[...Array(20)].map((_, index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.confetti,
                                    {
                                        left: Math.random() * width,
                                        animationDelay: Math.random() * 2000,
                                        transform: [{
                                            translateY: confettiAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [-50, height + 50]
                                            })
                                        }]
                                    }
                                ]}
                            />
                        ))}
                    </View>
                )}

                <Animated.View style={[
                    styles.modalContainer,
                    {
                        transform: [
                            { scale: scaleAnim },
                            { translateY: slideAnim }
                        ]
                    }
                ]}>
                    <BlurView intensity={70} tint="light" style={styles.modalView}>

                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >

                            {/* En-tête résultat */}
                            <View style={styles.resultHeaderContainer}>
                                <LinearGradient
                                    colors={isWinner()
                                        ? ['rgba(76, 175, 80, 0.3)', 'rgba(139, 195, 74, 0.2)']
                                        : userScore === getOpponentScore()
                                            ? ['rgba(255, 152, 0, 0.3)', 'rgba(255, 193, 7, 0.2)']
                                            : ['rgba(244, 67, 54, 0.3)', 'rgba(229, 57, 53, 0.2)']
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.resultHeaderGradient}
                                >
                                    <BlurView intensity={30} tint="light" style={styles.resultHeaderBlur}>
                                        <Text style={styles.duelCompleteText}>⚔️ DUEL TERMINÉ ⚔️</Text>
                                        <Text style={[styles.resultMessage, { color: getResultColor() }]}>
                                            {getResultMessage()}
                                        </Text>
                                    </BlurView>
                                </LinearGradient>
                            </View>

                            {/* Comparaison des joueurs */}
                            <View style={styles.playersComparisonContainer}>
                                <BlurView intensity={40} tint="light" style={styles.playersComparisonBlur}>

                                    {/* Joueur 1 */}
                                    <View style={[
                                        styles.playerResultSection,
                                        isWinner() && styles.winnerSection
                                    ]}>
                                        <View style={styles.playerAvatarContainer}>
                                            <Image
                                                source={avatarImages[userData.avatar] || avatarImages['avatar01.png']}
                                                style={[
                                                    styles.playerAvatar,
                                                    isWinner() && styles.winnerAvatar
                                                ]}
                                            />
                                            {isWinner() && <Text style={styles.crownIcon}>👑</Text>}
                                        </View>
                                        <Text style={styles.playerName}>{userData.username}</Text>
                                        <Text style={styles.playerRole}>
                                            {isWinner() ? '🏆 VAINQUEUR' : userScore === getOpponentScore() ? '🤝 ÉGALITÉ' : '😔 VAINCU'}
                                        </Text>
                                        <View style={styles.scoreContainer}>
                                            <Text style={[styles.score, { color: getResultColor() }]}>
                                                {userScore}/{totalQuestions}
                                            </Text>
                                            <Text style={styles.scoreLabel}>points</Text>
                                        </View>
                                        <Text style={styles.timeText}>
                                            ⏱️ {formatTime(timeElapsed)}
                                        </Text>
                                    </View>

                                    {/* VS */}
                                    <View style={styles.vsSection}>
                                        <BlurView intensity={50} tint="light" style={styles.vsBlur}>
                                            <Text style={styles.finalVsText}>VS</Text>
                                        </BlurView>
                                    </View>

                                    {/* Joueur 2 */}
                                    <View style={[
                                        styles.playerResultSection,
                                        !isWinner() && userScore !== getOpponentScore() && styles.winnerSection
                                    ]}>
                                        <View style={styles.playerAvatarContainer}>
                                            <Image
                                                source={avatarImages[challengerData?.avatar] || avatarImages['avatar01.png']}
                                                style={[
                                                    styles.playerAvatar,
                                                    (!isWinner() && userScore !== getOpponentScore()) && styles.winnerAvatar
                                                ]}
                                            />
                                            {(!isWinner() && userScore !== getOpponentScore()) && <Text style={styles.crownIcon}>👑</Text>}
                                        </View>
                                        <Text style={styles.playerName}>{challengerData?.username}</Text>
                                        <Text style={styles.playerRole}>
                                            {!isWinner() && userScore !== getOpponentScore() ? '🏆 VAINQUEUR' : userScore === getOpponentScore() ? '🤝 ÉGALITÉ' : '😔 VAINCU'}
                                        </Text>
                                        <View style={styles.scoreContainer}>
                                            <Text style={[
                                                styles.score,
                                                { color: !isWinner() && userScore !== getOpponentScore() ? '#4CAF50' : userScore === getOpponentScore() ? '#FF9800' : '#F44336' }
                                            ]}>
                                                {getOpponentScore()}/{totalQuestions}
                                            </Text>
                                            <Text style={styles.scoreLabel}>points</Text>
                                        </View>
                                        <Text style={styles.timeText}>
                                            ⏱️ {formatTime(getOpponentTime())}
                                        </Text>
                                    </View>

                                </BlurView>
                            </View>

                            {/* Statistiques détaillées */}
                            <View style={styles.statsContainer}>
                                <BlurView intensity={40} tint="light" style={styles.statsBlur}>
                                    <Text style={styles.statsTitle}>📊 STATISTIQUES</Text>

                                    <View style={styles.statRow}>
                                        <Text style={styles.statLabel}>Bonnes réponses :</Text>
                                        <Text style={styles.statValue}>{userScore}/{totalQuestions}</Text>
                                    </View>

                                    <View style={styles.statRow}>
                                        <Text style={styles.statLabel}>Pourcentage :</Text>
                                        <Text style={styles.statValue}>
                                            {Math.round((userScore / totalQuestions) * 100)}%
                                        </Text>
                                    </View>

                                    <View style={styles.statRow}>
                                        <Text style={styles.statLabel}>Temps total :</Text>
                                        <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
                                    </View>

                                    <View style={styles.statRow}>
                                        <Text style={styles.statLabel}>Temps moyen/question :</Text>
                                        <Text style={styles.statValue}>
                                            {Math.round(timeElapsed / 1000 / totalQuestions)}s
                                        </Text>
                                    </View>

                                    {isWinner() && getBonusPoints() > 0 && (
                                        <View style={styles.bonusContainer}>
                                            <LinearGradient
                                                colors={['rgba(255, 193, 7, 0.3)', 'rgba(255, 152, 0, 0.2)']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.bonusGradient}
                                            >
                                                <Text style={styles.bonusText}>
                                                    🎁 Bonus victoire : +{getBonusPoints()} points !
                                                </Text>
                                            </LinearGradient>
                                        </View>
                                    )}
                                </BlurView>
                            </View>

                            {/* Boutons d'action */}
                            <View style={styles.actionsContainer}>

                                {/* Rejouer */}
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={onPlayAgain}
                                >
                                    <LinearGradient
                                        colors={['rgba(76, 175, 80, 0.8)', 'rgba(139, 195, 74, 0.6)']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.actionButtonGradient}
                                    >
                                        <BlurView intensity={20} tint="light" style={styles.actionButtonBlur}>
                                            <Text style={styles.replayIcon}>🔄</Text>
                                            <Text style={styles.actionButtonText}>REVANCHE</Text>
                                        </BlurView>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Retour à la carte */}
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={onBackToMap}
                                >
                                    <LinearGradient
                                        colors={['rgba(255, 152, 0, 0.8)', 'rgba(255, 193, 7, 0.6)']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.actionButtonGradient}
                                    >
                                        <BlurView intensity={20} tint="light" style={styles.actionButtonBlur}>
                                            <Text style={styles.mapIcon}>🗺️</Text>
                                            <Text style={styles.actionButtonText}>RETOUR CARTE</Text>
                                        </BlurView>
                                    </LinearGradient>
                                </TouchableOpacity>

                            </View>

                        </ScrollView>

                        {/* Bouton fermer */}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <BlurView intensity={40} tint="light" style={styles.closeButtonBlur}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </BlurView>
                        </TouchableOpacity>

                    </BlurView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    modalContainer: {
        width: '94%',
        maxWidth: 440,
        maxHeight: '90%',
    },
    modalView: {
        width: '100%',
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: 'rgba(255, 240, 200, 1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 40,
        elevation: 60,
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 25,
        paddingBottom: 80,
    },
    confettiContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
    },
    confetti: {
        position: 'absolute',
        width: 10,
        height: 10,
        backgroundColor: '#FFD700',
        borderRadius: 5,
    },
    resultHeaderContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 25,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    resultHeaderGradient: {
        borderRadius: 20,
    },
    resultHeaderBlur: {
        padding: 20,
        alignItems: 'center',
        borderRadius: 20,
    },
    duelCompleteText: {
        fontFamily: 'Fustat-ExtraBold.ttf',
        fontSize: 24,
        color: '#FF7043',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    resultMessage: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 20,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    playersComparisonContainer: {
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 25,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    playersComparisonBlur: {
        padding: 20,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerResultSection: {
        flex: 1,
        alignItems: 'center',
        padding: 15,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    winnerSection: {
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.6)',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    playerAvatarContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    playerAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    winnerAvatar: {
        borderColor: '#FFD700',
        borderWidth: 4,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    },
    crownIcon: {
        position: 'absolute',
        top: -15,
        left: '50%',
        marginLeft: -12,
        fontSize: 24,
    },
    playerName: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 16,
        color: '#4a4a4a',
        marginBottom: 5,
        textAlign: 'center',
    },
    playerRole: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
    },
    scoreContainer: {
        alignItems: 'center',
        marginBottom: 5,
    },
    score: {
        fontFamily: 'Fustat-ExtraBold.ttf',
        fontSize: 24,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    scoreLabel: {
        fontFamily: 'Fustat-Regular.ttf',
        fontSize: 12,
        color: '#666',
    },
    timeText: {
        fontFamily: 'Fustat-Regular.ttf',
        fontSize: 12,
        color: '#666',
    },
    vsSection: {
        marginHorizontal: 15,
        borderRadius: 25,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    vsBlur: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 25,
        alignItems: 'center',
    },
    finalVsText: {
        fontFamily: 'Fustat-ExtraBold.ttf',
        fontSize: 16,
        color: '#FF9800',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    statsContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 25,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    statsBlur: {
        padding: 20,
        borderRadius: 20,
    },
    statsTitle: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 18,
        color: '#FF7043',
        textAlign: 'center',
        marginBottom: 15,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 5,
    },
    statLabel: {
        fontFamily: 'Fustat-Regular.ttf',
        fontSize: 16,
        color: '#4a4a4a',
    },
    statValue: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 16,
        color: '#FF9800',
    },
    bonusContainer: {
        marginTop: 15,
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 193, 7, 0.6)',
    },
    bonusGradient: {
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    bonusText: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 16,
        color: '#FF9800',
        textAlign: 'center',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
    },
    actionButton: {
        flex: 1,
        height: 65,
        marginHorizontal: 8,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    actionButtonGradient: {
        flex: 1,
        borderRadius: 32,
    },
    actionButtonBlur: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 32,
        paddingHorizontal: 15,
    },
    replayIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    mapIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    actionButtonText: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 14,
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    closeButtonBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    closeButtonText: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 18,
        color: '#666',
    },
});

export default DuelResultsModal;