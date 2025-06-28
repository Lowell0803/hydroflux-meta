import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const Terms = () => {
  const navigation = useNavigation();
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
      setIsScrolledToEnd(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={styles.title}>Terms of Service</Text>

        <Text style={styles.sectionTitle}>Welcome to HydroFlux!</Text>
        <Text style={styles.text}>
          By using this app, you agree to the following terms of service. Please
          read these terms carefully before using the application.
        </Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            1. Account Registration and Security
          </Text>
          <Text style={styles.text}>
            1.1 To access the app's features, you must create an account using a
            valid email and password.
          </Text>
          <Text style={styles.text}>
            1.2 You are responsible for maintaining the confidentiality of your
            login credentials.
          </Text>
          <Text style={styles.text}>
            1.3 You agree to provide accurate and complete information during
            registration and to update your account details if they change.
          </Text>

          <Text style={styles.sectionTitle}>2. Monitoring Features</Text>
          <Text style={styles.text}>
            2.1 The app provides real-time monitoring of the following
            parameters in your hydroponic system:
          </Text>
          <Text style={styles.text}>• pH Level</Text>
          <Text style={styles.text}>• Temperature</Text>
          <Text style={styles.text}>• Water Level</Text>
          <Text style={styles.text}>• Nutrient Level</Text>
          <Text style={styles.text}>
            2.2 The app delivers data based on sensors integrated into your
            hydroponic system. It is your responsibility to ensure that the
            sensors are properly installed, calibrated, and maintained for
            accurate data collection.
          </Text>

          <Text style={styles.sectionTitle}>3. Limitation of Liability</Text>
          <Text style={styles.text}>
            3.1 The app serves as a tool to assist with monitoring your
            hydroponic system but does not guarantee plant health or growth
            outcomes.
          </Text>
          <Text style={styles.text}>
            3.2 The app is not liable for any plant damage, loss, or death
            resulting from environmental factors, system malfunctions, sensor
            inaccuracies, or user decisions based on the app's data.
          </Text>
          <Text style={styles.text}>
            3.3 Users are advised to regularly inspect their hydroponic systems
            and take appropriate action based on the app's alerts and
            recommendations.
          </Text>

          <Text style={styles.sectionTitle}>4. User Responsibilities</Text>
          <Text style={styles.text}>
            4.1 You agree to use the app in compliance with all applicable laws
            and regulations.
          </Text>
          <Text style={styles.text}>
            4.2 You understand that the app's monitoring capabilities are
            limited to the listed parameters and cannot detect or address issues
            beyond these factors.
          </Text>
          <Text style={styles.text}>
            4.3 It is your responsibility to act on the data provided by the app
            and ensure the overall maintenance of your hydroponic system.
          </Text>

          <Text style={styles.sectionTitle}>5. Disclaimer of Warranties</Text>
          <Text style={styles.text}>
            5.1 The app is provided on an "as-is" and "as-available" basis. No
            warranties, express or implied, are made regarding the app's
            performance, accuracy, or suitability for your specific needs.
          </Text>
          <Text style={styles.text}>
            5.2 The app does not guarantee uninterrupted or error-free
            operation.
          </Text>

          <Text style={styles.sectionTitle}>6. Termination of Use</Text>
          <Text style={styles.text}>
            6.1 We reserve the right to suspend or terminate your account if you
            breach these terms of service or misuse the app.
          </Text>

          <Text style={styles.sectionTitle}>
            7. Updates to the Terms of Service
          </Text>
          <Text style={styles.text}>
            7.1 We may update these terms of service from time to time.
            Continued use of the app after changes are posted constitutes
            acceptance of the updated terms.
          </Text>

          <Text style={styles.sectionTitle}>8. Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions or concerns about these terms, please
            contact us at bytesquad@gmail.com
          </Text>
        </View>

        <Text style={styles.text}>
          By registering and using HydroFlux, you acknowledge that you have
          read, understood, and agreed to these terms of service.
        </Text>

        {isScrolledToEnd && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>I understand</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 20,
  },
  scrollContainer: {
    paddingBottom: 50, // Extra space for button at the end
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "white",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    color: "white",
  },
  sectionContainer: {
    marginBottom: 20, // Adds space between sections
    padding: 15, // Adds padding inside the container
    backgroundColor: "#1f1f1f", // Dark background for contrast
    borderRadius: 10, // Rounded corners
    borderWidth: 1, // Adds border to the container
    borderColor: "#555", // Border color to make it stand out
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "left",
    color: "white",
    marginLeft: "5%",
    marginTop: "2%",
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 20,
    alignSelf: "center",
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
    width: "100%",
  },
});

export default Terms;
