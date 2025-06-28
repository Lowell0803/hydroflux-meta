import { StatusBar } from "expo-status-bar";
import { Redirect, Tabs } from "expo-router";
import { Image, Text, View } from "react-native";

import { icons } from "../../constants";
import { Loader } from "../../components";
import { useGlobalContext } from "../../context/GlobalProvider";
import TopBar from "../../components/TopBar";
import { usePathname } from "expo-router";

const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View className="flex items-center justify-center w-20">
      <Image source={icon} resizeMode="contain" tintColor={color} className="w-6 h-6 border" marginTop={35} />
      {/* <Text
        className={`${focused ? "font-psemibold" : "font-pregular"} text-xs`}
        style={{
          fontWeight: focused ? "600" : "400",
          color: color,
        }}
      >
        {name}
      </Text> */}
    </View>
  );
};

const TabLayout = () => {
  const { loading, isLogged, theme } = useGlobalContext(); // Get theme from context

  const pathname = usePathname(); // 👈 Get the current route
  const currentTab = pathname.split("/").pop(); // e.g. 'dashboard'

  const screenTitles = {
    dashboard: "Home",
    info: "Info",
    plant: "Plant",
    statistics: "Statistics",
    settings: "Settings",
  };

  const currentTitle = screenTitles[currentTab] || "Dashboard";
  if (!loading && !isLogged) return <Redirect href="/sign-in" />;

  return (
    <>
      <TopBar title={currentTitle} />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme === "dark" ? "#00FFB7" : "#18daa3",
          tabBarInactiveTintColor: theme === "dark" ? "#ced0de" : "#7A7A7A",
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: theme === "dark" ? "#121212" : "#FFF",
            borderTopWidth: 0,
            borderTopColor: theme === "dark" ? "#121212" : "#DCE2E5",
            height: 80,
            paddingBottom: 30,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => <TabIcon icon={icons.dashboard} color={color} name="Dashboard" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="info"
          options={{
            title: "Info",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => <TabIcon icon={icons.info} color={color} name="Info" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="plant"
          options={{
            title: "Plant",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => <TabIcon icon={icons.plant} color={color} name="Plant" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: "Statistics",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => <TabIcon icon={icons.statistics} color={color} name="Statistics" focused={focused} />,
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => <TabIcon icon={icons.settings} color={color} name="Settings" focused={focused} />,
          }}
        />
      </Tabs>

      <Loader isLoading={loading} />
      <StatusBar backgroundColor={theme === "dark" ? "#000" : "#161622"} style={theme === "dark" ? "light" : "dark"} />
    </>
  );
};

export default TabLayout;
