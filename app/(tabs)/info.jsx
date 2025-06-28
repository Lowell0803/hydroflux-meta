import { useState, useRef, useEffect } from "react";
import { Animated, Easing, Modal, Keyboard, ScrollView, Image, TextInput, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity } from "react-native";
import { images, icons } from "../../constants";
import { useGlobalContext } from "../../context/GlobalProvider";
import Notifications from "../../components/Notifications";
import DateTimePicker from "@react-native-community/datetimepicker";
// NEW: Import Picker
import { Picker } from "@react-native-picker/picker";
import { doc, getDoc, onSnapshot, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from "firebase/firestore";
import { firestoreDB, auth } from "../../lib/firebase";
import plantStagesConstants from "../../constants/plant-stages";
import { data, choiceDetails } from "../../constants/infoContent"; // Import long texts
import NotificationsOverlay from "../../components/NotificationsOverlay";
import { getThemeStyles } from "../../constants/themeStyles";

// const { headingThreeTextColor, greenColor, greenColorBlack, greenColorWhite, blackColorGreen, checkboxColor, backgroundColor, textColor, textColorMiddleLight, logo, headingTextColor, welcomeCards, buttonColor, buttonText } = getThemeStyles(theme, images, icons);
// const { selectPlantCardBG, learnYourPlantCardBG, cardBG, smallCardBG } = getThemeStyles(theme, images, icons);

// Dropdown Component
const Dropdown = ({ title, items, index, activeDropdowns, toggleDropdown, dropdownHeights, handleSelectChoice, styles }) => {
  const { textColor, cardBG, dropdownCardBG, dropdownSubCardBG, greenColor, greenColorWhite, greenColorBlack } = styles;

  return (
    <View className="mb-1">
      <TouchableOpacity onPress={() => toggleDropdown(title)} style={{ backgroundColor: dropdownCardBG }} className="py-4 px-3 rounded-lg bg-gray-800">
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Circular badge displaying the index number */}
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: greenColorBlack,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
              backgroundColor: dropdownCardBG,
            }}
          >
            <Text style={{ color: greenColorBlack, fontWeight: "900" }}>{index}</Text>
          </View>
          {/* Title text */}
          <Text style={{ fontWeight: "900", color: greenColorBlack }}>{title}</Text>
        </View>
      </TouchableOpacity>
      <Animated.View
        style={{
          height: dropdownHeights.current[title],
          overflow: "hidden",
          backgroundColor: dropdownSubCardBG,
          marginTop: 8,
          borderRadius: 12,
        }}
      >
        {items.map((item, idx) => (
          <TouchableOpacity
            key={item}
            onPress={() => handleSelectChoice(item)}
            style={{
              marginHorizontal: 12,
              padding: 12,
              borderBottomColor: greenColorBlack,
              borderBottomWidth: idx === items.length - 1 ? 0 : 0.5,
            }}
          >
            <Text style={{ color: textColor, fontWeight: "500" }}>{item}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

// Info Modal Component
const InfoModal = ({ visible, closeModal, selectedDetails }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={closeModal}>
    <View className="flex-1 bg-black-200 pt-10 px-5">
      <TouchableOpacity onPress={closeModal} className="absolute top-10 right-5 p-3">
        <Text className="text-2xl text-white">✕</Text>
      </TouchableOpacity>
      <ScrollView className="mt-14">
        <Text className="text-xl font-psemibold text-white mb-4">{selectedDetails.choice}</Text>
        {selectedDetails.details.image && (
          <TouchableOpacity>
            <Image
              source={selectedDetails.details.image}
              // The style for this image is here so you can edit it easily
              style={{ width: "100%", height: 240, resizeMode: "contain" }}
            />
          </TouchableOpacity>
        )}
        <Text className="text-white text-base mt-4">{selectedDetails.details.description}</Text>
      </ScrollView>
    </View>
  </Modal>
);

const Info = () => {
  const { theme } = useGlobalContext();

  const styles = getThemeStyles(theme, images, icons);
  const {
    backgroundColor,
    textColor,
    textColorMiddleLight,
    textColorLight,
    headingTextColor,
    headingTwoTextColor,
    headingThreeTextColor,
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
  } = styles;

  // Dropdown states
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [optimalRanges, setOptimalRanges] = useState(null); // if you want to display expected range

  const [activeDropdowns, setActiveDropdowns] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState({
    choice: "",
    details: {},
  });
  const dropdownHeights = useRef({});

  useEffect(() => {
    Object.keys(data).forEach((key) => {
      if (!dropdownHeights.current[key]) {
        dropdownHeights.current[key] = new Animated.Value(0);
      }
    });
  }, []);

  const toggleDropdown = (text) => {
    if (!data[text]) return;
    setActiveDropdowns((prev) => {
      const newState = { ...prev };
      if (newState[text]) {
        Animated.timing(dropdownHeights.current[text], {
          toValue: 0,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: false,
        }).start();
        newState[text] = false;
      } else {
        Animated.timing(dropdownHeights.current[text], {
          toValue: data[text]?.length * 50 || 0,
          duration: 300,
          easing: Easing.ease,
          useNativeDriver: false,
        }).start();
        newState[text] = true;
      }
      return newState;
    });
  };

  const handleSelectChoice = (choice) => {
    setSelectedDetails({
      choice,
      details: choiceDetails[choice] || { description: "No details available." },
    });
    setModalVisible(true);
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchUserMacAndSubscribe = async () => {
      const userDocRef = doc(firestoreDB, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) return;

      const mac = userDocSnap.data().currentMacAddress;
      if (!mac) return;

      const notifRef = collection(firestoreDB, "devices", mac, "notifications");
      const unsubscribe = onSnapshot(notifRef, (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setNotifications(data);
      });

      return unsubscribe;
    };

    fetchUserMacAndSubscribe();
  }, []);

  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      setUnreadCount(0);
      return;
    }

    let count = 0;
    notifications.forEach((notification) => {
      const { value, expectedRange } = notification;
      if (expectedRange && typeof value !== "object") {
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
          if (numericValue < expectedRange.min || numericValue > expectedRange.max) {
            count++;
          }
        }
      }
    });
    setUnreadCount(count);
  }, [notifications]);

  useEffect(() => {
    const fetchOptimalRanges = async () => {
      try {
        const docRef = doc(firestoreDB, "optimal_ranges", selectedPlant);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setOptimalRanges(docSnap.data());
        }
      } catch (err) {
        console.error("Failed to fetch optimal ranges", err);
      }
    };
    fetchOptimalRanges();
  }, [selectedPlant]);

  // ---- Plant Info States ----
  const [plantDate, setPlantDate] = useState(new Date());
  const [plantStagesData, setPlantStagesData] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);
  const [selectedPlant, setSelectedPlant] = useState("Lettuce");
  // NEW: For controlling DateTimePicker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ---- Fetch Plant Info from Device Document with onSnapshot ----
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const userDocRef = doc(firestoreDB, "users", user.uid);
    let unsubscribeDevice = null;
    const unsubscribeUser = onSnapshot(userDocRef, (userDocSnap) => {
      if (userDocSnap.exists()) {
        const currentMacAddress = userDocSnap.data().currentMacAddress;
        if (currentMacAddress) {
          if (unsubscribeDevice) unsubscribeDevice();
          const deviceDocRef = doc(firestoreDB, "devices", currentMacAddress);
          unsubscribeDevice = onSnapshot(deviceDocRef, (deviceDocSnap) => {
            if (deviceDocSnap.exists()) {
              const currentPlant = deviceDocSnap.data().currentPlant || "Lettuce";
              setSelectedPlant(currentPlant);
              if (deviceDocSnap.data().plantDate) {
                setPlantDate(new Date(deviceDocSnap.data().plantDate));
              }
            } else {
              console.error("Device document not found!");
            }
          });
        }
      }
    });
    return () => {
      unsubscribeUser();
      if (unsubscribeDevice) unsubscribeDevice();
    };
  }, []);

  // ---- Fetch plantStages for the selected plant ----
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

  // ---- Compute current stage based on plantDate and plantStagesData ----
  useEffect(() => {
    if (!plantDate || !plantStagesData) return;
    const now = new Date();
    const diffDays = Math.floor((now - plantDate) / (1000 * 60 * 60 * 24));
    const stages = plantStagesData.stages;

    // Try to find a stage that matches the current age.
    let stage = stages.find((s) => diffDays >= s.days.start && diffDays <= s.days.end);

    // If no stage found and diffDays exceeds the last stage's end, create a "Past" stage.
    if (!stage && diffDays > stages[stages.length - 1].days.end) {
      const lastStage = stages[stages.length - 1];
      stage = {
        ...lastStage,
        stageName: `Past ${lastStage.stageName}`, // e.g., "Past Harvest"
        days: { ...lastStage.days }, // keep same date range for display
        canHarvest: true, // override to yes, as requested
      };
    }

    setCurrentStage({ diffDays, stage });
  }, [plantDate, plantStagesData]);

  // NEW: Function to handle date changes
  const onChangeDate = async (event, selectedDate) => {
    setShowDatePicker(false);

    // If the picker is dismissed (this works on Android; on iOS you might get null)
    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    // Check if the selected date is the same as the current plantDate
    // (Compare their ISO strings if plantDate is defined)
    if (plantDate && selectedDate.toISOString() === plantDate.toISOString()) {
      return; // No change, so do nothing.
    }

    // Validate that the selected date is not in the future.
    const now = new Date();
    if (selectedDate > now) {
      Alert.alert("Invalid Date", "The date cannot be set in the future!");
      return;
    }

    // Update the local state.
    setPlantDate(selectedDate);

    // Automatically update Firestore with the new plant date.
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Authentication", "You must be logged in to update the plant date.");
        return;
      }
      const userDocRef = doc(firestoreDB, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const currentMacAddress = userDocSnap.data().currentMacAddress;
        if (currentMacAddress) {
          const deviceDocRef = doc(firestoreDB, "devices", currentMacAddress);
          await updateDoc(deviceDocRef, { plantDate: selectedDate.toISOString() });
          Alert.alert("Success", "Plant date saved successfully!");
        }
      }
    } catch (error) {
      console.error("Error updating plant date:", error);
      Alert.alert("Error", "Failed to update plant date. Please try again.");
    }
  };

  // NEW: Function to handle plant selection changes
  const onSelectPlant = async (plant) => {
    setSelectedPlant(plant);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Authentication", "You must be logged in to update the plant.");
        return;
      }
      const userDocRef = doc(firestoreDB, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const currentMacAddress = userDocSnap.data().currentMacAddress;
        if (currentMacAddress) {
          const deviceDocRef = doc(firestoreDB, "devices", currentMacAddress);
          await updateDoc(deviceDocRef, { currentPlant: plant });
          Alert.alert("Success", "Plant updated successfully!");
        }
      }
    } catch (error) {
      console.error("Error updating plant:", error);
      Alert.alert("Error", "Failed to update plant. Please try again.");
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor }} className="flex-1">
      <ScrollView className="w-full flex-1 pb-8 px-5">
        <View className="flex-column justify-center items-center mb-4" style={{ paddingVertical: 20, borderRadius: 20, backgroundColor: selectPlantCardBG, marginHorizontal: 0 }}>
          <Text className="mb-3" style={{ fontSize: 18, textAlign: "center", color: textColor, fontWeight: "bold", marginTop: 10, fontWeight: "800" }}>
            Select your plant
          </Text>
          <View style={{ width: 250, paddingLeft: 14, marginHorizontal: 20, backgroundColor: "transparent", borderWidth: 2, borderColor: greenColor, borderRadius: 15 }} className="flex-row justify-center items-center">
            <Image style={{ tintColor: greenColor }} source={icons.selectPlant} className="w-6 h-6" resizeMode="contain" />
            <View className="flex-1">
              <Picker itemStyle={{ fontSize: 10 }} selectedValue={selectedPlant} onValueChange={(itemValue) => onSelectPlant(itemValue)} style={{ color: textColor }} dropdownIconColor={greenColor}>
                <Picker.Item label="Lettuce" value="Lettuce" />
                <Picker.Item label="Okra" value="Okra" />
                <Picker.Item label="Strawberry" value="Strawberry" />
                <Picker.Item label="Tomato" value="Tomato" />
              </Picker>
            </View>
          </View>
          <Text className="mb-3" style={{ fontSize: 18, textAlign: "center", color: textColor, fontWeight: "bold", marginTop: 10, fontWeight: "800" }}>
            When did you plant?
          </Text>
          <View style={{ backgroundColor: smallCardBG, height: 60, marginHorizontal: 25, borderRadius: 12, marginBottom: 15 }} className="flex-row justify-between">
            <View className="flex-row items-center" style={{ backgroundColor: "", borderRadius: 15, padding: 20 }}>
              <View>
                <Image source={icons.plantDate} style={{ width: 30, height: 30, marginRight: 12, tintColor: greenColorBlack }} resizeMode="contain" />
              </View>
              <View>
                <Text style={{ color: textColor, fontSize: 18 }}>{plantDate ? plantDate.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }) : "No date selected"}</Text>

                <Text style={{ color: textColorMiddleLight, fontSize: 12 }}>Plant Date</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                alignSelf: "stretch",
                backgroundColor: greenColor,
                paddingVertical: 10,
                paddingHorizontal: 0,
                borderTopRightRadius: 12,
                borderBottomRightRadius: 12,
                justifyContent: "center",
                // marginTop: 8,
              }}
            >
              <Image style={{ tintColor: "black" }} source={icons.dateSet} className="w-8 h-8" resizeMode="contain" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={plantDate}
                mode="date"
                display="default"
                // Added design prop to match the given snippet
                // (Note: if your DateTimePicker version does not support "design", you can omit it)
                design="material"
                onChange={onChangeDate}
              />
            )}
          </View>
        </View>
        {/* Plant Info Section */}
        <View style={{ backgroundColor: learnYourPlantCardBG, padding: 16, borderRadius: 20, marginBottom: 16, paddingVertical: 20 }}>
          <Text style={{ color: headingThreeTextColor, fontSize: 18, fontWeight: "700", textAlign: "center" }}>Learn Your Plant</Text>
          <Text style={{ color: "#FFF", textAlign: "center", fontSize: 12, color: textColorMiddleLight }}>An Estimated Overview of Your Plant</Text>

          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              marginTop: 10,
              borderColor: "#18daa3",
              borderWidth: 2,
              borderRadius: 16,
              alignSelf: "center",
              padding: 10,
            }}
          >
            {currentStage?.stage ? (
              (() => {
                const stageName = currentStage.stage.stageName;
                // If the stageName starts with "Past ", remove the prefix to get the last stage key.
                const imageKey = stageName.startsWith("Past ") ? stageName.replace("Past ", "") : stageName;
                return <Image source={plantStagesConstants[selectedPlant][imageKey] || plantStagesConstants.placeholder} style={{ borderRadius: 16, width: 150, height: 150 }} resizeMode="contain" />;
              })()
            ) : (
              <Text style={{ color: textColor }}>Loading...</Text>
            )}
          </View>

          <Text style={{ color: "#18daa3", fontSize: 18, textAlign: "center", marginTop: 10, fontWeight: 900 }}>{selectedPlant}</Text>

          <View className="flex-column gap-y-2" style={{ marginTop: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ color: textColor, fontSize: 14, fontWeight: "bold" }}>Current Stage</Text>
              <Text style={{ color: "#18daa3", fontSize: 14 }}>{currentStage?.stage?.stageName || "Loading..."}</Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ color: textColor, fontSize: 14, fontWeight: "bold" }}>Date Range</Text>
              <Text style={{ color: "#18daa3", fontSize: 14 }}>
                {currentStage?.stage ? (currentStage.stage.stageName.startsWith("Past") ? `Past ${currentStage.stage.days.start}-${currentStage.stage.days.end} days` : `${currentStage.stage.days.start}-${currentStage.stage.days.end} days`) : "Loading..."}
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ color: textColor, fontSize: 14, fontWeight: "bold" }}>Harvestable</Text>
              <Text style={{ color: "#18daa3", fontSize: 14 }}>{currentStage?.stage ? (currentStage.stage.canHarvest ? "Yes" : "No") : "Loading..."}</Text>
            </View>

            <View style={{ borderBottomColor: "#18daa3", borderBottomWidth: 1, marginVertical: 8 }} />

            <View>
              <Text
                style={{
                  color: textColorMiddleLight,
                  fontSize: 11,
                  textAlign: "justify",
                  flexWrap: "wrap",
                  width: "100%",
                }}
              >
                {currentStage?.stage?.description || "Loading..."}
              </Text>
              {currentStage?.stage?.stageName?.startsWith("Past") && (
                <Text
                  style={{
                    color: "#fe0000",
                    fontSize: 11,
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  Note: This plant is past the harvesting stage.
                </Text>
              )}
            </View>
          </View>
        </View>

        <View className="flex-row gap-x-2 items-center mb-2 ml-1 mt-2">
          <Image source={icons.infoGettingStarted} style={{ tintColor: headingThreeTextColor, width: 26, height: 26 }} resizeMode="contain" />
          <Text className="mb-3" style={{ fontSize: 18, color: headingThreeTextColor, fontWeight: "bold", marginTop: 10, fontWeight: "800" }}>
            Getting Started
          </Text>
        </View>

        {/* Dropdown Sections */}
        {Object.keys(data).map((text, index) => (
          <Dropdown
            key={text}
            title={text}
            index={index + 1} // Pass the index (starting from 1)
            items={data[text]}
            activeDropdowns={activeDropdowns}
            toggleDropdown={toggleDropdown}
            dropdownHeights={dropdownHeights}
            handleSelectChoice={handleSelectChoice}
            styles={styles}
          />
        ))}
        <View className="mb-4"></View>
      </ScrollView>

      <InfoModal visible={modalVisible} closeModal={() => setModalVisible(false)} selectedDetails={selectedDetails} />
      <NotificationsOverlay visible={showNotifications} onClose={() => setShowNotifications(false)} notifications={notifications} optimalRanges={optimalRanges} theme={theme} />
    </SafeAreaView>
  );
};

export default Info;
