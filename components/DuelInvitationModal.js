import React, { useState } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, Modal,
    Image, Alert, ActivityIndicator, Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSelector } from 'react-redux';
import { EXPO_PUBLIC_BACKEND_URL } from '@env';

const { width, height } = Dimensions.get('window');

const DuelInvitationModal = ({
    visible,
    onClose,
    challengerData,
    duelId,
    onAccept,
    onDecline
}) => {
    const URL = EXPO_PUBLIC_BACKEND_URL;
    const { userData } = useSelector((state) => state.user);
    const [isLoading, setIsLoading] = useState(false);
    const [actionType, setActionType] = useState(''); // 'accept' or 'decline'

    // Animation pour l'apparition du modal
    const scaleAnim = new Animated.Value(0);

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible]);

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

    const handleAccept = async () => {
        setIsLoading(true);
        setActionType('accept');

        try {
            const response = await fetch(`${URL}/api/duels/${duelId}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userData.userID
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de l\'acceptation du duel');
            }

            const result = await response.json();

            Alert.alert(
                '🎯 Duel Accepté !',
                'Le duel commence maintenant ! Bonne chance !',
                [{ text: 'Commencer', onPress: () => onAccept(result.duel) }]
            );

        } catch (error) {
            console.error('Erreur lors de l\'acceptation:', error);
            Alert.alert('Erreur', error.message || 'Impossible d\'accepter le duel');
        } finally {
            setIsLoading(false);
            setActionType('');
        }
    };

    const handleDecline = async () => {
        setIsLoading(true);
        setActionType('decline');

        try {
            const response = await fetch(`${URL}/api/duels/${duelId}/decline`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userData.userID
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors du refus du duel');
            }

            Alert.alert(
                '❌ Duel Refusé',
                'Vous avez refusé le duel.',
                [{ text: 'OK', onPress: () => onDecline() }]
            );

        } catch (error) {
            console.error('Erreur lors du refus:', error);
            Alert.alert('Erreur', error.message || 'Impossible de refuser le duel');
        } finally {
            setIsLoading(false);
            setActionType('');
        }
    };

    if (!challengerData) return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />

                <Animated.View style={[
                    styles.modalContainer,
                    { transform: [{ scale: scaleAnim }] }
                ]}>
                    <BlurView intensity={60} tint="light" style={styles.modalView}>

                        {/* En-tête avec effet de combat */}
                        <View style={styles.headerContainer}>
                            <LinearGradient
                                colors={['rgba(255, 112, 67, 0.3)', 'rgba(255, 152, 0, 0.2)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.headerGradient}
                            >
                                <BlurView intensity={30} tint="light" style={styles.headerBlur}>
                                    <Text style={styles.duelTitle}>⚔️ DUEL TIQUIZ ⚔️</Text>
                                    <Text style={styles.challengeText}>
                                        <Text style={styles.challengerName}>{challengerData.username}</Text>
                                        {' '}vous défie !
                                    </Text>
                                </BlurView>
                            </LinearGradient>
                        </View>

                        {/* Avatars face à face */}
                        <View style={styles.avatarsContainer}>
                            <View style={styles.playerSection}>
                                <View style={styles.avatarWrapper}>
                                    <BlurView intensity={40} tint="light" style={styles.avatarBlur}>
                                        <Image
                                            source={avatarImages[challengerData.avatar] || avatarImages['avatar01.png']}
                                            style={styles.challengerAvatar}
                                        />
                                    </BlurView>
                                </View>
                                <Text style={styles.playerName}>{challengerData.username}</Text>
                                <Text style={styles.playerTitle}>🔥 Challenger</Text>
                            </View>

                            <View style={styles.vsContainer}>
                                <BlurView intensity={50} tint="light" style={styles.vsBlur}>
                                    <Text style={styles.vsText}>VS</Text>
                                </BlurView>
                            </View>

                            <View style={styles.playerSection}>
                                <View style={styles.avatarWrapper}>
                                    <BlurView intensity={40} tint="light" style={styles.avatarBlur}>
                                        <Image
                                            source={avatarImages[userData.avatar] || avatarImages['avatar01.png']}
                                            style={styles.challengedAvatar}
                                        />
                                    </BlurView>
                                </View>
                                <Text style={styles.playerName}>{userData.username}</Text>
                                <Text style={styles.playerTitle}>🛡️ Défendu</Text>
                            </View>
                        </View>

                        {/* Informations du duel */}
                        <View style={styles.duelInfoContainer}>
                            <BlurView intensity={30} tint="light" style={styles.duelInfoBlur}>
                                <Text style={styles.duelInfoTitle}>📋 RÈGLES DU DUEL</Text>
                                <View style={styles.ruleItem}>
                                    <Text style={styles.ruleIcon}>🎯</Text>
                                    <Text style={styles.ruleText}>10 questions identiques</Text>
                                </View>
                                <View style={styles.ruleItem}>
                                    <Text style={styles.ruleIcon}>🏆</Text>
                                    <Text style={styles.ruleText}>Meilleur score gagne</Text>
                                </View>
                                <View style={styles.ruleItem}>
                                    <Text style={styles.ruleIcon}>⏱️</Text>
                                    <Text style={styles.ruleText}>Jouez à votre rythme</Text>
                                </View>
                                <View style={styles.ruleItem}>
                                    <Text style={styles.ruleIcon}>🎁</Text>
                                    <Text style={styles.ruleText}>Récompenses bonus au gagnant</Text>
                                </View>
                            </BlurView>
                        </View>

                        {/* Boutons d'action */}
                        <View style={styles.buttonsContainer}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.acceptButton]}
                                onPress={handleAccept}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={['rgba(76, 175, 80, 0.8)', 'rgba(139, 195, 74, 0.6)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.buttonGradient}
                                >
                                    <BlurView intensity={20} tint="light" style={styles.buttonBlur}>
                                        {isLoading && actionType === 'accept' ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Text style={styles.acceptButtonIcon}>⚔️</Text>
                                                <Text style={styles.acceptButtonText}>ACCEPTER</Text>
                                            </>
                                        )}
                                    </BlurView>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.declineButton]}
                                onPress={handleDecline}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={['rgba(244, 67, 54, 0.8)', 'rgba(229, 57, 53, 0.6)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.buttonGradient}
                                >
                                    <BlurView intensity={20} tint="light" style={styles.buttonBlur}>
                                        {isLoading && actionType === 'decline' ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Text style={styles.declineButtonIcon}>🚫</Text>
                                                <Text style={styles.declineButtonText}>REFUSER</Text>
                                            </>
                                        )}
                                    </BlurView>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Bouton fermer */}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            disabled={isLoading}
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
        width: '92%',
        maxWidth: 420,
        maxHeight: '85%',
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
        padding: 25,
    },
    headerContainer: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 25,
    },
    headerGradient: {
        width: '100%',
        borderRadius: 20,
    },
    headerBlur: {
        padding: 20,
        alignItems: 'center',
        borderRadius: 20,
    },
    duelTitle: {
        fontFamily: 'Fustat-ExtraBold.ttf',
        fontSize: 26,
        color: '#FF7043',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    challengeText: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 18,
        color: '#4a4a4a',
        textAlign: 'center',
    },
    challengerName: {
        fontFamily: 'Fustat-Bold.ttf',
        color: '#FF9800',
    },
    avatarsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
        paddingHorizontal: 10,
    },
    playerSection: {
        alignItems: 'center',
        flex: 1,
    },
    avatarWrapper: {
        borderRadius: 50,
        overflow: 'hidden',
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    avatarBlur: {
        padding: 3,
        borderRadius: 50,
    },
    challengerAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#FF7043',
    },
    challengedAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#4CAF50',
    },
    playerName: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 16,
        color: '#4a4a4a',
        marginBottom: 3,
    },
    playerTitle: {
        fontFamily: 'Fustat-Regular.ttf',
        fontSize: 12,
        color: '#666',
    },
    vsContainer: {
        marginHorizontal: 15,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    vsBlur: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 30,
        alignItems: 'center',
    },
    vsText: {
        fontFamily: 'Fustat-ExtraBold.ttf',
        fontSize: 20,
        color: '#FF9800',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    duelInfoContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 25,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    duelInfoBlur: {
        padding: 18,
        borderRadius: 20,
    },
    duelInfoTitle: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 18,
        color: '#FF7043',
        textAlign: 'center',
        marginBottom: 15,
    },
    ruleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ruleIcon: {
        fontSize: 18,
        marginRight: 12,
        width: 25,
    },
    ruleText: {
        fontFamily: 'Fustat-Regular.ttf',
        fontSize: 16,
        color: '#4a4a4a',
        flex: 1,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    actionButton: {
        flex: 1,
        height: 60,
        marginHorizontal: 8,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    acceptButton: {
        shadowColor: 'rgba(76, 175, 80, 0.6)',
    },
    declineButton: {
        shadowColor: 'rgba(244, 67, 54, 0.6)',
    },
    buttonGradient: {
        flex: 1,
        borderRadius: 30,
    },
    buttonBlur: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
        paddingHorizontal: 15,
    },
    acceptButtonIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    acceptButtonText: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 16,
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    declineButtonIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    declineButtonText: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 16,
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

export default DuelInvitationModal;