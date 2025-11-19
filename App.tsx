import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { SalesProvider } from "./src/context/SalesContext";
import SignInScreen from "./src/screens/Auth/SignInScreen";
import SignUpScreen from "./src/screens/Auth/SignUpScreen";
import DashboardScreen from "./src/screens/DashboardScreen";

export type RootStackParamList = {
  Auth: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AuthStack: React.FC = () => {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth">
        {() =>
          isSignIn ? (
            <SignInScreen onToggleMode={() => setIsSignIn(false)} />
          ) : (
            <SignUpScreen onToggleMode={() => setIsSignIn(true)} />
          )
        }
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {currentUser ? (
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SalesProvider>
        <AppContent />
      </SalesProvider>
    </AuthProvider>
  );
};

export default App;
