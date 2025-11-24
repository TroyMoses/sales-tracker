import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  Client,
  Prospect,
  Sale,
  FollowUp,
  PhoneNumber,
  CallLog,
  DailyCallStats,
  FollowUpWithDetails,
  AnalyticsData,
  FollowUpEntityType,
} from "../types";
import { useAuth } from "./AuthContext";
import * as db from "../services/database";
import { scheduleAllFollowUpNotifications } from "../services/notificationService";

interface SalesContextType {
  clients: Client[];
  prospects: Prospect[];
  sales: (Sale & { clientName: string })[];
  followUps: FollowUp[];
  followUpsWithDetails: FollowUpWithDetails[];
  phoneNumbers: PhoneNumber[];
  callLogs: (CallLog & { number: string })[];
  isLoading: boolean;
  addClient: (client: Omit<Client, "id" | "userId">) => Promise<void>;
  updateClient: (
    clientId: number,
    updates: Partial<Omit<Client, "id" | "userId">>
  ) => Promise<void>;
  deleteClient: (clientId: number) => Promise<void>;
  addProspect: (prospect: Omit<Prospect, "id" | "userId">) => Promise<void>;
  updateProspect: (
    prospectId: number,
    updates: Partial<Omit<Prospect, "id" | "userId">>
  ) => Promise<void>;
  deleteProspect: (prospectId: number) => Promise<void>;
  updateProspectStatus: (
    prospectId: number,
    status: Prospect["status"]
  ) => Promise<void>;
  addSale: (sale: Omit<Sale, "id">) => Promise<void>;
  updateSale: (
    saleId: number,
    updates: Partial<Omit<Sale, "id" | "clientId">>
  ) => Promise<void>;
  deleteSale: (saleId: number) => Promise<void>;
  convertProspectToClient: (
    prospectId: number,
    saleData: Omit<Sale, "id" | "clientId">
  ) => Promise<void>;
  addFollowUp: (followUp: Omit<FollowUp, "id" | "createdAt">) => Promise<void>;
  getFollowUpsByEntity: (
    entityId: number,
    entityType: FollowUpEntityType
  ) => Promise<FollowUp[]>;
  completeFollowUp: (followUpId: number) => Promise<void>;
  updateFollowUp: (
    followUpId: number,
    data: Partial<Pick<FollowUp, "date" | "notes">>
  ) => Promise<void>;
  deleteFollowUp: (followUpId: number) => Promise<void>;
  recordCall: (callData: {
    number: string;
    logData: Omit<CallLog, "id" | "phoneNumberId">;
  }) => Promise<void>;
  updateCall: (
    callId: number,
    updates: Partial<Omit<CallLog, "id" | "phoneNumberId">>
  ) => Promise<void>;
  deleteCall: (callId: number) => Promise<void>;
  convertPhoneToProspect: (
    phoneNumberId: number,
    prospectData: Omit<Prospect, "id" | "userId" | "phone">
  ) => Promise<void>;
  getDailyCallStats: (date: string) => Promise<DailyCallStats>;
  getPhoneNumberHistory: (phoneNumberId: number) => Promise<CallLog[]>;
  getAnalyticsData: (
    startDate?: string,
    endDate?: string
  ) => Promise<AnalyticsData>;
  refreshData: () => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error("useSales must be used within SalesProvider");
  }
  return context;
};

