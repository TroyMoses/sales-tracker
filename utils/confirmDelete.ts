import { Alert } from "react-native";

export const confirmDelete = (
  itemName: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  Alert.alert(
    "Confirm Delete",
    `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
    [
      {
        text: "Cancel",
        onPress: onCancel,
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: onConfirm,
        style: "destructive",
      },
    ]
  );
};
