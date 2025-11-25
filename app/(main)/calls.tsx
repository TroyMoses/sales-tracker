import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSales } from "../../contexts/SalesContext";
import { PhoneNumber, CallLog } from "../../types";
import {
  Phone,
  Plus,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Edit,
  Trash2,
} from "lucide-react-native";
import { confirmDelete } from "../../utils/confirmDelete";
import { ExportButton } from "../../components/ExportButton";
import { exportCallLogsToCSV } from "../../services/excelExportService";

export default function CallsScreen() {
  const {
    phoneNumbers,
    callLogs,
    recordCall,
    updateCall,
    deleteCall,
    convertPhoneToProspect,
    getDailyCallStats,
  } = useSales();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [convertModalVisible, setConvertModalVisible] =
    useState<boolean>(false);
  const [selectedPhoneNumber, setSelectedPhoneNumber] =
    useState<PhoneNumber | null>(null);
  const [editingCallId, setEditingCallId] = useState<number | null>(null);
  const [dailyStats, setDailyStats] = useState<{
    totalCalls: number;
    successful: number;
    busy: number;
    notAnswered: number;
    dnc: number;
    leads: number;
  }>({
    totalCalls: 0,
    successful: 0,
    busy: 0,
    notAnswered: 0,
    dnc: 0,
    leads: 0,
  });

  const [callFormData, setCallFormData] = useState<{
    number: string;
    feedback: CallLog["feedback"];
    duration: string;
    shortNotes: string;
  }>({
    number: "",
    feedback: "Not Answered",
    duration: "0",
    shortNotes: "",
  });

  const [prospectFormData, setProspectFormData] = useState<{
    name: string;
    email: string;
    company: string;
  }>({
    name: "",
    email: "",
    company: "",
  });

  useEffect(() => {
    loadDailyStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callLogs]);

  const loadDailyStats = async () => {
    try {
      const stats = await getDailyCallStats(new Date().toISOString());
      setDailyStats(stats);
    } catch (error) {
      console.error("Error loading daily stats:", error);
    }
  };

  const handleRecordCall = async () => {
    if (!callFormData.number.trim() || !callFormData.shortNotes.trim()) {
      Alert.alert("Error", "Please fill in phone number and notes");
      return;
    }

    const duration = parseInt(callFormData.duration);
    if (isNaN(duration) || duration < 0) {
      Alert.alert("Error", "Please enter a valid duration");
      return;
    }

    try {
      await recordCall({
        number: callFormData.number,
        logData: {
          date: new Date().toISOString(),
          feedback: callFormData.feedback,
          duration,
          shortNotes: callFormData.shortNotes,
          nextFollowUpDate: null,
        },
      });
      setModalVisible(false);
      setCallFormData({
        number: "",
        feedback: "Not Answered",
        duration: "0",
        shortNotes: "",
      });
      Alert.alert("Success", "Call logged successfully");
    } catch {
      Alert.alert("Error", "Failed to log call");
    }
  };

  const handleEditCall = async (callLog: CallLog & { number: string }) => {
    if (!callFormData.shortNotes.trim()) {
      Alert.alert("Error", "Please fill in notes");
      return;
    }

    const duration = parseInt(callFormData.duration);
    if (isNaN(duration) || duration < 0) {
      Alert.alert("Error", "Please enter a valid duration");
      return;
    }

    try {
      await updateCall(callLog.id, {
        feedback: callFormData.feedback,
        duration,
        shortNotes: callFormData.shortNotes,
      });
      setModalVisible(false);
      setEditingCallId(null);
      setCallFormData({
        number: "",
        feedback: "Not Answered",
        duration: "0",
        shortNotes: "",
      });
      Alert.alert("Success", "Call updated successfully");
    } catch {
      Alert.alert("Error", "Failed to update call");
    }
  };

  const handleDeleteCall = (callLog: CallLog & { number: string }) => {
    confirmDelete(`this call to "${callLog.number}"`, async () => {
      try {
        await deleteCall(callLog.id);
        Alert.alert("Success", "Call deleted successfully");
      } catch {
        Alert.alert("Error", "Failed to delete call");
      }
    });
  };

  const openEditModal = (callLog: CallLog & { number: string }) => {
    setCallFormData({
      number: callLog.number,
      feedback: callLog.feedback,
      duration: callLog.duration.toString(),
      shortNotes: callLog.shortNotes,
    });
    setEditingCallId(callLog.id);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setCallFormData({
      number: "",
      feedback: "Not Answered",
      duration: "0",
      shortNotes: "",
    });
    setEditingCallId(null);
    setModalVisible(true);
  };

  const handleConvertToProspect = async () => {
    if (!selectedPhoneNumber) return;

    if (!prospectFormData.name.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    try {
      await convertPhoneToProspect(selectedPhoneNumber.id, {
        name: prospectFormData.name,
        email: prospectFormData.email,
        company: prospectFormData.company,
        status: "New",
        followUpDate: new Date().toISOString().split("T")[0],
      });
      setConvertModalVisible(false);
      setSelectedPhoneNumber(null);
      setProspectFormData({
        name: "",
        email: "",
        company: "",
      });
      Alert.alert("Success", "Phone number converted to prospect!");
    } catch {
      Alert.alert("Error", "Failed to convert to prospect");
    }
  };

  const openConvertModal = (phoneNumber: PhoneNumber) => {
    setSelectedPhoneNumber(phoneNumber);
    setConvertModalVisible(true);
  };

  const getFeedbackColor = (feedback: CallLog["feedback"]) => {
    switch (feedback) {
      case "Successful":
        return "#10b981";
      case "Busy":
        return "#f59e0b";
      case "Not Answered":
        return "#64748b";
      case "DNC":
        return "#ef4444";
      case "Connected-Lead":
        return "#8b5cf6";
      default:
        return "#64748b";
    }
  };

  const getFeedbackIcon = (feedback: CallLog["feedback"]) => {
    switch (feedback) {
      case "Successful":
        return CheckCircle;
      case "Busy":
        return Clock;
      case "Not Answered":
        return XCircle;
      case "DNC":
        return AlertCircle;
      case "Connected-Lead":
        return TrendingUp;
      default:
        return Phone;
    }
  };

  const StatCard = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderCallLog = ({ item }: { item: CallLog & { number: string } }) => {
    const Icon = getFeedbackIcon(item.feedback);
    const color = getFeedbackColor(item.feedback);

    return (
      <View style={styles.callCard}>
        <View style={[styles.callIcon, { backgroundColor: color + "20" }]}>
          <Icon size={24} color={color} strokeWidth={2} />
        </View>
        <View style={styles.callInfo}>
          <Text style={styles.callNumber}>{item.number}</Text>
          <Text style={styles.callNotes}>{item.shortNotes}</Text>
          <Text style={styles.callDate}>
            {new Date(item.date).toLocaleString()} • {item.duration}s
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            style={styles.editButton}
          >
            <Edit size={20} color="#3b82f6" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteCall(item)}
            style={styles.deleteButton}
          >
            <Trash2 size={20} color="#ef4444" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <View style={[styles.feedbackBadge, { backgroundColor: color + "20" }]}>
          <Text style={[styles.feedbackText, { color }]}>{item.feedback}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Calls</Text>
        <ExportButton
          onExport={() => exportCallLogsToCSV(callLogs)}
          filename="sales-tracker-calls"
          label="Export"
          buttonColor="#3b82f6"
        />
      </View>
      <ScrollView>
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Today&apos;s Calls</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="Total"
              value={dailyStats.totalCalls}
              color="#3b82f6"
            />
            <StatCard
              label="Successful"
              value={dailyStats.successful}
              color="#10b981"
            />
            <StatCard label="Leads" value={dailyStats.leads} color="#8b5cf6" />
            <StatCard label="Busy" value={dailyStats.busy} color="#f59e0b" />
            <StatCard
              label="No Answer"
              value={dailyStats.notAnswered}
              color="#64748b"
            />
            <StatCard label="DNC" value={dailyStats.dnc} color="#ef4444" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call History</Text>
          {callLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Phone size={48} color="#475569" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No calls logged yet</Text>
              <Text style={styles.emptySubtext}>
                Start logging your calls to track your progress
              </Text>
            </View>
          ) : (
            <View style={styles.callsList}>
              {callLogs.slice(0, 10).map((log) => (
                <View key={log.id}>{renderCallLog({ item: log })}</View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phone Numbers</Text>
          {phoneNumbers.length === 0 ? (
            <View style={styles.emptyState}>
              <Phone size={48} color="#475569" strokeWidth={1.5} />
              <Text style={styles.emptyText}>No phone numbers yet</Text>
            </View>
          ) : (
            <View style={styles.phonesList}>
              {phoneNumbers.slice(0, 5).map((phone) => (
                <View key={phone.id} style={styles.phoneCard}>
                  <View style={styles.phoneInfo}>
                    <Text style={styles.phoneNumber}>{phone.number}</Text>
                    <Text style={styles.phoneDate}>
                      Last called:{" "}
                      {new Date(phone.lastCalledDate).toLocaleDateString()}
                    </Text>
                  </View>
                  {phone.isProspect === 0 && (
                    <TouchableOpacity
                      style={styles.convertSmallButton}
                      onPress={() => openConvertModal(phone)}
                    >
                      <Text style={styles.convertSmallButtonText}>
                        → Prospect
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

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
                {editingCallId ? "Edit Call" : "Log New Call"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={
                    editingCallId
                      ? [styles.input, styles.inputDisabled]
                      : styles.input
                  }
                  value={callFormData.number}
                  onChangeText={(text) =>
                    setCallFormData({ ...callFormData, number: text })
                  }
                  placeholder="Enter phone number"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  editable={!editingCallId}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Feedback *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.feedbackPills}
                >
                  {(
                    [
                      "Successful",
                      "Busy",
                      "Not Answered",
                      "DNC",
                      "Connected-Lead",
                    ] as const
                  ).map((feedback) => (
                    <TouchableOpacity
                      key={feedback}
                      style={[
                        styles.feedbackPill,
                        callFormData.feedback === feedback &&
                          styles.feedbackPillSelected,
                        { borderColor: getFeedbackColor(feedback) },
                        callFormData.feedback === feedback && {
                          backgroundColor: getFeedbackColor(feedback),
                        },
                      ]}
                      onPress={() =>
                        setCallFormData({ ...callFormData, feedback })
                      }
                    >
                      <Text
                        style={[
                          styles.feedbackPillText,
                          callFormData.feedback === feedback &&
                            styles.feedbackPillTextSelected,
                        ]}
                      >
                        {feedback}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Duration (seconds)</Text>
                <TextInput
                  style={styles.input}
                  value={callFormData.duration}
                  onChangeText={(text) =>
                    setCallFormData({ ...callFormData, duration: text })
                  }
                  placeholder="0"
                  placeholderTextColor="#64748b"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={callFormData.shortNotes}
                  onChangeText={(text) =>
                    setCallFormData({ ...callFormData, shortNotes: text })
                  }
                  placeholder="What happened during the call?"
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={
                  editingCallId
                    ? () => {
                        const callLog = callLogs.find(
                          (log) => log.id === editingCallId
                        );
                        if (callLog) {
                          handleEditCall(callLog);
                        }
                      }
                    : handleRecordCall
                }
              >
                <Text style={styles.submitButtonText}>
                  {editingCallId ? "Update Call" : "Log Call"}
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
              <Text style={styles.modalTitle}>Convert to Prospect</Text>
              <TouchableOpacity onPress={() => setConvertModalVisible(false)}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              {selectedPhoneNumber && (
                <View style={styles.phonePreview}>
                  <Text style={styles.phonePreviewLabel}>Phone Number:</Text>
                  <Text style={styles.phonePreviewNumber}>
                    {selectedPhoneNumber.number}
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={prospectFormData.name}
                  onChangeText={(text) =>
                    setProspectFormData({ ...prospectFormData, name: text })
                  }
                  placeholder="Contact name"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={prospectFormData.email}
                  onChangeText={(text) =>
                    setProspectFormData({ ...prospectFormData, email: text })
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
                  value={prospectFormData.company}
                  onChangeText={(text) =>
                    setProspectFormData({ ...prospectFormData, company: text })
                  }
                  placeholder="Company name"
                  placeholderTextColor="#64748b"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleConvertToProspect}
              >
                <Text style={styles.submitButtonText}>Convert to Prospect</Text>
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
  statsSection: {
    padding: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: 100,
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  callsList: {
    gap: 12,
  },
  callCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  callIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  callInfo: {
    flex: 1,
    gap: 4,
  },
  callNumber: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  callNotes: {
    fontSize: 14,
    color: "#94a3b8",
  },
  callDate: {
    fontSize: 12,
    color: "#64748b",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginRight: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#3b82f620",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#ef444420",
  },
  feedbackBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  feedbackText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  phonesList: {
    gap: 12,
  },
  phoneCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  phoneInfo: {
    flex: 1,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
    marginBottom: 4,
  },
  phoneDate: {
    fontSize: 12,
    color: "#94a3b8",
  },
  convertSmallButton: {
    backgroundColor: "#8b5cf6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  convertSmallButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  emptyState: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#94a3b8",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
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
  inputDisabled: {
    opacity: 0.6,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  feedbackPills: {
    flexDirection: "row",
    gap: 8,
  },
  feedbackPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    borderWidth: 2,
    marginRight: 8,
  },
  feedbackPillSelected: {
    borderColor: "transparent",
  },
  feedbackPillText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500" as const,
  },
  feedbackPillTextSelected: {
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
  phonePreview: {
    backgroundColor: "#0f172a",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  phonePreviewLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 8,
  },
  phonePreviewNumber: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#fff",
  },
});
