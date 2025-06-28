import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import { Modal, ScrollView, TextInput, Text, TouchableOpacity, View, Image, ActivityIndicator, TouchableWithoutFeedback, Keyboard } from "react-native";
import { icons, images } from "../../constants";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from "firebase/firestore";
import { useGlobalContext } from "../../context/GlobalProvider";
import { firestoreDB, auth } from "../../lib/firebase"; // Import correct Firestore instance
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import Notifications from "../../components/Notifications";
import { InsideFormField } from "../../components";
import { useRouter } from "expo-router";
import { getFirestore, onSnapshot } from "firebase/firestore";
import CustomNotifications from "../../components/CustomNotifications"; // Import your custom notifications component
import NotificationsOverlay from "../../components/NotificationsOverlay";
import { getThemeStyles } from "../../constants/themeStyles";
import { getDynamicReading } from "../../components/CustomNotifications";
import { query, orderBy, limit } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

const Dashboard = () => {
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.displayName) {
      setDisplayName(user.displayName);
    }
  }, []);

  const shortName = displayName.length > 12 ? displayName.slice(0, 12) + "..." : displayName;
  const [notifications, setNotifications] = useState([]);
  // Add these inside your Dashboard component function
  const [showNotifications, setShowNotifications] = useState(false);

  const { theme } = useGlobalContext();
  const [macAddress, setMacAddress] = useState("");
  const [iotName, setIotName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState(null); // "found" or "not found"
  const [userMacAddresses, setUserMacAddresses] = useState([]); // Saved MAC addresses array
  const [currentMacAddress, setCurrentMacAddress] = useState(""); // Current selected hardware MAC
  const [currentIoTName, setCurrentIoTName] = useState(""); // IoT name for current hardware
  const [selectedPlant, setSelectedPlant] = useState("Lettuce");
  const [optimalRanges, setOptimalRanges] = useState(null); // Fetched optimal ranges
  const [isFocused, setIsFocused] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Additional state for plant stages & current stage (for the dashboard stage display)
  const [plantStagesData, setPlantStagesData] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);

  // State for plant date & DateTimePicker
  const [plantDate, setPlantDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // const backgroundColor = theme === "dark" ? "#161622" : "#EEE";
  // const textColor = theme === "dark" ? "#FFF" : "#000";
  // const dashboardBG = theme === "dark" ? "#1E1E2C" : "#5C7AFF";
  // const dashboardText = "#FFF";
  // const topBarBG = theme === "dark" ? "#101019" : "#202032";

  const { greenColorBlack, checkboxColor, backgroundColor, textColor, logo, headingTextColor, headingTwoTextColor, welcomeCards, buttonColor, buttonText } = getThemeStyles(theme, images);
  const { hardwareCardBG, hardwareCardBGShadow, dashboardCardBG, dashboardCardBGShadow } = getThemeStyles(theme, images);

  const textColorMiddleLight = theme === "dark" ? "#DDD" : "#000";
  const textColorLight = theme === "dark" ? "#a3afb4" : "#FF00000";
  const dashboardBG = theme === "dark" ? "#1E1E2C" : "#5C7AFF";
  const cardBG = theme === "dark" ? "#0e101d" : "#f5f5f5";
  const CardBGShadow = theme === "dark" ? "#070811" : "#f5f5f5";
  const cardText = theme === "dark" ? "#FFF" : "#000";
  const dashboardText = "#000";
  const topBarBG = theme === "dark" ? "#192538" : "#202032";

  // Define colors based on theme
  const defaultBorderColor = theme === "dark" ? "#193843" : "#CCC";
  const focusBorderColor = "#00ffb7";

  // Start of Notif
  useEffect(() => {
    if (!currentMacAddress) return;
    const db = getFirestore();
    const notificationsRef = collection(db, "devices", currentMacAddress, "notifications");
    const unsubscribe = onSnapshot(
      notificationsRef,
      (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notificationsData);
      },
      (error) => {
        console.error("Error fetching device notifications:", error);
      }
    );
    return () => unsubscribe();
  }, [currentMacAddress]);

  const fetchNotifications = async () => {
    console.log("fetching notif");
    const user = auth.currentUser;
    if (!user) return;

    const db = getFirestore();
    const notificationsRef = collection(db, "devices", currentMacAddress, "notifications");

    try {
      const snapshot = await getDocs(notificationsRef);
      const notificationsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error manually fetching notifications:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(); // you’ll define this below
    }, 30000); // every 15 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);
  // End of Notif

  const markAllAsRead = async () => {
    if (!user) return;
    const notificationsRef = collection(db, "users", user.uid, "notifications");
    const snapshot = await getDocs(notificationsRef);
    snapshot.forEach(async (notificationDoc) => {
      await updateDoc(doc(db, "users", user.uid, "notifications", notificationDoc.id), { read: true });
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Fetch optimal ranges when selectedPlant changes.
  useEffect(() => {
    const fetchOptimalRanges = async () => {
      try {
        const docRef = doc(firestoreDB, "optimal_ranges", selectedPlant);
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

  // Fetch plantStages for the selected plant.
  useEffect(() => {
    if (!selectedPlant) return;
    const fetchPlantStages = async () => {
      try {
        const docRef = doc(firestoreDB, "plantStages", selectedPlant);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPlantStagesData(docSnap.data());
        } else {
          console.log("No plant stage data found for", selectedPlant);
          setPlantStagesData(null);
        }
      } catch (error) {
        console.error("Error fetching plant stages:", error);
      }
    };
    fetchPlantStages();
  }, [selectedPlant]);

  // Compute current stage based on plantDate and plantStagesData.
  useEffect(() => {
    if (!plantDate || !plantStagesData) return;
    const now = new Date();
    const diffDays = Math.floor((now - plantDate) / (1000 * 60 * 60 * 24));
    // Assume stages are stored in order in the stages array.
    const stage = plantStagesData.stages.find((s) => diffDays >= s.days.start && diffDays <= s.days.end);
    setCurrentStage({ diffDays, stage });
  }, [plantDate, plantStagesData]);

  // Fetch MAC Addresses, currentMacAddress, and currentIoTName from user document.
  useEffect(() => {
    const fetchMacAddresses = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userDocRef = doc(firestoreDB, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const macAddresses = userDocSnap.data().macAddresses || [];
        setUserMacAddresses(macAddresses);
        const currentMac = userDocSnap.data().currentMacAddress || macAddresses[0]?.mac;
        const currentName = macAddresses.find((macObj) => macObj.mac === currentMac)?.name || "";
        setCurrentMacAddress(currentMac);
        setCurrentIoTName(currentName);
      }
    };
    fetchMacAddresses();
  }, []);

  // Fetch plant data from device document.
  useEffect(() => {
    const fetchPlantData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userDocRef = doc(firestoreDB, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const currentMacAddress = userDocSnap.data().currentMacAddress;
        if (currentMacAddress) {
          const deviceDocRef = doc(firestoreDB, "devices", currentMacAddress);
          const deviceDocSnap = await getDoc(deviceDocRef);
          if (deviceDocSnap.exists()) {
            const currentPlant = deviceDocSnap.data().currentPlant || "Lettuce";
            setSelectedPlant(currentPlant);
            if (deviceDocSnap.data().plantDate) {
              setPlantDate(new Date(deviceDocSnap.data().plantDate));
            }
          } else {
            console.error("Device document not found!");
          }
        }
      }
    };
    fetchPlantData();
  }, []);

  async function bootstrapNotificationsForDevice(uid, mac) {
    // 1️⃣ Grab latest history entry
    const historyQ = query(collection(firestoreDB, "devices", mac, "history"), orderBy("timestamp", "desc"), limit(1));
    const historySnap = await getDocs(historyQ);
    if (historySnap.empty) return;

    const data = historySnap.docs[0].data();
    const plant = data.selectedPlant || "Lettuce";

    // 2️⃣ Fetch optimal ranges
    const optSnap = await getDoc(doc(firestoreDB, "optimal_ranges", plant));
    if (!optSnap.exists()) return;
    const optimal = optSnap.data();

    // 3️⃣ Create one notification per sensor
    for (const [sensorKey, { min, max }] of Object.entries(optimal)) {
      const raw = data[sensorKey.toLowerCase()];
      const value = raw === undefined || raw === null || isNaN(raw) || (sensorKey !== "water_level" && raw === 0) ? "No Data" : raw;
      const deviated = value !== "No Data" && (value < min || value > max);

      const notifId = `active_${mac}_${sensorKey.toLowerCase()}`;
      const userNotifRef = doc(firestoreDB, "users", uid, "notifications", notifId);

      const payload = {
        sensor: sensorKey,
        value,
        expectedRange: { min, max },
        timestamp: data.timestamp,
        macAddress: mac,
        selectedPlant: plant,
        message: deviated ? `${sensorKey} is ${value > max ? "too high" : "too low"} (Value: ${value}, Optimal: ${min}–${max})` : `${sensorKey} is normal`,
        deviated,
      };

      await setDoc(userNotifRef, payload, { merge: true });
    }
  }

  // Save new MAC Address and IoT name.
  const saveMacAddress = async () => {
    setLoading(true);
    setDeviceStatus(null);
    try {
      const user = auth.currentUser;
      if (!user || macAddress.trim() === "") {
        alert("Please enter a valid MAC address.");
        setLoading(false);
        return;
      }
      const trimmedMacAddress = macAddress.trim();
      const macDocRef = doc(firestoreDB, "devices", trimmedMacAddress);
      const macDocSnap = await getDoc(macDocRef);

      if (!macDocSnap.exists()) {
        setDeviceStatus("not found");
        alert("Device not found in 'devices' collection.");
        setLoading(false);
        return;
      } else {
        setDeviceStatus("found");
      }

      // User document reference
      const userDocRef = doc(firestoreDB, "users", user.uid);

      // Check if the user document exists
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        // Document doesn't exist, create a new document with initial fields
        await setDoc(userDocRef, {
          macAddresses: [{ mac: trimmedMacAddress, name: iotName }],
          currentMacAddress: trimmedMacAddress,
        });
      } else {
        // Document exists, update the document
        await updateDoc(userDocRef, {
          macAddresses: arrayUnion({ mac: trimmedMacAddress, name: iotName }),
          currentMacAddress: trimmedMacAddress,
        });
      }

      // Update state with new values
      setUserMacAddresses((prev) => [...prev, { mac: trimmedMacAddress, name: iotName }]);
      setCurrentMacAddress(trimmedMacAddress);
      setCurrentIoTName(iotName);
      setMacAddress("");
      setIotName("");
      alert("MAC Address saved successfully!");

      // 3️⃣ **Bootstrap** user-scoped notifications
      await bootstrapNotificationsForDevice(user.uid, trimmedMacAddress);
    } catch (error) {
      console.error("Error saving MAC address:", error);
      alert("Failed to save MAC address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setPlantDate(selectedDate);
    }
  };

  const removeMacAddress = async (macToRemove) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const userDocRef = doc(firestoreDB, "users", user.uid);
      await updateDoc(userDocRef, {
        macAddresses: arrayRemove(macToRemove),
      });
      setUserMacAddresses((prev) => prev.filter((mac) => mac.mac !== macToRemove.mac));
      alert("MAC Address removed successfully!");
    } catch (error) {
      console.error("Error removing MAC address:", error);
      alert("Failed to remove MAC address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectCurrentMacAddress = async (mac, name) => {
    setCurrentMacAddress(mac);
    setCurrentIoTName(name);
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(firestoreDB, "users", user.uid);
      await updateDoc(userDocRef, { currentMacAddress: mac });
      const deviceDocRef = doc(firestoreDB, "devices", mac);
      const deviceDocSnap = await getDoc(deviceDocRef);
      if (deviceDocSnap.exists()) {
        const currentPlant = deviceDocSnap.data().currentPlant || "Lettuce";
        setSelectedPlant(currentPlant);
      } else {
        console.error("Device document not found!");
      }
    }
  };

  const savePlantDate = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to save a plant date.");
        setLoading(false);
        return;
      }
      if (!currentMacAddress) {
        alert("No current device selected.");
        setLoading(false);
        return;
      }
      const deviceDocRef = doc(firestoreDB, "devices", currentMacAddress);
      await updateDoc(deviceDocRef, {
        plantDate: plantDate.toISOString(),
      });
      alert("Plant date saved successfully!");
    } catch (error) {
      console.error("Error saving plant date:", error);
      alert("Failed to save plant date. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveSelectedPlant = async (plant) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to save a plant.");
        setLoading(false);
        return;
      }
      if (!plant) {
        alert("Please select a plant first.");
        setLoading(false);
        return;
      }
      const userDocRef = doc(firestoreDB, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        alert("User document not found.");
        setLoading(false);
        return;
      }
      const currentMacAddress = userDocSnap.data().currentMacAddress;
      if (!currentMacAddress) {
        alert("No current MAC address found.");
        setLoading(false);
        return;
      }
      const deviceDocRef = doc(firestoreDB, "devices", currentMacAddress);
      await updateDoc(deviceDocRef, {
        currentPlant: plant,
      });
      alert("Plant saved successfully!");
    } catch (error) {
      console.error("Error saving selected plant:", error);
      alert("Failed to save plant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper: Compute the age of the plant in days.
  // Helper: Compute the age of the plant in days.
  const computePlantAge = () => {
    if (!plantDate) return 0;
    const now = new Date();
    return Math.floor((now - plantDate) / (1000 * 60 * 60 * 24));
  };

  // Helper: Compute days until harvest based on the earliest harvestable stage.
  const computeDaysUntilHarvest = () => {
    if (!plantDate || !plantStagesData || !plantStagesData.stages) return null;
    const age = computePlantAge();
    const harvestStages = plantStagesData.stages.filter((s) => s.canHarvest);
    if (harvestStages.length === 0) return null;
    const earliestStage = harvestStages.reduce((prev, current) => (current.days.start < prev.days.start ? current : prev));
    if (age < earliestStage.days.start) {
      return earliestStage.days.start - age;
    }
    return "Can Harvest";
  };

  // In your Dashboard card display section, calculate age and days until harvest once.
  const plantAge = computePlantAge();
  const daysUntilHarvest = computeDaysUntilHarvest();
  const router = useRouter();

  return (
    <SafeAreaView style={{ backgroundColor }} className="flex-1">
      {/***************************************************************************************************************************************/}

      <ScrollView className="w-full flex-1 pb-8 px-5">
        <View style={{ position: "relative", marginBottom: 6 }}>
          {/* The small box behind */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 10,
              right: 10,
              bottom: 10,
              backgroundColor: dashboardCardBGShadow,
              borderRadius: 25,
              // Adjust width/height or top/left offsets as needed
            }}
          />

          {/* Your original big box (unchanged content) */}
          <View
            style={{
              backgroundColor: dashboardCardBG,
              borderRadius: 25,
              paddingHorizontal: 25,
              paddingVertical: 20,
            }}
            className="mb-6"
          >
            {/* --- BEGIN: Your existing big-box content --- */}
            <View style={{ borderBottomColor: "black", borderBottomWidth: 1, paddingBottom: 10, marginBottom: 10 }}>
              <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "600", color: "black" }}>
                How you doin? <Text style={{ fontWeight: "800" }}>{shortName}</Text>
              </Text>
            </View>

            <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <Text
                className="text-center text-xl font-pbold"
                style={{
                  color: dashboardText,
                  fontWeight: "900",
                }}
              >
                Dashboard
              </Text>
              <Image style={{ marginTop: 5 }} source={icons.dashboardSmall} className="w-6 h-6" resizeMode="contain" />
            </View>

            <View>
              <View className="flex-row items-center gap-x-3" style={{ color: dashboardText, marginBottom: 8, paddingHorizontal: 10 }}>
                <Image source={icons.dashboardIoT} className="w-7 h-7" resizeMode="contain" />
                <Text style={{ fontWeight: "800", fontSize: 18 }}>{currentMacAddress ? currentIoTName : "No IoT"}</Text>
              </View>
            </View>

            <View>
              <View className="flex-row items-center gap-x-3" style={{ color: dashboardText, marginBottom: 8, paddingHorizontal: 10 }}>
                <Image source={icons.dashboardPlant} className="w-7 h-7" resizeMode="contain" />
                <Text style={{ fontWeight: "800", fontSize: 18 }}>{currentMacAddress ? selectedPlant : "No Plant"}</Text>
              </View>
            </View>

            <View>
              <View className="flex-row items-center gap-x-3" style={{ color: dashboardText, marginBottom: 8, paddingHorizontal: 10 }}>
                <Image source={icons.dashboardDays} className="w-7 h-7" resizeMode="contain" />
                <Text style={{ fontWeight: "800", fontSize: 18 }}>{currentMacAddress ? (daysUntilHarvest === "Can Harvest" ? "Can harvest" : `${daysUntilHarvest} days until harvest`) : "N/A"}</Text>
              </View>
            </View>

            {/* --- END: Your existing big-box content --- */}
          </View>
        </View>

        <View style={{ position: "relative", marginBottom: 6 }}>
          {/* The small box behind */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 10,
              right: 10,
              bottom: 10,
              backgroundColor: hardwareCardBGShadow,
              borderRadius: 25,
              // Adjust width/height or top/left offsets as needed
            }}
          />

          {/* Your original big box (unchanged content) */}
          <View
            style={{
              backgroundColor: hardwareCardBG,
              borderRadius: 25,
              paddingHorizontal: 25,
              paddingVertical: 20,
            }}
            className="mb-6"
          >
            {/* --- BEGIN: Your existing big-box content --- */}

            <View style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Text
                className="text-center text-xl font-pbold"
                style={{
                  color: cardText,
                  fontWeight: "800",
                }}
              >
                Hardware
              </Text>
              <Image style={{ marginTop: 5 }} source={icons.hardware} className="w-6 h-6" resizeMode="contain" />
            </View>

            {userMacAddresses.map((macObj, index) => (
              <View key={index} className="flex-row justify-between items-center" style={{ marginBottom: 4 }}>
                <View className="flex-column items-start gap-x-3" style={{ marginLeft: 10, marginBottom: 8, borderLeftColor: headingTextColor, borderLeftWidth: 4 }}>
                  <Text style={{ color: textColor, fontSize: 18 }}>{macObj.name}</Text>
                  <Text style={{ color: textColorLight, fontSize: 12 }}>{macObj.mac}</Text>
                </View>
                <View className="flex-row gap-x-3" style={{ marginRight: 10 }}>
                  <TouchableOpacity onPress={() => removeMacAddress(macObj)}>
                    <Image source={icons.removeIoT} className="w-7 h-7" resizeMode="contain" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => selectCurrentMacAddress(macObj.mac, macObj.name)}>
                    <Image style={{}} source={icons.selectIoT} className="w-7 h-7" resizeMode="contain" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableWithoutFeedback
              onPress={() => {
                Keyboard.dismiss();
                setFocusedInput(null);
              }}
            >
              <View style={{ marginTop: 20 }}>
                <Text style={{ color: headingTwoTextColor, fontWeight: "800", marginBottom: 10, fontSize: 15 }}>Add a Hardware</Text>
                <TextInput
                  style={{ borderWidth: 1, borderColor: focusedInput === "iotName" ? focusBorderColor : defaultBorderColor, marginBottom: 10, padding: 10, borderRadius: 5, color: "#18daa3", backgroundColor: theme === "dark" ? "#193843" : "#FFF", height: 40 }}
                  placeholder="Name of your hardware"
                  placeholderTextColor={theme === "dark" ? "#4fa28f" : "#AAA"}
                  value={iotName}
                  onChangeText={setIotName}
                  onFocus={() => setFocusedInput("iotName")}
                  onBlur={() => setFocusedInput(null)}
                />
                <TextInput
                  style={{ borderWidth: 1, borderColor: focusedInput === "macAddress" ? focusBorderColor : defaultBorderColor, marginBottom: 10, padding: 10, borderRadius: 5, color: "#18daa3", backgroundColor: theme === "dark" ? "#193843" : "#FFF", height: 40 }}
                  placeholder="XX-XX-XX-XX-XX-XX"
                  placeholderTextColor={theme === "dark" ? "#4fa28f" : "#AAA"}
                  value={macAddress}
                  onChangeText={setMacAddress}
                  onFocus={() => setFocusedInput("macAddress")}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </TouchableWithoutFeedback>
            <View>
              <TouchableOpacity onPress={saveMacAddress} style={{ backgroundColor: buttonColor, padding: 12, borderRadius: 10, height: 40, width: 150, alignSelf: "center" }} disabled={loading}>
                <Text className="text-center" style={{ color: "#000", fontWeight: "800" }}>
                  Add
                </Text>
              </TouchableOpacity>
            </View>

            {/* --- END: Your existing big-box content --- */}
          </View>
        </View>
      </ScrollView>
      {/* Insert the notifications overlay here */}
      <NotificationsOverlay visible={showNotifications} onClose={() => setShowNotifications(false)} notifications={notifications} optimalRanges={optimalRanges} theme={theme} />
    </SafeAreaView>
  );
};

export default Dashboard;
