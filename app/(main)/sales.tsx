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
import { Sale } from "../../types";
import { DollarSign, Plus, X, Edit, Trash2 } from "lucide-react-native";
import { confirmDelete } from "../../utils/confirmDelete";
import { ExportButton } from "../../components/ExportButton";
import { exportSalesToCSV } from "../../services/excelExportService";

export default function SalesScreen() {
  const { sales, clients, addSale, updateSale, deleteSale } = useSales();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    clientId: string;
    amount: string;
    productOrService: string;
    date: string;
  }>({
    clientId: "",
    amount: "",
    productOrService: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleAddSale = async () => {
    if (
      !formData.clientId ||
      !formData.amount.trim() ||
      !formData.productOrService.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      await addSale({
        clientId: parseInt(formData.clientId),
        amount,
        productOrService: formData.productOrService,
        date: formData.date,
      });
      setModalVisible(false);
      setFormData({
        clientId: "",
        amount: "",
        productOrService: "",
        date: new Date().toISOString().split("T")[0],
      });
      Alert.alert("Success", "Sale added successfully");
    } catch {
      Alert.alert("Error", "Failed to add sale");
    }
  };

  const handleEditSale = async () => {
    if (!formData.amount.trim() || !formData.productOrService.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      await updateSale(editingId!, {
        amount,
        productOrService: formData.productOrService,
        date: formData.date,
      });
      setModalVisible(false);
      setEditingId(null);
      setFormData({
        clientId: "",
        amount: "",
        productOrService: "",
        date: new Date().toISOString().split("T")[0],
      });
      Alert.alert("Success", "Sale updated successfully");
    } catch {
      Alert.alert("Error", "Failed to update sale");
    }
  };

  const handleDeleteSale = (sale: Sale & { clientName: string }) => {
    confirmDelete(`this sale for "${sale.clientName}"`, async () => {
      try {
        await deleteSale(sale.id);
        Alert.alert("Success", "Sale deleted successfully");
      } catch {
        Alert.alert("Error", "Failed to delete sale");
      }
    });
  };

  const openEditModal = (sale: Sale & { clientName: string }) => {
    setFormData({
      clientId: sale.clientId.toString(),
      amount: sale.amount.toString(),
      productOrService: sale.productOrService,
      date: sale.date,
    });
    setEditingId(sale.id);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setFormData({
      clientId: "",
      amount: "",
      productOrService: "",
      date: new Date().toISOString().split("T")[0],
    });
    setEditingId(null);
    setModalVisible(true);
  };

  const renderSale = ({ item }: { item: Sale & { clientName: string } }) => (
    <View style={styles.saleCard}>
      <View style={styles.saleHeader}>
        <View style={styles.saleIcon}>
          <DollarSign size={24} color="#10b981" strokeWidth={2} />
        </View>
        <View style={styles.saleInfo}>
          <Text style={styles.saleClient}>{item.clientName}</Text>
          <Text style={styles.saleProduct}>{item.productOrService}</Text>
          <Text style={styles.saleDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.saleActions}>
          <Text style={styles.saleAmount}>
            UGX {item.amount.toLocaleString()}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              style={styles.actionButton}
            >
              <Edit size={18} color="#3b82f6" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteSale(item)}
              style={styles.actionButton}
            >
              <Trash2 size={18} color="#ef4444" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Sales</Text>
        <ExportButton
          onExport={() => exportSalesToCSV(sales)}
          filename="sales-tracker-sales"
          label="Export"
          buttonColor="#10b981"
        />
      </View>
      <FlatList
        data={sales}
        renderItem={renderSale}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <DollarSign size={64} color="#475569" strokeWidth={1.5} />
            <Text style={styles.emptyText}>No sales yet</Text>
            <Text style={styles.emptySubtext}>
              Record your first sale to get started
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
                {editingId ? "Edit Sale" : "Record New Sale"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Client *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.clientPills}
                >
                  {clients.map((client) => (
                    <TouchableOpacity
                      key={client.id}
                      style={[
                        styles.clientPill,
                        formData.clientId === client.id.toString() &&
                          styles.clientPillSelected,
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          clientId: client.id.toString(),
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.clientPillText,
                          formData.clientId === client.id.toString() &&
                            styles.clientPillTextSelected,
                        ]}
                      >
                        {client.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Amount *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.amount}
                  onChangeText={(text) =>
                    setFormData({ ...formData, amount: text })
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
                  value={formData.productOrService}
                  onChangeText={(text) =>
                    setFormData({ ...formData, productOrService: text })
                  }
                  placeholder="What was sold?"
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={editingId ? handleEditSale : handleAddSale}
              >
                <Text style={styles.submitButtonText}>
                  {editingId ? "Update Sale" : "Record Sale"}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e293b",
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  saleCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  saleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#10b98120",
    alignItems: "center",
    justifyContent: "center",
  },
  saleInfo: {
    flex: 1,
    gap: 4,
  },
  saleActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  saleClient: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  saleProduct: {
    fontSize: 14,
    color: "#94a3b8",
  },
  saleDate: {
    fontSize: 12,
    color: "#64748b",
  },
  saleAmount: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#10b981",
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
    backgroundColor: "#10b981",
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
  clientPills: {
    flexDirection: "row",
    gap: 8,
  },
  clientPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    marginRight: 8,
  },
  clientPillSelected: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  clientPillText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500" as const,
  },
  clientPillTextSelected: {
    color: "#fff",
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
    backgroundColor: "#10b981",
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
