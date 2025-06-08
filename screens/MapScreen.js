import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Image, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../redux/userSlice';
import { LocationService } from '../services/LocationService.js';

export default function MapScreen() {
  const dispatch = useDispatch();
  const { userData, isLoggedIn } = useSelector((state) => state.user);

  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [locationPermissions, setLocationPermissions] = useState(null);

  const mapRef = useRef(null);

  // États possibles d'un quiz
  const QUIZ_STATES = {
    LOCKED: 'locked',           // Rouge - Trop loin
    UNLOCKED: 'unlocked',       // Jaune - Débloqué mais pas fait
    COMPLETED: 'completed',     // Bleu - Fait mais pas 100%
    PERFECT: 'perfect'          // Vert - 100% réussi
  };
  // tabelau de question a mapper avant d avoir le pbranhcment bdd
  const quizPoints =
    [
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d43"
        },
        "name": "Tour Eiffel",
        "location": {
          "latitude": "48.8584",
          "longitude": "2.2945"
        },
        "arrondissement": "7ème",
        "ville": "Paris",
        "descriptionLieu": "Monument emblématique de Paris, construite pour l'Exposition universelle de 1889.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/1024px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg",
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
          },
          {
            "question": "Qui est l'architecte de la Tour Eiffel ?",
            "reponses": ["Gustave Eiffel", "Henri Labrouste", "Eugène Viollet-le-Duc", "Charles Garnier"],
            "bonneReponseIndex": 0,
            "explication": "Gustave Eiffel a conçu cette tour qui porte son nom.",
            "theme": "Architecture",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "Quelle est la hauteur de la Tour Eiffel avec son antenne ?",
            "reponses": ["300 mètres", "324 mètres", "350 mètres", "276 mètres"],
            "bonneReponseIndex": 1,
            "explication": "La Tour Eiffel mesure 324 mètres avec son antenne.",
            "theme": "Architecture",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d44"
        },
        "name": "Cathédrale Notre-Dame de Paris",
        "location": {
          "latitude": "48.8530",
          "longitude": "2.3499"
        },
        "arrondissement": "4ème",
        "ville": "Paris",
        "descriptionLieu": "Chef-d'œuvre de l'architecture gothique française, située sur l'île de la Cité.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Notre_Dame_de_Paris_2013-07-24.jpg/1024px-Notre_Dame_de_Paris_2013-07-24.jpg",
        "badgeDebloque": "Gardien de Notre-Dame",
        "themeLieu": "Architecture religieuse",
        "quiz": [
          {
            "question": "En quel siècle a commencé la construction de Notre-Dame ?",
            "reponses": ["11ème siècle", "12ème siècle", "13ème siècle", "14ème siècle"],
            "bonneReponseIndex": 1,
            "explication": "La construction a commencé au 12ème siècle en 1163.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "Quel écrivain a rendu Notre-Dame célèbre avec son roman ?",
            "reponses": ["Alexandre Dumas", "Victor Hugo", "Émile Zola", "Honoré de Balzac"],
            "bonneReponseIndex": 1,
            "explication": "Victor Hugo avec 'Notre-Dame de Paris' en 1831.",
            "theme": "Littérature",
            "difficulte": "Facile",
            "points": 5
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d45"
        },
        "name": "Arc de Triomphe",
        "location": {
          "latitude": "48.8738",
          "longitude": "2.2950"
        },
        "arrondissement": "8ème",
        "ville": "Paris",
        "descriptionLieu": "Monument emblématique situé au centre de la place Charles-de-Gaulle.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Arc_de_Triomphe%2C_Paris_21_October_2010.jpg/1024px-Arc_de_Triomphe%2C_Paris_21_October_2010.jpg",
        "badgeDebloque": "Conquérant de l'Arc",
        "themeLieu": "Histoire militaire",
        "quiz": [
          {
            "question": "Qui a ordonné la construction de l'Arc de Triomphe ?",
            "reponses": ["Louis XIV", "Napoléon Bonaparte", "Charles de Gaulle", "François Mitterrand"],
            "bonneReponseIndex": 1,
            "explication": "Napoléon Ier a ordonné sa construction en 1806.",
            "theme": "Histoire",
            "difficulte": "Facile",
            "points": 10
          },
          {
            "question": "Combien d'avenues partent de la place de l'Étoile ?",
            "reponses": ["8", "10", "12", "14"],
            "bonneReponseIndex": 2,
            "explication": "12 avenues partent de la place Charles-de-Gaulle (ancienne place de l'Étoile).",
            "theme": "Géographie",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d46"
        },
        "name": "Musée du Louvre",
        "location": {
          "latitude": "48.8606",
          "longitude": "2.3376"
        },
        "arrondissement": "1er",
        "ville": "Paris",
        "descriptionLieu": "Le plus grand musée d'art au monde, ancien palais royal.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Louvre_Museum_Wikimedia_Commons.jpg/1024px-Louvre_Museum_Wikimedia_Commons.jpg",
        "badgeDebloque": "Gardien des Trésors",
        "themeLieu": "Art et Culture",
        "quiz": [
          {
            "question": "Quel tableau célèbre se trouve au Louvre ?",
            "reponses": ["La Nuit étoilée", "La Joconde", "Guernica", "La Liberté guidant le peuple"],
            "bonneReponseIndex": 1,
            "explication": "La Joconde de Léonard de Vinci est l'œuvre la plus célèbre du Louvre.",
            "theme": "Art",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "En quelle année la pyramide du Louvre a-t-elle été inaugurée ?",
            "reponses": ["1985", "1987", "1989", "1991"],
            "bonneReponseIndex": 2,
            "explication": "La pyramide de verre a été inaugurée en 1989.",
            "theme": "Architecture",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d47"
        },
        "name": "Basilique du Sacré-Cœur",
        "location": {
          "latitude": "48.8867",
          "longitude": "2.3431"
        },
        "arrondissement": "18ème",
        "ville": "Paris",
        "descriptionLieu": "Basilique romano-byzantine située au sommet de la butte Montmartre.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Sacre_Coeur_at_Dawn.jpg/1024px-Sacre_Coeur_at_Dawn.jpg",
        "badgeDebloque": "Pèlerin de Montmartre",
        "themeLieu": "Architecture religieuse",
        "quiz": [
          {
            "question": "En quelle année la construction du Sacré-Cœur a-t-elle commencé ?",
            "reponses": ["1875", "1880", "1885", "1890"],
            "bonneReponseIndex": 0,
            "explication": "La construction a commencé en 1875 après la guerre de 1870.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "De quelle pierre est construite la basilique ?",
            "reponses": ["Grès", "Travertin", "Marbre", "Calcaire"],
            "bonneReponseIndex": 1,
            "explication": "Le Sacré-Cœur est construit en travertin, pierre qui blanchit avec le temps.",
            "theme": "Architecture",
            "difficulte": "Difficile",
            "points": 15
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d48"
        },
        "name": "Champs-Élysées",
        "location": {
          "latitude": "48.8698",
          "longitude": "2.3076"
        },
        "arrondissement": "8ème",
        "ville": "Paris",
        "descriptionLieu": "Avenue la plus célèbre de Paris, reliant la Concorde à l'Arc de Triomphe.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Champs-Elysees_at_night.jpg/1024px-Champs-Elysees_at_night.jpg",
        "badgeDebloque": "Promeneur des Champs",
        "themeLieu": "Commerce et Culture",
        "quiz": [
          {
            "question": "Quelle est la longueur des Champs-Élysées ?",
            "reponses": ["1,5 km", "1,9 km", "2,3 km", "2,7 km"],
            "bonneReponseIndex": 1,
            "explication": "Les Champs-Élysées mesurent 1,9 kilomètre de long.",
            "theme": "Géographie",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "Quel événement sportif se termine traditionnellement sur les Champs-Élysées ?",
            "reponses": ["Marathon de Paris", "Tour de France", "Roland-Garros", "Paris-Roubaix"],
            "bonneReponseIndex": 1,
            "explication": "Le Tour de France se termine chaque année sur les Champs-Élysées.",
            "theme": "Sport",
            "difficulte": "Facile",
            "points": 5
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d49"
        },
        "name": "Panthéon",
        "location": {
          "latitude": "48.8462",
          "longitude": "2.3464"
        },
        "arrondissement": "5ème",
        "ville": "Paris",
        "descriptionLieu": "Monument néoclassique qui abrite les tombeaux des grands hommes de la nation.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Pantheon_Paris_BLS.jpg/1024px-Pantheon_Paris_BLS.jpg",
        "badgeDebloque": "Gardien des Grands Hommes",
        "themeLieu": "Histoire",
        "quiz": [
          {
            "question": "Qui repose au Panthéon parmi ces personnalités ?",
            "reponses": ["Napoléon", "Voltaire", "Louis XIV", "Charles de Gaulle"],
            "bonneReponseIndex": 1,
            "explication": "Voltaire fut l'un des premiers à être inhumé au Panthéon en 1791.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "Quelle expérience célèbre a eu lieu au Panthéon ?",
            "reponses": ["Pendule de Foucault", "Radioactivité", "Rayons X", "Électricité"],
            "bonneReponseIndex": 0,
            "explication": "Le pendule de Foucault a démontré la rotation de la Terre au Panthéon en 1851.",
            "theme": "Sciences",
            "difficulte": "Difficile",
            "points": 15
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d50"
        },
        "name": "Place de la Concorde",
        "location": {
          "latitude": "48.8656",
          "longitude": "2.3212"
        },
        "arrondissement": "8ème",
        "ville": "Paris",
        "descriptionLieu": "Plus grande place de Paris, ornée de l'obélisque de Louxor.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Place_de_la_Concorde_Paris.jpg/1024px-Place_de_la_Concorde_Paris.jpg",
        "badgeDebloque": "Maître de la Concorde",
        "themeLieu": "Histoire",
        "quiz": [
          {
            "question": "Comment s'appelait initialement la place de la Concorde ?",
            "reponses": ["Place Louis XV", "Place Royale", "Place Napoléon", "Place de la République"],
            "bonneReponseIndex": 0,
            "explication": "Elle s'appelait place Louis XV avant la Révolution.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "D'où provient l'obélisque qui orne la place ?",
            "reponses": ["Égypte", "Rome", "Grèce", "Turquie"],
            "bonneReponseIndex": 0,
            "explication": "L'obélisque de Louxor provient du temple de Louxor en Égypte.",
            "theme": "Histoire",
            "difficulte": "Facile",
            "points": 5
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d51"
        },
        "name": "Opéra Garnier",
        "location": {
          "latitude": "48.8720",
          "longitude": "2.3319"
        },
        "arrondissement": "9ème",
        "ville": "Paris",
        "descriptionLieu": "Opéra somptueux construit sous Napoléon III, chef-d'œuvre de l'architecture théâtrale.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Opera_Garnier_Grand_Staircase_2.jpg/1024px-Opera_Garnier_Grand_Staircase_2.jpg",
        "badgeDebloque": "Fantôme de l'Opéra",
        "themeLieu": "Art et Culture",
        "quiz": [
          {
            "question": "Qui est l'architecte de l'Opéra Garnier ?",
            "reponses": ["Charles Garnier", "Henri Labrouste", "Gustave Eiffel", "Viollet-le-Duc"],
            "bonneReponseIndex": 0,
            "explication": "Charles Garnier a conçu cet opéra qui porte son nom.",
            "theme": "Architecture",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "Quel roman célèbre se déroule à l'Opéra Garnier ?",
            "reponses": ["Les Misérables", "Le Fantôme de l'Opéra", "Notre-Dame de Paris", "Le Comte de Monte-Cristo"],
            "bonneReponseIndex": 1,
            "explication": "Le Fantôme de l'Opéra de Gaston Leroux se déroule dans ce lieu.",
            "theme": "Littérature",
            "difficulte": "Facile",
            "points": 5
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d52"
        },
        "name": "Place Vendôme",
        "location": {
          "latitude": "48.8677",
          "longitude": "2.3297"
        },
        "arrondissement": "1er",
        "ville": "Paris",
        "descriptionLieu": "Place octogonale célèbre pour ses bijoutiers de luxe et sa colonne Vendôme.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Place_Vend%C3%B4me%2C_Paris_2005.jpg/1024px-Place_Vend%C3%B4me%2C_Paris_2005.jpg",
        "badgeDebloque": "Empereur du Luxe",
        "themeLieu": "Commerce de Luxe",
        "quiz": [
          {
            "question": "Que représente la statue au sommet de la colonne Vendôme ?",
            "reponses": ["Louis XIV", "Napoléon", "Henri IV", "Louis XV"],
            "bonneReponseIndex": 1,
            "explication": "Une statue de Napoléon Ier surmonte la colonne Vendôme.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "Avec quoi la colonne Vendôme a-t-elle été construite ?",
            "reponses": ["Marbre", "Bronze des canons ennemis", "Pierre de taille", "Fer forgé"],
            "bonneReponseIndex": 1,
            "explication": "La colonne a été construite avec le bronze des canons pris à l'ennemi à Austerlitz.",
            "theme": "Histoire",
            "difficulte": "Difficile",
            "points": 15
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d53"
        },
        "name": "Pont Alexandre III",
        "location": {
          "latitude": "48.8634",
          "longitude": "2.3136"
        },
        "arrondissement": "7ème/8ème",
        "ville": "Paris",
        "descriptionLieu": "Pont le plus orné de Paris, construit pour l'Exposition universelle de 1900.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Pont_Alexandre_III%2C_Paris_2010.jpg/1024px-Pont_Alexandre_III%2C_Paris_2010.jpg",
        "badgeDebloque": "Gardien du Pont Doré",
        "themeLieu": "Architecture",
        "quiz": [
          {
            "question": "En l'honneur de qui le pont Alexandre III a-t-il été nommé ?",
            "reponses": ["Alexandre le Grand", "Tsar Alexandre III", "Alexandre Dumas", "Alexandre Eiffel"],
            "bonneReponseIndex": 1,
            "explication": "Le pont est nommé en l'honneur du tsar Alexandre III de Russie.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "Pour quelle exposition le pont a-t-il été construit ?",
            "reponses": ["1889", "1900", "1925", "1937"],
            "bonneReponseIndex": 1,
            "explication": "Le pont a été construit pour l'Exposition universelle de 1900.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d54"
        },
        "name": "Les Invalides",
        "location": {
          "latitude": "48.8566",
          "longitude": "2.3122"
        },
        "arrondissement": "7ème",
        "ville": "Paris",
        "descriptionLieu": "Complexe architectural abritant le tombeau de Napoléon et des musées militaires.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Hotel_des_Invalides_2010.jpg/1024px-Hotel_des_Invalides_2010.jpg",
        "badgeDebloque": "Vétéran des Invalides",
        "themeLieu": "Histoire militaire",
        "quiz": [
          {
            "question": "Qui a fait construire l'Hôtel des Invalides ?",
            "reponses": ["Louis XIII", "Louis XIV", "Louis XV", "Louis XVI"],
            "bonneReponseIndex": 1,
            "explication": "Louis XIV a fait construire les Invalides pour les soldats blessés.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "Où repose exactement Napoléon aux Invalides ?",
            "reponses": ["Dans l'église", "Sous le dôme", "Dans la cour", "Dans les caves"],
            "bonneReponseIndex": 1,
            "explication": "Le tombeau de Napoléon se trouve sous le dôme des Invalides.",
            "theme": "Histoire",
            "difficulte": "Facile",
            "points": 5
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d55"
        },
        "name": "Place des Vosges",
        "location": {
          "latitude": "48.8555",
          "longitude": "2.3659"
        },
        "arrondissement": "4ème",
        "ville": "Paris",
        "descriptionLieu": "Plus ancienne place planifiée de Paris, joyau de l'architecture du 17ème siècle.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Place_des_Vosges_panorama.jpg/1024px-Place_des_Vosges_panorama.jpg",
        "badgeDebloque": "Noble des Vosges",
        "themeLieu": "Architecture",
        "quiz": [
          {
            "question": "Comment s'appelait initialement la place des Vosges ?",
            "reponses": ["Place Royale", "Place Henri IV", "Place Louis XIII", "Place Cardinal"],
            "bonneReponseIndex": 0,
            "explication": "Elle s'appelait place Royale avant de devenir place des Vosges.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "Quel écrivain célèbre a vécu place des Vosges ?",
            "reponses": ["Molière", "Victor Hugo", "Voltaire", "Balzac"],
            "bonneReponseIndex": 1,
            "explication": "Victor Hugo a vécu au numéro 6 de la place des Vosges.",
            "theme": "Littérature",
            "difficulte": "Facile",
            "points": 5
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d56"
        },
        "name": "Sainte-Chapelle",
        "location": {
          "latitude": "48.8555",
          "longitude": "2.3448"
        },
        "arrondissement": "1er",
        "ville": "Paris",
        "descriptionLieu": "Joyau de l'art gothique rayonnant, célèbre pour ses verrières exceptionnelles.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Sainte_Chapelle_Interior_Stained_Glass.jpg/1024px-Sainte_Chapelle_Interior_Stained_Glass.jpg",
        "badgeDebloque": "Gardien des Vitraux",
        "themeLieu": "Architecture religieuse",
        "quiz": [
          {
            "question": "Qui a fait construire la Sainte-Chapelle ?",
            "reponses": ["Louis VII", "Philippe Auguste", "Saint Louis", "Charles V"],
            "bonneReponseIndex": 2,
            "explication": "Saint Louis (Louis IX) a fait construire la Sainte-Chapelle vers 1248.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "Quelle relique était conservée à la Sainte-Chapelle ?",
            "reponses": ["Couronne d'épines", "Saint Graal", "Suaire", "Croix du Christ"],
            "bonneReponseIndex": 0,
            "explication": "La Sainte-Chapelle abritait la couronne d'épines du Christ.",
            "theme": "Religion",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d57"
        },
        "name": "Pont Neuf",
        "location": {
          "latitude": "48.8566",
          "longitude": "2.3411"
        },
        "arrondissement": "1er",
        "ville": "Paris",
        "descriptionLieu": "Plus ancien pont de Paris encore existant, ironiquement appelé 'Pont Neuf'.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Pont_Neuf_Paris.jpg/1024px-Pont_Neuf_Paris.jpg",
        "badgeDebloque": "Gardien du Pont Neuf",
        "themeLieu": "Architecture",
        "quiz": [
          {
            "question": "Pourquoi le Pont Neuf porte-t-il ce nom paradoxal ?",
            "reponses": ["Il était neuf à l'époque", "Il a été rénové", "C'est ironique", "Erreur historique"],
            "bonneReponseIndex": 0,
            "explication": "Il s'appelait 'Pont Neuf' car il était nouveau lors de sa construction.",
            "theme": "Histoire",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "Sous quel roi le Pont Neuf a-t-il été achevé ?",
            "reponses": ["Henri III", "Henri IV", "Louis XIII", "Louis XIV"],
            "bonneReponseIndex": 1,
            "explication": "Le Pont Neuf a été achevé sous Henri IV en 1607.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d58"
        },
        "name": "Musée d'Orsay",
        "location": {
          "latitude": "48.8600",
          "longitude": "2.3266"
        },
        "arrondissement": "7ème",
        "ville": "Paris",
        "descriptionLieu": "Musée installé dans une ancienne gare, spécialisé dans l'art du 19ème siècle.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Gare_d%27Orsay_interieur.jpg/1024px-Gare_d%27Orsay_interieur.jpg",
        "badgeDebloque": "Voyageur Impressionniste",
        "themeLieu": "Art et Culture",
        "quiz": [
          {
            "question": "Qu'était le bâtiment du musée d'Orsay avant d'être un musée ?",
            "reponses": ["Palais", "Gare", "Hôpital", "Marché"],
            "bonneReponseIndex": 1,
            "explication": "Le musée d'Orsay était la gare d'Orsay, construite pour l'Exposition de 1900.",
            "theme": "Architecture",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "Quel mouvement artistique est particulièrement représenté au musée d'Orsay ?",
            "reponses": ["Cubisme", "Impressionnisme", "Surréalisme", "Art Nouveau"],
            "bonneReponseIndex": 1,
            "explication": "Le musée d'Orsay possède la plus grande collection d'œuvres impressionnistes au monde.",
            "theme": "Art",
            "difficulte": "Facile",
            "points": 5
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d59"
        },
        "name": "Place de la Bastille",
        "location": {
          "latitude": "48.8532",
          "longitude": "2.3695"
        },
        "arrondissement": "11ème",
        "ville": "Paris",
        "descriptionLieu": "Place symbolique de la Révolution française, où se dressait l'ancienne forteresse.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Colonne_de_Juillet_place_de_la_Bastille.jpg/1024px-Colonne_de_Juillet_place_de_la_Bastille.jpg",
        "badgeDebloque": "Révolutionnaire de la Bastille",
        "themeLieu": "Histoire",
        "quiz": [
          {
            "question": "En quelle année la Bastille a-t-elle été prise ?",
            "reponses": ["1789", "1790", "1791", "1792"],
            "bonneReponseIndex": 0,
            "explication": "La prise de la Bastille a eu lieu le 14 juillet 1789, début de la Révolution française.",
            "theme": "Histoire",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "Que commémore la colonne de Juillet sur la place ?",
            "reponses": ["Révolution de 1789", "Révolution de 1830", "Commune de 1871", "Libération de 1944"],
            "bonneReponseIndex": 1,
            "explication": "La colonne de Juillet commémore les journées révolutionnaires de juillet 1830.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d60"
        },
        "name": "Cimetière du Père-Lachaise",
        "location": {
          "latitude": "48.8619",
          "longitude": "2.3936"
        },
        "arrondissement": "20ème",
        "ville": "Paris",
        "descriptionLieu": "Plus grand cimetière de Paris, véritable musée à ciel ouvert.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Pere-Lachaise_Cemetery_Paris.jpg/1024px-Pere-Lachaise_Cemetery_Paris.jpg",
        "badgeDebloque": "Gardien des Étoiles Éternelles",
        "themeLieu": "Histoire",
        "quiz": [
          {
            "question": "Quel chanteur célèbre repose au Père-Lachaise ?",
            "reponses": ["Elvis Presley", "Jim Morrison", "John Lennon", "Michael Jackson"],
            "bonneReponseIndex": 1,
            "explication": "Jim Morrison, leader des Doors, est enterré au Père-Lachaise depuis 1971.",
            "theme": "Musique",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "Quel écrivain français célèbre y repose également ?",
            "reponses": ["Victor Hugo", "Marcel Proust", "Émile Zola", "Alexandre Dumas"],
            "bonneReponseIndex": 1,
            "explication": "Marcel Proust, auteur d'À la recherche du temps perdu, repose au Père-Lachaise.",
            "theme": "Littérature",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d61"
        },
        "name": "Tour Montparnasse",
        "location": {
          "latitude": "48.8421",
          "longitude": "2.3219"
        },
        "arrondissement": "15ème",
        "ville": "Paris",
        "descriptionLieu": "Gratte-ciel emblématique offrant une vue panoramique sur tout Paris.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Tour_Montparnasse_2011.jpg/1024px-Tour_Montparnasse_2011.jpg",
        "badgeDebloque": "Grimpeur des Nuages",
        "themeLieu": "Architecture moderne",
        "quiz": [
          {
            "question": "Quelle est la hauteur de la Tour Montparnasse ?",
            "reponses": ["200 mètres", "210 mètres", "220 mètres", "230 mètres"],
            "bonneReponseIndex": 1,
            "explication": "La Tour Montparnasse mesure 210 mètres de hauteur.",
            "theme": "Architecture",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "En quelle année la Tour Montparnasse a-t-elle été inaugurée ?",
            "reponses": ["1973", "1975", "1977", "1979"],
            "bonneReponseIndex": 0,
            "explication": "La Tour Montparnasse a été inaugurée en 1973.",
            "theme": "Histoire",
            "difficulte": "Difficile",
            "points": 15
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d62"
        },
        "name": "Musée Rodin",
        "location": {
          "latitude": "48.8553",
          "longitude": "2.3161"
        },
        "arrondissement": "7ème",
        "ville": "Paris",
        "descriptionLieu": "Musée dédié au sculpteur Auguste Rodin, avec jardin de sculptures.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Musee_Rodin_Paris.jpg/1024px-Musee_Rodin_Paris.jpg",
        "badgeDebloque": "Sculpteur de Génie",
        "themeLieu": "Art",
        "quiz": [
          {
            "question": "Quelle est l'œuvre la plus célèbre de Rodin ?",
            "reponses": ["Le Baiser", "Le Penseur", "Les Bourgeois de Calais", "La Porte de l'Enfer"],
            "bonneReponseIndex": 1,
            "explication": "Le Penseur est l'œuvre la plus célèbre d'Auguste Rodin.",
            "theme": "Art",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "Dans quel hôtel particulier le musée Rodin est-il installé ?",
            "reponses": ["Hôtel Biron", "Hôtel de Soubise", "Hôtel Carnavalet", "Hôtel Matignon"],
            "bonneReponseIndex": 0,
            "explication": "Le musée Rodin est installé dans l'hôtel Biron depuis 1919.",
            "theme": "Architecture",
            "difficulte": "Difficile",
            "points": 15
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d63"
        },
        "name": "Institut de France",
        "location": {
          "latitude": "48.8577",
          "longitude": "2.3376"
        },
        "arrondissement": "6ème",
        "ville": "Paris",
        "descriptionLieu": "Siège de l'Académie française et d'autres académies prestigieuses.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Institut_de_France_-_Academie_francaise.jpg/1024px-Institut_de_France_-_Academie_francaise.jpg",
        "badgeDebloque": "Immortel de l'Académie",
        "themeLieu": "Culture",
        "quiz": [
          {
            "question": "Combien l'Académie française compte-t-elle de membres ?",
            "reponses": ["35", "40", "45", "50"],
            "bonneReponseIndex": 1,
            "explication": "L'Académie française compte 40 membres, appelés les 'Immortels'.",
            "theme": "Culture",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "Qui a fondé l'Académie française ?",
            "reponses": ["Louis XIII", "Richelieu", "Louis XIV", "Mazarin"],
            "bonneReponseIndex": 1,
            "explication": "Le cardinal de Richelieu a fondé l'Académie française en 1635.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d64"
        },
        "name": "Place Saint-Michel",
        "location": {
          "latitude": "48.8534",
          "longitude": "2.3440"
        },
        "arrondissement": "6ème",
        "ville": "Paris",
        "descriptionLieu": "Place animée du Quartier Latin, avec sa célèbre fontaine Saint-Michel.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Fontaine_Saint-Michel_Paris.jpg/1024px-Fontaine_Saint-Michel_Paris.jpg",
        "badgeDebloque": "Archange du Quartier Latin",
        "themeLieu": "Quartier étudiant",
        "quiz": [
          {
            "question": "Que représente la fontaine Saint-Michel ?",
            "reponses": ["Saint Michel et le dragon", "Saint Michel et l'ange", "Saint Michel seul", "La bataille"],
            "bonneReponseIndex": 0,
            "explication": "La fontaine représente saint Michel terrassant le dragon.",
            "theme": "Art",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "Sous quel empereur la fontaine a-t-elle été construite ?",
            "reponses": ["Napoléon Ier", "Napoléon III", "Louis-Philippe", "Charles X"],
            "bonneReponseIndex": 1,
            "explication": "La fontaine Saint-Michel a été construite sous Napoléon III.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d65"
        },
        "name": "Musée Picasso",
        "location": {
          "latitude": "48.8597",
          "longitude": "2.3627"
        },
        "arrondissement": "3ème",
        "ville": "Paris",
        "descriptionLieu": "Musée consacré à Pablo Picasso, installé dans l'hôtel Salé du Marais.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Hotel_Sale_Musee_Picasso.jpg/1024px-Hotel_Sale_Musee_Picasso.jpg",
        "badgeDebloque": "Maître du Cubisme",
        "themeLieu": "Art moderne",
        "quiz": [
          {
            "question": "Dans quel quartier se trouve le musée Picasso ?",
            "reponses": ["Montmartre", "Le Marais", "Saint-Germain", "Latin"],
            "bonneReponseIndex": 1,
            "explication": "Le musée Picasso se trouve dans le quartier du Marais.",
            "theme": "Géographie",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "Quel mouvement artistique Picasso a-t-il co-fondé ?",
            "reponses": ["Impressionnisme", "Cubisme", "Surréalisme", "Fauvisme"],
            "bonneReponseIndex": 1,
            "explication": "Pablo Picasso a co-fondé le mouvement cubiste avec Georges Braque.",
            "theme": "Art",
            "difficulte": "Facile",
            "points": 5
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d66"
        },
        "name": "Conciergerie",
        "location": {
          "latitude": "48.8560",
          "longitude": "2.3459"
        },
        "arrondissement": "1er",
        "ville": "Paris",
        "descriptionLieu": "Ancien palais royal devenu prison révolutionnaire, où fut emprisonnée Marie-Antoinette.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Conciergerie_Paris.jpg/1024px-Conciergerie_Paris.jpg",
        "badgeDebloque": "Geôlier de la Révolution",
        "themeLieu": "Histoire",
        "quiz": [
          {
            "question": "Quelle reine célèbre fut emprisonnée à la Conciergerie ?",
            "reponses": ["Marie-Antoinette", "Catherine de Médicis", "Anne d'Autriche", "Marie de Médicis"],
            "bonneReponseIndex": 0,
            "explication": "Marie-Antoinette fut emprisonnée à la Conciergerie avant son exécution en 1793.",
            "theme": "Histoire",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "À quelle époque la Conciergerie était-elle un palais royal ?",
            "reponses": ["Moyen Âge", "Renaissance", "17ème siècle", "18ème siècle"],
            "bonneReponseIndex": 0,
            "explication": "La Conciergerie était un palais royal au Moyen Âge, résidence des rois capétiens.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d67"
        },
        "name": "Palais de Justice",
        "location": {
          "latitude": "48.8557",
          "longitude": "2.3454"
        },
        "arrondissement": "1er",
        "ville": "Paris",
        "descriptionLieu": "Siège de la justice parisienne, construit sur l'île de la Cité.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Palais_de_Justice_Paris.jpg/1024px-Palais_de_Justice_Paris.jpg",
        "badgeDebloque": "Juge Suprême",
        "themeLieu": "Justice",
        "quiz": [
          {
            "question": "Sur quelle île se trouve le Palais de Justice ?",
            "reponses": ["Île Saint-Louis", "Île de la Cité", "Île aux Cygnes", "Île Seguin"],
            "bonneReponseIndex": 1,
            "explication": "Le Palais de Justice se trouve sur l'île de la Cité, cœur historique de Paris.",
            "theme": "Géographie",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "Quelle était la fonction originelle de ce lieu ?",
            "reponses": ["Prison", "Palais royal", "Marché", "Cathédrale"],
            "bonneReponseIndex": 1,
            "explication": "C'était à l'origine un palais royal avant de devenir le siège de la justice.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d68"
        },
        "name": "Église Saint-Germain-des-Prés",
        "location": {
          "latitude": "48.8544",
          "longitude": "2.3344"
        },
        "arrondissement": "6ème",
        "ville": "Paris",
        "descriptionLieu": "Plus ancienne église de Paris, cœur du quartier intellectuel de Saint-Germain.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Eglise_Saint-Germain-des-Pres.jpg/1024px-Eglise_Saint-Germain-des-Pres.jpg",
        "badgeDebloque": "Gardien des Prés",
        "themeLieu": "Architecture religieuse",
        "quiz": [
          {
            "question": "À quel siècle remonte la fondation de cette église ?",
            "reponses": ["5ème siècle", "6ème siècle", "7ème siècle", "8ème siècle"],
            "bonneReponseIndex": 1,
            "explication": "L'église Saint-Germain-des-Prés a été fondée au 6ème siècle.",
            "theme": "Histoire",
            "difficulte": "Difficile",
            "points": 15
          },
          {
            "question": "Quel philosophe célèbre fréquentait les cafés du quartier ?",
            "reponses": ["Voltaire", "Sartre", "Descartes", "Rousseau"],
            "bonneReponseIndex": 1,
            "explication": "Jean-Paul Sartre fréquentait les cafés de Saint-Germain-des-Prés.",
            "theme": "Philosophie",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d69"
        },
        "name": "Pont des Arts",
        "location": {
          "latitude": 48.8583,
          "longitude": 2.3375
        },
        "arrondissement": "1er/6ème",
        "ville": "Paris",
        "descriptionLieu": "Pont piétonnier emblématique reliant le Louvre à l'Institut de France.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Pont_des_Arts%2C_Paris_2010.jpg/1024px-Pont_des_Arts%2C_Paris_2010.jpg",
        "badgeDebloque": "Amoureux des Arts",
        "themeLieu": "Romantisme",
        "quiz": [
          {
            "question": "Pourquoi le Pont des Arts était-il célèbre chez les amoureux ?",
            "reponses": ["Cadenas d'amour", "Demandes en mariage", "Rendez-vous", "Légende"],
            "bonneReponseIndex": 0,
            "explication": "Les couples y accrochaient des cadenas d'amour avant leur retrait en 2015.",
            "theme": "Culture",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "Quels monuments relie le Pont des Arts ?",
            "reponses": ["Louvre et Notre-Dame", "Louvre et Institut", "Orsay et Louvre", "Concorde et Tuileries"],
            "bonneReponseIndex": 1,
            "explication": "Le Pont des Arts relie le Louvre à l'Institut de France.",
            "theme": "Géographie",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d70"
        },
        "name": "Église Saint-Sulpice",
        "location": {
          "latitude": 48.8510,
          "longitude": 2.3347
        },
        "arrondissement": "6ème",
        "ville": "Paris",
        "descriptionLieu": "Grande église parisienne connue pour ses dimensions imposantes et son orgue.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Saint-Sulpice_Paris.jpg/1024px-Saint-Sulpice_Paris.jpg",
        "badgeDebloque": "Organiste de Saint-Sulpice",
        "themeLieu": "Architecture religieuse",
        "quiz": [
          {
            "question": "Quelle particularité architecturale Saint-Sulpice possède-t-elle ?",
            "reponses": ["Tours identiques", "Tours différentes", "Pas de tours", "Une seule tour"],
            "bonneReponseIndex": 1,
            "explication": "Saint-Sulpice a deux tours de hauteurs différentes, jamais achevées.",
            "theme": "Architecture",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "Dans quel roman populaire Saint-Sulpice apparaît-elle ?",
            "reponses": ["Notre-Dame de Paris", "Da Vinci Code", "Les Misérables", "Le Comte de Monte-Cristo"],
            "bonneReponseIndex": 1,
            "explication": "Saint-Sulpice joue un rôle important dans le Da Vinci Code de Dan Brown.",
            "theme": "Littérature",
            "difficulte": "Facile",
            "points": 5
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d71"
        },
        "name": "Jardin du Luxembourg",
        "location": {
          "latitude": 48.8462,
          "longitude": 2.3372
        },
        "arrondissement": "6ème",
        "ville": "Paris",
        "descriptionLieu": "Grand jardin parisien avec son palais, lieu de détente au cœur de la ville.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Jardin_du_Luxembourg_Paris.jpg/1024px-Jardin_du_Luxembourg_Paris.jpg",
        "badgeDebloque": "Promeneur du Luxembourg",
        "themeLieu": "Nature urbaine",
        "quiz": [
          {
            "question": "Quelle institution siège au Palais du Luxembourg ?",
            "reponses": ["Assemblée nationale", "Sénat", "Conseil constitutionnel", "Élysée"],
            "bonneReponseIndex": 1,
            "explication": "Le Sénat français siège au Palais du Luxembourg depuis 1879.",
            "theme": "Politique",
            "difficulte": "Moyenne",
            "points": 10
          },
          {
            "question": "Qui a fait aménager le jardin du Luxembourg ?",
            "reponses": ["Marie de Médicis", "Anne d'Autriche", "Catherine de Médicis", "Madame de Pompadour"],
            "bonneReponseIndex": 0,
            "explication": "Marie de Médicis a fait aménager le jardin au 17ème siècle.",
            "theme": "Histoire",
            "difficulte": "Moyenne",
            "points": 10
          }
        ]
      },
      {
        "_id": {
          "$oid": "68446c823eaa6f50bd436d72"
        },
        "name": "Place de la République",
        "location": {
          "latitude": 48.8676,
          "longitude": 2.3632
        },
        "arrondissement": "11ème",
        "ville": "Paris",
        "descriptionLieu": "Grande place symbolique de la République française et lieu de rassemblement.",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Place_de_la_Republique_Paris.jpg/1024px-Place_de_la_Republique_Paris.jpg",
        "badgeDebloque": "Citoyen de la République",
        "themeLieu": "Politique",
        "quiz": [
          {
            "question": "Que représente la statue au centre de la place ?",
            "reponses": ["Liberté", "République", "Justice", "Fraternité"],
            "bonneReponseIndex": 1,
            "explication": "La statue représente la République française, œuvre de Morice.",
            "theme": "Art",
            "difficulte": "Facile",
            "points": 5
          },
          {
            "question": "Combien de rues convergent vers la place de la République ?",
            "reponses": ["5", "7", "9", "11"],
            "bonneReponseIndex": 2,
            "explication": "9 rues et boulevards convergent vers la place de la République.",
            "theme": "Géographie",
            "difficulte": "Difficile",
            "points": 15
          }
        ]
      }
    ]

    ;




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

  // Déterminer l'état d'un quiz
  const getQuizState = (quiz) => {
    if (!userLocation) return QUIZ_STATES.LOCKED;

    const quizId = quiz._id.$oid;
    const distance = getDistanceInMeters(
      userLocation.latitude,
      userLocation.longitude,
      parseFloat(quiz.location.latitude),
      parseFloat(quiz.location.longitude)
    );

    // Vérifier si complété
    const completedQuiz = userData?.completedQuizzes?.[quizId];
    if (completedQuiz) {
      const totalPoints = quiz.quiz.reduce((acc, q) => acc + q.points, 0);
      return completedQuiz.score === totalPoints ? QUIZ_STATES.PERFECT : QUIZ_STATES.COMPLETED;
    }

    // Vérifier si débloqué par la distance
    const isUnlocked = userData?.unlockedQuizzes?.includes(quizId) || distance < 100;
    return isUnlocked ? QUIZ_STATES.UNLOCKED : QUIZ_STATES.LOCKED;
  };

  // Couleur du pin selon l'état
  const getPinColor = (state) => {
    switch (state) {
      case QUIZ_STATES.LOCKED: return '#FF6B6B';     // Rouge
      case QUIZ_STATES.UNLOCKED: return '#FFD93D';   // Jaune
      case QUIZ_STATES.COMPLETED: return '#6BCF7F';  // Bleu
      case QUIZ_STATES.PERFECT: return '#4ECDC4';    // Vert
      default: return '#FF6B6B';
    }
  };

  // Description de l'état
  const getStateDescription = (state) => {
    switch (state) {
      case QUIZ_STATES.LOCKED: return "🔒 Quiz verrouillé - Approche-toi !";
      case QUIZ_STATES.UNLOCKED: return "🟡 Quiz débloqué - À toi de jouer !";
      case QUIZ_STATES.COMPLETED: return "🔵 Quiz terminé - Bonne tentative !";
      case QUIZ_STATES.PERFECT: return "🟢 Quiz parfait - Félicitations !";
      default: return "🔒 Quiz verrouillé";
    }
  };

  // Initialisation
  useEffect(() => {
    if (!isLoggedIn) return;

    const initializeLocation = async () => {
      try {
        // Demander permissions
        const permissions = await LocationService.requestPermissions();
        setLocationPermissions(permissions);

        if (!permissions.foreground) {
          setLocationError(true);
          setIsLoading(false);
          return;
        }

        // Obtenir position actuelle
        const location = await LocationService.getCurrentLocation();
        if (location) {
          setUserLocation(location.coords);

          // Démarrer géolocalisation en arrière-plan si autorisée
          if (permissions.background) {
            await LocationService.startBackgroundLocation();
          }
        }

        setIsLoading(false);

      } catch (error) {
        console.error('Erreur initialisation:', error);
        setLocationError(true);
        setIsLoading(false);
      }
    };

    initializeLocation();

    // Nettoyage à la fermeture
    return () => {
      LocationService.stopBackgroundLocation();
    };
  }, [isLoggedIn]);

  // Vérifier nouveaux déverrouillages quand la position change
  useEffect(() => {
    if (!userLocation || !userData) return;

    const checkUnlocks = () => {
      const currentUnlocked = userData.unlockedQuizzes || [];
      const newUnlocked = [];

      quizPoints.forEach((quiz) => {
        const quizId = quiz._id.$oid;
        const distance = getDistanceInMeters(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(quiz.location.latitude),
          parseFloat(quiz.location.longitude)
        );

        if (distance < 100 && !currentUnlocked.includes(quizId)) {
          newUnlocked.push(quizId);
        }
      });

      if (newUnlocked.length > 0) {
        dispatch(updateUser({
          userData: {
            ...userData,
            unlockedQuizzes: [...currentUnlocked, ...newUnlocked]
          }
        }));

        Alert.alert(
          '🎉 Nouveau quiz débloqué !',
          `Tu as débloqué ${newUnlocked.length} nouveau(x) quiz !`,
          [{ text: 'Super !', style: 'default' }]
        );
      }
    };

    checkUnlocks();
  }, [userLocation, dispatch, userData]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#fb7a68" />
        <Text style={styles.loaderText}>Localisation en cours...</Text>
      </SafeAreaView>
    );
  }

  if (locationError || !userLocation) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorMessage}>
          Autorisation de géolocalisation requise pour découvrir les quiz !
        </Text>
        {locationPermissions && !locationPermissions.background && (
          <Text style={styles.warningMessage}>
            ⚠️ Géolocalisation en arrière-plan désactivée.
            Tu devras ouvrir l'app pour débloquer les quiz.
          </Text>
        )}
      </SafeAreaView>
    );
  }

  return (
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
        if (selectedPoint) setSelectedPoint(null);
      }}
    >
      {/* Pin de l'utilisateur */}
      <Marker
        coordinate={userLocation}
        title="Ma position"
        description="Tu es ici !"
        pinColor="#007AFF"
      />

      {/* Pins des quiz avec couleurs selon l'état */}
      {quizPoints.map((point, index) => {
        const state = getQuizState(point);
        const pinColor = getPinColor(state);

        return (
          <Marker
            key={index}
            coordinate={{
              latitude: parseFloat(point.location.latitude),
              longitude: parseFloat(point.location.longitude)
            }}
            title={point.name}
            description={getStateDescription(state)}
            pinColor={pinColor}
            onPress={() => setSelectedPoint({ ...point, state })}
          />
        );
      })}

      {/* Carte info */}
      {selectedPoint && (
        <View style={[
          styles.infoCard,
          { borderLeftColor: getPinColor(selectedPoint.state) }
        ]}>
          {selectedPoint.image && selectedPoint.image.startsWith('http') && (
            <Image
              source={{ uri: selectedPoint.image }}
              style={styles.imageSide}
              resizeMode="cover"
            />
          )}
          <View style={styles.infoText}>
            <Text style={styles.title}>{selectedPoint.name}</Text>
            <Text style={styles.description}>{selectedPoint.descriptionLieu}</Text>
            <Text style={[
              styles.stateText,
              { color: getPinColor(selectedPoint.state) }
            ]}>
              {getStateDescription(selectedPoint.state)}
            </Text>
            <Text style={styles.badge}>🏅 {selectedPoint.badgeDebloque}</Text>
          </View>
        </View>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginBottom: 10,
  },
  imageSide: {
    width: 100,
    height: 150,
    borderRadius: 10,
    marginRight: 12,
  },

  infoText: {
    flex: 1,
    flexShrink: 1, // Pour éviter que ça dépasse
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
    flexDirection: 'row', // <-- affichage en ligne
    alignItems: 'center',
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
