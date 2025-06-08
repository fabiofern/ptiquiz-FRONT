import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, SafeAreaView, TextInput, Text, Modal, TouchableOpacity,
    Image, ScrollView, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from "expo-splash-screen";
import { BlurView } from 'expo-blur';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../redux/userSlice';
import { RewardsService } from '../services/RewardsService';
import RewardsNotification from '../components/RewardsNotification';
import * as Location from "expo-location";

SplashScreen.preventAutoHideAsync();

export default function QuizScreen({ navigation }) {
    // Redux
    const dispatch = useDispatch();
    const { userData, isLoggedIn } = useSelector((state) => state.user);

    // États locaux
    const [unlockedQuizzes, setUnlockedQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [quizScore, setQuizScore] = useState(0);
    const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [newRewards, setNewRewards] = useState([]);
    const [showRewardsNotification, setShowRewardsNotification] = useState(false);

    // Protection de route
    useEffect(() => {
        if (!isLoggedIn) {
            navigation.navigate('Login');
        }
    }, [isLoggedIn, navigation]);

    const quizPoints = [
        // ... tous vos quiz data (gardez le même array)
        {
            "_id": { "$oid": "68446c823eaa6f50bd436d43" },
            "name": "Tour Eiffel",
            "location": { "latitude": "48.8584", "longitude": "2.2945" },
            "arrondissement": "7ème",
            "ville": "Paris",
            "descriptionLieu": "Monument emblématique de Paris, construite pour l'Exposition universelle de 1889.",
            "badgeDebloque": "Gardien de la Dame de Fer",
            "themeLieu": "Architecture",
            "quiz": [
                {
                    "question": "En quelle année la Tour Eiffel a-t-elle été inaugurée ?",
                    "reponses": ["1887", "1889", "1891", "1893"],
                    "bonneReponseIndex": 1,
                    "explication": "La Tour Eiffel a été inaugurée en 1889 pour l'Exposition universelle.",
                    "theme": "Histoire",
                    "difficulte": "Facile",
                    "points": 10
                }
            ]
        }
        // ... ajoutez tous vos autres quiz
    ];

    // Obtenir la géolocalisation
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                setUserLocation(location.coords);
            }
        })();
    }, []);

    // Calcul de distance
    const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const toRad = (x) => (x * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Détermine les quiz débloqués
    useEffect(() => {
        if (!userLocation) return;

        const nearby = quizPoints.filter((point) => {
            const distance = getDistanceInMeters(
                userLocation.latitude,
                userLocation.longitude,
                parseFloat(point.location.latitude),
                parseFloat(point.location.longitude)
            );
            return distance < 50; // 50 mètres pour production
        });

        setUnlockedQuizzes(nearby);
    }, [userLocation]);

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

    // Finaliser le quiz
    const completeQuiz = () => {
        const totalPoints = selectedQuiz.quiz.reduce((acc, q) => acc + q.points, 0);
        const percentage = Math.round((quizScore / totalPoints) * 100);

        // Sauvegarder dans Redux
        const completedQuizzes = userData?.completedQuizzes || {};
        const currentScore = userData?.score || 0;

        const updatedUserData = {
            ...userData,
            score: currentScore + quizScore,
            completedQuizzes: {
                ...completedQuizzes,
                [selectedQuiz._id.$oid]: {
                    name: selectedQuiz.name,
                    score: quizScore,
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

        // 🏆 Vérifier les nouvelles récompenses !
        const newRewards = RewardsService.checkAllRewards(updatedUserData);
        if (newRewards.length > 0) {
            RewardsService.applyRewards(newRewards);
            setNewRewards(newRewards);
            setShowRewardsNotification(true);
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
    };

    // Démarrer un quiz
    const startQuiz = (quiz) => {
        const isCompleted = userData?.completedQuizzes?.[quiz._id.$oid];

        if (isCompleted) {
            Alert.alert(
                'Quiz déjà terminé',
                `Tu as déjà complété ce quiz avec ${isCompleted.score}/${isCompleted.totalPoints} points. Veux-tu le refaire ?`,
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
                            Score total: {userData?.score || 0} points
                        </Text>

                        {unlockedQuizzes.map((quiz, index) => {
                            const isCompleted = userData?.completedQuizzes?.[quiz._id.$oid];
                            const totalPoints = quiz.quiz.reduce((acc, q) => acc + q.points, 0);

                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => startQuiz(quiz)}
                                    style={[
                                        styles.card,
                                        isCompleted && styles.completedCard
                                    ]}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.quizTitle}>{quiz.name}</Text>
                                        {isCompleted && <Text style={styles.completedBadge}>✅</Text>}
                                    </View>
                                    <Text style={styles.quizDesc}>🏅 {quiz.badgeDebloque}</Text>
                                    <Text style={styles.quizPoints}>
                                        Points disponibles: {totalPoints}
                                    </Text>
                                    {isCompleted && (
                                        <Text style={styles.completedScore}>
                                            Ton score: {isCompleted.score}/{isCompleted.totalPoints} ({isCompleted.percentage}%)
                                        </Text>
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
                                // Écran de résultats
                                <View style={styles.resultsContainer}>
                                    <Text style={styles.resultsTitle}>🎉 Quiz terminé !</Text>
                                    <Text style={styles.resultsScore}>
                                        Score: {quizScore}/{selectedQuiz.quiz.reduce((acc, q) => acc + q.points, 0)}
                                    </Text>
                                    <Text style={styles.resultsBadge}>
                                        🏅 Badge débloqué: {selectedQuiz.badgeDebloque}
                                    </Text>
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
        marginBottom: 20,
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
    completedCard: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
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
        fontSize: 20,
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
        color: '#4CAF50',
        fontWeight: '600',
        marginTop: 5,
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