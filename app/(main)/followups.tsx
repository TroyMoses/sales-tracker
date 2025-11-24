import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useSales } from "../../contexts/SalesContext";
import { FollowUpWithDetails, FollowUpEntityType } from "../../types";
import {
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  Users,
  Target,
  Plus,
  X,
  Edit,
  Trash2,
} from "lucide-react-native";
import { confirmDelete } from "../../utils/confirmDelete";

export default function FollowUpsScreen() {
  const {
    followUpsWithDetails,
    completeFollowUp,
    addFollowUp,
    updateFollowUp,
    deleteFollowUp,
    clients,
    prospects,
    phoneNumbers,
  } = useSales();
  const [activeTab, setActiveTab] = useState<"pending" | "completed">(
    "pending"
  );
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingFollowUpId, setEditingFollowUpId] = useState<number | null>(null);
  const [entityType, setEntityType] = useState<FollowUpEntityType>("client");
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [followUpTime, setFollowUpTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { pending, completed, overdue } = useMemo(() => {
    const now = new Date();
    const pendingFollowUps = followUpsWithDetails.filter(
      (f) => f.isCompleted === 0
    );
    const completedFollowUps = followUpsWithDetails.filter(
      (f) => f.isCompleted === 1
    );

    const overdueFollowUps = pendingFollowUps.filter((f) => {
      const followUpDateObj = new Date(f.date);
      return followUpDateObj < now;
    });

    return {
      pending: pendingFollowUps,
      completed: completedFollowUps,
      overdue: overdueFollowUps.length,
    };
  }, [followUpsWithDetails]);

  const handleComplete = async (followUpId: number) => {
    Alert.alert("Complete Follow-up", "Mark this follow-up as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        style: "default",
        onPress: async () => {
          try {
            await completeFollowUp(followUpId);
          } catch {
            Alert.alert("Error", "Failed to complete follow-up");
          }
        },
      },
    ]);
  };

  const validateDateTimeInputs = (): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;

    if (!dateRegex.test(followUpDate)) {
      Alert.alert("Invalid Date", "Please enter date in YYYY-MM-DD format");
      return false;
    }

    if (!timeRegex.test(followUpTime)) {
      Alert.alert("Invalid Time", "Please enter time in HH:MM format");
      return false;
    }

    // Validate the date is actually valid
    const dateParts = followUpDate.split("-");
    const date = new Date(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2])
    );
    
    if (isNaN(date.getTime())) {
      Alert.alert("Invalid Date", "Please enter a valid date");
      return false;
    }

    // Validate time parts
    const timeParts = followUpTime.split(":");
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      Alert.alert("Invalid Time", "Hours must be 0-23 and minutes 0-59");
      return false;
    }

    return true;
  };

  const handleAddFollowUp = async () => {
    if (!selectedEntityId || !notes.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!validateDateTimeInputs()) {
      return;
    }

    try {
      const timeParts = followUpTime.split(":");
      const dateParts = followUpDate.split("-");
      const date = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        parseInt(timeParts[0]),
        parseInt(timeParts[1])
      );

      const dateTimeString = date.toISOString();

      await addFollowUp({
        entityId: selectedEntityId,
        entityType,
        date: dateTimeString,
        notes: notes.trim(),
        isCompleted: 0,
      });

      setShowAddModal(false);
      resetForm();

      Alert.alert("Success", "Follow-up created successfully");
    } catch {
      Alert.alert("Error", "Failed to create follow-up");
    }
  };

  const handleEditFollowUp = async () => {
    if (!notes.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!validateDateTimeInputs()) {
      return;
    }

    try {
      const timeParts = followUpTime.split(":");
      const dateParts = followUpDate.split("-");
      const date = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        parseInt(timeParts[0]),
        parseInt(timeParts[1])
      );

      const dateTimeString = date.toISOString();

      await updateFollowUp(editingFollowUpId!, {
        date: dateTimeString,
        notes: notes.trim(),
      });

      setShowAddModal(false);
      resetForm();

      Alert.alert("Success", "Follow-up updated successfully");
    } catch {
      Alert.alert("Error", "Failed to update follow-up");
    }
  };

  const handleDeleteFollowUp = (followUp: FollowUpWithDetails) => {
    confirmDelete(`this follow-up for "${followUp.entityName}"`, async () => {
      try {
        await deleteFollowUp(followUp.id);
        Alert.alert("Success", "Follow-up deleted successfully");
      } catch {
        Alert.alert("Error", "Failed to delete follow-up");
      }
    });
  };

  const resetForm = () => {
    setSelectedEntityId(null);
    setFollowUpDate("");
    setFollowUpTime("");
    setNotes("");
    setEditingFollowUpId(null);
  };

  const openEditModal = (followUp: FollowUpWithDetails) => {
    const followUpDateObj = new Date(followUp.date);
    const year = followUpDateObj.getFullYear();
    const month = String(followUpDateObj.getMonth() + 1).padStart(2, "0");
    const day = String(followUpDateObj.getDate()).padStart(2, "0");
    const hours = String(followUpDateObj.getHours()).padStart(2, "0");
    const minutes = String(followUpDateObj.getMinutes()).padStart(2, "0");

    setFollowUpDate(`${year}-${month}-${day}`);
    setFollowUpTime(`${hours}:${minutes}`);
    setNotes(followUp.notes);
    setEditingFollowUpId(followUp.id);
    setShowAddModal(true);
  };

  const openAddModal = () => {
    resetForm();
    // Set default date to today
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    
    setFollowUpDate(`${year}-${month}-${day}`);
    setFollowUpTime(`${hours}:${minutes}`);
    setShowAddModal(true);
  };

  const getEntityOptions = () => {
    switch (entityType) {
      case "client":
        return clients.map((c) => ({ id: c.id, name: c.name }));
      case "prospect":
        return prospects.map((p) => ({ id: p.id, name: p.name }));
      case "phoneNumber":
        return phoneNumbers
          .filter((p) => p.isProspect === 0)
          .map((p) => ({ id: p.id, name: p.number }));
      default:
        return [];
    }
  };

  const entityOptions = getEntityOptions();

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "client":
        return Users;
      case "prospect":
        return Target;
      case "phoneNumber":
        return Phone;
      default:
        return Calendar;
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case "client":
        return "#3b82f6";
      case "prospect":
        return "#f59e0b";
      case "phoneNumber":
        return "#8b5cf6";
      default:
        return "#64748b";
    }
  };

  const renderFollowUp = (item: FollowUpWithDetails) => {
    const Icon = getEntityIcon(item.entityType);
    const color = getEntityColor(item.entityType);
    const followUpDateObj = new Date(item.date);
    const isOverdue = followUpDateObj < new Date() && item.isCompleted === 0;

    return (
      <View key={item.id} style={styles.followUpCard}>
        <View style={styles.followUpHeader}>
          <View
            style={[styles.iconContainer, { backgroundColor: color + "20" }]}
          >
            <Icon size={20} color={color} strokeWidth={2} />
          </View>
          <View style={styles.followUpInfo}>
            <Text style={styles.entityName}>{item.entityName}</Text>
            {item.entityCompany ? (
              <Text style={styles.entityCompany}>{item.entityCompany}</Text>
            ) : null}
            {item.entityPhone ? (
              <Text style={styles.entityPhone}>{item.entityPhone}</Text>
            ) : null}
          </View>
          <View style={styles.followUpActions}>
            {item.isCompleted === 0 && (
              <>
                <TouchableOpacity
                  onPress={() => openEditModal(item)}
                  style={styles.actionIconButton}
                >
                  <Edit size={18} color="#3b82f6" strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteFollowUp(item)}
                  style={styles.actionIconButton}
                >
                  <Trash2 size={18} color="#ef4444" strokeWidth={2} />
                </TouchableOpacity>
              </>
            )}
            {isOverdue && (
              <View style={styles.overdueTag}>
                <Text style={styles.overdueText}>Overdue</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.followUpDetails}>
          <View style={styles.detailRow}>
            <Calendar size={16} color="#64748b" />
            <Text style={styles.detailText}>
              {followUpDateObj.toLocaleDateString()} at{" "}
              {followUpDateObj.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <Text style={styles.notes}>{item.notes}</Text>
          <Text style={styles.entityTypeLabel}>
            {item.entityType === "client" && "Client Follow-up"}
            {item.entityType === "prospect" && "Prospect Follow-up"}
            {item.entityType === "phoneNumber" && "Phone Number Follow-up"}
          </Text>
        </View>

        {item.isCompleted === 0 && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleComplete(item.id)}
          >
            <CheckCircle size={16} color="#fff" strokeWidth={2} />
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}

        {item.isCompleted === 1 && (
          <View style={styles.completedBadge}>
            <CheckCircle size={16} color="#10b981" strokeWidth={2} />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Clock size={20} color="#f59e0b" strokeWidth={2} />
            <Text style={styles.statNumber}>{pending.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          {overdue > 0 && (
            <View style={styles.statBox}>
              <Calendar size={20} color="#ef4444" strokeWidth={2} />
              <Text style={[styles.statNumber, { color: "#ef4444" }]}>
                {overdue}
              </Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          )}
          <View style={styles.statBox}>
            <CheckCircle size={20} color="#10b981" strokeWidth={2} />
            <Text style={styles.statNumber}>{completed.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "pending" && styles.tabActive]}
            onPress={() => setActiveTab("pending")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "pending" && styles.tabTextActive,
              ]}
            >
              Pending ({pending.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "completed" && styles.tabActive]}
            onPress={() => setActiveTab("completed")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "completed" && styles.tabTextActive,
              ]}
            >
              Completed ({completed.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {activeTab === "pending" && pending.length === 0 && (
          <View style={styles.emptyState}>
            <CheckCircle size={64} color="#475569" strokeWidth={1.5} />
            <Text style={styles.emptyText}>No pending follow-ups</Text>
            <Text style={styles.emptySubtext}>All caught up!</Text>
          </View>
        )}

        {activeTab === "completed" && completed.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={64} color="#475569" strokeWidth={1.5} />
            <Text style={styles.emptyText}>No completed follow-ups</Text>
            <Text style={styles.emptySubtext}>
              Complete a follow-up to see it here
            </Text>
          </View>
        )}

        {activeTab === "pending" && pending.map(renderFollowUp)}
        {activeTab === "completed" && completed.map(renderFollowUp)}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => openAddModal()}
      >
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingFollowUpId ? "Edit Follow-up" : "Add Follow-up"}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#94a3b8" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Entity Type</Text>
              <View style={styles.entityTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.entityTypeButton,
                    entityType === "client" && styles.entityTypeButtonActive,
                  ]}
                  onPress={() => {
                    setEntityType("client");
                    setSelectedEntityId(null);
                  }}
                >
                  <Users
                    size={18}
                    color={entityType === "client" ? "#fff" : "#94a3b8"}
                  />
                  <Text
                    style={[
                      styles.entityTypeText,
                      entityType === "client" && styles.entityTypeTextActive,
                    ]}
                  >
                    Client
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.entityTypeButton,
                    entityType === "prospect" && styles.entityTypeButtonActive,
                  ]}
                  onPress={() => {
                    setEntityType("prospect");
                    setSelectedEntityId(null);
                  }}
                >
                  <Target
                    size={18}
                    color={entityType === "prospect" ? "#fff" : "#94a3b8"}
                  />
                  <Text
                    style={[
                      styles.entityTypeText,
                      entityType === "prospect" && styles.entityTypeTextActive,
                    ]}
                  >
                    Prospect
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.entityTypeButton,
                    entityType === "phoneNumber" &&
                      styles.entityTypeButtonActive,
                  ]}
                  onPress={() => {
                    setEntityType("phoneNumber");
                    setSelectedEntityId(null);
                  }}
                >
                  <Phone
                    size={18}
                    color={entityType === "phoneNumber" ? "#fff" : "#94a3b8"}
                  />
                  <Text
                    style={[
                      styles.entityTypeText,
                      entityType === "phoneNumber" &&
                        styles.entityTypeTextActive,
                    ]}
                  >
                    Phone
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>
                Select{" "}
                {entityType === "client"
                  ? "Client"
                  : entityType === "prospect"
                  ? "Prospect"
                  : "Phone Number"}
              </Text>
              <ScrollView style={styles.entityList} nestedScrollEnabled>
                {entityOptions.length === 0 ? (
                  <Text style={styles.emptyEntityText}>
                    No {entityType}s available
                  </Text>
                ) : (
                  entityOptions.map((entity) => (
                    <TouchableOpacity
                      key={entity.id}
                      style={[
                        styles.entityOption,
                        selectedEntityId === entity.id &&
                          styles.entityOptionActive,
                      ]}
                      onPress={() => setSelectedEntityId(entity.id)}
                    >
                      <Text
                        style={[
                          styles.entityOptionText,
                          selectedEntityId === entity.id &&
                            styles.entityOptionTextActive,
                        ]}
                      >
                        {entity.name}
                      </Text>
                      {selectedEntityId === entity.id && (
                        <CheckCircle
                          size={18}
                          color="#3b82f6"
                          strokeWidth={2}
                        />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                value={followUpDate}
                onChangeText={setFollowUpDate}
                placeholder="e.g., 2025-12-25"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.label}>Time (HH:MM) *</Text>
              <TextInput
                style={styles.input}
                value={followUpTime}
                onChangeText={setFollowUpTime}
                placeholder="e.g., 14:30"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add notes about this follow-up..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={4}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={editingFollowUpId ? handleEditFollowUp : handleAddFollowUp}
              >
                <Text style={styles.addButtonText}>
                  {editingFollowUpId ? "Update Follow-up" : "Add Follow-up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  header: {
    backgroundColor: "#1e293b",
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statBox: {
    alignItems: "center",
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#3b82f6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#94a3b8",
  },
  tabTextActive: {
    color: "#3b82f6",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 90,
  },
  followUpCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  followUpHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  followUpInfo: {
    flex: 1,
    gap: 4,
  },
  entityName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  entityCompany: {
    fontSize: 13,
    color: "#94a3b8",
  },
  entityPhone: {
    fontSize: 12,
    color: "#64748b",
  },
  followUpActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIconButton: {
    padding: 6,
    borderRadius: 6,
  },
  overdueTag: {
    backgroundColor: "#ef444420",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overdueText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#ef4444",
  },
  followUpDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  notes: {
    fontSize: 14,
    color: "#e2e8f0",
    lineHeight: 20,
  },
  entityTypeLabel: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  completeButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  completeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    backgroundColor: "#10b98120",
    borderRadius: 8,
  },
  completedText: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  emptyState: {
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
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#fff",
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#e2e8f0",
    marginBottom: 8,
    marginTop: 16,
  },
  entityTypeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  entityTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
  },
  entityTypeButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  entityTypeText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#94a3b8",
  },
  entityTypeTextActive: {
    color: "#fff",
  },
  entityList: {
    maxHeight: 150,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  entityOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  entityOptionActive: {
    backgroundColor: "#1e293b",
  },
  entityOptionText: {
    fontSize: 14,
    color: "#94a3b8",
  },
  entityOptionTextActive: {
    color: "#3b82f6",
    fontWeight: "600" as const,
  },
  emptyEntityText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    paddingVertical: 20,
  },
  input: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#fff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#334155",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  addButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
});
