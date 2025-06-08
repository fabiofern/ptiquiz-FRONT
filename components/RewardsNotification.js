// components/RewardsNotification.js
import React, { useState, useEffect } from 'react';
import {
    View, Text, Modal, TouchableOpacity, StyleSheet,
    Animated, Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const RewardsNotification = ({ visible, rewards, onClose }) => {
    const [currentRewardIndex, setCurrentRewardIndex] = useState(0);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.5));

    useEffect(() => {
        if (visible && rewards.length > 0) {
            setCurrentRewardIndex(0);
            startAnimation();
        }
    }, [visible, rewards]);

    const startAnimation = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const showNextReward = () => {
        if (currentRewardIndex < rewards.length - 1) {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.5,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            setCurrentRewardIndex(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.5,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.5);
            onClose();
        });
    };

    if (!visible || !rewards || rewards.length === 0) {
        return null;
    }

    const currentReward = rewards[currentRewardIndex];
    const isLastReward = currentRewardIndex === rewards.length - 1;

    // Déterminer le type de récompense pour l'animation
    const getRewardTypeStyle = () => {
        if (currentReward.prestigeLevel) {
            // C'est un titre
            return {
                backgroundColor: 'rgba(255, 215, 0, 0.9)', // Or
                borderColor: '#FFD700',
            };
        } else if (currentReward.requirement?.allCompleted) {
            // C'est une coupe
            return {
                backgroundColor: 'rgba(192, 192, 192, 0.9)', // Argent
                borderColor: '#C0C0C0',
            };
        } else {
            // C'est une médaille
            return {
                backgroundColor: 'rgba(205, 127, 50, 0.9)', // Bronze
                borderColor: '#CD7F32',
            };
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={handleClose}
        >
            <BlurView intensity={80} style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* Effet de confettis */}
                    <View style={styles.confetti}>
                        <Text style={styles.confettiEmoji}>🎉</Text>
                        <Text style={[styles.confettiEmoji, { top: 20, left: 50 }]}>✨</Text>
                        <Text style={[styles.confettiEmoji, { top: 10, right: 30 }]}>🎊</Text>
                        <Text style={[styles.confettiEmoji, { bottom: 30, left: 20 }]}>⭐</Text>
                        <Text style={[styles.confettiEmoji, { bottom: 20, right: 50 }]}>🏆</Text>
                    </View>

                    <View style={[styles.rewardCard, getRewardTypeStyle()]}>
                        {/* En-tête */}
                        <View style={styles.header}>
                            <Text style={styles.congratsText}>🎉 FÉLICITATIONS ! 🎉</Text>
                            <Text style={styles.newRewardText}>
                                Nouvelle récompense débloquée !
                            </Text>
                        </View>

                        {/* Icône principale */}
                        <View style={styles.iconContainer}>
                            <Text style={styles.rewardIcon}>{currentReward.icon}</Text>
                        </View>

                        {/* Info récompense */}
                        <View style={styles.rewardInfo}>
                            <Text style={styles.rewardName}>{currentReward.name}</Text>
                            <Text style={styles.rewardDescription}>
                                {currentReward.description}
                            </Text>

                            {/* Points gagnés */}
                            <View style={styles.pointsContainer}>
                                <Text style={styles.pointsText}>
                                    +{currentReward.points} points ! 🏆
                                </Text>
                            </View>

                            {/* Niveau de prestige pour les titres */}
                            {currentReward.prestigeLevel && (
                                <View style={styles.prestigeContainer}>
                                    <Text style={styles.prestigeText}>Niveau de prestige:</Text>
                                    <View style={styles.prestigeStars}>
                                        {Array.from({ length: currentReward.prestigeLevel }, (_, i) => (
                                            <Text key={i} style={styles.prestigeStar}>⭐</Text>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Progression */}
                        {rewards.length > 1 && (
                            <View style={styles.progressContainer}>
                                <Text style={styles.progressText}>
                                    {currentRewardIndex + 1} / {rewards.length}
                                </Text>
                                <View style={styles.progressDots}>
                                    {rewards.map((_, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.progressDot,
                                                index === currentRewardIndex && styles.activeDot
                                            ]}
                                        />
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Boutons */}
                        <View style={styles.buttonContainer}>
                            {!isLastReward ? (
                                <TouchableOpacity
                                    style={styles.nextButton}
                                    onPress={showNextReward}
                                >
                                    <Text style={styles.nextButtonText}>
                                        Suivant 👉
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={styles.continueButton}
                                    onPress={handleClose}
                                >
                                    <Text style={styles.continueButtonText}>
                                        Continuer l'aventure ! 🚀
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.9,
        maxHeight: height * 0.8,
    },
    confetti: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: 1,
    },
    confettiEmoji: {
        position: 'absolute',
        fontSize: 24,
    },
    rewardCard: {
        borderRadius: 25,
        padding: 25,
        alignItems: 'center',
        borderWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    congratsText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    newRewardText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    rewardIcon: {
        fontSize: 60,
    },
    rewardInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    rewardName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    rewardDescription: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 15,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    pointsContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    pointsText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fb7a68',
        textAlign: 'center',
    },
    prestigeContainer: {
        alignItems: 'center',
        marginTop: 15,
    },
    prestigeText: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    prestigeStars: {
        flexDirection: 'row',
    },
    prestigeStar: {
        fontSize: 20,
        marginHorizontal: 2,
    },
    progressContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    progressText: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    progressDots: {
        flexDirection: 'row',
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#fff',
    },
    buttonContainer: {
        width: '100%',
    },
    nextButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        paddingVertical: 15,
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fb7a68',
    },
    continueButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        paddingVertical: 15,
        paddingHorizontal: 30,
        alignItems: 'center',
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fb7a68',
    },
});

export default RewardsNotification;