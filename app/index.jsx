import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Redirect, router } from "expo-router";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "../constants";
import { CustomButton, Loader } from "../components";
import { useGlobalContext } from "../context/GlobalProvider";
import { getThemeStyles } from "../constants/themeStyles"; // Import the theme styles function

const Welcome = () => {
  const { loading, isLogged, theme } = useGlobalContext();

  // if (!loading) return <Redirect href="/plant" />;
  const { backgroundColor, textColor, logo, welcomeCards, buttonColor, buttonText } = getThemeStyles(theme, images);

  if (!loading && isLogged) return <Redirect href="/plant" />; // Changed from /home to /plant

  // const backgroundColor = theme === "dark" ? "#151522" : "#fafafa";
  // const textColor = theme === "dark" ? "#FFFFFF" : "#191c32";
  // const logo = theme === "dark" ? images.logo : images.logoBlack;
  // const cards = theme === "dark" ? images.cards : images.cardsBlack;
  // const buttonText = theme === "dark" ? "#151522" : "#192235";

  const handlePress = () => {
    // This will navigate the user to the sign-in screen.
    router.push("/sign-in");
  };

  return (
    <SafeAreaView style={{ backgroundColor }} className="h-full">
      <Loader isLoading={loading} />

      <ScrollView
        contentContainerStyle={{
          height: "100%",
        }}
      >
        <View className="w-full flex justify-center items-center h-full px-4">
          <Image source={logo} className="w-[170px] h-[84px]" resizeMode="contain" />

          <Image source={welcomeCards} className="max-w-[380px] w-full h-[298px]" resizeMode="contain" />

          <View className="relative mt-5">
            <Text style={{ color: textColor }} className="text-2xl font-bold text-center">
              Monitor your hydroponics {"\n"} with <Text style={{ color: "#18daa3" }}>HydroFlux</Text>
            </Text>

            <Image source={images.path} className="w-[136px] h-[15px] absolute -bottom-2 right-12" resizeMode="contain" />
          </View>

          <Text style={{ color: textColor }} className="text-sm font-pregular mt-7 text-center">
            Stay Informed, Grow Better
          </Text>

          <TouchableOpacity onPress={handlePress} style={{}}>
            <View style={{ width: 200, backgroundColor: buttonColor, borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 30 }}>
              <Text style={{ fontSize: 18, fontWeight: 800, color: buttonText }}>Go to Login Page</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <StatusBar backgroundColor="#161622" style="light" />
    </SafeAreaView>
  );
};

export default Welcome;
