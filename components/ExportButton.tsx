// components/ExportButton.tsx
import React, { useState } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  ActivityIndicator,
  View,
  Text,
  Modal,
} from "react-native";
import { Download } from "lucide-react-native";

interface ExportButtonProps {
  onExport: () => string; // Function that returns CSV string
  filename: string; // Filename without extension
  label?: string; // Button label
  buttonColor?: string; // Button background color
  showAlert?: boolean; // Show alert after export
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  filename,
  label = "Export",
  buttonColor = "#3b82f6",
  showAlert = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const csvData = onExport();

      if (!csvData || csvData === "No data to export") {
        Alert.alert("No Data", "There is no data to export");
        setIsLoading(false);
        return;
      }

      // Share the CSV data
      await Share.share({
        message: csvData,
        title: `${filename}.csv`,
        url: undefined,
      });

      if (showAlert) {
        Alert.alert(
          "Export Successful",
          `${filename}.csv has been prepared for sharing. You can copy the data and paste it into Excel or any spreadsheet application.`
        );
      }
    } catch (error: any) {
      if (error.message !== "Share cancelled.") {
        Alert.alert(
          "Export Failed",
          "Failed to export data. Please try again."
        );
        console.error("Export error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: buttonColor }]}
        onPress={handleExport}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Download size={18} color="#fff" strokeWidth={2} />
            <Text style={styles.buttonText}>{label}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Info Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Export Tips</Text>
            <Text style={styles.modalText}>
              1. Export creates a CSV file{"\n"}
              2. Share using email or messaging{"\n"}
              3. Open in Excel or Google Sheets{"\n"}
              4. Analyze and create reports
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 20,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 22,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
