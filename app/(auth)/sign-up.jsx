import { useState } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, Dimensions, Alert, Image } from "react-native";
import { images } from "../../constants";
import { CustomButton, FormField } from "../../components";
import { auth, createUserWithEmailAndPassword, firestoreDB } from "../../lib/firebase";
import { fetchSignInMethodsForEmail, updateProfile, signOut } from "firebase/auth";
import { useGlobalContext } from "../../context/GlobalProvider";
import ThemeToggleIcon from "../../components/ThemeToggleIcon";
import Checkbox from "expo-checkbox";
import { getThemeStyles } from "../../constants/themeStyles";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const SignUp = () => {
  const { setUser, setIsLogged, theme, toggleTheme } = useGlobalContext();
  const [isSubmitting, setSubmitting] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false); // State for checkbox
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const submit = async () => {
    if (form.username === "" || form.email === "" || form.password === "") {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!tosAccepted) {
      Alert.alert("Error", "You must agree to the Data Privacy Policy.");
      return;
    }

    setSubmitting(true);
    try {
      // 1️⃣ Check that the username isn't taken
      const usernameRef = doc(firestoreDB, "usernames", form.username);
      const usernameSnap = await getDoc(usernameRef);
      if (usernameSnap.exists()) {
        throw new Error("Username already taken");
      }

      // 2️⃣ Check that the email isn't already in use
      const methods = await fetchSignInMethodsForEmail(auth, form.email);
      if (methods.length > 0) {
        throw new Error("Email already in use");
      }

      // 3️⃣ Create the Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      // 4️⃣ Save their username in the Auth profile
      await updateProfile(user, { displayName: form.username });

      // ⏱ Give Firebase a moment to register auth state
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 5️⃣ Now write the username lookup document
      await setDoc(usernameRef, {
        uid: user.uid,
        email: form.email,
        createdAt: serverTimestamp(),
      });

      // 6️⃣ Sign out the user immediately
      await signOut(auth);

      // Success: prompt and go to Sign In
      Alert.alert("Success", "Registration successful—please sign in.");
      router.replace("/sign-in");
    } catch (error) {
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
        <View style={{ flex: 2, borderWidth: 0, borderColor: "#F00", borderRadius: 5 }} className="items-center">
          <Image source={logo} style={{ marginTop: 40 }} resizeMode="contain" className="w-[170px] h-[40px]" />
          <View style={{ marginTop: 50 }} className="flex flex-row justify-between items-center w-full">
            <Text style={{ color: headingTextColor, marginBottom: 5, fontWeight: "900", fontSize: 30 }}>Register</Text>
            <ThemeToggleIcon toggleTheme={toggleTheme} theme={theme} />
          </View>
        </View>
        <View style={{ flex: 5, borderWidth: 0, borderColor: "#F00", borderRadius: 5, paddingTop: 0 }} className="justify-center">
          <FormField title="Username" placeholder="Username" value={form.username} handleChangeText={(e) => setForm({ ...form, username: e })} otherStyles="" />
          <FormField title="Email" placeholder="Email" value={form.email} handleChangeText={(e) => setForm({ ...form, email: e })} otherStyles="" keyboardType="email-address" />
          <FormField title="Password" placeholder="Password" value={form.password} handleChangeText={(e) => setForm({ ...form, password: e })} otherStyles="" />

          {/* Data Privacy Notice */}
          {/* <Text style={{ color: tosColor, fontSize: 10, textAlign: "center", marginTop: 20 }}>
            By registering, you acknowledge and agree to our{"\n "}
            <Link href="/data-privacy" style={{ color: "#473BF0", textDecorationLine: "underline" }}>
              Privacy and Data Protection Policy
            </Link>
            .
          </Text> */}
          {/* Terms of Service with Checkbox */}
          <View className="flex-row items-center mt-7">
            <Checkbox style={{ backgroundColor: checkboxColor, borderColor: checkboxColor, borderRadius: 5 }} value={tosAccepted} onValueChange={setTosAccepted} color={tosAccepted ? "#18daa3" : undefined} />
            <Text style={{ color: textColor, fontSize: 14, marginLeft: 8 }}>
              I agree to the{" "}
              <Link href="/data-privacy" style={{ color: textColor, textDecorationLine: "underline" }}>
                Data Privacy Policy
              </Link>
              .
            </Text>
          </View>

          <CustomButton title="Register" handlePress={submit} containerStyles="mt-7" isLoading={isSubmitting} buttonStyle={{ backgroundColor: loginButtonBg }} textStyle={{ color: loginButtonTextColor }} disabled={!isFormValid} />
        </View>

        <View style={{ flex: 1 }} className="flex-4 justify-center pt-5 flex-row">
          <Text style={{ color: textColor, fontWeight: "500" }}>
            Already Registered? Let’s {}
            <Link href="/sign-in" className="text-md" style={{ color: "#18daa3", textDecorationLine: "underline" }}>
              Login
            </Link>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignUp;
