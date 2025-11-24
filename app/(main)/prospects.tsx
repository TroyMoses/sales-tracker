import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSales } from "../../contexts/SalesContext";
import { Prospect } from "../../types";
import { Target, Plus, X, Mail, Phone } from "lucide-react-native";

export default function ProspectsScreen() {
  const { prospects, addProspect } = useSales();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [formData, setFormData] = useState<Omit<Prospect, "id" | "userId">>({
    name: "",
    phone: "",
    email: "",
    company: "",
    status: "New",
    followUpDate: new Date().toISOString().split("T")[0],
  });

  const handleAddProspect = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert("Error", "Please fill in at least name and phone");
      return;
    }

    try {
      await addProspect(formData);
      setModalVisible(false);
      setFormData({
        name: "",
        phone: "",
        email: "",
        company: "",
        status: "New",
        followUpDate: new Date().toISOString().split("T")[0],
      });
      Alert.alert("Success", "Prospect added successfully");
    } catch {
      Alert.alert("Error", "Failed to add prospect");
    }
  };

  const getStatusColor = (status: Prospect["status"]) => {
    switch (status) {
      case "New":
        return "#3b82f6";
      case "Contacted":
        return "#f59e0b";
      case "Qualified":
        return "#8b5cf6";
      case "Won":
        return "#10b981";
      default:
        return "#64748b";
    }
  };

  const renderProspect = ({ item }: { item: Prospect }) => (
    <View style={styles.prospectCard}>
      <View style={styles.prospectHeader}>
        <View
          style={[
            styles.prospectIcon,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Target
            size={24}
            color={getStatusColor(item.status)}
            strokeWidth={2}
          />
        </View>
        <View style={styles.prospectInfo}>
          <Text style={styles.prospectName}>{item.name}</Text>
          {item.company ? (
            <Text style={styles.prospectCompany}>{item.company}</Text>
          ) : null}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.prospectDetails}>
        {item.phone ? (
          <View style={styles.detailRow}>
            <Phone size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        ) : null}
        {item.email ? (
          <View style={styles.detailRow}>
            <Mail size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={prospects}
        renderItem={renderProspect}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Target size={64} color="#475569" strokeWidth={1.5} />
            <Text style={styles.emptyText}>No prospects yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first prospect to get started
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Prospect</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Prospect name"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  placeholder="Phone number"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  placeholder="Email address"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company</Text>
                <TextInput
                  style={styles.input}
                  value={formData.company}
                  onChangeText={(text) =>
                    setFormData({ ...formData, company: text })
                  }
                  placeholder="Company name"
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddProspect}
              >
                <Text style={styles.submitButtonText}>Add Prospect</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  prospectCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  prospectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  prospectIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  prospectInfo: {
    flex: 1,
  },
  prospectName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#fff",
    marginBottom: 4,
  },
  prospectCompany: {
    fontSize: 14,
    color: "#94a3b8",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  prospectDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#fff",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 8,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#fff",
  },
  modalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#e2e8f0",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#fff",
  },
  submitButton: {
    backgroundColor: "#f59e0b",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
