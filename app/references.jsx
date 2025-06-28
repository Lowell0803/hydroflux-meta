import React from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  View,
} from "react-native";

// Handle link press function
const handleLinkPress = (url) => {
  Linking.openURL(url).catch((err) =>
    console.error("Failed to open link: ", err)
  );
};

const References = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>References</Text>

        <View style={styles.referenceContainer}>
          <Text style={styles.referenceText}>
            Oliver R. Alaijos. n.d.{" "}
            <Text style={styles.italic}>
              Title: Guide to Lettuce Farming Through Hydroponics.
            </Text>
          </Text>
          <TouchableOpacity
            onPress={() =>
              handleLinkPress(
                "https://drive.google.com/file/d/1MFAIohw8wELCf-j8-HsZa1tLmcNWwfrJ/view?usp=drive_link"
              )
            }
          >
            <Text style={styles.link}>GUIDE-HYDROPONICS.pdf</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.referenceContainer}>
          <Text style={styles.referenceText}>
            Hardeep Singh & Dunn Bruce. 2016.{" "}
            <Text style={styles.italic}>
              Electrical Conductivity and pH Guide for Hydroponics
            </Text>
          </Text>
          <TouchableOpacity
            onPress={() =>
              handleLinkPress(
                "https://drive.google.com/file/d/1BgGhudwmuiqpExGTKVEAb3ir25hgknzY/view?usp=drive_link"
              )
            }
          >
            <Text style={styles.link}>
              electrical-conductivity-and-ph-guide-for-hydroponics-hla-6722.pdf
            </Text>
          </TouchableOpacity>
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
  title: {
    color: "white",
    fontWeight: "bold",
    fontSize: 25,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  referenceContainer: {
    marginVertical: 10,
    padding: 15,
    borderRadius: 8,
    width: "100%",
    borderColor: "#E0E0E0",
    borderWidth: 1,
  },
  referenceText: {
    color: "white",
    fontSize: 16,
    marginBottom: 5,
  },
  link: {
    color: "#1E90FF",
    textDecorationLine: "underline",
    fontSize: 16,
  },
  italic: {
    fontWeight: "italic",
  },
});

export default References;
