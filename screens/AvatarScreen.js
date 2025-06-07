import React, { useState, useEffect, useRef } from "react";
import {
    StyleSheet,
    View,
    SafeAreaView,
    TextInput,
    Text,
    TouchableOpacity,
    FlatList,
    Image,
    Dimensions,
    Animated,
} from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get("window");

export default function AvatarScreen() {
    // const [loaded] = useFonts({
    //     "Fustat-ExtraBold.ttf": require("../assets/fonts/Fustat-ExtraBold.ttf"),
    // });

    // useEffect(() => {
    //     if (loaded) SplashScreen.hideAsync();
    // }, [loaded]);

    // if (!loaded) return null;

    const [signUpUsername, setSignUpUsername] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState(null);

    const images = [
        require("../assets/avatars/avatar01.png"),
        require("../assets/avatars/avatar02.png"),
        require("../assets/avatars/avatar03.png"),
    ];

    const handleRegister = () => {
        if (!selectedAvatar || signUpUsername.trim() === "") {
            alert("Choisis un avatar et un pseudo !");
            return;
        }
        console.log("Pseudo :", signUpUsername);
        console.log("Avatar sélectionné :", selectedAvatar);
    };

    return (
        <View style={styles.container}>
            <SafeAreaView />

            <View style={styles.avatarContainer}>
                <Text style={styles.text}>Personnalise</Text>
                <Text style={styles.subtitle}>ton profil</Text>
                <FlatList
                    data={images}
                    horizontal
                    keyExtractor={(_, index) => index.toString()}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carousel}
                    renderItem={({ item }) => (
                        <AnimatedAvatar
                            image={item}
                            selected={selectedAvatar === item}
                            onPress={() => setSelectedAvatar(item)}
                        />
                    )}
                />
            </View>

            <TextInput
                placeholder="Ton pseudo"
                placeholderTextColor="#636773"
                style={styles.input}
                onChangeText={setSignUpUsername}
                value={signUpUsername}
            />

            <TouchableOpacity onPress={handleRegister} style={styles.button}>
                <Text style={styles.buttonText}>C'est parti !</Text>
            </TouchableOpacity>
        </View>
    );
}

const AnimatedAvatar = ({ image, selected, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: selected ? 1.2 : 1,
            useNativeDriver: true,
        }).start();
    }, [selected]);

    return (
        <TouchableOpacity onPress={onPress}>
            <Animated.Image
                source={image}
                style={[
                    styles.image,
                    selected && styles.selectedImage,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#85CAE4",
        alignItems: "center",
    },
    avatarContainer: {
        width: "100%",
        height: "70%",
        alignItems: "center",
    },
    text: {
        fontSize: 32,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: "#FFFFFF",
        paddingTop: 80,
    },
    subtitle: {
        fontSize: 32,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: "white",
        marginBottom: 20,
        marginTop: -25,
    },
    carousel: {
        paddingHorizontal: 15,
        alignItems: "center",
    },
    image: {
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: 100,
        marginHorizontal: 15,
        elevation: 3,
    },
    selectedImage: {
        borderWidth: 3,
        borderColor: "white",
    },
    input: {
        width: "80%",
        height: 70,
        backgroundColor: "#F0F0F0",
        borderRadius: 12,
        marginTop: 10,
        paddingLeft: 20,
        fontSize: 15,
    },
    button: {
        width: "80%",
        height: 72,
        backgroundColor: "#FF8527",
        marginTop: 20,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        elevation: 3,
    },
    buttonText: {
        fontSize: 20,
        fontFamily: "Fustat-ExtraBold.ttf",
        color: "white",
    },
});
