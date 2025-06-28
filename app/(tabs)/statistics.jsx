import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dimensions, Text } from "react-native";
import { ScrollView, View, TouchableOpacity, Image } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import DateTimePicker from "@react-native-community/datetimepicker";
import { icons, images } from "../../constants";
import { useGlobalContext } from "../../context/GlobalProvider";
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { firestoreDB, auth } from "../../lib/firebase";
import Notifications from "../../components/Notifications";
import CustomNotifications from "../../components/CustomNotifications";
import { getThemeStyles } from "../../constants/themeStyles";

import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

// Replace this with your actual deployed function URL
const FUNCTION_URL = "https://us-central1-hydrofluxapp-4b3b8.cloudfunctions.net/exportSensorDataCSV";

const Statistics = () => {
  // State declarations
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
    blackColorGreen,
    greenColorWhite,
    plantIoTCardBG,
    plantDataCardBG,
    plantPrescriptionsBG,
    statsIcon,
    dateBG,
  } = styles;
  const [currentMacAddress, setCurrentMacAddress] = useState("");
  const [aggregatedData, setAggregatedData] = useState({
    "pH Level": [],
    Temperature: [],
    EC: [],
    "TDS Value": [],
    "Water Level": [],
    Humidity: [],
  });
  const [selectedData, setSelectedData] = useState({ label: "pH Level", data: [] });
  const [userMacAddresses, setUserMacAddresses] = useState([]);
  const [currentIoTName, setCurrentIoTName] = useState("");
  // Date range states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleExportData = async () => {
    if (!startDate || !endDate) {
      Alert.alert("Please select a valid date range first.");
      return;
    }

    try {
      const start = startDate.toISOString();
      const end = endDate.toISOString();

      const url = `${FUNCTION_URL}?mac=${encodeURIComponent(currentMacAddress)}&startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${await response.text()}`);
      }

      const csv = await response.text();
      const fileUri = FileSystem.documentDirectory + "sensor_data.csv";
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error("Export failed:", error);
      Alert.alert("Export Failed", error.message);
    }
  };

  // Map sensor label to units
  const unitMapping = {
    "pH Level": " pH",
    Temperature: "°C",
    EC: " mS/cm",
    "TDS Value": " ppm",
    "Water Level": "",
    Humidity: "%",
  };

  // Get device width
  const deviceWidth = Dimensions.get("window").width;

  // Fetch plant date to initialize date range
  useEffect(() => {
    const fetchPlantDate = async () => {
      if (!currentMacAddress) return;
      try {
        const deviceDocRef = doc(firestoreDB, "devices", currentMacAddress);
        const deviceDocSnap = await getDoc(deviceDocRef);
        if (deviceDocSnap.exists() && deviceDocSnap.data().plantDate) {
          const plantDate = new Date(deviceDocSnap.data().plantDate);
          setStartDate(plantDate);
          const end = new Date(plantDate);
          end.setDate(end.getDate() + 100);
          setEndDate(end);
        }
      } catch (error) {
        console.error("Error fetching plant date:", error);
      }
    };
    fetchPlantDate();
  }, [currentMacAddress]);

  // Fetch user's device info and currentMacAddress
  useEffect(() => {
    const fetchMacAddresses = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userDocRef = doc(firestoreDB, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const macAddresses = userDocSnap.data().macAddresses || [];
        setUserMacAddresses(macAddresses);
        const currentMac = userDocSnap.data().currentMacAddress || (macAddresses[0] && macAddresses[0].mac);
        const currentName = macAddresses.find((m) => m.mac === currentMac)?.name || "";
        setCurrentMacAddress(currentMac);
        setCurrentIoTName(currentName);
      }
    };
    fetchMacAddresses();
  }, []);

  // Fetch aggregated data for the current device every 15 minutes,
  // but also re-run immediately when startDate or endDate change.
  useEffect(() => {
    if (!currentMacAddress) return;

    const fetchAggregatedData = async () => {
      try {
        const aggregatedRef = collection(firestoreDB, "devices", currentMacAddress, "aggregated");
        const q = query(aggregatedRef, orderBy("timestamp", "asc"));
        const snapshot = await getDocs(q);
        let tempData = {
          "pH Level": [],
          Temperature: [],
          EC: [],
          "TDS Value": [],
          "Water Level": [],
          Humidity: [],
        };
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          if (data.filteredAverageData) {
            const ts = data.timestamp ? data.timestamp.toDate() : new Date();
            // Format date as MM/DD
            const dateLabel = ts.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
            tempData["pH Level"].push({ value: data.filteredAverageData.ph, label: dateLabel, timestamp: ts });
            tempData["Temperature"].push({ value: data.filteredAverageData.temperature, label: dateLabel, timestamp: ts });
            tempData["EC"].push({ value: data.filteredAverageData.ec, label: dateLabel, timestamp: ts });
            tempData["TDS Value"].push({ value: data.filteredAverageData.tds, label: dateLabel, timestamp: ts });
            tempData["Water Level"].push({ value: data.filteredAverageData.water_level, label: dateLabel, timestamp: ts });
            tempData["Humidity"].push({ value: data.filteredAverageData.humidity, label: dateLabel, timestamp: ts });
          }
        });
        setAggregatedData(tempData);
        setSelectedData({ label: selectedData.label, data: tempData[selectedData.label] || [] });
      } catch (error) {
        console.error("Error fetching aggregated data:", error);
      }
    };

    // Fetch immediately when the effect runs
    fetchAggregatedData();
    // Then set up an interval to update every 15 minutes (900000 ms)
    const interval = setInterval(fetchAggregatedData, 900000);
    return () => clearInterval(interval);
  }, [currentMacAddress, selectedData.label, startDate, endDate]);

  // Filter data: date range, ignore negative values, adjust x-axis labels
  // Filter data: date range, ignore negative values, adjust x-axis labels
  const getFilteredData = () => {
    if (!selectedData.data || selectedData.data.length === 0) return [];

    // Sort the data by timestamp (ascending)
    const sorted = [...selectedData.data].sort((a, b) => a.timestamp - b.timestamp);

    // Group data by date (ignoring the time part)
    const groupedByDate = sorted.reduce((acc, item) => {
      const dateLabel = item.timestamp.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
      if (!acc[dateLabel]) acc[dateLabel] = [];
      acc[dateLabel].push(item);
      return acc;
    }, {});

    // Calculate the average for each group and round the value to 2 decimal places
    const averagedData = Object.keys(groupedByDate)
      .map((dateLabel) => {
        const values = groupedByDate[dateLabel].map((item) => item.value).filter((val) => !isNaN(val)); // Filter out NaN values

        // If no valid values, you might want to skip this date
        if (values.length === 0) return null;

        const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        return {
          label: dateLabel,
          value: parseFloat(avgValue.toFixed(2)), // Round to 2 decimal places
          timestamp: groupedByDate[dateLabel][0].timestamp, // Use the first timestamp for the date
        };
      })
      .filter((dataPoint) => dataPoint !== null); // Remove any null entries

    // Filter the data based on the date range
    const earliest = sorted[0].timestamp;
    const latest = sorted[sorted.length - 1].timestamp;
    const effectiveStart = startDate && startDate > earliest ? startDate : earliest;
    const effectiveEnd = endDate && endDate < latest ? endDate : latest;

    let filtered = averagedData.filter(
      (item) =>
        item.timestamp >= effectiveStart &&
        item.timestamp <= effectiveEnd &&
        !isNaN(item.value) && // Ensure value is a valid number
        (item.value === undefined || item.value >= 0)
    );

    // If no data points match the filter, return the original sorted data
    if (filtered.length === 0) filtered = averagedData;

    return filtered;
  };

  // Compute the chart width based on data points
  const filteredData = getFilteredData();
  // Calculate required width: initialSpacing (20) + (n-1)*spacing (68) + endSpacing (20)
  const computedWidth = filteredData.length > 0 ? 20 + (filteredData.length - 1) * 68 + 20 : deviceWidth * 0.8;
  // Ensure a minimum width of 80% of the device width
  const chartWidth = Math.max(deviceWidth * 0.8, computedWidth);

  const sensorIcons = {
    "pH Level": icons.phOutlineWhite,
    Temperature: icons.temperatureOutlineWhite,
    EC: icons.ecOutlineWhite,
    "TDS Value": icons.tdsOutlineWhite,
    "Water Level": icons.levelOutlineWhite,
    Humidity: icons.humidityOutlineWhite,
  };

  return (
    <SafeAreaView style={{ backgroundColor }} className="flex-1">
      <ScrollView style={{ flex: 1 }}>
        {/* Sensor Buttons */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginBottom: 16, paddingHorizontal: 2 }}>
          {["pH Level", "Temperature", "EC", "TDS Value", "Water Level", "Humidity"].map((sensor) => (
            <TouchableOpacity
              key={sensor}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 12,
                borderRadius: 10,
                margin: 4,
                backgroundColor: selectedData.label === sensor ? (theme === "dark" ? "#18daa3" : "#91F3D7") : statsIcon,
              }}
              onPress={() => setSelectedData({ label: sensor, data: aggregatedData[sensor] || [] })}
            >
              <Image
                source={sensorIcons[sensor]}
                style={{
                  width: 25,
                  height: 25,
                  tintColor: selectedData.label === sensor ? "#000" : theme === "dark" ? "#FFF" : "#000", // "#FFF" for selected, "#CCC" for unselected
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Horizontal ScrollView for the Chart */}
        <View style={{ marginVertical: 20, paddingHorizontal: 16 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <View style={{ width: chartWidth, overflow: "visible" }}>
              <LineChart
                areaChart
                curved={false}
                data={filteredData}
                width={chartWidth}
                showValuesAsDataPointsText // Show value labels at the data points
                dataPointsTextStyle={{
                  color: "white",
                  fontSize: 12,
                  fontWeight: "bold",
                }} // Style of labels
                spacing={68}
                mostNegativeValue={0}
                initialSpacing={20}
                endSpacing={20}
                color1={greenColor}
                startFillColor1={greenColor}
                endFillColor1={greenColor}
                startOpacity={0.9}
                endOpacity={0.2}
                noOfSections={4}
                yAxisColor={textColor}
                yAxisThickness={2}
                xAxisThickness={2}
                rulesType="solid"
                rulesColor="#7D8491"
                verticalLinesColor="#7D8491"
                thickness={4}
                textFontSize={15}
                textShiftY={-10}
                textColor1="white"
                showVerticalLines
                yAxisTextStyle={{
                  color: textColor,
                }}
                yAxisLabelSuffix={unitMapping[selectedData.label] || ""}
                xAxisColor={textColor}
                xAxisLabelTextStyle={{
                  color: textColor,
                }}
                xAxisLabelComponent={(label, index, totalLabels) => (
                  <View
                    style={{
                      marginLeft: index === 0 ? 20 : 0,
                      marginRight: index === totalLabels - 1 ? 20 : 0,
                    }}
                  >
                    <Text style={{ color: textColor }}>{label}</Text>
                  </View>
                )}
                pointerConfig={{
                  pointerStripUptoDataPoint: true,
                  pointerStripColor: "lightgray",
                  pointerStripWidth: 2,
                  strokeDashArray: [2, 5],
                  pointerColor: "lightgray",
                  radius: 4,
                  pointerLabelWidth: 100,
                  pointerLabelHeight: 120,
                  pointerLabelComponent: (items) => (
                    <View
                      style={{
                        height: 120,
                        width: 100,
                        backgroundColor: "#000",
                        borderRadius: 8,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: "gray", fontSize: 12 }}>2025</Text>
                      <Text style={{ color: "#FFF", fontWeight: "bold" }}>{items[0].value}</Text>
                    </View>
                  ),
                }}
                scatterData={filteredData.map((dataPoint, index) => ({
                  x: index, // Using the index of the filteredData array for X position
                  y: dataPoint.value, // The value of the Y position
                  dotSize: 10, // Size of the dot
                  dotColor: "#FFF", // Color of the dot
                  dotBorderColor: "#000", // Border color of the dot
                  dotBorderWidth: 2, // Border width of the dot
                }))}
              />
            </View>
          </ScrollView>
        </View>

        <Text style={{ fontSize: 18, color: headingFourTextColor, fontWeight: "bold", fontWeight: "800", marginHorizontal: 25, marginTop: 10, marginBottom: 15 }}>Select date range</Text>

        <View style={{ backgroundColor: dateBG, height: 60, marginHorizontal: 25, borderRadius: 12, marginBottom: 15 }} className="flex-row justify-between">
          <View className="flex-row items-center" style={{ backgroundColor: "", borderRadius: 15, padding: 20 }}>
            <View>
              <Image source={icons.dateStart} style={{ width: 30, height: 30, marginRight: 12, tintColor: greenColorBlack }} resizeMode="contain" />
            </View>
            <View>
              <Text style={{ color: textColor, fontSize: 18 }}>{startDate ? startDate.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }) : "No date selected"}</Text>

              <Text style={{ color: textColorMiddleLight, fontSize: 12 }}>Start Date</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            style={{
              alignSelf: "stretch",
              backgroundColor: "#18daa3",
              paddingVertical: 10,
              paddingHorizontal: 0,
              borderTopRightRadius: 12,
              borderBottomRightRadius: 12,
              // height: 40,
              justifyContent: "center",
            }}
          >
            <Image style={{ tintColor: "#000" }} source={icons.dateSet} className="w-8 h-8" resizeMode="contain" />
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display="default"
              design="material"
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={{ backgroundColor: dateBG, height: 60, marginHorizontal: 25, borderRadius: 12 }} className="flex-row justify-between">
          <View className="flex-row items-center" style={{ backgroundColor: "", borderRadius: 15, padding: 20 }}>
            <View>
              <Image source={icons.dateEnd} style={{ width: 30, height: 30, marginRight: 12, tintColor: greenColorBlack }} resizeMode="contain" />
            </View>
            <View>
              <Text style={{ color: textColor, fontSize: 18 }}>{endDate ? endDate.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" }) : "No date selected"}</Text>
              <Text style={{ color: textColorMiddleLight, fontSize: 12 }}>End Date</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            style={{
              alignSelf: "stretch",
              backgroundColor: "#18daa3",
              paddingVertical: 10,
              paddingHorizontal: 0,
              borderTopRightRadius: 12,
              borderBottomRightRadius: 12,
              // height: 40,
              justifyContent: "center",
            }}
          >
            <Image style={{ tintColor: "#000" }} source={icons.dateSet} className="w-8 h-8" resizeMode="contain" />
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) {
                  setEndDate(selectedDate);
                }
              }}
            />
          )}
        </View>
        <View style={{ marginHorizontal: 26 }} className="justify-center items-center">
          <TouchableOpacity onPress={handleExportData} style={{ width: 120, backgroundColor: greenColor }} className="mt-4 px-4 py-2 rounded">
            <Text className="text-white font-bold text-center" style={{ color: "#151522" }}>
              Export Data
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Statistics;
