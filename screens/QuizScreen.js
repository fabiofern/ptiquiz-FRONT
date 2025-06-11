import React, { useState, useEffect, useRef } from 'react'; // Ajout de useRef
import {
    StyleSheet, View, SafeAreaView, TextInput, Text, Modal, TouchableOpacity,
    Image, ScrollView, Alert, ActivityIndicator, Dimensions, Animated // Ajout de Dimensions et Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from "expo-splash-screen";
import { BlurView } from 'expo-blur';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../redux/userSlice';
import { RewardsService } from '../services/RewardsService';
import { useFonts } from "expo-font";
// import RewardsNotification from '../components/RewardsNotification'; // Non fourni, laissé tel quel

SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('window'); // Dimensions de l'écran pour AuroraBackground

// --- COMPOSANT : FOND DYNAMIQUE "AURORA" ---
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
// --- FIN DU COMPOSANT FOND DYNAMIQUE "AURORA" ---


export default function QuizScreen({ navigation }) {
    const URL = process.env.EXPO_PUBLIC_BACKEND_URL
    const dispatch = useDispatch();
    const { userData, isLoggedIn } = useSelector((state) => state.user);

    // Font loading
    const [loaded] = useFonts({
        "Fustat-Bold.ttf": require("../assets/fonts/Fustat-Bold.ttf"),
        "Fustat-ExtraBold.ttf": require("../assets/fonts/Fustat-ExtraBold.ttf"),
        "Fustat-Regular.ttf": require("../assets/fonts/Fustat-Regular.ttf"),
        "Fustat-SemiBold.ttf": require("../assets/fonts/Fustat-SemiBold.ttf"),
    });

    // Hide splash screen once fonts are loaded
    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    // Local states
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

    // Route protection
    useEffect(() => {
        if (!isLoggedIn) {
            navigation.navigate('Login');
        }
    }, [isLoggedIn, navigation]);

    // Fetch unlocked quizzes from API
    const fetchUnlockedQuizzes = async () => {
        if (!userData?.userID) {
            console.log('❌ No userID available');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('📚 Fetching unlocked quizzes from API...');

            const response = await fetch(`${URL}/quizz/unlocked/${userData.userID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 API unlocked response:', data);

            if (data.result && data.quiz) {
                setUnlockedQuizzes(data.quiz);
                console.log(`✅ ${data.quiz.length} unlocked quizzes loaded`);
            } else {
                console.log('ℹ️ No unlocked quizzes found');
                setUnlockedQuizzes([]);
            }
        } catch (error) {
            console.error('❌ Error fetching unlocked quizzes:', error);
            setUnlockedQuizzes([]);
        } finally {
            setLoading(false);
        }
    };

    // Load quizzes on component mount
    useEffect(() => {
        if (userData?.userID) {
            fetchUnlockedQuizzes();
        }
    }, [userData?.userID]);

    // Reload when returning to screen (focus)
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (userData?.userID) {
                fetchUnlockedQuizzes();
            }
        });
        return unsubscribe;
    }, [navigation, userData?.userID]);

    // handleNextQuestion function
    const handleNextQuestion = () => {
        if (currentQuestionIndex + 1 < selectedQuiz.quiz.length) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswerIndex(null);
        } else {
            // Quiz finished
            completeQuiz();
        }
    };

    // handleAnswer function
    const handleAnswer = (answerIndex) => {
        if (selectedAnswerIndex !== null) return;

        setSelectedAnswerIndex(answerIndex);
        const currentQuestion = selectedQuiz.quiz[currentQuestionIndex];
        const isCorrect = answerIndex === currentQuestion.bonneReponseIndex;

        if (isCorrect) {
            setQuizScore(prev => {
                const newScore = prev + currentQuestion.points;
                console.log(`✅ Correct answer! +${currentQuestion.points} points. Total score: ${newScore}`);
                return newScore;
            });
        } else {
            console.log(`❌ Wrong answer. Score remains: ${quizScore}`);
        }
    };

    // Save quiz via API
    const saveQuizToAPI = async (quizId, score, totalPoints, percentage) => {
        try {
            console.log('💾 Saving quiz via API...');

            const response = await fetch(`${URL}/quizz/complete`, {
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
                console.log('✅ Quiz saved to database successfully');
                return data;
            } else {
                console.error('❌ Quiz save error:', data.error);
            }
        } catch (error) {
            console.error('❌ API quiz save error:', error);
        }
    };

    // Calculate total user score (points obtained)
    const calculateUserTotalScore = () => {
        const completedQuizzes = userData?.completedQuizzes || {};
        return Object.values(completedQuizzes).reduce((total, quiz) => {
            return total + (quiz.score || 0);
        }, 0);
    };

    // Function to determine card color
    const getCardStyle = (percentage) => {
        if (percentage === 100) {
            // Green for perfect
            return { borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.2)' };
        } else if (percentage >= 70) {
            // Orange for good
            return { borderColor: '#FF9800', backgroundColor: 'rgba(255, 152, 0, 0.2)' };
        } else {
            // Red for needs improvement
            return { borderColor: '#F44336', backgroundColor: 'rgba(244, 67, 54, 0.2)' };
        }
    };

    // Function to determine performance emoji
    const getPerformanceEmoji = (percentage) => {
        if (percentage === 100) return '🏆'; // Perfect
        if (percentage >= 70) return '⭐'; // Good
        return '💪'; // Needs improvement
    };

    // Finalize quiz
    const completeQuiz = async () => {
        const totalPoints = selectedQuiz.quiz.reduce((acc, q) => acc + q.points, 0);
        const percentage = Math.round((quizScore / totalPoints) * 100);
        const quizId = selectedQuiz._id?.$oid || selectedQuiz._id;

        // Save via API
        await saveQuizToAPI(quizId, quizScore, totalPoints, percentage);

        // Update Redux: Add only obtained points (don't replace)
        const completedQuizzes = userData?.completedQuizzes || {};
        const previousQuizData = completedQuizzes[quizId];
        const previousScore = previousQuizData?.score || 0;

        // Calculate new total score (add only the difference)
        const currentTotalScore = calculateUserTotalScore();
        const scoreDifference = quizScore - previousScore;
        const newTotalScore = currentTotalScore + scoreDifference;

        const updatedUserData = {
            ...userData,
            score: Math.max(newTotalScore, currentTotalScore), // Never decrease score
            completedQuizzes: {
                ...completedQuizzes, // Ensure existing completed quizzes are spread
                [quizId]: {
                    name: selectedQuiz.name,
                    score: quizScore, // Points obtained in this quiz
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

        // Check rewards only if >= 80%
        if (percentage >= 80) {
            console.log(`🎉 Sufficient score (${percentage}%) to unlock rewards!`);
            const newRewards = RewardsService.checkAllRewards(updatedUserData);
            if (newRewards.length > 0) {
                // Filter special titles (only at 100%)
                const filteredRewards = newRewards.filter(reward => {
                    if (reward.type === 'title' && percentage < 100) {
                        console.log(`🚫 Title "${reward.title}" not unlocked (needs 100%, obtained ${percentage}%)`);
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
            console.log(`❌ Insufficient score (${percentage}%) to unlock rewards (minimum 80%)`);
        }

        setShowResults(true);
    };

    // Close quiz
    const closeQuiz = () => {
        setShowModal(false);
        setShowResults(false);
        setSelectedQuiz(null);
        setCurrentQuestionIndex(0);
        setQuizScore(0);
        setSelectedAnswerIndex(null);
        setNewRewards([]);
        setShowRewardsNotification(false);

        // Reload quizzes to update "completed" status
        fetchUnlockedQuizzes();
    };

    // Start a quiz
    const startQuiz = (quiz) => {
        const quizId = quiz._id?.$oid || quiz._id;
        const isCompleted = userData?.completedQuizzes?.[quizId];

        if (isCompleted) {
            Alert.alert(
                'Quiz already completed',
                `You have already completed this quiz with ${isCompleted.score}/${isCompleted.totalPoints} points (${isCompleted.percentage}%). Do you want to try again?`,
                [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes', onPress: () => initializeQuiz(quiz) }
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

    // If fonts are not loaded yet, don't render
    if (!loaded) {
        return null;
    }

    // Loading display
    if (loading) {
        return (
            <LinearGradient
                colors={['#FFF3E0', '#FFE0B2', '#FFCC80']} // Sunrise Palette
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.generalContainer}
            >
                <SafeAreaView />
                <BlurView intensity={50} tint="light" style={styles.glass}>
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color="#FF7043" /> {/* Sunrise Palette Color */}
                        <Text style={styles.message}>Loading quizzes...</Text>
                    </View>
                </BlurView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#FFF3E0', '#FFE0B2', '#FFCC80']} // Sunrise Palette
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.generalContainer}
        >
            {/* Le fond dynamique Aurora est ici, derrière le reste du contenu */}
            <AuroraBackground />

            <SafeAreaView />

            <BlurView intensity={50} tint="light" style={styles.glass}>
                {unlockedQuizzes.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.message}>🧭 Wander around your city and unlock Tiquizzes!</Text>
                        <TouchableOpacity
                            style={styles.mapButton}
                            onPress={() => navigation.navigate('MainApp')} // Navigate to MainApp
                        >
                            <Text style={styles.mapButtonText}>See Map</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.title}>🎯 TIME TO PLAY</Text>
                        <Text style={styles.subtitle}>
                            🏆 Total Score: {calculateUserTotalScore()} points
                        </Text>
                        <Text style={styles.subtitle}>
                            🔓 {unlockedQuizzes.length} quizzes unlocked
                        </Text>

                        {unlockedQuizzes.map((quiz, index) => {
                            const quizId = quiz._id?.$oid || quiz._id;
                            const completedData = userData?.completedQuizzes?.[quizId];
                            const isCompleted = !!completedData;
                            const totalPoints = quiz.quiz ? quiz.quiz.reduce((acc, q) => acc + q.points, 0) : 0;

                            // Card style based on performance
                            const cardPerformanceStyle = isCompleted ? getCardStyle(completedData.percentage) : {};

                            return (
                                <BlurView
                                    intensity={30} tint="light"
                                    key={index}
                                    style={[
                                        styles.card,
                                        { // Default liquid glass styles
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            borderColor: 'rgba(255, 255, 255, 0.7)',
                                            shadowColor: 'rgba(255, 240, 200, 0.8)', // Sunrise Glow
                                            shadowRadius: 10,
                                            elevation: 15,
                                            overflow: 'hidden', // Ensures content is clipped by border radius
                                        },
                                        // OVERRIDE with performance styles if quiz is completed
                                        isCompleted && {
                                            backgroundColor: cardPerformanceStyle.backgroundColor,
                                            borderColor: cardPerformanceStyle.borderColor,
                                            shadowColor: cardPerformanceStyle.borderColor, // Glow takes border color
                                            shadowRadius: 15, // More pronounced glow
                                            elevation: 18, // Slightly higher elevation
                                        }
                                    ]}
                                >
                                    <TouchableOpacity // Keep TouchableOpacity for interaction
                                        onPress={() => startQuiz(quiz)}
                                        style={styles.cardInnerTouch} // Internal style for touch
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
                                            Available Points: {totalPoints}
                                        </Text>
                                        {isCompleted && (
                                            <>
                                                <Text style={[
                                                    styles.completedScore,
                                                    {
                                                        color: cardPerformanceStyle.borderColor // Use border color for score
                                                    }
                                                ]}>
                                                    {getPerformanceEmoji(completedData.percentage)} Your score: {completedData.score}/{completedData.totalPoints} ({completedData.percentage}%)
                                                </Text>
                                                <Text style={styles.performanceText}>
                                                    {completedData.percentage === 100 ? '🏆 Perfect!' :
                                                        completedData.percentage >= 80 ? '⭐ Excellent!' :
                                                            completedData.percentage >= 70 ? '👍 Well done!' :
                                                                '💪 You can do better!'}
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </BlurView>
                            );
                        })}
                    </ScrollView>
                )}

                {/* Quiz Modal */}
                <Modal visible={showModal} animationType="slide" transparent={true}>
                    <View style={styles.modalContainer}>
                        <BlurView intensity={80} tint="light" style={styles.quizModal}>
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
                                                    ),
                                                    // Liquid glass styles for answer buttons
                                                    {
                                                        backgroundColor: selectedAnswerIndex === i ? undefined : 'rgba(255, 255, 255, 0.4)',
                                                        borderColor: selectedAnswerIndex === i ? undefined : 'rgba(255, 255, 255, 0.7)',
                                                        shadowColor: 'rgba(0,0,0,0.1)',
                                                        shadowOffset: { width: 0, height: 3 },
                                                        shadowOpacity: 0.15,
                                                        shadowRadius: 5,
                                                        elevation: 8,
                                                        overflow: 'hidden', // Ensures content is clipped by border radius
                                                    }
                                                ]}
                                                onPress={() => handleAnswer(i)}
                                                disabled={selectedAnswerIndex !== null}
                                            >
                                                <Text style={[
                                                    styles.answerText,
                                                    selectedAnswerIndex === i && { color: 'white', fontWeight: '600' }
                                                ]}>
                                                    {reponse}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}

                                        {/* FUN FACT - Only if correct answer */}
                                        {selectedAnswerIndex !== null &&
                                            selectedAnswerIndex === selectedQuiz.quiz[currentQuestionIndex].bonneReponseIndex && (
                                                <BlurView intensity={40} tint="light" style={styles.funFactContainer}>
                                                    <Text style={styles.funFactTitle}>💡 Did you know?</Text>
                                                    <Text style={styles.funFactText}>
                                                        {selectedQuiz.quiz[currentQuestionIndex].explication}
                                                    </Text>
                                                </BlurView>
                                            )}

                                        {/* NEXT QUESTION BUTTON - Appears after answer */}
                                        {selectedAnswerIndex !== null && (
                                            <TouchableOpacity
                                                style={styles.nextQuestionButton}
                                                onPress={handleNextQuestion}
                                            >
                                                <Text style={styles.nextQuestionText}>
                                                    {currentQuestionIndex + 1 < selectedQuiz.quiz.length
                                                        ? "Next Question →"
                                                        : "See Results 🏆"
                                                    }
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </>
                                ) : null
                            ) : (
                                <View style={styles.resultsContainer}> {/* Corrected: removed leading comment and ensured single root */}
                                    <Text style={styles.resultsTitle}>🎉 Quiz Completed!</Text>
                                    <Text style={styles.resultsScore}>
                                        Score: {quizScore}/{selectedQuiz.quiz.reduce((acc, q) => acc + q.points, 0)}
                                    </Text>
                                    <Text style={styles.resultsPercentage}>
                                        {Math.round((quizScore / selectedQuiz.quiz.reduce((acc, q) => acc + q.points, 0)) * 100)}%
                                    </Text>

                                    {/* MESSAGE BASED ON PERFORMANCE */}
                                    {(() => {
                                        const percentage = Math.round((quizScore / selectedQuiz.quiz.reduce((acc, q) => acc + q.points, 0)) * 100);
                                        if (percentage === 100) {
                                            return (
                                                <>
                                                    <Text style={styles.perfectMessage}>🏆 PERFECT! All rewards unlocked!</Text>
                                                    <Text style={styles.resultsBadge}>🏅 Badge + Title: {selectedQuiz.badgeDebloque}</Text>
                                                </>
                                            );
                                        } else if (percentage >= 80) {
                                            return (
                                                <>
                                                    <Text style={styles.excellentMessage}>⭐ Excellent! Rewards unlocked!</Text>
                                                    <Text style={styles.resultsBadge}>🏅 Badge: {selectedQuiz.badgeDebloque}</Text>
                                                </>
                                            );
                                        } else if (percentage >= 70) {
                                            return <Text style={styles.goodMessage}>👍 Well done! No reward this time.</Text>;
                                        } else {
                                            return <Text style={styles.tryAgainMessage}>💪 You can do better! Try again to unlock rewards!</Text>;
                                        }
                                    })()}

                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={closeQuiz}
                                    >
                                        <Text style={styles.closeText}>Continue</Text>
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
    // Main "Liquid Glass" container for the screen
    glass: {
        width: '95%',
        height: '88%',
        padding: 20,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: 'rgba(255, 240, 200, 1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 40,
        elevation: 60,
        overflow: 'hidden', // Ensures content is clipped by border radius
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    message: {
        fontSize: 18,
        fontFamily: "Fustat-Regular.ttf",
        textAlign: 'center',
        color: '#4a4a4a',
        paddingVertical: 20,
        marginBottom: 20,
        lineHeight: 25,
    },
    mapButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '80%',
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Liquid glass button
        borderWidth: 1.8,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.9)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 25,
    },
    mapButtonText: {
        fontSize: 18,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF9800',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    title: {
        fontSize: 28,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF7043',
        marginBottom: 10,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#4a4a4a',
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 22,
    },
    scrollContent: {
        paddingBottom: 30,
        paddingHorizontal: 5,
    },
    // Quiz Card (Liquid Glass)
    card: {
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        borderWidth: 2,
        overflow: 'hidden', // Ensures content is clipped by border radius
    },
    cardInnerTouch: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    quizTitle: {
        fontSize: 18,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#4a4a4a',
        flex: 1,
    },
    completedBadge: {
        fontSize: 24,
    },
    quizDesc: {
        fontSize: 14,
        fontFamily: "Fustat-Regular.ttf",
        color: '#666',
        marginBottom: 8,
    },
    quizPoints: {
        fontSize: 14,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#FF9800',
    },
    completedScore: {
        fontSize: 14,
        fontFamily: "Fustat-SemiBold.ttf",
        marginTop: 5,
    },
    performanceText: {
        fontSize: 12,
        fontFamily: "Fustat-Regular.ttf",
        marginTop: 3,
        color: '#4a4a4a',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    // Quiz Modal (Liquid Glass)
    quizModal: {
        width: '90%',
        maxHeight: '85%',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 25,
        padding: 25,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: 'rgba(255, 240, 200, 1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 35,
        elevation: 50,
        overflow: 'hidden', // Ensures content is clipped by border radius
    },
    quizHeader: {
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.4)',
    },
    quizName: {
        fontSize: 22,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF7043',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    questionNumber: {
        fontSize: 14,
        fontFamily: "Fustat-Regular.ttf",
        color: '#4a4a4a',
        marginTop: 5,
    },
    currentScore: {
        fontSize: 16,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#FF9800',
        marginTop: 5,
    },
    question: {
        fontSize: 18,
        fontFamily: "Fustat-SemiBold.ttf",
        marginBottom: 20,
        textAlign: 'center',
        color: '#4a4a4a',
        lineHeight: 25,
    },
    // Answer button (Liquid Glass)
    answerButton: {
        padding: 15,
        borderRadius: 15,
        marginVertical: 8,
        borderWidth: 2,
        overflow: 'hidden', // Ensures content is clipped by border radius
    },
    answerText: {
        fontSize: 16,
        fontFamily: "Fustat-Regular.ttf",
        textAlign: 'center',
        color: '#4a4a4a',
    },
    // Answers: colors adjusted to be vibrant but consistent
    correctAnswer: {
        backgroundColor: 'rgba(76, 175, 80, 0.8)',
        borderColor: '#4CAF50',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    wrongAnswer: {
        backgroundColor: 'rgba(244, 67, 54, 0.8)',
        borderColor: '#F44336',
        shadowColor: '#F44336',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    // Fun Fact (Liquid Glass)
    funFactContainer: {
        borderRadius: 15,
        padding: 18,
        marginTop: 15,
        marginBottom: 10,
        borderLeftWidth: 5,
        borderLeftColor: '#FF9800',
        // Internal glass styles
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 10,
        overflow: 'hidden', // Ensures content is clipped by border radius
    },
    funFactTitle: {
        fontSize: 16,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#FF7043',
        marginBottom: 8,
    },
    funFactText: {
        fontSize: 14,
        fontFamily: "Fustat-Regular.ttf",
        color: '#4a4a4a',
        lineHeight: 22,
        fontStyle: 'italic',
    },
    // Next question/results button (Liquid Glass)
    nextQuestionButton: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 55,
        borderRadius: 30,
        marginTop: 20,
        // Liquid glass styles
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1.8,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.9)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 25,
    },
    nextQuestionText: {
        color: '#FF9800',
        fontSize: 18,
        fontFamily: "Fustat-ExtraBold.ttf",
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    // Results container (Liquid Glass)
    resultsContainer: {
        alignItems: 'center',
        padding: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 25,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: 'rgba(255, 240, 200, 1)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 35,
        elevation: 50,
        overflow: 'hidden', // Ensures content is clipped by border radius
    },
    resultsTitle: {
        fontSize: 28,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF7043',
        marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    resultsScore: {
        fontSize: 20,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#FF9800',
        marginBottom: 10,
    },
    resultsPercentage: {
        fontSize: 36,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#4a4a4a',
        marginBottom: 20,
    },
    perfectMessage: {
        fontSize: 16,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#4CAF50',
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 22,
    },
    excellentMessage: {
        fontSize: 16,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#FF9800',
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 22,
    },
    goodMessage: {
        fontSize: 16,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#64B5F6',
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 22,
    },
    tryAgainMessage: {
        fontSize: 16,
        fontFamily: "Fustat-SemiBold.ttf",
        color: '#F44336',
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 22,
    },
    resultsBadge: {
        fontSize: 16,
        fontFamily: "Fustat-Regular.ttf",
        color: '#4a4a4a',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    // Close results button (Liquid Glass)
    closeButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '90%',
        height: 60,
        borderRadius: 30,
        marginTop: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1.8,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        shadowColor: 'rgba(255, 240, 200, 0.9)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 25,
    },
    closeText: {
        fontSize: 18,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: '#FF9800',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
});
