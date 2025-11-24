// hooks/useNotifications.ts
import { useEffect, useRef, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { useSales } from "../contexts/SalesContext";
import {
  initializeNotifications,
  scheduleAllFollowUpNotifications,
  handleNotificationResponse,
} from "../services/notificationService";

export const useNotifications = () => {
  const { followUpsWithDetails } = useSales();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const setupNotifications = useCallback(async () => {
    try {
      // Initialize notification permissions
      await initializeNotifications();

      // Schedule all follow-up notifications
      await scheduleAllFollowUpNotifications(followUpsWithDetails);
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  }, [followUpsWithDetails]);

  useEffect(() => {
    setupNotifications();
  }, [setupNotifications]);

  useEffect(() => {
    // Listen for notifications received while app is in foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received:", notification);
      });

    // Listen for notification responses (when user taps notification)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        handleNotificationResponse(response);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    setupNotifications,
  };
};
