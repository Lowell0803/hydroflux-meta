import React from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  View,
} from "react-native";
import { images, icons } from "../constants";

const AboutUs = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.topText}>About Us</Text>
        <Text style={styles.topBody}>
          Welcome to HydroFlux, designed to empower hydroponic farmers with the
          latest in real-time data and insights for their systems. Our goal is
          to enhance the sustainability, productivity, and efficiency of
          hydroponic farming by providing easy-to-understand, actionable data at
          your fingertips.
        </Text>
        <Text style={styles.topText}>Our Goal</Text>
        <Text style={styles.topBody}>
          Our mission is to support the growth of hydroponic systems and lessen
          the human labor by providing a comprehensive mobile application that
          allows users to:
        </Text>
        <Text style={styles.bulletPoint}>
          • Monitor Real-Time Data: Track vital factors such as pH levels, water
          quality, temperature, and water levels in your hydroponic systems.
        </Text>
        <Text style={styles.bulletPoint}>
          • Analyze Trends: Access historical data and generate insights through
          graphical representations of your system's performance over different
          time periods (e.g., today, last week, last 30 days).
        </Text>
        <Text style={styles.bulletPoint}>
          • Ensure Optimal Conditions: Set alerts and notifications to help you
          maintain optimal conditions for plant growth, preventing issues before
          they arise.
        </Text>
        <Text style={styles.bulletPoint}>
          • Easy Access to Information: Provide you with essential information
          on hydroponics, best practices, and troubleshooting tips right within
          the app.
        </Text>
        <Text style={styles.topText}>Meet the Team</Text>
        <View style={styles.row1}>
          <Image
            source={icons.cslogo}
            style={styles.smallImage}
            resizeMode="contain"
          />
          <Image
            source={icons.bsulogo}
            style={styles.smallImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.person, { marginRight: 30 }]}>
            <Image
              source={images.yvan}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.text}>
              <Text style={styles.bold}>Group Leader</Text> {"\n"} Aquino, Yvan
              Lowell T.
            </Text>
          </View>
          <View style={[styles.person, { marginLeft: 20 }]}>
            <Image
              source={images.mamblez}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.text}>
              <Text style={styles.bold}>Thesis Adviser</Text> {"\n"} Lampayan,
              Valentine Blez L.
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.person}>
            <Image
              source={images.roen}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.text}>Jumaquio, Roen Isaac S.J.</Text>
          </View>
          <View style={styles.person}>
            <Image
              source={images.jelo}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.text}>Rosal, Ramil Angelo Jan M.</Text>
          </View>
          <View style={styles.person}>
            <Image
              source={images.noren}
              style={styles.image}
              resizeMode="contain"
            />
            <Text style={styles.text}>Belonio, Noren Ester C.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  scrollContainer: {
    alignItems: "center",
  },
  topText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 25,
    textAlign: "left",
    marginRight: "15%",
    marginTop: 20,
    marginBottom: "5%",
    width: "80%",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  row1: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: "5%",
  },
  person: {
    alignItems: "center",
    marginHorizontal: 10,
    width: "30%",
  },
  smallImage: {
    width: 100,
    height: 100,
    marginHorizontal: "18%",
    marginBottom: "5%",
    marginTop: "-5%",
  },
  image: {
    width: 110,
    height: 120,
    marginVertical: 10,
  },
  text: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
  },
  topBody: {
    color: "white",
    fontSize: 18,
    textAlign: "justify",
    marginHorizontal: "5%",
    width: "95%",
  },
  bold: {
    fontWeight: "bold",
  },
  bulletPoint: {
    color: "white",
    fontSize: 16,
    width: "90%",
    textAlign: "left",
    marginLeft: "10%",
    marginBottom: 10,
    marginTop: "5%",
  },
});

export default AboutUs;
