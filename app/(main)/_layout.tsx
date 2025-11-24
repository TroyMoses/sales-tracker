import { Stack } from "expo-router";
import { TouchableOpacity, Alert } from "react-native";
import { LogOut } from "lucide-react-native";
import { useAuth } from "../../contexts/AuthContext";

export default function MainLayout() {
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1e293b",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "700" as const,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Dashboard",
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 8 }}>
              <LogOut size={22} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="clients"
        options={{
          title: "Clients",
        }}
      />
      <Stack.Screen
        name="prospects"
        options={{
          title: "Prospects",
        }}
      />
      <Stack.Screen
        name="sales"
        options={{
          title: "Sales",
        }}
      />
      <Stack.Screen
        name="calls"
        options={{
          title: "Calls",
        }}
      />
    </Stack>
  );
}
