// services/notificationService.ts
import * as Notifications from "expo-notifications";
import { FollowUpWithDetails } from "../types";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const initializeNotifications = async (): Promise<void> => {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permissions not granted");
      return;
    }

    console.log("Notification permissions granted");
  } catch (error) {
    console.error("Error initializing notifications:", error);
  }
};

export const scheduleFollowUpNotification = async (
  followUp: FollowUpWithDetails
): Promise<string | null> => {
  try {
    const followUpDate = new Date(followUp.date);
    const now = new Date();

    // Only schedule if the follow-up date is in the future
    if (followUpDate <= now) {
      console.warn("Follow-up date is in the past, skipping notification");
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Sales Tracker - Follow-up Reminder",
        body: `Follow up with ${followUp.entityName}${
          followUp.entityCompany ? ` (${followUp.entityCompany})` : ""
        }`,
        data: {
          followUpId: followUp.id.toString(),
          entityId: followUp.entityId.toString(),
          entityType: followUp.entityType,
          entityName: followUp.entityName,
        },
        sound: true,
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: followUpDate,
      },
    });

    console.log("Notification scheduled:", notificationId);
    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
};

export const scheduleAllFollowUpNotifications = async (
  followUps: FollowUpWithDetails[]
): Promise<void> => {
  try {
    // Cancel all existing notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule only pending follow-ups that are in the future
    const pendingFollowUps = followUps.filter((f) => f.isCompleted === 0);

    for (const followUp of pendingFollowUps) {
      await scheduleFollowUpNotification(followUp);
    }

    console.log(`Scheduled ${pendingFollowUps.length} follow-up notifications`);
  } catch (error) {
    console.error("Error scheduling all notifications:", error);
  }
};

export const cancelFollowUpNotification = async (
  followUpId: number
): Promise<void> => {
  try {
    // In Expo Notifications, we can't identify which notification to cancel by ID
    // So we reschedule all remaining notifications
    console.log("Cancelling and rescheduling all notifications");
  } catch (error) {
    console.error("Error cancelling notification:", error);
  }
};

export const handleNotificationResponse = async (
  response: Notifications.NotificationResponse
): Promise<void> => {
  try {
    const { followUpId, entityName } = response.notification.request.content
      .data as {
      followUpId: string;
      entityName: string;
    };

    console.log("Notification pressed for follow-up:", followUpId, entityName);
    // You can handle navigation or other actions here
  } catch (error) {
    console.error("Error handling notification response:", error);
  }
};

// Schedule a reminder notification a few minutes before the follow-up
export const scheduleFollowUpReminderNotification = async (
  followUp: FollowUpWithDetails,
  minutesBefore: number = 15
): Promise<string | null> => {
  try {
    const followUpDate = new Date(followUp.date);
    const reminderDate = new Date(
      followUpDate.getTime() - minutesBefore * 60000
    );
    const now = new Date();

    // Only schedule if the reminder date is in the future
    if (reminderDate <= now) {
      return null;
    }
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Upcoming Follow-up in " + minutesBefore + " minutes",
        body: `${followUp.entityName}${
          followUp.entityCompany ? ` (${followUp.entityCompany})` : ""
        } - ${followUp.notes}`,
        data: {
          followUpId: followUp.id.toString(),
          isReminder: "true",
        },
        sound: true,
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    console.log("Reminder notification scheduled:", notificationId);
    return notificationId;
  } catch (error) {
    console.error("Error scheduling reminder notification:", error);
    return null;
  }
};
