import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Linking, Text, View, Button, Alert, Switch, ScrollView, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { signOutUser } from "../(auth)/sign-out";
import { useGlobalContext } from "../../context/GlobalProvider";
import { images, icons, diagnostics } from "../../constants";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { realtimeDB, auth } from "../../lib/firebase";
import Notifications from "../../components/Notifications";
import CustomNotifications from "../../components/CustomNotifications";
import { getThemeStyles } from "../../constants/themeStyles";

const Settings = () => {
  const { setUser, setIsLogged, toggleTheme } = useGlobalContext();
  const router = useRouter();

  const { theme } = useGlobalContext();
  const styles = getThemeStyles(theme, images, icons);
  const {
    backgroundColor,
    textColor,
    // textColor,
    textColorMiddleLight,
    textColorLight,
    headingTextColor,
    headingTwoTextColor,
    headingThreeTextColor,
    headingFourTextColor,
    logo,
    welcomeCards,
    buttonColor,
    buttonText,
    checkboxColor,
    dashboardCardBG,
    dashboardCardBGShadow,
    hardwareCardBG,
    hardwareCardBGShadow,
    selectPlantCardBG,
    learnYourPlantCardBG,
    cardBG,
    smallCardBG,
    dropdownCardBG,
    dropdownSubCardBG,
    greenColor,
    greenColorBlack,
    lightGreenColorBlack,
    blackColorGreen,
    greenColorWhite,
    plantIoTCardBG,
    plantDataCardBG,
    plantPrescriptionsBG,
    statsIcon,
    dateBG,
    settingsDiagnosticsBG,
    settingsCardBG,
  } = styles;

  const [isFocused, setIsFocused] = useState(false);

  const focusBorder = theme === "dark" ? "#03dac6" : "#03C9B5";
  const defaultBorder = theme === "dark" ? "#193943" : "#CCC";
  const inputBackgroundColor = theme === "dark" ? "#193943" : "#EEE";
  const inputTextColor = theme === "dark" ? "#FFF" : "#000";

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          onPress: async () => {
            await signOutUser(setUser, setIsLogged);
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Notification bell state & component (existing)
  const notifications = [
    { id: 1, message: "pH level is slightly high: 7.01" },
    { id: 2, message: "Water level is low. Check the reservoir." },
    { id: 3, message: "Nutrient concentration is optimal: 600 ppm" },
  ];
  const [showNotifications, setShowNotifications] = useState(false);
  const NotificationBell = () => (
    <TouchableOpacity style={{ marginTop: 12 }} onPress={() => setShowNotifications(!showNotifications)} className="relative">
      <Image source={icons.bell} className="w-7 h-7" resizeMode="contain" />
      {notifications.length > 0 && (
        <View className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full flex items-center justify-center">
          <Text className="text-xs font-bold text-white">{notifications.length}</Text>
        </View>
      )}
      {showNotifications && (
        <View className="absolute top-12 right-0 w-64 p-3 rounded-lg shadow-lg" style={{ backgroundColor: theme === "dark" ? "#2A2A3A" : "#FFF" }}>
          <ScrollView style={{ maxHeight: 200 }}>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <View key={notification.id} className="border-b last:border-b-0 py-2" style={{ borderColor: theme === "dark" ? "#444" : "#DDD" }}>
                  <Text className="text-sm" style={{ color: theme === "dark" ? "#FFF" : "#000" }}>
                    {notification.message}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-sm" style={{ color: theme === "dark" ? "#AAA" : "#666" }}>
                No new notifications
              </Text>
            )}
          </ScrollView>
        </View>
      )}
    </TouchableOpacity>
  );

  // --- SENSOR STATUS LOGIC ---
  // State for sensor values & MAC address
  const [sensorValues, setSensorValues] = useState({
    ph: "--",
    temperature: "--",
    waterLevel: "--",
    tds: "--",
    humidity: "--",
    ec: "--",
  });
  const [macAddress, setMacAddress] = useState(null);
  const [question, setQuestion] = useState("");

  // Subscribe to Firestore for current MAC address (using same logic as in Plant.jsx)
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const db = getFirestore();
    const userDocRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      const newMacAddress = docSnapshot.data()?.currentMacAddress;
      if (newMacAddress && newMacAddress !== macAddress) {
        setMacAddress(newMacAddress);
      }
    });
    return () => unsubscribe();
  }, [macAddress]);

  // Subscribe to the realtime database for sensor data based on macAddress
  useEffect(() => {
    if (macAddress) {
      const sensorRef = ref(realtimeDB, `${macAddress}/sensor_data`);
      const unsubscribe = onValue(sensorRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setSensorValues({
            ph: data.ph ?? "--",
            temperature: data.temperature ?? "--",
            waterLevel: data.water_level ?? "--",
            tds: data.tds ?? "--",
            humidity: data.humidity ?? "--",
            ec: data.ec ?? "--",
          });
        }
      });
      return () => unsubscribe();
    }
  }, [macAddress]);

  useEffect(() => {
    console.log(sensorValues);
  }, [sensorValues]);

  const handleSubmitInquiry = () => {
    if (!question.trim()) {
      Alert.alert("Please enter a question", "Your inquiry cannot be empty.");
      return;
    }

    const currentUser = auth.currentUser;
    const userEmail = currentUser ? currentUser.email : "Unknown User";
    const subject = `Inquiry from ${userEmail}`;
    const body = question;
    const mailtoURL = `mailto:bytesquad@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailtoURL)
      .then(() => {
        Alert.alert("Inquiry Submitted", "Your inquiry email has been prepared.");
        setQuestion("");
        Keyboard.dismiss();
      })
      .catch((err) => {
        Alert.alert("Error", "Failed to open the email app.");
        console.error(err);
      });
  };

  // Determine if each sensor is "on" (non-zero value) or "off" (0 or not loaded)
  const isPhOn = sensorValues.ph !== "--" && Number(sensorValues.ph) !== 0;
  const isTdsOn = sensorValues.tds !== "--" && Number(sensorValues.tds) !== 0;
  const isEcOn = sensorValues.ec !== "--" && Number(sensorValues.ec) !== 0;
  const isLevelOn = sensorValues.waterLevel !== "--" && Number(sensorValues.waterLevel) !== 0;
  const isTempHumidityOn = (sensorValues.temperature !== "--" && Number(sensorValues.temperature) !== 0) || (sensorValues.humidity !== "--" && Number(sensorValues.humidity) !== 0);

  // For the IoT status: if at least one sensor is active, the IoT is considered "on"
  const isIotOn = isPhOn || isTdsOn || isEcOn || isLevelOn || isTempHumidityOn;

  // Build the sensor icons array using your diagnostics assets
  // Updated sensor icons array with dynamic on/off states based on the theme and sensor status
  const sensorIcons = [
    {
      key: "iot",
      image: isIotOn ? diagnostics.arduinoOn : theme === "dark" ? diagnostics.iotOffDark : diagnostics.arduinoOff,
    },
    {
      key: "ph",
      image: isPhOn ? diagnostics.phOn : theme === "dark" ? diagnostics.phOffDark : diagnostics.phOff,
    },
    {
      key: "tds",
      image: isTdsOn ? diagnostics.tdsOn : theme === "dark" ? diagnostics.tdsOffDark : diagnostics.tdsOff,
    },
    {
      key: "ec",
      image: isEcOn ? diagnostics.ecOn : theme === "dark" ? diagnostics.ecOffDark : diagnostics.ecOff,
    },
    {
      key: "level",
      image: isLevelOn ? diagnostics.levelOn : theme === "dark" ? diagnostics.levelOffDark : diagnostics.levelOff,
    },
    {
      key: "tempHumidity",
      image: isTempHumidityOn ? diagnostics.tempHumidityOn : theme === "dark" ? diagnostics.tempHumidityOffDark : diagnostics.tempHumidityOff,
    },
  ];

  // --- END SENSOR STATUS LOGIC ---

  return (
    <SafeAreaView style={{ backgroundColor }} className="flex-1">
      <ScrollView className="w-full flex-1 pb-8 px-5">
        {/* SENSOR STATUS SECTION */}
        <View className="flex-column items-center">
          <Text style={{ color: greenColorBlack, fontWeight: "900", fontSize: 22 }}>Diagnostics</Text>
          <Text style={{ color: lightGreenColorBlack, fontSize: 12, marginTop: 5 }}>MAC: {macAddress ? macAddress : "No MAC Address"}</Text>
          <View style={{ width: 250, backgroundColor: settingsDiagnosticsBG, flexDirection: "row", justifyContent: "space-around", alignItems: "center", marginVertical: 20, marginHorizontal: 20, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 15 }}>
            {sensorIcons.map((sensor) => (
              <Image key={sensor.key} source={sensor.image} style={{ width: 30, height: 30 }} resizeMode="contain" />
            ))}
          </View>
        </View>

        <View className="mt-6 mb-3 p-4 bg-gray-800 rounded-lg flex-column" style={{ backgroundColor: settingsCardBG }}>
          <View className="flex-row items-center gap-x-4 mb-2">
            <Image style={{ tintColor: greenColor }} source={icons.inquiry} className="w-7 h-7" resizeMode="contain" />
            <Text style={{ fontSize: 16, color: textColor, fontWeight: "500" }} className="text-lg text-white font-psemibold mb-2">
              Do you have any questions?
            </Text>
          </View>

          <TextInput
            placeholder="What do I do if..."
            placeholderTextColor="#A1A1B0"
            value={question}
            onChangeText={setQuestion}
            multiline
            numberOfLines={4}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              width: "100%",
              height: 64,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginVertical: 4,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: isFocused ? focusBorder : defaultBorder,
              backgroundColor: inputBackgroundColor,
              color: inputTextColor,
              fontSize: 16,
              fontWeight: "600",
              textAlignVertical: "top",
            }}
          />
          <TouchableOpacity onPress={handleSubmitInquiry} style={{ alignSelf: "center", width: 150, backgroundColor: "#18daa3", paddingVertical: 7 }} className="mt-3 rounded-lg">
            <Text style={{ color: "#151522", fontWeight: 800 }} className="text-center text-lg">
              Submit
            </Text>
          </TouchableOpacity>
        </View>

        {/* DARK MODE TOGGLE */}
        <View className="flex-row items-center justify-between mb-3" style={{ height: 50, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: settingsCardBG, borderRadius: 10 }}>
          <View className="flex-row items-center gap-x-4">
            <Image source={images.darkMode} className="w-7 h-7" resizeMode="contain" />
            <Text style={{ fontSize: 16, color: textColor, fontWeight: "500" }}>Dark Mode</Text>
          </View>

          <Switch value={theme === "dark"} onValueChange={toggleTheme} thumbColor={theme === "dark" ? "#03dac6" : "#fff"} trackColor={{ false: "#767577", true: "#03dac6" }} />
        </View>
        <TouchableOpacity onPress={() => router.push("/aboutus")}>
          <View className="flex-row items-center justify-between mb-3" style={{ height: 50, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: settingsCardBG, borderRadius: 10 }}>
            <View className="flex-row items-center gap-x-4">
              <Image style={{ tintColor: greenColor }} source={icons.settingsAboutUs} className="w-7 h-7" resizeMode="contain" />
              <Text style={{ color: textColor, fontWeight: "500", fontSize: 16 }}>About Us</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/references")}>
          <View className="flex-row items-center justify-between mb-3" style={{ height: 50, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: settingsCardBG, borderRadius: 10 }}>
            <View className="flex-row items-center gap-x-4">
              <Image style={{ tintColor: greenColor }} source={icons.settingsResearch} className="w-7 h-7" resizeMode="contain" />
              <Text style={{ color: textColor, fontWeight: "500", fontSize: 16 }}>Research and References</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/tos")}>
          <View className="flex-row items-center justify-between mb-3" style={{ height: 50, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: settingsCardBG, borderRadius: 10 }}>
            <View className="flex-row items-center gap-x-4">
              <Image style={{ tintColor: greenColor }} source={icons.settingsTOS} className="w-7 h-7" resizeMode="contain" />
              <Text style={{ color: textColor, fontWeight: "500", fontSize: 16 }}>Terms of Service</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSignOut}>
          <View className="flex-row items-center justify-between mb-3" style={{ height: 50, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: settingsCardBG, borderRadius: 10 }}>
            <View className="flex-row items-center gap-x-4">
              <Image style={{ tintColor: "#e73625" }} source={icons.settingsLogout} className="w-7 h-7" resizeMode="contain" />
              <Text style={{ color: textColor, fontWeight: "500", fontSize: 16 }}>Logout</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;
