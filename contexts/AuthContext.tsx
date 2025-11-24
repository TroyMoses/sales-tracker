import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";
import {
  initDatabase,
  signup as dbSignup,
  signin as dbSignin,
} from "../services/database";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      await initDatabase();

      const storedUserId = await AsyncStorage.getItem("userId");
      const storedUsername = await AsyncStorage.getItem("username");
      const storedName = await AsyncStorage.getItem("name");

      if (storedUserId && storedUsername && storedName) {
        setUser({
          id: parseInt(storedUserId),
          username: storedUsername,
          name: storedName,
          passwordHash: "",
        });
        console.log("User session restored:", storedUsername);
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const loggedInUser = await dbSignin(username, password);
      setUser(loggedInUser);

      await AsyncStorage.setItem("userId", loggedInUser.id.toString());
      await AsyncStorage.setItem("username", loggedInUser.username);
      await AsyncStorage.setItem("name", loggedInUser.name);

      console.log("User logged in:", loggedInUser);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (username: string, password: string, name: string) => {
    try {
      const newUser = await dbSignup(username, password, name);
      setUser(newUser);

      await AsyncStorage.setItem("userId", newUser.id.toString());
      await AsyncStorage.setItem("username", newUser.username);
      await AsyncStorage.setItem("name", newUser.name);

      console.log("User registered:", newUser);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("userId");
      await AsyncStorage.removeItem("username");
      await AsyncStorage.removeItem("name");
      setUser(null);
      console.log("User logged out");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
