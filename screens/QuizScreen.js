import React, { useState } from "react";
import { StyleSheet, View, SafeAreaView, Button, TextInput, Text, Modal, TouchableOpacity, Image } from 'react-native';
import { useDispatch } from 'react-redux';
import { addUserToStore } from '../reducers/users';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { checkBody } from '../modules/checkBody';
import { BlurView } from 'expo-blur';

SplashScreen.preventAutoHideAsync();



const URL = process.env.EXPO_PUBLIC_BACKEND_URL


export default function QuizScreen({ navigation }) {


    const [unlockedQuizzes, setUnlockedQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [score, setScore] = useState(0);
    const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);



    const quizPoints = [
        {
            name: "CN Tower",
            location: {
                latitude: 43.642566,
                longitude: -79.387057
            },
            arrondissement: "Downtown",
            ville: "Toronto",
            descriptionLieu: "La CN Tower est une icône de Toronto et l'une des plus hautes structures autoportantes au monde.",
            image: "https://upload.wikimedia.org/wikipedia/commons/9/99/CN_Tower_from_base.jpg",
            badgeDebloque: "Maître des hauteurs",
            quiz: [
                {
                    question: "Quelle est la hauteur de la CN Tower ?",
                    reponses: ["553 m", "300 m", "650 m", "720 m"],
                    bonneReponseIndex: 0,
                    explication: "La CN Tower mesure 553 mètres de hauteur.",
                    theme: "Architecture",
                    difficulte: "Facile",
                    points: 5
                },
                {
                    question: "Dans quelle ville se situe la CN Tower ?",
                    reponses: ["Vancouver", "Toronto", "Ottawa", "Montréal"],
                    bonneReponseIndex: 1,
                    explication: "La CN Tower se trouve dans le centre-ville de Toronto.",
                    theme: "Géographie",
                    difficulte: "Facile",
                    points: 5
                },
                {
                    question: "Que signifie 'CN' dans CN Tower ?",
                    reponses: ["Canada North", "Canadian Network", "Canadian National", "Central Node"],
                    bonneReponseIndex: 2,
                    explication: "CN signifie Canadian National, l'entreprise ferroviaire à l'origine de la tour.",
                    theme: "Culture G",
                    difficulte: "Moyenne",
                    points: 10
                },
                {
                    question: "Quel élément spectaculaire attire les touristes à la CN Tower ?",
                    reponses: ["Un jardin suspendu", "Un cinéma 4D", "Le plancher de verre", "Un aquarium"],
                    bonneReponseIndex: 2,
                    explication: "La tour possède un plancher de verre qui surplombe le vide.",
                    theme: "Tourisme",
                    difficulte: "Facile",
                    points: 5
                },
                {
                    question: "La CN Tower est-elle encore la plus haute tour du monde ?",
                    reponses: ["Oui", "Non", "Oui mais seulement au Canada", "Elle n'a jamais été la plus haute"],
                    bonneReponseIndex: 1,
                    explication: "Elle a été la plus haute jusqu'en 2009, mais a été dépassée par la Burj Khalifa.",
                    theme: "Architecture",
                    difficulte: "Moyenne",
                    points: 10
                }
            ]
        },
        {
            name: "Royal Ontario Museum",
            location: {
                latitude: 43.667710,
                longitude: -79.394777
            },
            arrondissement: "Yorkville",
            ville: "Toronto",
            descriptionLieu: "Le Royal Ontario Museum (ROM) est l’un des plus grands musées d’histoire naturelle et de culture mondiale au Canada.",
            image: "https://upload.wikimedia.org/wikipedia/commons/f/f1/Royal_Ontario_Museum-Toronto-2014.jpg",
            badgeDebloque: "Explorateur du ROM",
            quiz: [
                {
                    question: "Quel type de musée est le ROM ?",
                    reponses: ["Musée d'art moderne", "Musée militaire", "Musée d’histoire naturelle et culturelle", "Musée des sciences"],
                    bonneReponseIndex: 2,
                    explication: "Le ROM abrite à la fois des expositions de sciences naturelles et de cultures humaines.",
                    theme: "Culture",
                    difficulte: "Facile",
                    points: 5
                },
                {
                    question: "Dans quelle ville est situé le ROM ?",
                    reponses: ["Montréal", "Toronto", "Ottawa", "Vancouver"],
                    bonneReponseIndex: 1,
                    explication: "Le Royal Ontario Museum se trouve à Toronto, au Canada.",
                    theme: "Géographie",
                    difficulte: "Facile",
                    points: 5
                },
                {
                    question: "Quelle structure moderne s’ajoute à l’entrée du musée ?",
                    reponses: ["La Pyramide", "Le Crystal", "La Voûte", "La Spirale"],
                    bonneReponseIndex: 1,
                    explication: "L’entrée du ROM a été transformée avec l'ajout du Michael Lee-Chin Crystal.",
                    theme: "Architecture",
                    difficulte: "Moyenne",
                    points: 10
                },
                {
                    question: "Quelle grande exposition retrouve-t-on au ROM ?",
                    reponses: ["Avions de guerre", "Dinosaures", "Peintures de Picasso", "Astronomie"],
                    bonneReponseIndex: 1,
                    explication: "Le ROM est célèbre pour sa galerie des dinosaures.",
                    theme: "Sciences naturelles",
                    difficulte: "Facile",
                    points: 5
                },
                {
                    question: "Combien de visiteurs accueille le ROM chaque année (approx.) ?",
                    reponses: ["500 000", "1 million", "2 millions", "5 millions"],
                    bonneReponseIndex: 2,
                    explication: "Le ROM attire en moyenne 1,3 à 2 millions de visiteurs par an.",
                    theme: "Culture",
                    difficulte: "Moyenne",
                    points: 10
                }
            ]
        },
        {
            name: "Distillery District",
            location: {
                latitude: 43.650313,
                longitude: -79.359743
            },
            arrondissement: "Old Toronto",
            ville: "Toronto",
            descriptionLieu: "Le Distillery District est un quartier historique connu pour ses bâtiments industriels victoriens et son ambiance artistique.",
            image: "https://upload.wikimedia.org/wikipedia/commons/8/81/Distillery_District_Toronto.jpg",
            badgeDebloque: "Explorateur du District",
            quiz: [
                {
                    question: "Que trouvait-on à l’origine dans le Distillery District ?",
                    reponses: ["Un centre commercial", "Une gare", "Une distillerie", "Une école"],
                    bonneReponseIndex: 2,
                    explication: "Il s'agissait à l'origine de la Gooderham & Worts Distillery.",
                    theme: "Histoire locale",
                    difficulte: "Facile",
                    points: 5
                },
                {
                    question: "Quel style architectural prédomine ?",
                    reponses: ["Art déco", "Gothique", "Victorienne industrielle", "Moderne brutaliste"],
                    bonneReponseIndex: 2,
                    explication: "Les bâtiments sont de style victorien industriel en brique rouge.",
                    theme: "Architecture",
                    difficulte: "Moyenne",
                    points: 10
                },
                {
                    question: "Quel type d’événements s’y déroule souvent ?",
                    reponses: ["Foires agricoles", "Festivals d’art", "Courses de chevaux", "Marchés financiers"],
                    bonneReponseIndex: 1,
                    explication: "Le quartier accueille de nombreux festivals artistiques et expositions.",
                    theme: "Culture",
                    difficulte: "Facile",
                    points: 5
                },
                {
                    question: "Dans quel film ce lieu a-t-il été utilisé ?",
                    reponses: ["Chicago", "Inception", "Titanic", "The Shape of Water"],
                    bonneReponseIndex: 0,
                    explication: "Des scènes du film Chicago ont été tournées dans ce quartier.",
                    theme: "Cinéma",
                    difficulte: "Moyenne",
                    points: 10
                },
                {
                    question: "Comment est-il classé au niveau du patrimoine ?",
                    reponses: ["Site archéologique", "Site du patrimoine mondial", "Lieu historique national", "Zone écologique protégée"],
                    bonneReponseIndex: 2,
                    explication: "Le Distillery District est un lieu historique national du Canada.",
                    theme: "Patrimoine",
                    difficulte: "Moyenne",
                    points: 10
                }
            ]
        },
        {
            name: "High Park",
            location: {
                latitude: 43.646548,
                longitude: -79.463698
            },
            arrondissement: "West End",
            ville: "Toronto",
            descriptionLieu: "High Park est le plus grand parc public de Toronto, célèbre pour ses cerisiers en fleurs et ses sentiers boisés.",
            image: "https://upload.wikimedia.org/wikipedia/commons/6/6e/High_Park_Toronto.jpg",
            badgeDebloque: "Gardien du parc",
            quiz: [
                {
                    question: "Quelle est la taille de High Park ?",
                    reponses: ["50 hectares", "100 hectares", "161 hectares", "200 hectares"],
                    bonneReponseIndex: 2,
                    explication: "High Park couvre environ 161 hectares.",
                    theme: "Géographie locale",
                    difficulte: "Moyenne",
                    points: 10
                },
                {
                    question: "Que peut-on voir au printemps à High Park ?",
                    reponses: ["Tulipes", "Cerisiers en fleurs", "Chênes rouges", "Lilas bleus"],
                    bonneReponseIndex: 1,
                    explication: "Les cerisiers japonais en fleur attirent chaque année de nombreux visiteurs.",
                    theme: "Nature",
                    difficulte: "Facile",
                    points: 5
                },
                {
                    question: "High Park abrite-t-il un zoo ?",
                    reponses: ["Oui", "Non"],
                    bonneReponseIndex: 0,
                    explication: "Oui, un petit zoo gratuit avec bisons, lamas et cerfs y est présent.",
                    theme: "Faune urbaine",
                    difficulte: "Facile",
                    points: 5
                },
                {
                    question: "Qui a offert High Park à la ville ?",
                    reponses: ["John Howard", "William Lyon Mackenzie", "David Crombie", "Kathleen Wynne"],
                    bonneReponseIndex: 0,
                    explication: "John Howard, un architecte, a légué le terrain à la ville au XIXe siècle.",
                    theme: "Histoire de Toronto",
                    difficulte: "Moyenne",
                    points: 10
                },
                {
                    question: "Quel sport populaire peut-on pratiquer à High Park ?",
                    reponses: ["Escalade", "Surf", "Baseball", "Ski nautique"],
                    bonneReponseIndex: 2,
                    explication: "Des terrains de baseball sont disponibles dans le parc.",
                    theme: "Activités",
                    difficulte: "Facile",
                    points: 5
                }
            ]
        }
    ];


    useEffect(() => {
        // Simule la position de l'utilisateur (exemple proche de CN Tower)
        const userLat = 43.650200;
        const userLng = -79.359600;


        const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
            const R = 6371e3;
            const toRad = (x) => (x * Math.PI) / 180;

            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) *
                Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) ** 2;

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        // Filtrage automatique des quiz débloqués
        const nearby = quizPoints.filter((point) => {
            const d = getDistanceInMeters(
                userLat,
                userLng,
                point.location.latitude,
                point.location.longitude
            );
            return d < 10000; // si distance < 100m
        });

        setUnlockedQuizzes(nearby);
    }, []);


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
                    <Text style={styles.message}>🧭 Balade-toi dans ta ville et débloque des Tiquizs !</Text>
                ) : (
                    <View style={{ width: '100%' }}>
                        <Text style={styles.title}>🎯 À TOI DE JOUER</Text>
                        {unlockedQuizzes.map((quiz, index) =>
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedQuiz(quiz);
                                    setCurrentQuestionIndex(0);
                                    setScore(0);
                                    setShowModal(true);
                                }}
                            >
                                <View style={styles.card}>
                                    <Text style={styles.quizTitle}>{quiz.name}</Text>
                                    <Text style={styles.quizDesc}>{quiz.badgeDebloque}</Text>

                                    {/* Affichage du score en live */}
                                    <Text style={styles.score}>
                                        Score : {selectedQuiz?.name === quiz.name ? score : 0} / {quiz.quiz.reduce((acc, q) => acc + q.points, 0)}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                        )}
                    </View>
                )}
                <Modal visible={showModal} animationType="slide" transparent={true}>
                    <View style={styles.modalContainer}>
                        <View style={styles.quizModal}>
                            {selectedQuiz && currentQuestionIndex < selectedQuiz.quiz.length ? (
                                <>
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
                                            onPress={() => {
                                                if (selectedAnswerIndex !== null) return; // Empêche double-clic

                                                setSelectedAnswerIndex(i);

                                                const isCorrect = i === selectedQuiz.quiz[currentQuestionIndex].bonneReponseIndex;
                                                if (isCorrect) {
                                                    setScore(prev => prev + selectedQuiz.quiz[currentQuestionIndex].points);
                                                }

                                                // Attendre un peu pour montrer la couleur avant de passer à la suite
                                                setTimeout(() => {
                                                    setCurrentQuestionIndex(prev => prev + 1);
                                                    setSelectedAnswerIndex(null);
                                                }, 500); // délai d'0.5 seconde
                                            }}
                                        >
                                            <Text style={styles.answerText}>{reponse}</Text>
                                        </TouchableOpacity>

                                    ))}
                                </>
                            ) : (
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setShowModal(false)}
                                >
                                    <Text style={styles.closeText}>Fermer</Text>
                                </TouchableOpacity>
                            )}
                        </View>
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
        // backgroundColor: 'black',
    },
    glass: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '80%',
        padding: 20,
        borderRadius: 33,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',

        // 🌫️ Flou
        overflow: 'hidden',

        // ☁️ Ombre douce pour effet clay
        shadowColor: '#000',
        shadowOffset: { width: 6, height: 4 }, // ➡️ vers la droite
        shadowOpacity: 0.25,
        shadowRadius: 8,

        // Android
        elevation: 10,
    },
    message: {
        fontSize: 18,
        textAlign: 'center',
        fontWeight: '600',
        color: '#4a3b79',
        paddingVertical: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#3a2e6b',
        marginBottom: 10,
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 20,
        padding: 10,
        marginBottom: 10,
    },
    quizTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c1d53',
    },
    quizDesc: {
        fontSize: 14,
        color: '#555',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    quizModal: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    question: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    answerButton: {
        backgroundColor: '#eeddfd',
        padding: 12,
        borderRadius: 12,
        marginVertical: 6,
        width: '100%',
    },
    answerText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#4a3b79',
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 10,
        color: '#4a3b79',
    },
    resultScore: {
        fontSize: 18,
        marginBottom: 20,
    },
    closeButton: {
        backgroundColor: '#d5c3f3',
        padding: 10,
        borderRadius: 10,
    },
    closeText: {
        fontWeight: '600',
        color: '#3a2e6b',
    },
    score: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#3a2e6b',
    },
    correctAnswer: {
        backgroundColor: '#4CAF50', // vert
        borderColor: '#388E3C',
    },

    wrongAnswer: {
        backgroundColor: '#F44336', // rouge
        borderColor: '#C62828',
    },





});
