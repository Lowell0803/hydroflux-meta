import { auth } from "../../lib/firebase";
import { useGlobalContext } from "../../context/GlobalProvider";
import { Alert } from "react-native";
import { router } from "expo-router";

export const signOutUser = async (setUser, setIsLogged) => {
  try {
    await auth.signOut();

    setUser(null);
    setIsLogged(false);

    Alert.alert("Success", "You have successfully signed out.");
    router.push("/sign-in");
  } catch (error) {
    Alert.alert(
      "Error",
      "An error occurred while signing out. Please try again."
    );
  }
};

export default signOutUser;
