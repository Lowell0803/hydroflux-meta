import React, { useLayoutEffect } from "react";
import { ScrollView, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

const DataPrivacy = () => {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Privacy and Data Protection</Text>

        <Text style={styles.paragraph}>
          We are committed to protecting your privacy and ensuring the security of your personal information in compliance with Republic Act No. 10173 (Data Privacy Act of 2012) and the Philippine Constitution. By using this app, you acknowledge and agree to the following:
        </Text>

        <Text style={styles.sectionTitle}>Collection and Use of Personal Data:</Text>
        <Text style={styles.paragraph}>
          We collect, process, and store your personal data only for legitimate purposes, such as providing our services, improving user experience, and fulfilling legal obligations. Your data will not be shared, sold, or disclosed to third parties without your consent, except as required by law.
        </Text>

        <Text style={styles.sectionTitle}>Privacy of Communications:</Text>
        <Text style={styles.paragraph}>
          In accordance with Article III, Section 3 of the Philippine Constitution, the privacy of your communications and correspondence is inviolable. We will not intercept, access, or disclose your private communications unless authorized by law or with your explicit consent.
        </Text>

        <Text style={styles.sectionTitle}>Data Subject Rights:</Text>
        <Text style={styles.paragraph}>Under the Data Privacy Act, you have the right to access, correct, update, or delete your personal data. You may also object to or restrict the processing of your data. To exercise these rights, please contact us at bytesquad@gmail.com.</Text>

        <Text style={styles.sectionTitle}>Data Security:</Text>
        <Text style={styles.paragraph}>We implement reasonable and appropriate physical, technical, and organizational measures to protect your personal data from unauthorized access, disclosure, alteration, or destruction.</Text>

        <Text style={styles.sectionTitle}>Retention of Data:</Text>
        <Text style={styles.paragraph}>Your personal data will only be retained for as long as necessary to fulfill the purposes for which it was collected, or as required by applicable laws and regulations.</Text>

        <Text style={styles.sectionTitle}>Updates to this Policy:</Text>
        <Text style={styles.paragraph}>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We encourage you to review this section periodically.</Text>

        <Text style={styles.paragraph}>By continuing to use this app, you consent to the collection, processing, and storage of your personal data as described in this Privacy Policy and in compliance with the Data Privacy Act of 2012 and the Philippine Constitution.</Text>

        <Text style={styles.sectionTitle}>References:</Text>
        <Text style={styles.paragraph}>
          https://privacy.gov.ph/wp-content/uploads/2022/01/DPA_QuickGuidefolder_10191.pdf{"\n"}
          https://www.respicio.ph/bar/2025/political-law-and-public-international-law/the-bill-of-rights/privacy-of-communications-and-correspondence/ra-no-10173-or-the-data-privacy-act
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161622",
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 15,
  },
  paragraph: {
    fontSize: 16,
    color: "#FFF",
    marginTop: 10,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DataPrivacy;
