import React, { useState, useEffect } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Dimensions, Alert, Image } from "react-native";
import { images } from "../../constants";
import { CustomButton, FormField } from "../../components";
// import { auth, signInWithEmailAndPassword } from "../../lib/firebase";
import { auth, signInWithEmailAndPassword, firestoreDB } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useGlobalContext } from "../../context/GlobalProvider";
import ThemeToggleIcon from "../../components/ThemeToggleIcon";
import Checkbox from "expo-checkbox";
import { getThemeStyles } from "../../constants/themeStyles";
import { setDoc } from "firebase/firestore";

const SignIn = () => {
  const { setUser, setIsLogged, theme, toggleTheme, loading, isLogged } = useGlobalContext();
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [isDevMode, setIsDevMode] = useState(false); // Set to true for dev mode
  const [tosAccepted, setTosAccepted] = useState(false); // State for checkbox

  useEffect(() => {
    if (!loading && isLogged) {
      router.replace("/plant");
    }
  }, [loading, isLogged]);

  const submit = async () => {
    setSubmitting(true);
    try {
      let loginIdentifier = form.email.trim();
      let password = form.password;

      if (isDevMode) {
        // 🧪 Dev mode: use predefined credentials
        loginIdentifier = "juandelacruz@gmail.com";
        password = "password123";
      } else {
        // 🚫 Prevent login if TOS isn't accepted
        if (!tosAccepted) {
          Alert.alert("Error", "You must agree to the Terms of Service.");
          return;
        }

        // 🔍 Resolve username if it's not an email
        if (!loginIdentifier.includes("@")) {
          if (loginIdentifier === "") {
            throw new Error("Please enter a username or email.");
          }

          const usernameDoc = await getDoc(doc(firestoreDB, "usernames", loginIdentifier));
          if (!usernameDoc.exists()) {
            throw new Error("Username not found");
          }
          loginIdentifier = usernameDoc.data().email;
        }
      }

      // ✅ Sign in
      const userCredential = await signInWithEmailAndPassword(auth, loginIdentifier, password);
      const user = userCredential.user;

      const macAddress = "98-F4-AB-C2-F9-CC"; // Replace with dynamic MAC if needed
      await setDoc(doc(firestoreDB, "devices", macAddress), { userId: user.uid }, { merge: true });

      setUser(user);
      setIsLogged(true);
      Alert.alert("Success", "User signed in successfully");
      router.replace("/plant");
    } catch (error) {
      console.log("Firebase Auth Error:", error.code, error.message);
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const { checkboxColor, backgroundColor, textColor, logo, headingTextColor, welcomeCards, buttonColor, buttonText } = getThemeStyles(theme, images);

  // Determine if all fields are filled and the TOS checkbox is checked
  const isFormValid = form.email.trim() !== "" && form.password.trim() !== "" && tosAccepted;

  // Default colors for the login button
  const defaultButtonBg = theme === "dark" ? "#090a12" : "#191c32";
  const defaultButtonTextColor = theme === "dark" ? "#18daa3" : "#18daa3";

  // If form is valid, swap the button colors
  const loginButtonBg = isFormValid ? defaultButtonTextColor : defaultButtonBg;
  const loginButtonTextColor = isFormValid ? defaultButtonBg : defaultButtonTextColor;

  return (
    <SafeAreaView style={{ backgroundColor: backgroundColor }} className="h-full flex-1">
      <View
        className="w-full flex h-full"
        style={{
          minHeight: Dimensions.get("window").height - 100,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ flex: 2 }} className="items-center">
          <Image source={logo} style={{ marginTop: 40 }} resizeMode="contain" className="w-[170px] h-[40px]" />
          <View style={{ marginTop: 50 }} className="flex flex-row justify-between items-center w-full">
            <Text style={{ color: headingTextColor, marginBottom: 5, fontWeight: "900", fontSize: 30 }}>Log In</Text>
            <ThemeToggleIcon toggleTheme={toggleTheme} theme={theme} />
          </View>
        </View>
        <View style={{ flex: 5, paddingTop: 75 }}>
          {/* Form fields */}
          <FormField title="Email" placeholder="Enter Email / Username" value={form.email} handleChangeText={(e) => setForm({ ...form, email: e })} otherStyles="" keyboardType="email-address" />
          <FormField title="Password" placeholder="Password" value={form.password} handleChangeText={(e) => setForm({ ...form, password: e })} otherStyles="" />

          {/* Terms of Service with Checkbox */}
          <View className="flex-row items-center mt-7">
            <Checkbox style={{ backgroundColor: checkboxColor, borderColor: checkboxColor, borderRadius: 5 }} value={tosAccepted} onValueChange={setTosAccepted} color={tosAccepted ? "#18daa3" : undefined} />
            <Text style={{ color: textColor, fontSize: 14, marginLeft: 8 }}>
              I agree to the{" "}
              <Link href="/tos" style={{ color: textColor, textDecorationLine: "underline" }}>
                Terms of Service
              </Link>
              .
            </Text>
          </View>

          {/* Sign in button */}
          <CustomButton title="Login" handlePress={submit} containerStyles="mt-7" isLoading={isSubmitting} buttonStyle={{ backgroundColor: loginButtonBg }} textStyle={{ color: loginButtonTextColor }} disabled={!isFormValid} />
        </View>
        {/* Sign-up link */}
        <View style={{ flex: 1 }} className="flex-4 justify-center pt-5 flex-row">
          <Text style={{ color: textColor, fontWeight: "500" }}>
            Don't have an account? Let's{" "}
            <Link href="/sign-up" className="text-md" style={{ textDecorationLine: "underline" }}>
              Register
            </Link>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignIn;
