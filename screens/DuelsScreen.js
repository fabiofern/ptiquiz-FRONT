import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet, View, SafeAreaView, Text, TouchableOpacity,
    ScrollView, Alert, ActivityIndicator, Dimensions, Animated, BackHandler
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSelector } from 'react-redux';
import { useFonts } from "expo-font";
import { EXPO_PUBLIC_BACKEND_URL } from '@env';

const { width, height } = Dimensions.get('window');

// Composant d'animation de fond Aurora
const AuroraBackground = () => {
    const [isReady, setIsReady] = useState(false);
    const blobs = useRef([]);

    useEffect(() => {
        if (!isReady) {
            blobs.current = [...Array(4)].map(() => ({
                translateX: new Animated.Value(Math.random() * width),
                translateY: new Animated.Value(Math.random() * height),
                scale: new Animated.Value(0.5 + Math.random()),
                opacity: new Animated.Value(0.1 + Math.random() * 0.2),
                duration: 8000 + Math.random() * 4000,
            }));
            setIsReady(true);

            blobs.current.forEach(blob => {
                const animateBlob = () => {
                    Animated.loop(
                        Animated.parallel([
                            Animated.timing(blob.translateX, { toValue: Math.random() * width, duration: blob.duration, useNativeDriver: true }),
                            Animated.timing(blob.translateY, { toValue: Math.random() * height, duration: blob.duration, useNativeDriver: true }),
                            Animated.timing(blob.scale, { toValue: 0.6 + Math.random() * 0.8, duration: blob.duration, useNativeDriver: true }),
                            Animated.timing(blob.opacity, { toValue: 0.1 + Math.random() * 0.2, duration: blob.duration, useNativeDriver: true }),
                        ])
                    ).start();
                };
                animateBlob();
            });
        }
    }, [isReady]);

    const auroraColors = [
        'rgba(255, 152, 0, 0.15)',
        'rgba(255, 112, 67, 0.15)',
        'rgba(255, 204, 128, 0.15)',
        'rgba(255, 240, 200, 0.15)',
    ];

    if (!isReady) return null;

    return (
        <View style={StyleSheet.absoluteFillObject}>
            {blobs.current.map((blob, index) => (
                <Animated.View
                    key={index}
                    style={{
                        position: 'absolute',
                        width: width * 0.7,
                        height: width * 0.7,
                        borderRadius: width * 0.35,
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

const DuelScreen = ({ navigation, route }) => {
    const URL = EXPO_PUBLIC_BACKEND_URL;
    const { userData } = useSelector((state) => state.user);
    const { duelId, challengerData } = route.params;

    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isQuestionConfirmed, setIsQuestionConfirmed] = useState(false);

    const startTime = useRef(Date.now());
    const timerRef = useRef(null);

    const [loaded] = useFonts({
        "Fustat-Bold.ttf": require("../assets/fonts/Fustat-Bold.ttf"),
        "Fustat-ExtraBold.ttf": require("../assets/fonts/Fustat-ExtraBold.ttf"),
        "Fustat-Regular.ttf": require("../assets/fonts/Fustat-Regular.ttf"),
        "Fustat-SemiBold.ttf": require("../assets/fonts/Fustat-SemiBold.ttf"),
    });

    // Timer
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeElapsed(Math.floor((Date.now() - startTime.current) / 1000));
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Gérer le retour système
    useEffect(() => {
        const backAction = () => {
            Alert.alert(
                "⚠️ Quitter le duel ?",
                "Si vous quittez maintenant, vous perdrez automatiquement le duel.",
                [
                    { text: "Continuer", style: "cancel" },
                    { text: "Quitter", style: "destructive", onPress: () => navigation.goBack() }
                ]
            );
            return true;
        };

        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, [navigation]);

    // Charger les questions du duel
    useEffect(() => {
        loadDuelQuestions();
    }, []);

    const loadDuelQuestions = async () => {
        try {
            const response = await fetch(`${URL}/api/duels/${duelId}/questions`, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des questions');
            }

            const data = await response.json();
            setQuestions(data.questions);
        } catch (error) {
            console.error('Erreur:', error);
            Alert.alert('Erreur', 'Impossible de charger les questions du duel');
            navigation.goBack();
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerSelect = (answerIndex) => {
        if (isQuestionConfirmed) return;
        setSelectedAnswer(answerIndex);
    };

    const confirmAnswer = () => {
        if (selectedAnswer === null) {
            Alert.alert('⚠️ Attention', 'Veuillez sélectionner une réponse');
            return;
        }

        const currentQuestion = questions[currentQuestionIndex];
        const newAnswer = {
            questionId: currentQuestion._id,
            selectedAnswer: selectedAnswer,
            isCorrect: selectedAnswer === currentQuestion.correctAnswer,
            timeSpent: Date.now() - startTime.current
        };

        setUserAnswers([...userAnswers, newAnswer]);
        setIsQuestionConfirmed(true);

        // Passer à la question suivante après 1.5 secondes
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setSelectedAnswer(null);
                setIsQuestionConfirmed(false);
            } else {
                submitDuelAnswers([...userAnswers, newAnswer]);
            }
        }, 1500);
    };

    const submitDuelAnswers = async (finalAnswers) => {
        setIsSubmitting(true);

        try {
            const totalTime = Date.now() - startTime.current;
            const score = finalAnswers.filter(answer => answer.isCorrect).length;

            const response = await fetch(`${URL}/api/duels/${duelId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userData.userID,
                    answers: finalAnswers,
                    score: score,
                    totalTime: totalTime
                }),
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la soumission');
            }

            const result = await response.json();

            // Navigation vers l'écran de résultats
            navigation.replace('DuelResults', {
                duelResult: result.duel,
                userScore: score,
                totalQuestions: questions.length,
                timeElapsed: totalTime,
                challengerData
            });

        } catch (error) {
            console.error('Erreur:', error);
            Alert.alert('Erreur', 'Impossible de soumettre vos réponses');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getAnswerStyle = (answerIndex) => {
        if (!isQuestionConfirmed) {
            return selectedAnswer === answerIndex ? styles.selectedAnswer : styles.answer;
        }

        const currentQuestion = questions[currentQuestionIndex];
        if (answerIndex === currentQuestion.correctAnswer) {
            return styles.correctAnswer;
        } else if (answerIndex === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer) {
            return styles.wrongAnswer;
        }
        return styles.answer;
    };

    const getAnswerTextStyle = (answerIndex) => {
        if (!isQuestionConfirmed) {
            return selectedAnswer === answerIndex ? styles.selectedAnswerText : styles.answerText;
        }

        const currentQuestion = questions[currentQuestionIndex];
        if (answerIndex === currentQuestion.correctAnswer) {
            return styles.correctAnswerText;
        } else if (answerIndex === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer) {
            return styles.wrongAnswerText;
        }
        return styles.answerText;
    };

    if (!loaded || isLoading) {
        return (
            <LinearGradient
                colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#FF9800" />
                    <Text style={styles.loadingText}>Chargement du duel...</Text>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (isSubmitting) {
        return (
            <LinearGradient
                colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <SafeAreaView style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#FF9800" />
                    <Text style={styles.loadingText}>Envoi de vos réponses...</Text>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
        <LinearGradient
            colors={['#FFF3E0', '#FFE0B2', '#FFCC80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <AuroraBackground />

            <SafeAreaView style={styles.container}>

                {/* Header avec progression */}
                <View style={styles.headerWrapper}>
                    <BlurView intensity={50} tint="light" style={styles.headerBlur}>
                        <View style={styles.headerContent}>
                            <Text style={styles.duelTitle}>⚔️ DUEL TIQUIZ</Text>
                            <Text style={styles.opponentName}>VS {challengerData?.username}</Text>

                            <View style={styles.progressContainer}>
                                <Text style={styles.progressText}>
                                    Question {currentQuestionIndex + 1}/{questions.length}
                                </Text>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                                </View>
                                <Text style={styles.timeText}>⏱️ {formatTime(timeElapsed)}</Text>
                            </View>
                        </View>
                    </BlurView>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

                    {/* Question */}
                    <View style={styles.questionWrapper}>
                        <BlurView intensity={50} tint="light" style={styles.questionBlur}>
                            <Text style={styles.questionNumber}>Question {currentQuestionIndex + 1}</Text>
                            <Text style={styles.questionText}>{currentQuestion.question}</Text>

                            {currentQuestion.image && (
                                <View style={styles.questionImageContainer}>
                                    <Image
                                        source={{ uri: currentQuestion.image }}
                                        style={styles.questionImage}
                                        resizeMode="contain"
                                    />
                                </View>
                            )}
                        </BlurView>
                    </View>

                    {/* Réponses */}
                    <View style={styles.answersContainer}>
                        {currentQuestion.answers.map((answer, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.answerWrapper, getAnswerStyle(index)]}
                                onPress={() => handleAnswerSelect(index)}
                                disabled={isQuestionConfirmed}
                                activeOpacity={0.8}
                            >
                                <BlurView intensity={30} tint="light" style={styles.answerBlur}>
                                    <View style={styles.answerContent}>
                                        <View style={styles.answerIndex}>
                                            <Text style={styles.answerIndexText}>
                                                {String.fromCharCode(65 + index)}
                                            </Text>
                                        </View>
                                        <Text style={[styles.answerText, getAnswerTextStyle(index)]}>
                                            {answer}
                                        </Text>
                                        {isQuestionConfirmed && index === currentQuestion.correctAnswer && (
                                            <Text style={styles.correctIcon}>✓</Text>
                                        )}
                                        {isQuestionConfirmed && index === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer && (
                                            <Text style={styles.wrongIcon}>✗</Text>
                                        )}
                                    </View>
                                </BlurView>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Bouton de confirmation */}
                    {!isQuestionConfirmed && (
                        <View style={styles.confirmButtonWrapper}>
                            <TouchableOpacity
                                style={[
                                    styles.confirmButton,
                                    selectedAnswer === null && styles.confirmButtonDisabled
                                ]}
                                onPress={confirmAnswer}
                                disabled={selectedAnswer === null}
                            >
                                <LinearGradient
                                    colors={selectedAnswer !== null
                                        ? ['rgba(76, 175, 80, 0.8)', 'rgba(139, 195, 74, 0.6)']
                                        : ['rgba(158, 158, 158, 0.5)', 'rgba(117, 117, 117, 0.3)']
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.confirmButtonGradient}
                                >
                                    <BlurView intensity={20} tint="light" style={styles.confirmButtonBlur}>
                                        <Text style={[
                                            styles.confirmButtonText,
                                            selectedAnswer === null && styles.confirmButtonTextDisabled
                                        ]}>
                                            {currentQuestionIndex === questions.length - 1 ? 'TERMINER' : 'CONFIRMER'}
                                        </Text>
                                    </BlurView>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Feedback après confirmation */}
                    {isQuestionConfirmed && (
                        <View style={styles.feedbackWrapper}>
                            <BlurView intensity={40} tint="light" style={styles.feedbackBlur}>
                                {selectedAnswer === currentQuestion.correctAnswer ? (
                                    <View style={styles.feedbackContent}>
                                        <Text style={styles.correctFeedbackIcon}>🎉</Text>
                                        <Text style={styles.correctFeedbackText}>Correct !</Text>
                                    </View>
                                ) : (
                                    <View style={styles.feedbackContent}>
                                        <Text style={styles.wrongFeedbackIcon}>😅</Text>
                                        <Text style={styles.wrongFeedbackText}>
                                            La bonne réponse était : {currentQuestion.answers[currentQuestion.correctAnswer]}
                                        </Text>
                                    </View>
                                )}
                            </BlurView>
                        </View>
                    )}

                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 18,
        color: '#FF9800',
        marginTop: 15,
    },
    headerWrapper: {
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerBlur: {
        padding: 20,
        borderRadius: 20,
    },
    headerContent: {
        alignItems: 'center',
    },
    duelTitle: {
        fontFamily: 'Fustat-ExtraBold.ttf',
        fontSize: 24,
        color: '#FF7043',
        marginBottom: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    opponentName: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 16,
        color: '#4a4a4a',
        marginBottom: 15,
    },
    progressContainer: {
        width: '100%',
        alignItems: 'center',
    },
    progressText: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 16,
        color: '#FF9800',
        marginBottom: 8,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    timeText: {
        fontFamily: 'Fustat-Regular.ttf',
        fontSize: 14,
        color: '#666',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    questionWrapper: {
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 25,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    questionBlur: {
        padding: 25,
        borderRadius: 25,
        alignItems: 'center',
    },
    questionNumber: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 18,
        color: '#FF7043',
        marginBottom: 15,
    },
    questionText: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 20,
        color: '#4a4a4a',
        textAlign: 'center',
        lineHeight: 28,
    },
    questionImageContainer: {
        marginTop: 15,
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    questionImage: {
        width: '100%',
        height: 200,
    },
    answersContainer: {
        marginBottom: 25,
    },
    answerWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 15,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
    },
    answer: {
        borderColor: 'rgba(255, 255, 255, 0.4)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    selectedAnswer: {
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.2)',
        shadowColor: '#FF9800',
        shadowOpacity: 0.3,
    },
    correctAnswer: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        shadowColor: '#4CAF50',
        shadowOpacity: 0.4,
    },
    wrongAnswer: {
        borderColor: '#F44336',
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        shadowColor: '#F44336',
        shadowOpacity: 0.4,
    },
    answerBlur: {
        padding: 18,
        borderRadius: 20,
    },
    answerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    answerIndex: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        backgroundColor: 'rgba(255, 152, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    answerIndexText: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 16,
        color: '#FF9800',
    },
    answerText: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 16,
        color: '#4a4a4a',
        flex: 1,
        lineHeight: 22,
    },
    selectedAnswerText: {
        color: '#FF9800',
    },
    correctAnswerText: {
        color: '#4CAF50',
    },
    wrongAnswerText: {
        color: '#F44336',
    },
    correctIcon: {
        fontSize: 20,
        color: '#4CAF50',
        marginLeft: 10,
    },
    wrongIcon: {
        fontSize: 20,
        color: '#F44336',
        marginLeft: 10,
    },
    confirmButtonWrapper: {
        alignItems: 'center',
        marginBottom: 20,
    },
    confirmButton: {
        width: '80%',
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    confirmButtonDisabled: {
        shadowOpacity: 0.1,
        elevation: 2,
    },
    confirmButtonGradient: {
        flex: 1,
        borderRadius: 30,
    },
    confirmButtonBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
    },
    confirmButtonText: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 18,
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    confirmButtonTextDisabled: {
        color: 'rgba(255, 255, 255, 0.5)',
    },
    feedbackWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    feedbackBlur: {
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    feedbackContent: {
        alignItems: 'center',
    },
    correctFeedbackIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    correctFeedbackText: {
        fontFamily: 'Fustat-Bold.ttf',
        fontSize: 18,
        color: '#4CAF50',
        textAlign: 'center',
    },
    wrongFeedbackIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    wrongFeedbackText: {
        fontFamily: 'Fustat-SemiBold.ttf',
        fontSize: 16,
        color: '#4a4a4a',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default DuelScreen;