import React, { useEffect, useState } from 'react';
import {
    View, StyleSheet, Text, TouchableOpacity, Image, Modal, TextInput, FlatList,
    Dimensions, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get("window");

export default function ProfileScreen({ navigation }) {
    const [loaded] = useFonts({
        "Fustat-Bold.ttf": require("../assets/fonts/Fustat-Bold.ttf"),
        "Fustat-ExtraBold.ttf": require("../assets/fonts/Fustat-ExtraBold.ttf"),
        "Fustat-Regular.ttf": require("../assets/fonts/Fustat-Regular.ttf"),
        "Fustat-SemiBold.ttf": require("../assets/fonts/Fustat-SemiBold.ttf"),
    });

    useEffect(() => {
        if (loaded) SplashScreen.hideAsync();
    }, [loaded]);

    if (!loaded) return null;

    const [username, setUsername] = useState("Détective Fabio");
    const [avatar, setAvatar] = useState(require("../assets/avatars/avatar01.png"));
    const [email, setEmail] = useState("fabio@detective.com");
    const [score, setScore] = useState(420);
    const [finishedScenario, setFinishedScenarios] = useState([
        "L'Affaire du Manoir", "Le Code d'Or"
    ]);

    const [modalUserVisible, setUserModalVisible] = useState(false);
    const [modalAvatarVisible, setAvatarModalVisible] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState(null);

    const images = [
        require("../assets/avatars/avatar01.png"),
        require("../assets/avatars/avatar02.png"),
        require("../assets/avatars/avatar03.png"),

    ];

    const handleLogout = () => {
        alert("Déconnexion fictive (pas de backend)");
        navigation.navigate("Home");
    };

    const updateUsername = () => {
        if (!newUsername.trim()) {
            alert("Le pseudo ne peut pas être vide !");
            return;
        }
        setUsername(newUsername);
        setUserModalVisible(false);
    };

    const changeAvatar = (item) => {
        setSelectedAvatar(item);
        setAvatar(item);
    };

    return (
        <LinearGradient
            colors={['#eeddfd', '#d5c3f3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <SafeAreaView />
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <FontAwesome name='sign-out' size={30} color='#85CAE4' />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setAvatarModalVisible(true)}>
                <Image source={avatar} style={styles.avatar} />
            </TouchableOpacity>

            <Text style={styles.username}>{username}</Text>
            <Text style={styles.email}>{email}</Text>

            <TouchableOpacity onPress={() => setUserModalVisible(true)}>
                <FontAwesome name='pencil' size={24} color='#85CAE4' />
            </TouchableOpacity>

            <Text style={styles.score}>Score: {score} points</Text>

            <Text style={styles.title}>Aventures terminées :</Text>
            <ScrollView>
                {finishedScenario.map((item, index) => (
                    <Text key={index} style={styles.adventure}>{item}</Text>
                ))}
            </ScrollView>

            <TouchableOpacity onPress={() => navigation.navigate('Map')}>
                <FontAwesome name='map-o' size={32} color="white" />
            </TouchableOpacity>

            {modalUserVisible && (
                <Modal visible={modalUserVisible} transparent animationType="fade">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text>Changer de pseudo</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nouveau pseudo"
                                value={newUsername}
                                onChangeText={setNewUsername}
                            />
                            <TouchableOpacity onPress={updateUsername}>
                                <Text>Valider</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                                <Text>Annuler</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {modalAvatarVisible && (
                <Modal visible={modalAvatarVisible} transparent animationType="slide">
                    <View style={styles.modalContainer}>
                        <FlatList
                            data={images}
                            horizontal
                            keyExtractor={(_, index) => index.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => changeAvatar(item)}>
                                    <Image source={item} style={styles.avatarOption} />
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setAvatarModalVisible(false)}>
                            <Text>Valider</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "white",
        paddingTop: 40,
    },
    logoutBtn: {
        position: "absolute",
        top: 40,
        right: 20,
        backgroundColor: "white",
        borderRadius: 30,
        padding: 10,
        elevation: 5,
    },
    avatar: {
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: 100,
        marginVertical: 20,
    },
    username: {
        fontSize: 24,
        fontWeight: "bold",
    },
    email: {
        fontSize: 16,
        color: "#666",
    },
    score: {
        marginTop: 20,
        fontSize: 20,
        color: "#FF8527",
    },
    title: {
        marginTop: 30,
        fontSize: 18,
        fontWeight: "bold",
    },
    adventure: {
        fontSize: 16,
        padding: 5,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "80%",
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
    },
    input: {
        borderBottomWidth: 1,
        borderColor: "#ccc",
        marginVertical: 10,
        padding: 10,
    },
    avatarOption: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginHorizontal: 10,
    },
});
