import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import {
  Client,
  Prospect,
  Sale,
  FollowUp,
  dbService,
} from "../services/dbService";
import { useAuth } from "./AuthContext";

interface SalesContextType {
  clients: Client[];
  prospects: Prospect[];
  sales: Sale[];
  followUps: FollowUp[];
  addClient: (client: Omit<Client, "id" | "userId">) => Promise<void>;
  addProspect: (prospect: Omit<Prospect, "id" | "userId">) => Promise<void>;
  addSale: (sale: Omit<Sale, "id">) => Promise<void>;
  convertProspectToClient: (
    prospectId: number,
    saleData: Omit<Sale, "id" | "clientId">
  ) => Promise<void>;
  addFollowUp: (followUp: Omit<FollowUp, "id">) => Promise<void>;
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

interface SalesProviderProps {
  children: ReactNode;
}

export const SalesProvider: React.FC<SalesProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUserData = async () => {
    if (!currentUser) {
      setClients([]);
      setProspects([]);
      setSales([]);
      setFollowUps([]);
      return;
    }

    setIsLoading(true);
    try {
      const [clientsData, prospectsData, followUpsData] = await Promise.all([
        dbService.getClients(currentUser.id),
        dbService.getProspects(currentUser.id),
        dbService.getFollowUps(currentUser.id),
      ]);

      setClients(clientsData);
      setProspects(prospectsData);
      setFollowUps(followUpsData);

      // Load sales for all clients
      const allSales: Sale[] = [];
      for (const client of clientsData) {
        const clientSales = await dbService.getSalesByClientId(client.id);
        allSales.push(...clientSales);
      }
      setSales(allSales);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [currentUser]);

  const addClient = async (clientData: Omit<Client, "id" | "userId">) => {
    if (!currentUser) throw new Error("User not logged in");

    const newClient = await dbService.addClient({
      ...clientData,
      userId: currentUser.id,
    });
    setClients((prev) => [...prev, newClient]);
  };

  const addProspect = async (prospectData: Omit<Prospect, "id" | "userId">) => {
    if (!currentUser) throw new Error("User not logged in");

    const newProspect = await dbService.addProspect({
      ...prospectData,
      userId: currentUser.id,
    });
    setProspects((prev) => [...prev, newProspect]);
  };

  const addSale = async (saleData: Omit<Sale, "id">) => {
    const newSale = await dbService.addSale(saleData);
    setSales((prev) => [...prev, newSale]);
  };

  const convertProspectToClient = async (
    prospectId: number,
    saleData: Omit<Sale, "id" | "clientId">
  ) => {
    const result = await dbService.convertProspectToClientAndRecordSale(
      prospectId,
      saleData
    );

    // Update local state
    setProspects((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, status: "Won" } : p))
    );
    setClients((prev) => [...prev, result.client]);
    setSales((prev) => [...prev, result.sale]);
  };

  const addFollowUp = async (followUpData: Omit<FollowUp, "id">) => {
    const newFollowUp = await dbService.addFollowUp(followUpData);
    setFollowUps((prev) => [...prev, newFollowUp]);
  };

  const refreshData = async () => {
    await loadUserData();
  };

  const value: SalesContextType = {
    clients,
    prospects,
    sales,
    followUps,
    addClient,
    addProspect,
    addSale,
    convertProspectToClient,
    addFollowUp,
    refreshData,
    isLoading,
  };

  return (
    <SalesContext.Provider value={value}>{children}</SalesContext.Provider>
  );
};

export const useSales = (): SalesContextType => {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error("useSales must be used within a SalesProvider");
  }
  return context;
};