export const SalesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [sales, setSales] = useState<(Sale & { clientName: string })[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [followUpsWithDetails, setFollowUpsWithDetails] = useState<
    FollowUpWithDetails[]
  >([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [callLogs, setCallLogs] = useState<(CallLog & { number: string })[]>(
    []
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [
        clientsData,
        prospectsData,
        salesData,
        followUpsData,
        followUpsDetailsData,
        phoneNumbersData,
        callLogsData,
      ] = await Promise.all([
        db.getClients(user.id),
        db.getProspects(user.id),
        db.getSales(user.id),
        db.getFollowUps(user.id),
        db.getFollowUpsWithDetails(user.id),
        db.getPhoneNumbers(user.id),
        db.getCallLogs(user.id),
      ]);

      setClients(clientsData);
      setProspects(prospectsData);
      setSales(salesData);
      setFollowUps(followUpsData);
      setFollowUpsWithDetails(followUpsDetailsData);
      setPhoneNumbers(phoneNumbersData);
      setCallLogs(callLogsData);

      console.log("Data loaded successfully");
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setClients([]);
      setProspects([]);
      setSales([]);
      setFollowUps([]);
      setFollowUpsWithDetails([]);
      setPhoneNumbers([]);
      setCallLogs([]);
    }
  }, [user, loadData]);

  const refreshData = async () => {
    await loadData();
  };

  const addClient = async (client: Omit<Client, "id" | "userId">) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const newClient = await db.addClient(user.id, client);
      setClients((prev) => [...prev, newClient]);
      console.log("Client added:", newClient);
    } catch (error) {
      console.error("Error adding client:", error);
      throw error;
    }
  };

  const updateClient = async (
    clientId: number,
    updates: Partial<Omit<Client, "id" | "userId">>
  ) => {
    try {
      await db.updateClient(clientId, updates);
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, ...updates } : c))
      );
      console.log("Client updated:", clientId);
    } catch (error) {
      console.error("Error updating client:", error);
      throw error;
    }
  };

  const deleteClient = async (clientId: number) => {
    try {
      await db.deleteClient(clientId);
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setSales((prev) => prev.filter((s) => s.clientId !== clientId));
      console.log("Client deleted:", clientId);
    } catch (error) {
      console.error("Error deleting client:", error);
      throw error;
    }
  };

  const addProspect = async (prospect: Omit<Prospect, "id" | "userId">) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const newProspect = await db.addProspect(user.id, prospect);
      setProspects((prev) => [...prev, newProspect]);
      console.log("Prospect added:", newProspect);
    } catch (error) {
      console.error("Error adding prospect:", error);
      throw error;
    }
  };

  const updateProspectStatus = async (
    prospectId: number,
    status: Prospect["status"]
  ) => {
    try {
      await db.updateProspectStatus(prospectId, status);
      setProspects((prev) =>
        prev.map((p) => (p.id === prospectId ? { ...p, status } : p))
      );
      console.log("Prospect status updated:", prospectId, status);
    } catch (error) {
      console.error("Error updating prospect status:", error);
      throw error;
    }
  };

  const updateProspect = async (
    prospectId: number,
    updates: Partial<Omit<Prospect, "id" | "userId">>
  ) => {
    try {
      await db.updateProspect(prospectId, updates);
      setProspects((prev) =>
        prev.map((p) => (p.id === prospectId ? { ...p, ...updates } : p))
      );
      console.log("Prospect updated:", prospectId);
    } catch (error) {
      console.error("Error updating prospect:", error);
      throw error;
    }
  };

  const deleteProspect = async (prospectId: number) => {
    try {
      await db.deleteProspect(prospectId);
      setProspects((prev) => prev.filter((p) => p.id !== prospectId));
      setFollowUps((prev) =>
        prev.filter(
          (f) => !(f.entityId === prospectId && f.entityType === "prospect")
        )
      );
      setFollowUpsWithDetails((prev) =>
        prev.filter(
          (f) => !(f.entityId === prospectId && f.entityType === "prospect")
        )
      );
      console.log("Prospect deleted:", prospectId);
    } catch (error) {
      console.error("Error deleting prospect:", error);
      throw error;
    }
  };

  const addSale = async (sale: Omit<Sale, "id">) => {
    try {
      const newSale = await db.addSale(sale);
      await refreshData();
      console.log("Sale added:", newSale);
    } catch (error) {
      console.error("Error adding sale:", error);
      throw error;
    }
  };

  const updateSale = async (
    saleId: number,
    updates: Partial<Omit<Sale, "id" | "clientId">>
  ) => {
    try {
      await db.updateSale(saleId, updates);
      setSales((prev) =>
        prev.map((s) => (s.id === saleId ? { ...s, ...updates } : s))
      );
      console.log("Sale updated:", saleId);
    } catch (error) {
      console.error("Error updating sale:", error);
      throw error;
    }
  };

  const deleteSale = async (saleId: number) => {
    try {
      await db.deleteSale(saleId);
      setSales((prev) => prev.filter((s) => s.id !== saleId));
      console.log("Sale deleted:", saleId);
    } catch (error) {
      console.error("Error deleting sale:", error);
      throw error;
    }
  };

  const convertProspectToClient = async (
    prospectId: number,
    saleData: Omit<Sale, "id" | "clientId">
  ) => {
    try {
      const result = await db.convertProspectToClientAndRecordSale(
        prospectId,
        saleData
      );
      await refreshData();
      console.log("Prospect converted:", result);
    } catch (error) {
      console.error("Error converting prospect:", error);
      throw error;
    }
  };

  const rescheduleNotifications = async (
    followUpsWithDetails: FollowUpWithDetails[]
  ) => {
    try {
      await scheduleAllFollowUpNotifications(followUpsWithDetails);
    } catch (error) {
      console.error("Error rescheduling notifications:", error);
    }
  };

  const addFollowUp = async (followUp: Omit<FollowUp, "id" | "createdAt">) => {
    try {
      const newFollowUp = await db.addFollowUp(followUp);
      await refreshData();
      const updatedFollowUps = await db.getFollowUpsWithDetails(user!.id);
      await rescheduleNotifications(updatedFollowUps);
      console.log("Follow-up added:", newFollowUp);
    } catch (error) {
      console.error("Error adding follow-up:", error);
      throw error;
    }
  };

  const getFollowUpsByEntity = async (
    entityId: number,
    entityType: FollowUpEntityType
  ): Promise<FollowUp[]> => {
    try {
      return await db.getFollowUpsByEntity(entityId, entityType);
    } catch (error) {
      console.error("Error fetching entity follow-ups:", error);
      throw error;
    }
  };

  const completeFollowUp = async (followUpId: number) => {
    try {
      await db.completeFollowUp(followUpId);
      await refreshData();
      const updatedFollowUps = await db.getFollowUpsWithDetails(user!.id);
      await rescheduleNotifications(updatedFollowUps);
      console.log("Follow-up completed:", followUpId);
    } catch (error) {
      console.error("Error completing follow-up:", error);
      throw error;
    }
  };

  const updateFollowUp = async (
    followUpId: number,
    data: Partial<Pick<FollowUp, "date" | "notes">>
  ) => {
    try {
      await db.updateFollowUp(followUpId, data);
      await refreshData();
      const updatedFollowUps = await db.getFollowUpsWithDetails(user!.id);
      await rescheduleNotifications(updatedFollowUps);
      console.log("Follow-up updated:", followUpId);
    } catch (error) {
      console.error("Error updating follow-up:", error);
      throw error;
    }
  };

  const deleteFollowUp = async (followUpId: number) => {
    try {
      await db.deleteFollowUp(followUpId);
      await refreshData();
      const updatedFollowUps = await db.getFollowUpsWithDetails(user!.id);
      await rescheduleNotifications(updatedFollowUps);
      console.log("Follow-up deleted:", followUpId);
    } catch (error) {
      console.error("Error deleting follow-up:", error);
      throw error;
    }
  };

  const recordCall = async (callData: {
    number: string;
    logData: Omit<CallLog, "id" | "phoneNumberId">;
  }) => {
    if (!user) throw new Error("User not authenticated");

    try {
      const result = await db.recordNewCall(user.id, callData);
      await refreshData();
      console.log("Call recorded:", result);
    } catch (error) {
      console.error("Error recording call:", error);
      throw error;
    }
  };

  const updateCall = async (
    callId: number,
    updates: Partial<Omit<CallLog, "id" | "phoneNumberId">>
  ) => {
    try {
      await db.updateCallLog(callId, updates);
      await refreshData();
      console.log("Call updated:", callId);
    } catch (error) {
      console.error("Error updating call:", error);
      throw error;
    }
  };

  const deleteCall = async (callId: number) => {
    try {
      await db.deleteCallLog(callId);
      await refreshData();
      console.log("Call deleted:", callId);
    } catch (error) {
      console.error("Error deleting call:", error);
      throw error;
    }
  };

  const convertPhoneToProspect = async (
    phoneNumberId: number,
    prospectData: Omit<Prospect, "id" | "userId" | "phone">
  ) => {
    try {
      const newProspect = await db.convertPhoneNumberToProspect(
        phoneNumberId,
        prospectData
      );
      await refreshData();
      console.log("Phone converted to prospect:", newProspect);
    } catch (error) {
      console.error("Error converting phone to prospect:", error);
      throw error;
    }
  };

  const getDailyCallStats = async (date: string): Promise<DailyCallStats> => {
    if (!user) throw new Error("User not authenticated");

    try {
      return await db.getDailyCallStats(user.id, date);
    } catch (error) {
      console.error("Error fetching daily call stats:", error);
      throw error;
    }
  };

  const getPhoneNumberHistory = async (
    phoneNumberId: number
  ): Promise<CallLog[]> => {
    try {
      return await db.getCallLogsByPhoneNumber(phoneNumberId);
    } catch (error) {
      console.error("Error fetching phone number history:", error);
      throw error;
    }
  };

  const getAnalyticsData = async (
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsData> => {
    if (!user) throw new Error("User not authenticated");

    try {
      return await db.getAnalyticsData(user.id, startDate, endDate);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      throw error;
    }
  };

  return (
    <SalesContext.Provider
      value={{
        clients,
        prospects,
        sales,
        followUps,
        followUpsWithDetails,
        phoneNumbers,
        callLogs,
        isLoading,
        addClient,
        updateClient,
        deleteClient,
        addProspect,
        updateProspect,
        deleteProspect,
        updateProspectStatus,
        addSale,
        updateSale,
        deleteSale,
        convertProspectToClient,
        addFollowUp,
        getFollowUpsByEntity,
        completeFollowUp,
        updateFollowUp,
        deleteFollowUp,
        recordCall,
        updateCall,
        deleteCall,
        convertPhoneToProspect,
        getDailyCallStats,
        getPhoneNumberHistory,
        getAnalyticsData,
        refreshData,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};
