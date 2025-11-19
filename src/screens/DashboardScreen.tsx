import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useSales } from "../context/SalesContext";

interface User {
  id: number;
  name: string;
  email?: string;
}

interface Client {
  id: number;
  name: string;
  company?: string;
}

interface Prospect {
  id: number;
  name: string;
  company?: string;
  status: string;
}

interface Sale {
  id?: number;
  date: string;
  amount: number;
  productOrService: string;
  prospectId?: number;
}

interface FollowUp {
  id: number;
  date: string;
  notes: string;
  isCompleted: boolean | number;
}

interface AuthContextValue {
  currentUser?: User | null;
  logout: () => void;
}

interface SalesContextValue {
  clients: Client[];
  prospects: Prospect[];
  sales: Sale[];
  followUps: FollowUp[];
  convertProspectToClient: (prospectId: number, sale: Sale) => void;
}

const DashboardScreen: React.FC = () => {
  const { currentUser, logout } = useAuth() as AuthContextValue;
  const { clients, prospects, sales, followUps, convertProspectToClient } =
    useSales() as SalesContextValue;

  const handleConvertProspect = (prospectId: number) => {
    Alert.prompt(
      "Convert Prospect",
      "Enter sale amount:",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Convert",
          onPress: (amount?: string) => {
            if (amount && !isNaN(parseFloat(amount))) {
              convertProspectToClient(prospectId, {
                date: new Date().toISOString(),
                amount: parseFloat(amount),
                productOrService: "Product/Service Sale",
              });
              Alert.alert(
                "Success",
                "Prospect converted to client and sale recorded!"
              );
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: logout, style: "destructive" },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.welcome}>Welcome, {currentUser?.name}!</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{clients.length}</Text>
            <Text style={styles.summaryLabel}>Clients</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{prospects.length}</Text>
            <Text style={styles.summaryLabel}>Prospects</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{sales.length}</Text>
            <Text style={styles.summaryLabel}>Sales</Text>
          </View>
        </View>

        {/* Recent Prospects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Prospects</Text>
          {prospects.slice(0, 5).map((prospect: Prospect) => (
            <View key={prospect.id} style={styles.listItem}>
              <View>
                <Text style={styles.itemName}>{prospect.name}</Text>
                <Text style={styles.itemCompany}>{prospect.company}</Text>
                <Text style={styles.itemStatus}>Status: {prospect.status}</Text>
              </View>
              {prospect.status !== "Won" && (
                <TouchableOpacity
                  style={styles.convertButton}
                  onPress={() => handleConvertProspect(prospect.id)}
                >
                  <Text style={styles.convertButtonText}>Convert</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {prospects.length === 0 && (
            <Text style={styles.emptyText}>No prospects yet</Text>
          )}
        </View>

        {/* Upcoming Follow-ups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Follow-ups</Text>
          {followUps
            .filter((fu: FollowUp) => !fu.isCompleted)
            .slice(0, 5)
            .map((followUp: FollowUp) => (
              <View key={followUp.id} style={styles.listItem}>
                <Text style={styles.itemName}>
                  Follow-up: {new Date(followUp.date).toLocaleDateString()}
                </Text>
                <Text style={styles.itemNotes} numberOfLines={2}>
                  {followUp.notes}
                </Text>
              </View>
            ))}
          {followUps.filter((fu: FollowUp) => !fu.isCompleted).length === 0 && (
            <Text style={styles.emptyText}>No upcoming follow-ups</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  welcome: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  logoutButton: {
    position: "absolute",
    top: 60,
    right: 20,
    padding: 10,
  },
  logoutText: {
    color: "#FF3B30",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  summaryCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  section: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  itemCompany: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  itemStatus: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  convertButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  convertButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
    padding: 20,
  },
});

export default DashboardScreen;
