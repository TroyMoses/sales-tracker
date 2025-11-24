import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Client, Prospect, Sale, FollowUp } from "../types";
import { useAuth } from "./AuthContext";
import * as db from "../services/database";

interface SalesContextType {
  clients: Client[];
  prospects: Prospect[];
  sales: (Sale & { clientName: string })[];
  followUps: FollowUp[];
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [clientsData, prospectsData, salesData, followUpsData] =
        await Promise.all([
          db.getClients(user.id),
          db.getProspects(user.id),
          db.getSales(user.id),
          db.getFollowUps(user.id),
        ]);

      setClients(clientsData);
      setProspects(prospectsData);
      setSales(salesData);
      setFollowUps(followUpsData);

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

  return (
    <SalesContext.Provider
      value={{
        clients,
        prospects,
        sales,
        followUps,
        isLoading,
        addClient,
        addProspect,
        updateProspectStatus,
        addSale,
        convertProspectToClient,
        addFollowUp,
        completeFollowUp,
        refreshData,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};
