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
} from "../types";
import { useAuth } from "./AuthContext";
import * as db from "../services/database";

interface SalesContextType {
  clients: Client[];
  prospects: Prospect[];
  sales: (Sale & { clientName: string })[];
  followUps: FollowUp[];
  phoneNumbers: PhoneNumber[];
  callLogs: (CallLog & { number: string })[];
  isLoading: boolean;
  addClient: (client: Omit<Client, "id" | "userId">) => Promise<void>;
  addProspect: (prospect: Omit<Prospect, "id" | "userId">) => Promise<void>;
  updateProspectStatus: (
    prospectId: number,
    status: Prospect["status"]
  ) => Promise<void>;
  addSale: (sale: Omit<Sale, "id">) => Promise<void>;
  convertProspectToClient: (
    prospectId: number,
    saleData: Omit<Sale, "id" | "clientId">
  ) => Promise<void>;
  addFollowUp: (followUp: Omit<FollowUp, "id">) => Promise<void>;
  completeFollowUp: (followUpId: number) => Promise<void>;
  recordCall: (callData: {
    number: string;
    logData: Omit<CallLog, "id" | "phoneNumberId">;
  }) => Promise<void>;
  convertPhoneToProspect: (
    phoneNumberId: number,
    prospectData: Omit<Prospect, "id" | "userId" | "phone">
  ) => Promise<void>;
  getDailyCallStats: (date: string) => Promise<DailyCallStats>;
  getPhoneNumberHistory: (phoneNumberId: number) => Promise<CallLog[]>;
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
        phoneNumbersData,
        callLogsData,
      ] = await Promise.all([
        db.getClients(user.id),
        db.getProspects(user.id),
        db.getSales(user.id),
        db.getFollowUps(user.id),
        db.getPhoneNumbers(user.id),
        db.getCallLogs(user.id),
      ]);

      setClients(clientsData);
      setProspects(prospectsData);
      setSales(salesData);
      setFollowUps(followUpsData);
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

  const addFollowUp = async (followUp: Omit<FollowUp, "id">) => {
    try {
      const newFollowUp = await db.addFollowUp(followUp);
      setFollowUps((prev) => [...prev, newFollowUp]);
      console.log("Follow-up added:", newFollowUp);
    } catch (error) {
      console.error("Error adding follow-up:", error);
      throw error;
    }
  };

  const completeFollowUp = async (followUpId: number) => {
    try {
      await db.completeFollowUp(followUpId);
      setFollowUps((prev) =>
        prev.map((f) => (f.id === followUpId ? { ...f, isCompleted: 1 } : f))
      );
      console.log("Follow-up completed:", followUpId);
    } catch (error) {
      console.error("Error completing follow-up:", error);
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

  return (
    <SalesContext.Provider
      value={{
        clients,
        prospects,
        sales,
        followUps,
        phoneNumbers,
        callLogs,
        isLoading,
        addClient,
        addProspect,
        updateProspectStatus,
        addSale,
        convertProspectToClient,
        addFollowUp,
        completeFollowUp,
        recordCall,
        convertPhoneToProspect,
        getDailyCallStats,
        getPhoneNumberHistory,
        refreshData,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};
