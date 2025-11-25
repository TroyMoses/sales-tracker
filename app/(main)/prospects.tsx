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
import {
  Target,
  Plus,
  X,
  Mail,
  Phone,
  TrendingUp,
  Edit,
  Trash2,
} from "lucide-react-native";
import { confirmDelete } from "../../utils/confirmDelete";
import { ExportButton } from "../../components/ExportButton";
import { exportProspectsToCSV } from "../../services/excelExportService";

export default function ProspectsScreen() {
  const {
    prospects,
    addProspect,
    updateProspect,
    deleteProspect,
    convertProspectToClient,
  } = useSales();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [convertModalVisible, setConvertModalVisible] =
    useState<boolean>(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(
    null
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<Prospect, "id" | "userId">>({
    name: "",
    phone: "",
    email: "",
    company: "",
    status: "New",
    followUpDate: new Date().toISOString().split("T")[0],
  });
  const [saleFormData, setSaleFormData] = useState<{
    amount: string;
    productOrService: string;
  }>({
    amount: "",
    productOrService: "",
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

  const handleEditProspect = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      Alert.alert("Error", "Please fill in at least name and phone");
      return;
    }

    try {
      await updateProspect(editingId!, formData);
      setModalVisible(false);
      setEditingId(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        company: "",
        status: "New",
        followUpDate: new Date().toISOString().split("T")[0],
      });
      Alert.alert("Success", "Prospect updated successfully");
    } catch {
      Alert.alert("Error", "Failed to update prospect");
    }
  };

  const handleDeleteProspect = (prospect: Prospect) => {
    confirmDelete(`"${prospect.name}"`, async () => {
      try {
        await deleteProspect(prospect.id);
        Alert.alert("Success", "Prospect deleted successfully");
      } catch {
        Alert.alert("Error", "Failed to delete prospect");
      }
    });
  };

  const openEditModal = (prospect: Prospect) => {
    setFormData({
      name: prospect.name,
      phone: prospect.phone,
      email: prospect.email,
      company: prospect.company,
      status: prospect.status,
      followUpDate: prospect.followUpDate,
    });
    setEditingId(prospect.id);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      company: "",
      status: "New",
      followUpDate: new Date().toISOString().split("T")[0],
    });
    setEditingId(null);
    setModalVisible(true);
  };

  const handleConvertToClient = async () => {
    if (!selectedProspect) return;

    if (!saleFormData.amount.trim() || !saleFormData.productOrService.trim()) {
      Alert.alert("Error", "Please fill in all sale details");
      return;
    }

    const amount = parseFloat(saleFormData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      await convertProspectToClient(selectedProspect.id, {
        amount,
        productOrService: saleFormData.productOrService,
        date: new Date().toISOString(),
      });
      setConvertModalVisible(false);
      setSelectedProspect(null);
      setSaleFormData({
        amount: "",
        productOrService: "",
      });
      Alert.alert("Success", "Prospect converted to client with sale!");
    } catch {
      Alert.alert("Error", "Failed to convert prospect");
    }
  };

  const openConvertModal = (prospect: Prospect) => {
    setSelectedProspect(prospect);
    setConvertModalVisible(true);
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
      <View style={styles.prospectActions}>
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          style={styles.actionButton}
        >
          <Edit size={18} color="#3b82f6" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDeleteProspect(item)}
          style={styles.actionButton}
        >
          <Trash2 size={18} color="#ef4444" strokeWidth={2} />
        </TouchableOpacity>
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
      {item.status !== "Won" && (
        <TouchableOpacity
          style={styles.convertButton}
          onPress={() => openConvertModal(item)}
        >
          <TrendingUp size={16} color="#fff" strokeWidth={2} />
          <Text style={styles.convertButtonText}>Convert to Client</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Prospects</Text>
        <ExportButton
          onExport={() => exportProspectsToCSV(prospects)}
          filename="sales-tracker-prospects"
          label="Export"
          buttonColor="#f59e0b"
        />
      </View>
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

      <TouchableOpacity style={styles.fab} onPress={() => openAddModal()}>
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
              <Text style={styles.modalTitle}>
                {editingId ? "Edit Prospect" : "Add New Prospect"}
              </Text>
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
                onPress={editingId ? handleEditProspect : handleAddProspect}
              >
                <Text style={styles.submitButtonText}>
                  {editingId ? "Update Prospect" : "Add Prospect"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={convertModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setConvertModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Convert to Client & Record Sale
              </Text>
              <TouchableOpacity onPress={() => setConvertModalVisible(false)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {selectedProspect && (
                <View style={styles.prospectPreview}>
                  <Text style={styles.prospectPreviewLabel}>Converting:</Text>
                  <Text style={styles.prospectPreviewName}>
                    {selectedProspect.name}
                  </Text>
                  <Text style={styles.prospectPreviewCompany}>
                    {selectedProspect.company}
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sale Amount (UGX) *</Text>
                <TextInput
                  style={styles.input}
                  value={saleFormData.amount}
                  onChangeText={(text) =>
                    setSaleFormData({ ...saleFormData, amount: text })
                  }
                  placeholder="0.00"
                  placeholderTextColor="#64748b"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Product/Service *</Text>
                <TextInput
                  style={styles.input}
                  value={saleFormData.productOrService}
                  onChangeText={(text) =>
                    setSaleFormData({ ...saleFormData, productOrService: text })
                  }
                  placeholder="What was sold?"
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleConvertToClient}
              >
                <Text style={styles.submitButtonText}>
                  Convert & Record Sale
                </Text>
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
  headerBar: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#fff",
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
  prospectActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
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
  convertButton: {
    marginTop: 12,
    backgroundColor: "#10b981",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  convertButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  prospectPreview: {
    backgroundColor: "#0f172a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  prospectPreviewLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 8,
  },
  prospectPreviewName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 4,
  },
  prospectPreviewCompany: {
    fontSize: 14,
    color: "#94a3b8",
  },
});
