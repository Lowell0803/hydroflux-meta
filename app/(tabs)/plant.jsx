console.log("Plant component mounted");
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Modal, ScrollView, Image, Text, TouchableOpacity, View } from "react-native";
import { images, icons } from "../../constants";
import prescriptions from "../../constants/prescriptions"; // Adjust path if necessary
import { useGlobalContext } from "../../context/GlobalProvider";
import { getFirestore, doc, onSnapshot, collection, updateDoc, getDocs, getDoc } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { realtimeDB } from "../../lib/firebase";
import Notifications from "../../components/Notifications";
import { Picker } from "@react-native-picker/picker";
import CustomNotifications from "../../components/CustomNotifications";
import { getThemeStyles } from "../../constants/themeStyles";

const Plant = () => {
  // Global states from context and local component state
  const { theme, user } = useGlobalContext();

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
    blackColorGreen,
    greenColorWhite,
    plantIoTCardBG,
    plantDataCardBG,
    plantPrescriptionsBG,
  } = styles;

  const [sensorValues, setSensorValues] = useState({
    ph: "--",
    temperature: "--",
    waterLevel: "--",
    tds: "--",
    nutrient: "--",
    humidity: "--",
    ec: "--",
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [macAddress, setMacAddress] = useState(null);
  const [currentIoTName, setCurrentIoTName] = useState("");
  const [selectedPlant, setSelectedPlant] = useState("Lettuce"); // default value
  const [expanded, setExpanded] = useState({});

  // Notifications and modal control
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState({
    sensor: "",
    condition: "",
    image: null,
  });

  // Optimal ranges state
  const [optimalRanges, setOptimalRanges] = useState(null);

  const dashboardBG = theme === "dark" ? "#1E1E2C" : "#5C7AFF";
  const dashboardText = "#FFF";

  const descriptions = {
    ph: "The pH level affects nutrient availability and should be carefully maintained for optimal plant health.",
    temperature: "Temperature influences plant growth and should be controlled to promote healthy development.",
    waterLevel: "The water level should ensure that seedling cups are properly submerged without excess saturation.",
    tds: "TDS indicates nutrient concentration, and proper levels are essential for plant growth.",
    humidity: "Humidity affects plant transpiration and disease control, requiring careful management.",
    ec: "EC measures the strength of the nutrient solution, ensuring the correct nutrient concentration for plants.",
  };

  // Fetch optimal ranges when selectedPlant changes.
  useEffect(() => {
    if (!selectedPlant) return;
    const db = getFirestore();
    const fetchOptimalRanges = async () => {
      try {
        const docRef = doc(db, "optimal_ranges", selectedPlant);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOptimalRanges(docSnap.data());
        } else {
          console.log("No optimal range data found for this plant.");
          setOptimalRanges(null);
        }
      } catch (error) {
        console.error("Error fetching optimal ranges: ", error);
      }
    };
    fetchOptimalRanges();
  }, [selectedPlant]);

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;
    const db = getFirestore();
    const notificationsRef = collection(db, "users", user.uid, "notifications");
    const snapshot = await getDocs(notificationsRef);
    snapshot.forEach(async (notificationDoc) => {
      await updateDoc(doc(db, "users", user.uid, "notifications", notificationDoc.id), {
        read: true,
      });
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Helper: Map sensor key to the field name in optimalRanges.
  const mapKey = (key) => {
    if (key === "waterLevel") return "water_level";
    if (key === "ph") return "pH";
    return key;
  };

  // Helper: Determine prescription for a sensor.
  const getPrescriptionForSensor = (sensorKey, sensorValue) => {
    if (!optimalRanges || sensorValue === "--") return null;
    const optimal = optimalRanges[mapKey(sensorKey)];
    if (!optimal) return null;
    // Special handling for waterLevel: if the value is below optimal.min, use lowWaterLevel image.
    if (sensorKey === "waterLevel") {
      if (parseFloat(sensorValue) < optimal.min) {
        return { condition: "Low", image: prescriptions.lowWaterLevel };
      }
      return null;
    }
    // For temperature, map sensorKey to "temp" if needed.
    const keyPrefix = sensorKey === "temperature" ? "temperature" : sensorKey;
    if (parseFloat(sensorValue) < optimal.min) {
      return { condition: "Low", image: prescriptions[`${keyPrefix}TooLow`] };
    }
    if (parseFloat(sensorValue) > optimal.max) {
      return { condition: "High", image: prescriptions[`${keyPrefix}TooHigh`] };
    }
    return null; // within range
  };

  // Helper: Compute sensor status for the table.
  const computeStatus = (key) => {
    // If the sensor value is not available, return "No Sensor"
    if (sensorValues[key] === "--") return "No Sensor";

    const value = parseFloat(sensorValues[key]);
    if (isNaN(value)) return "No Sensor";

    // If waterLevel is 0, treat it as No Sensor
    if (key === "waterLevel" && value === 0) return "No Sensor";

    // For sensors (except waterLevel), a value of 0 is treated as "No Sensor"
    if (key !== "waterLevel" && value === 0) return "No Sensor";

    if (!optimalRanges) return "No optimal range";
    const optimal = optimalRanges[mapKey(key)];
    if (!optimal) return "No optimal range";

    // For waterLevel, only check for low readings
    if (key === "waterLevel") {
      return value < optimal.min ? "Low" : "Normal";
    }

    // For all other sensors, apply dynamic thresholds:
    if (value > optimal.max) {
      const diff = value - optimal.max;
      if (diff < 0.1 * optimal.max) return "Slightly High";
      else if (diff < 0.3 * optimal.max) return "Very High";
      else return "Abnormally High";
    } else if (value < optimal.min) {
      const diff = optimal.min - value;
      if (diff < 0.1 * optimal.min) return "Slightly Low";
      else if (diff < 0.3 * optimal.min) return "Very Low";
      else return "Abnormally Low";
    } else {
      return "Normal";
    }
  };

  // Render the merged status table. Rows with "Low" or "High" are clickable to open the prescription modal.
  const renderStatusTable = () => {
    const parameters = ["ph", "temperature", "waterLevel", "tds", "humidity", "ec"];

    return (
      <View>
        {/* Instruction Text ABOVE the Table */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "extralight",
            color: "#888888",
            textAlign: "justify",
            marginBottom: 10,
            marginLeft: 10,
            width: "95%",
            fontStyle: "italic",
            fontFamily: "Poppins-Light",
          }}
        >
          Note: If your crop is not "Good", click its status for prescriptive advice.
        </Text>

        {/* Table Container */}
        <View
          style={{
            marginTop: 2,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 5,
            overflow: "hidden",
          }}
        >
          {/* Table Header */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#f1f1f1",
              padding: 8,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontWeight: "bold",
                color: "#333",
                textAlign: "left",
                fontSize: 18,
              }}
            >
              Parameter
            </Text>
            <Text
              style={{
                flex: 1,
                fontWeight: "bold",
                color: "#333",
                textAlign: "right",
                fontSize: 18,
              }}
            >
              Status
            </Text>
          </View>

          {/* Table Rows */}
          {parameters.map((key) => {
            const status = computeStatus(key);
            const prescription = getPrescriptionForSensor(key, sensorValues[key]);

            const rowContent = (
              <View
                style={{
                  flexDirection: "row",
                  padding: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee",
                }}
              >
                <Text style={{ flex: 2, color: textColor, fontSize: 16 }}>{key === "ph" ? "pH" : key === "tds" ? "TDS" : key === "ec" ? "EC" : key === "waterLevel" ? "Water Level" : key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                <Text style={{ flex: 1, color: textColor, textAlign: "right" }}>{status}</Text>
              </View>
            );

            // Fix: Return only once inside .map()
            if ((status.includes("Low") || status.includes("High")) && prescription) {
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    setSelectedPrescription({
                      sensor: key,
                      condition: prescription.condition,
                      image: prescription.image,
                    });
                    setPrescriptionModalVisible(true);
                  }}
                >
                  {rowContent}
                </TouchableOpacity>
              );
            } else {
              return <View key={key}>{rowContent}</View>;
            }
          })}
        </View>
      </View>
    );
  };

  // NotificationBell toggles the notifications modal.
  const NotificationBell = () => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    return (
      <TouchableOpacity style={{ marginTop: 12 }} onPress={() => setShowNotifications(true)} className="relative">
        <Image source={icons.bell} className="w-7 h-7" resizeMode="contain" />
        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full flex items-center justify-center">
            <Text className="text-xs font-bold text-white">{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Listen for MAC Address and IoT Name updates from the user's Firestore document.
  useEffect(() => {
    if (!user) return;
    const db = getFirestore();
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      const data = docSnapshot.data();
      const newMacAddress = data?.currentMacAddress;
      const iotName = data?.macAddresses.find((device) => device.mac === newMacAddress)?.name || "";
      console.log("User doc fetched, macAddress:", newMacAddress, "iotName:", iotName);
      if (newMacAddress !== macAddress) {
        setMacAddress(newMacAddress);
        setCurrentIoTName(iotName);
      }
    });
    return () => unsubscribe();
  }, [user, macAddress]);

  // Listen for the selectedPlant from the device document.
  useEffect(() => {
    if (!macAddress) return;
    const db = getFirestore();
    const deviceDocRef = doc(db, "devices", macAddress);
    const unsubscribe = onSnapshot(deviceDocRef, (docSnapshot) => {
      const data = docSnapshot.data();
      const plant = data?.currentPlant || "Lettuce";
      console.log("Fetched plant from device:", plant);
      setSelectedPlant(plant);
    });
    return () => unsubscribe();
  }, [macAddress]);

  // Listen for notifications from Firestore under the current user's document.
  useEffect(() => {
    if (!user) return;
    const db = getFirestore();
    const notificationsRef = collection(db, "users", user.uid, "notifications");
    const unsubscribe = onSnapshot(
      notificationsRef,
      (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched notifications:", notificationsData);
        setNotifications(notificationsData);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Listen for realtime sensor data updates from Firebase Realtime Database.
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
          setLastUpdated(new Date().toLocaleString());
        }
      });
      return () => unsubscribe();
    }
  }, [macAddress]);

  const getStatusColor = (status) => {
    if (status === "No Sensor") return "#feda44";
    if (status === "Low") return "#e73625";
    if (status === "Good" || status === "Normal") return "#18daa3";

    // Slight variations
    if (status.includes("Slightly Low") || status.includes("Slightly High")) return "#EB5547";

    // Strong deviations
    if (status.includes("Very Low") || status.includes("Abnormally Low") || status.includes("Very High") || status.includes("Abnormally High")) return "#e73625";

    return textColor;
  };

  const renderStatusRow = (param) => {
    const status = computeStatus(param);
    const prescription = getPrescriptionForSensor(param, sensorValues[param]);

    const rowContent = (
      <View style={{ flex: 3, minWidth: 85, justifyContent: "center" }}>
        <Text style={{ color: getStatusColor(status), textAlign: "right", fontSize: 14, fontWeight: 900 }}>{status}</Text>
        <Text style={{ color: textColorMiddleLight, textAlign: "right", fontSize: 10 }}>
          {param.toLowerCase() === "ph" ? "pH Level" : param.toLowerCase() === "tds" ? "TDS" : param.toLowerCase() === "ec" ? "EC" : param.toLowerCase() === "waterlevel" ? "Water Level" : param.charAt(0).toUpperCase() + param.slice(1)}
        </Text>
      </View>
    );

    if ((status.includes("Low") || status.includes("High")) && prescription) {
      return (
        <TouchableOpacity
          key={param}
          onPress={() => {
            setSelectedPrescription({
              sensor: param,
              condition: prescription.condition,
              image: prescription.image,
            });
            setPrescriptionModalVisible(true);
          }}
        >
          {rowContent}
        </TouchableOpacity>
      );
    } else {
      return <View key={param}>{rowContent}</View>;
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor }} className="flex-1">
      <ScrollView className="w-full flex-1 pb-8 px-5">
        <View className="flex-row items-center" style={{ backgroundColor: plantIoTCardBG, borderRadius: 15, padding: 20 }}>
          <View>
            <Image source={icons.plantIoT} style={{ tintColor: greenColorBlack, width: 30, height: 30, marginRight: 12 }} resizeMode="contain" />
          </View>
          <View>
            <Text style={{ color: textColor, fontSize: 18, fontWeight: 700 }}>{currentIoTName || "No IoT Selected"}</Text>
            <Text style={{ color: textColorMiddleLight, fontSize: 12 }}>Recent Data: {lastUpdated || "No data available"}</Text>
          </View>
        </View>

        <View
          style={{
            padding: 2,
            marginBottom: 5,
          }}
        >
          {/* Section 1: Title */}
          <Text className="mb-3" style={{ fontSize: 18, color: headingFourTextColor, fontWeight: "bold", marginTop: 10, fontWeight: "800" }}>
            Environmental monitoring
          </Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
          {[
            { key: "ph", icon: icons.ph, title: "pH Level", unit: " pH" },
            { key: "temperature", icon: icons.temperature, title: "Temperature", unit: "°C" },
            { key: "waterLevel", icon: icons.level, title: "Water Level", unit: "" },
            { key: "tds", icon: icons.tds, title: "TDS", unit: " ppm" },
            { key: "humidity", icon: icons.humidity, title: "Humidity", unit: "%" },
            { key: "ec", icon: icons.nutrient, title: "EC", unit: " mS/cm" },
          ].map(({ key, icon, title, unit }) => (
            <View
              key={key}
              style={{
                width: "48%",
                marginBottom: 16,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity onPress={() => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))} style={{ backgroundColor: plantDataCardBG, padding: 10, paddingVertical: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <Image source={icon} style={{ width: 28, height: 28, marginRight: 8 }} resizeMode="contain" />
                  </View>
                  <View style={{ flexDirection: "column", alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 18, fontWeight: "600", color: textColor }}>{`${typeof sensorValues[key] === "number" ? (sensorValues[key] % 1 === 0 ? sensorValues[key] : sensorValues[key].toFixed(2)) : sensorValues[key] ?? "--"}${unit}`}</Text>
                    <Text style={{ fontSize: 12, color: textColorLight }}>{title}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              {expanded[key] && <Text style={{ fontSize: 14, marginTop: 8, color: textColorLight }}>{descriptions[key]}</Text>}
            </View>
          ))}
        </View>

        <View>
          <Text className="mb-3" style={{ fontSize: 18, color: headingFourTextColor, fontWeight: "bold", marginTop: 10, fontWeight: "800" }}>
            Optimal Values
          </Text>
        </View>

        <View className="flex-column" style={{}}>
          <View className="flex-row justify-between items-center" style={{ marginBottom: 10, backgroundColor: plantPrescriptionsBG, borderRadius: 15, padding: 20 }}>
            <View style={{ minWidth: 15, flex: 1, alignItems: "start" }}>
              <Image source={icons.phOutlineWhite} style={{ tintColor: textColor, width: 30, height: 30 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 5, alignItems: "center" }}>
              <Text style={{ color: textColor, fontSize: 16, fontWeight: 700 }}>{optimalRanges && `${optimalRanges.pH.min} - ${optimalRanges.pH.max} pH`}</Text>
            </View>
            {renderStatusRow("ph")}
          </View>
          <View className="flex-row justify-between items-center" style={{ marginBottom: 10, backgroundColor: plantPrescriptionsBG, borderRadius: 15, padding: 20 }}>
            <View style={{ minWidth: 15, flex: 1, alignItems: "start" }}>
              <Image source={icons.levelOutlineWhite} style={{ tintColor: textColor, width: 30, height: 30 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 5, alignItems: "center" }}>
              <Text style={{ color: textColor, fontSize: 16, fontWeight: 700 }}>{optimalRanges && `${optimalRanges.water_level.min} - ${optimalRanges.water_level.max}`}</Text>
            </View>
            {renderStatusRow("waterLevel")}
          </View>
          <View className="flex-row justify-between items-center" style={{ marginBottom: 10, backgroundColor: plantPrescriptionsBG, borderRadius: 15, padding: 20 }}>
            <View style={{ minWidth: 15, flex: 1, alignItems: "start" }}>
              <Image source={icons.humidityOutlineWhite} style={{ tintColor: textColor, width: 30, height: 30 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 5, alignItems: "center" }}>
              <Text style={{ color: textColor, fontSize: 16, fontWeight: 700 }}>{optimalRanges && `${optimalRanges.humidity.min} - ${optimalRanges.humidity.max}%`}</Text>
            </View>
            {renderStatusRow("humidity")}
          </View>
          <View className="flex-row justify-between items-center" style={{ marginBottom: 10, backgroundColor: plantPrescriptionsBG, borderRadius: 15, padding: 20 }}>
            <View style={{ minWidth: 15, flex: 1, alignItems: "start" }}>
              <Image source={icons.temperatureOutlineWhite} style={{ tintColor: textColor, width: 30, height: 30 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 5, alignItems: "center" }}>
              <Text style={{ color: textColor, fontSize: 16, fontWeight: 700 }}>{optimalRanges && `${optimalRanges.temperature.min} - ${optimalRanges.temperature.max} °C`} </Text>
            </View>
            {renderStatusRow("temperature")}
          </View>
          <View className="flex-row justify-between items-center" style={{ marginBottom: 10, backgroundColor: plantPrescriptionsBG, borderRadius: 15, padding: 20 }}>
            <View style={{ minWidth: 15, flex: 1, alignItems: "start" }}>
              <Image source={icons.tdsOutlineWhite} style={{ tintColor: textColor, width: 30, height: 30 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 5, alignItems: "center" }}>
              <Text style={{ color: textColor, fontSize: 16, fontWeight: 700 }}>{optimalRanges && `${optimalRanges.tds.min} - ${optimalRanges.tds.max} ppm`}</Text>
            </View>
            {renderStatusRow("tds")}
          </View>
          <View className="flex-row justify-between items-center" style={{ marginBottom: 10, backgroundColor: plantPrescriptionsBG, borderRadius: 15, padding: 20 }}>
            <View style={{ minWidth: 15, flex: 1, alignItems: "start" }}>
              <Image source={icons.ecOutlineWhite} style={{ tintColor: textColor, width: 30, height: 30 }} resizeMode="contain" />
            </View>
            <View style={{ flex: 5, alignItems: "center" }}>
              <Text style={{ color: textColor, fontSize: 16, fontWeight: 700 }}>{optimalRanges && `${optimalRanges.ec.min} - ${optimalRanges.ec.max} mS/cm`}</Text>
            </View>
            {renderStatusRow("ec")}
          </View>
        </View>
      </ScrollView>

      {/* Modal for Notifications */}
      <Modal visible={showNotifications} transparent={true} animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 300,
              height: 400,
              padding: 16,
              backgroundColor: theme === "dark" ? "#2A2A3A" : "#FFF",
              borderRadius: 10,
            }}
          >
            <TouchableOpacity
              onPress={markAllAsRead}
              style={{
                alignSelf: "flex-end",
                marginBottom: 8,
                paddingVertical: 4,
                paddingHorizontal: 8,
                backgroundColor: plantIoTCardBG,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: dashboardText, fontSize: 12 }}>Mark all as read</Text>
            </TouchableOpacity>
            <ScrollView>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <View
                    key={notification.id}
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: theme === "dark" ? "#444" : "#DDD",
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: theme === "dark" ? "#FFF" : "#000",
                        fontSize: 14,
                      }}
                    >
                      {notification.message} - {notification.sensor} at {new Date(notification.timestamp.seconds * 1000).toLocaleTimeString()}
                      {notification.read ? " (Read)" : ""}
                    </Text>
                  </View>
                ))
              ) : (
                <Text
                  style={{
                    color: theme === "dark" ? "#AAA" : "#666",
                    fontSize: 14,
                  }}
                >
                  No new notifications
                </Text>
              )}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowNotifications(false)}
              style={{
                marginTop: 16,
                alignSelf: "center",
                backgroundColor: plantIoTCardBG,
                paddingVertical: 6,
                paddingHorizontal: 16,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: dashboardText }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for Prescription */}
      <Modal visible={prescriptionModalVisible} transparent={true} animationType="slide" onRequestClose={() => setPrescriptionModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 300,
              padding: 16,
              backgroundColor: theme === "dark" ? "#2A2A3A" : "#FFF",
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: textColor,
                marginBottom: 12,
              }}
            >
              Prescription for {selectedPrescription.sensor.toUpperCase()} {selectedPrescription.condition}
            </Text>
            {selectedPrescription.image ? <Image source={selectedPrescription.image} style={{ width: 200, height: 200, marginBottom: 16 }} resizeMode="contain" /> : <Text style={{ color: textColor }}>Your sensor is performing well!</Text>}
            <TouchableOpacity
              onPress={() => setPrescriptionModalVisible(false)}
              style={{
                backgroundColor: plantIoTCardBG,
                paddingVertical: 6,
                paddingHorizontal: 16,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: dashboardText }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Plant;
