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
import { Client } from "../../types";
import { Users, Plus, X, Mail, Phone, Briefcase } from "lucide-react-native";

export default function ClientsScreen() {
  const { clients, addClient } = useSales();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [formData, setFormData] = useState<Omit<Client, "id" | "userId">>({
    name: "",
    phone: "",
    email: "",
    company: "",
    industry: "",
  });

  const handleAddClient = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert("Error", "Please fill in at least name and phone");
      return;
    }

    try {
      await addClient(formData);
      setModalVisible(false);
      setFormData({
        name: "",
        phone: "",
        email: "",
        company: "",
        industry: "",
      });
      Alert.alert("Success", "Client added successfully");
    } catch {
      Alert.alert("Error", "Failed to add client");
    }
  };

  const renderClient = ({ item }: { item: Client }) => (
    <View style={styles.clientCard}>
      <View style={styles.clientHeader}>
        <View style={styles.clientIcon}>
          <Users size={24} color="#3b82f6" strokeWidth={2} />
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.name}</Text>
          {item.company ? (
            <Text style={styles.clientCompany}>{item.company}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.clientDetails}>
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
        {item.industry ? (
          <View style={styles.detailRow}>
            <Briefcase size={16} color="#64748b" />
            <Text style={styles.detailText}>{item.industry}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={clients}
        renderItem={renderClient}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users size={64} color="#475569" strokeWidth={1.5} />
            <Text style={styles.emptyText}>No clients yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first client to get started
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
              <Text style={styles.modalTitle}>Add New Client</Text>
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
                  placeholder="Client name"
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Industry</Text>
                <TextInput
                  style={styles.input}
                  value={formData.industry}
                  onChangeText={(text) =>
                    setFormData({ ...formData, industry: text })
                  }
                  placeholder="Industry"
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddClient}
              >
                <Text style={styles.submitButtonText}>Add Client</Text>
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
  clientCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  clientIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#3b82f620",
    alignItems: "center",
    justifyContent: "center",
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#fff",
    marginBottom: 4,
  },
  clientCompany: {
    fontSize: 14,
    color: "#94a3b8",
  },
  clientDetails: {
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
    backgroundColor: "#3b82f6",
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
    backgroundColor: "#3b82f6",
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
