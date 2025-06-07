import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const mapRef = useRef(null);

  // tabelau de question a mapper avant d avoir le pbranhcment bdd
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
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError(true);
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
      setIsLoading(false);
    })();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#009EBA" />
        <Text style={styles.loaderText}>Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (locationError || !userLocation) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorMessage}>
          Autorisation de géolocalisation refusée ou indisponible.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    // <SafeAreaView style={{ flex: 1 }}>
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      onPress={() => {
        if (selectedPoint) setSelectedPoint(null); // 👉 Fermer la fiche si elle est ouverte
      }}
    >
      {/* Pin de l'utilisateur */}
      <Marker coordinate={userLocation} />

      {/* Pins des lieux quiz */}
      {quizPoints.map((point, index) => (
        <Marker
          key={index}
          coordinate={point.location}
          title={point.name}
          onPress={() => {
            setSelectedPoint(point); // nouveau pin → affiche
          }}
        />
      ))}

      {/* Carte info visible seulement si un lieu est sélectionné */}
      {selectedPoint ? (
        <View style={styles.infoCard}>
          <Text style={styles.title}>{selectedPoint.name}</Text>
          <Text style={styles.description}>{selectedPoint.descriptionLieu}</Text>
          <Text style={styles.description2}>Approche toi d'ici pour débloquer ce Tiquizz</Text>
          <Text style={styles.badge}>🏅 {selectedPoint.badgeDebloque}</Text>
        </View>
      ) : (<View style={styles.infoCardHidden}></View>)}
    </MapView>


    // </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#85CAE4",
  },
  loaderText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    marginTop: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: "#FF6347",
    textAlign: "center",
    padding: 20,
  },
  infoCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#f6836c',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  infoCardHidden: {
    opacity: 0
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#333',
  },
  description2: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  badge: {
    marginTop: 10,
    fontWeight: '600',
    color: '#6b4caf',
  },

});
