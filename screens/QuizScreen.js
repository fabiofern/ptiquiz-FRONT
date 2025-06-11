import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, SafeAreaView, TextInput, Text, Modal, TouchableOpacity,
    Image, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from "expo-splash-screen";
import { BlurView } from 'expo-blur';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../redux/userSlice';
import { RewardsService } from '../services/RewardsService';
import RewardsNotification from '../components/RewardsNotification';

SplashScreen.preventAutoHideAsync();

export default function QuizScreen({ navigation }) {

    const URL = process.env.EXPO_PUBLIC_BACKEND_URL
    // Redux
    const dispatch = useDispatch();
    const { userData, isLoggedIn } = useSelector((state) => state.user);

    // États locaux
    const [unlockedQuizzes, setUnlockedQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [quizScore, setQuizScore] = useState(0);
    const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [newRewards, setNewRewards] = useState([]);
    const [showRewardsNotification, setShowRewardsNotification] = useState(false);

    // Protection de route
    useEffect(() => {
        if (!isLoggedIn) {
            navigation.navigate('Login');
        }
    }, [isLoggedIn, navigation]);

    // 🎯 Récupérer les quiz débloqués depuis l'API
    const fetchUnlockedQuizzes = async () => {
        if (!userData?.userID) {
            console.log('❌ Pas d\'userID disponible');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('📚 Récupération quiz débloqués depuis l\'API...');

            const response = await fetch(`${URL}/quizz/unlocked/${userData.userID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Réponse API unlocked:', data);

            if (data.result && data.quiz) {
                setUnlockedQuizzes(data.quiz);
                console.log(`✅ ${data.quiz.length} quiz débloqués chargés`);
            } else {
                console.log('ℹ️ Aucun quiz débloqué trouvé');
                setUnlockedQuizzes([]);
            }
        } catch (error) {
            console.error('❌ Erreur récupération quiz débloqués:', error);
            setUnlockedQuizzes([]);
        } finally {
            setLoading(false);
        }
    };

    // 🎯 Charger les quiz au montage du composant
    useEffect(() => {
        if (userData?.userID) {
            fetchUnlockedQuizzes();
        }
    }, [userData?.userID]);

    // 🎯 Recharger quand on revient sur l'écran (focus)
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (userData?.userID) {
                fetchUnlockedQuizzes();
            }
        });
        return unsubscribe;
    }, [navigation, userData?.userID]);

    // Gestion de la réponse
    const handleAnswer = (answerIndex) => {
        if (selectedAnswerIndex !== null) return;

        setSelectedAnswerIndex(answerIndex);
        const currentQuestion = selectedQuiz.quiz[currentQuestionIndex];
        const isCorrect = answerIndex === currentQuestion.bonneReponseIndex;

        if (isCorrect) {
            setQuizScore(prev => prev + currentQuestion.points);
        }

        setTimeout(() => {
            if (currentQuestionIndex + 1 < selectedQuiz.quiz.length) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedAnswerIndex(null);
            } else {
                // Quiz terminé
                completeQuiz();
            }
        }, 1500);
    };

    // 🎯 Sauvegarder via API
    const saveQuizToAPI = async (quizId, score, totalPoints, percentage) => {
        try {
            console.log('💾 Sauvegarde quiz via API...');

            const response = await fetch(`${URL}}/quizz/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userData.userID,
                    quizId: quizId,
                    score: score,
                    totalPoints: totalPoints,
                    percentage: percentage,
                    answers: [],
                    completedAt: new Date().toISOString()
                }),
            });

            const data = await response.json();

            if (data.result) {
                console.log('✅ Quiz sauvegardé en base avec succès');
                return data;
            } else {
                console.error('❌ Erreur sauvegarde quiz:', data.error);
            }
        } catch (error) {
            console.error('❌ Erreur API sauvegarde quiz:', error);
        }
    };

    // 🎯 CALCUL DU SCORE TOTAL UTILISATEUR (POINTS OBTENUS)
    const calculateUserTotalScore = () => {
        const completedQuizzes = userData?.completedQuizzes || {};
        return Object.values(completedQuizzes).reduce((total, quiz) => {
            return total + (quiz.score || 0);
        }, 0);
    };

    // 🎯 FONCTION POUR DÉTERMINER LA COULEUR DE LA CARTE
    const getCardStyle = (percentage) => {
        if (percentage === 100) {
            return { borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)' }; // Vert
        } else if (percentage >= 70) {
            return { borderColor: '#FF9800', backgroundColor: 'rgba(255, 152, 0, 0.1)' }; // Jaune/Orange
        } else {
            return { borderColor: '#F44336', backgroundColor: 'rgba(244, 67, 54, 0.1)' }; // Rouge
        }
    };

    // 🎯 FONCTION POUR DÉTERMINER L'EMOJI DE PERFORMANCE
    const getPerformanceEmoji = (percentage) => {
        if (percentage === 100) return '🏆'; // Parfait
        if (percentage >= 70) return '⭐'; // Bien
        return '💪'; // À améliorer
    };

    // Finaliser le quiz
    const completeQuiz = async () => {
        const totalPoints = selectedQuiz.quiz.reduce((acc, q) => acc + q.points, 0);
        const percentage = Math.round((quizScore / totalPoints) * 100);
        const quizId = selectedQuiz._id?.$oid || selectedQuiz._id;

        // Sauvegarder via API
        await saveQuizToAPI(quizId, quizScore, totalPoints, percentage);

        // 🎯 MISE À JOUR REDUX : Ajouter seulement les points obtenus (pas remplacer)
        const completedQuizzes = userData?.completedQuizzes || {};
        const previousQuizData = completedQuizzes[quizId];
        const previousScore = previousQuizData?.score || 0;

        // Calculer le nouveau score total (ajouter seulement la différence)
        const currentTotalScore = calculateUserTotalScore();
        const scoreDifference = quizScore - previousScore;
        const newTotalScore = currentTotalScore + scoreDifference;

        const updatedUserData = {
            ...userData,
            score: Math.max(newTotalScore, currentTotalScore), // Ne jamais diminuer le score
            completedQuizzes: {
                ...completedQuizzes,
                [quizId]: {
                    name: selectedQuiz.name,
                    score: quizScore, // Points obtenus dans ce quiz
                    totalPoints,
                    percentage,
                    badge: selectedQuiz.badgeDebloque,
                    completedAt: new Date().toISOString(),
                    theme: selectedQuiz.themeLieu
                }
            }
        };

        dispatch(updateUser({
            userData: updatedUserData
        }));

        // 🏆 VÉRIFIER LES RÉCOMPENSES SEULEMENT SI >= 80%
        if (percentage >= 80) {
            console.log(`🎉 Score suffisant (${percentage}%) pour débloquer des récompenses !`);
            const newRewards = RewardsService.checkAllRewards(updatedUserData);
            if (newRewards.length > 0) {
                // 🎯 Filtrer les titres spéciaux (seulement à 100%)
                const filteredRewards = newRewards.filter(reward => {
                    if (reward.type === 'title' && percentage < 100) {
                        console.log(`🚫 Titre "${reward.title}" non débloqué (besoin de 100%, obtenu ${percentage}%)`);
                        return false;
                    }
                    return true;
                });

                if (filteredRewards.length > 0) {
                    RewardsService.applyRewards(filteredRewards);
                    setNewRewards(filteredRewards);
                    setShowRewardsNotification(true);
                }
            }
        } else {
            console.log(`❌ Score insuffisant (${percentage}%) pour débloquer des récompenses (minimum 80%)`);
        }

        setShowResults(true);
    };

    // Fermer le quiz
    const closeQuiz = () => {
        setShowModal(false);
        setShowResults(false);
        setSelectedQuiz(null);
        setCurrentQuestionIndex(0);
        setQuizScore(0);
        setSelectedAnswerIndex(null);
        setNewRewards([]);
        setShowRewardsNotification(false);

        // Recharger les quiz pour mettre à jour le statut "complété"
        fetchUnlockedQuizzes();
    };

    // Démarrer un quiz
    const startQuiz = (quiz) => {
        const quizId = quiz._id?.$oid || quiz._id;
        const isCompleted = userData?.completedQuizzes?.[quizId];

        if (isCompleted) {
            Alert.alert(
                'Quiz déjà terminé',
                `Tu as déjà complété ce quiz avec ${isCompleted.score}/${isCompleted.totalPoints} points (${isCompleted.percentage}%). Veux-tu le refaire ?`,
                [
                    { text: 'Non', style: 'cancel' },
                    { text: 'Oui', onPress: () => initializeQuiz(quiz) }
                ]
            );
        } else {
            initializeQuiz(quiz);
        }
    };

    const initializeQuiz = (quiz) => {
        setSelectedQuiz(quiz);
        setCurrentQuestionIndex(0);
        setQuizScore(0);
        setSelectedAnswerIndex(null);
        setShowResults(false);
        setShowModal(true);
    };

    // 🎯 AFFICHAGE DE CHARGEMENT
    if (loading) {
        return (
            <LinearGradient
                colors={['#eeddfd', '#d5c3f3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.generalContainer}
            >
                <SafeAreaView />
                <BlurView intensity={50} style={styles.glass}>
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color="#85CAE4" />
                        <Text style={styles.message}>Chargement des quiz...</Text>
                    </View>
                </BlurView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#eeddfd', '#d5c3f3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.generalContainer}
        >
            <SafeAreaView />

            <BlurView intensity={50} style={styles.glass}>
                {unlockedQuizzes.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.message}>🧭 Balade-toi dans ta ville et débloque des Tiquizs !</Text>
                        <TouchableOpacity
                            style={styles.mapButton}
                            onPress={() => navigation.navigate('Map')}
                        >
                            <Text style={styles.mapButtonText}>Voir la carte</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.title}>🎯 À TOI DE JOUER</Text>
                        <Text style={styles.subtitle}>
                            🏆 Score total: {calculateUserTotalScore()} points
                        </Text>
                        <Text style={styles.subtitle}>
                            🔓 {unlockedQuizzes.length} quiz débloqués
                        </Text>

                        {unlockedQuizzes.map((quiz, index) => {
                            const quizId = quiz._id?.$oid || quiz._id;
                            const completedData = userData?.completedQuizzes?.[quizId];
                            const isCompleted = !!completedData;
                            const totalPoints = quiz.quiz ? quiz.quiz.reduce((acc, q) => acc + q.points, 0) : 0;

                            // 🎯 Style de carte basé sur la performance
                            const cardPerformanceStyle = isCompleted ? getCardStyle(completedData.percentage) : {};

                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => startQuiz(quiz)}
                                    style={[
                                        styles.card,
                                        cardPerformanceStyle
                                    ]}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.quizTitle}>{quiz.name}</Text>
                                        {isCompleted && (
                                            <Text style={styles.completedBadge}>
                                                {getPerformanceEmoji(completedData.percentage)}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={styles.quizDesc}>📍 {quiz.arrondissement}</Text>
                                    <Text style={styles.quizDesc}>🏅 {quiz.badgeDebloque}</Text>
                                    <Text style={styles.quizPoints}>
                                        Points disponibles: {totalPoints}
                                    </Text>
                                    {isCompleted && (
                                        <>
                                            <Text style={[
                                                styles.completedScore,
                                                {
                                                    color: completedData.percentage === 100 ? '#4CAF50' :
                                                        completedData.percentage >= 70 ? '#FF9800' : '#F44336'
                                                }
                                            ]}>
                                                {getPerformanceEmoji(completedData.percentage)} Ton score: {completedData.score}/{completedData.totalPoints} ({completedData.percentage}%)
                                            </Text>
                                            <Text style={styles.performanceText}>
                                                {completedData.percentage === 100 ? '🏆 Parfait !' :
                                                    completedData.percentage >= 80 ? '⭐ Excellent !' :
                                                        completedData.percentage >= 70 ? '👍 Bien joué !' :
                                                            '💪 Tu peux mieux faire !'}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}

                {/* Modal Quiz */}
                <Modal visible={showModal} animationType="slide" transparent={true}>
                    <View style={styles.modalContainer}>
                        <BlurView intensity={80} style={styles.quizModal}>
                            {!showResults ? (
                                selectedQuiz && currentQuestionIndex < selectedQuiz.quiz.length ? (
                                    <>
                                        <View style={styles.quizHeader}>
                                            <Text style={styles.quizName}>{selectedQuiz.name}</Text>
                                            <Text style={styles.questionNumber}>
                                                Question {currentQuestionIndex + 1}/{selectedQuiz.quiz.length}
                                            </Text>
                                            <Text style={styles.currentScore}>Score: {quizScore}</Text>
                                        </View>

                                        <Text style={styles.question}>
                                            {selectedQuiz.quiz[currentQuestionIndex].question}
                                        </Text>

                                        {selectedQuiz.quiz[currentQuestionIndex].reponses.map((reponse, i) => (
                                            <TouchableOpacity
                                                key={i}
                                                style={[
                                                    styles.answerButton,
                                                    selectedAnswerIndex === i && (
                                                        i === selectedQuiz.quiz[currentQuestionIndex].bonneReponseIndex
                                                            ? styles.correctAnswer
                                                            : styles.wrongAnswer
                                                    )
                                                ]}
                                                onPress={() => handleAnswer(i)}
                                                disabled={selectedAnswerIndex !== null}
                                            >
                                                <Text style={styles.answerText}>{reponse}</Text>
                                            </TouchableOpacity>
                                        ))}

                                        {selectedAnswerIndex !== null && (
                                            <Text style={styles.explanation}>
                                                💡 {selectedQuiz.quiz[currentQuestionIndex].explication}
                                            </Text>
                                        )}
                                    </>
                                ) : null
                            ) : (
                                // 🎯 ÉCRAN DE RÉSULTATS AMÉLIORÉ
                                <View style={styles.resultsContainer}>
                                    <Text style={styles.resultsTitle}>🎉 Quiz terminé !</Text>
                                    <Text style={styles.resultsScore}>
                                        Score: {quizScore}/{selectedQuiz.quiz.reduce((acc, q) => acc + q.points, 0)}
                                    </Text>
                                    <Text style={styles.resultsPercentage}>
                                        {Math.round((quizScore / selectedQuiz.quiz.reduce((acc, q) => acc + q.points, 0)) * 100)}%
                                    </Text>

                                    {/* 🎯 MESSAGE BASÉ SUR LA PERFORMANCE */}
                                    {(() => {
                                        const percentage = Math.round((quizScore / selectedQuiz.quiz.reduce((acc, q) => acc + q.points, 0)) * 100);
                                        if (percentage === 100) {
                                            return (
                                                <>
                                                    <Text style={styles.perfectMessage}>🏆 PARFAIT ! Tous les rewards débloqués !</Text>
                                                    <Text style={styles.resultsBadge}>🏅 Badge + Titre: {selectedQuiz.badgeDebloque}</Text>
                                                </>
                                            );
                                        } else if (percentage >= 80) {
                                            return (
                                                <>
                                                    <Text style={styles.excellentMessage}>⭐ Excellent ! Rewards débloqués !</Text>
                                                    <Text style={styles.resultsBadge}>🏅 Badge: {selectedQuiz.badgeDebloque}</Text>
                                                </>
                                            );
                                        } else if (percentage >= 70) {
                                            return <Text style={styles.goodMessage}>👍 Bien joué ! Pas de reward cette fois.</Text>;
                                        } else {
                                            return <Text style={styles.tryAgainMessage}>💪 Tu peux mieux faire ! Réessaie pour débloquer des rewards !</Text>;
                                        }
                                    })()}

                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={closeQuiz}
                                    >
                                        <Text style={styles.closeText}>Continuer</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </BlurView>
                    </View>
                </Modal>
            </BlurView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    generalContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glass: {
        width: '90%',
        height: '85%',
        padding: 20,
        borderRadius: 33,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 6, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        fontSize: 18,
        textAlign: 'center',
        fontWeight: '600',
        color: '#4a3b79',
        paddingVertical: 20,
        marginBottom: 20,
    },
    mapButton: {
        backgroundColor: '#85CAE4',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
    },
    mapButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#3a2e6b',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#4a3b79',
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: '600',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    quizTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c1d53',
        flex: 1,
    },
    completedBadge: {
        fontSize: 24,
    },
    quizDesc: {
        fontSize: 14,
        color: '#555',
        marginBottom: 8,
    },
    quizPoints: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3a2e6b',
    },
    completedScore: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 5,
    },
    performanceText: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 3,
        color: '#666',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    quizModal: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 20,
    },
    quizHeader: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    quizName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#3a2e6b',
        textAlign: 'center',
    },
    questionNumber: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    currentScore: {
        fontSize: 16,
        fontWeight: '600',
        color: '#85CAE4',
        marginTop: 5,
    },
    question: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
        color: '#2c1d53',
        lineHeight: 24,
    },
    answerButton: {
        backgroundColor: '#eeddfd',
        padding: 15,
        borderRadius: 12,
        marginVertical: 6,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    answerText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#4a3b79',
        fontWeight: '500',
    },
    correctAnswer: {
        backgroundColor: '#4CAF50',
        borderColor: '#388E3C',
    },
    wrongAnswer: {
        backgroundColor: '#F44336',
        borderColor: '#C62828',
    },
    explanation: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 15,
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 10,
        lineHeight: 20,
    },
    resultsContainer: {
        alignItems: 'center',
        padding: 20,
    },
    resultsTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#3a2e6b',
        marginBottom: 20,
    },
    resultsScore: {
        fontSize: 20,
        fontWeight: '600',
        color: '#85CAE4',
        marginBottom: 10,
    },
    resultsPercentage: {
        fontSize: 32,
        fontWeight: '700',
        color: '#3a2e6b',
        marginBottom: 20,
    },
    perfectMessage: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4CAF50',
        textAlign: 'center',
        marginBottom: 15,
    },
    excellentMessage: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF9800',
        textAlign: 'center',
        marginBottom: 15,
    },
    goodMessage: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2196F3',
        textAlign: 'center',
        marginBottom: 15,
    },
    tryAgainMessage: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F44336',
        textAlign: 'center',
        marginBottom: 15,
    },
    resultsBadge: {
        fontSize: 16,
        color: '#4a3b79',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    closeButton: {
        backgroundColor: '#85CAE4',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 25,
    },
    closeText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
    },
});