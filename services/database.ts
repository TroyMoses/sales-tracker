import { Platform } from "react-native";
import CryptoJS from "crypto-js";
import { User, Client, Prospect, Sale, FollowUp } from "../types";

let SQLite: any = null;
let db: any = null;

if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SQLite = require("expo-sqlite");
}

const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

export const initDatabase = async (): Promise<void> => {
  if (Platform.OS === "web") {
    console.warn("SQLite is not available on web. Using mock implementation.");
    return;
  }

  try {
    db = await SQLite.openDatabaseAsync("salestracker.db");

    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        name TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS Clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT NOT NULL,
        industry TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES Users(id)
      );
      
      CREATE TABLE IF NOT EXISTS Prospects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT NOT NULL,
        status TEXT NOT NULL,
        followUpDate TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES Users(id)
      );
      
      CREATE TABLE IF NOT EXISTS Sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId INTEGER NOT NULL,
        date TEXT NOT NULL,
        amount REAL NOT NULL,
        productOrService TEXT NOT NULL,
        FOREIGN KEY (clientId) REFERENCES Clients(id)
      );
      
      CREATE TABLE IF NOT EXISTS FollowUps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entityId INTEGER NOT NULL,
        isClient INTEGER NOT NULL,
        date TEXT NOT NULL,
        notes TEXT NOT NULL,
        isCompleted INTEGER NOT NULL DEFAULT 0
      );
    `);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
};

export const signup = async (
  username: string,
  password: string,
  name: string
): Promise<User> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const passwordHash = hashPassword(password);

    const result = await db.runAsync(
      "INSERT INTO Users (username, passwordHash, name) VALUES (?, ?, ?)",
      [username, passwordHash, name]
    );

    const user: User = {
      id: result.lastInsertRowId,
      username,
      passwordHash,
      name,
    };

    console.log("User created:", user);
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Username already exists");
  }
};

export const signin = async (
  username: string,
  password: string
): Promise<User> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const passwordHash = hashPassword(password);

    const result = (await db.getFirstAsync(
      "SELECT * FROM Users WHERE username = ? AND passwordHash = ?",
      [username, passwordHash]
    )) as User | null;

    if (!result) {
      throw new Error("Invalid credentials");
    }

    console.log("User signed in:", result);
    return result;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

export const addClient = async (
  userId: number,
  client: Omit<Client, "id" | "userId">
): Promise<Client> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const result = await db.runAsync(
      "INSERT INTO Clients (userId, name, phone, email, company, industry) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userId,
        client.name,
        client.phone,
        client.email,
        client.company,
        client.industry,
      ]
    );

    return {
      id: result.lastInsertRowId,
      userId,
      ...client,
    };
  } catch (error) {
    console.error("Error adding client:", error);
    throw error;
  }
};

export const getClients = async (userId: number): Promise<Client[]> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const clients = (await db.getAllAsync(
      "SELECT * FROM Clients WHERE userId = ? ORDER BY name ASC",
      [userId]
    )) as Client[];

    return clients;
  } catch (error) {
    console.error("Error fetching clients:", error);
    throw error;
  }
};

export const getClientById = async (
  clientId: number
): Promise<Client | null> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const client = (await db.getFirstAsync(
      "SELECT * FROM Clients WHERE id = ?",
      [clientId]
    )) as Client | null;

    return client || null;
  } catch (error) {
    console.error("Error fetching client:", error);
    throw error;
  }
};

export const addProspect = async (
  userId: number,
  prospect: Omit<Prospect, "id" | "userId">
): Promise<Prospect> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const result = await db.runAsync(
      "INSERT INTO Prospects (userId, name, phone, email, company, status, followUpDate) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        prospect.name,
        prospect.phone,
        prospect.email,
        prospect.company,
        prospect.status,
        prospect.followUpDate,
      ]
    );

    return {
      id: result.lastInsertRowId,
      userId,
      ...prospect,
    };
  } catch (error) {
    console.error("Error adding prospect:", error);
    throw error;
  }
};

export const getProspects = async (userId: number): Promise<Prospect[]> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const prospects = (await db.getAllAsync(
      "SELECT * FROM Prospects WHERE userId = ? ORDER BY followUpDate ASC",
      [userId]
    )) as Prospect[];

    return prospects;
  } catch (error) {
    console.error("Error fetching prospects:", error);
    throw error;
  }
};

export const updateProspectStatus = async (
  prospectId: number,
  status: Prospect["status"]
): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  try {
    await db.runAsync("UPDATE Prospects SET status = ? WHERE id = ?", [
      status,
      prospectId,
    ]);
  } catch (error) {
    console.error("Error updating prospect status:", error);
    throw error;
  }
};

export const addSale = async (sale: Omit<Sale, "id">): Promise<Sale> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const result = await db.runAsync(
      "INSERT INTO Sales (clientId, date, amount, productOrService) VALUES (?, ?, ?, ?)",
      [sale.clientId, sale.date, sale.amount, sale.productOrService]
    );

    return {
      id: result.lastInsertRowId,
      ...sale,
    };
  } catch (error) {
    console.error("Error adding sale:", error);
    throw error;
  }
};

export const getSales = async (
  userId: number
): Promise<(Sale & { clientName: string })[]> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const sales = (await db.getAllAsync(
      `SELECT Sales.*, Clients.name as clientName 
       FROM Sales 
       INNER JOIN Clients ON Sales.clientId = Clients.id 
       WHERE Clients.userId = ? 
       ORDER BY Sales.date DESC`,
      [userId]
    )) as (Sale & { clientName: string })[];

    return sales;
  } catch (error) {
    console.error("Error fetching sales:", error);
    throw error;
  }
};

export const getSalesByClient = async (clientId: number): Promise<Sale[]> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const sales = (await db.getAllAsync(
      "SELECT * FROM Sales WHERE clientId = ? ORDER BY date DESC",
      [clientId]
    )) as Sale[];

    return sales;
  } catch (error) {
    console.error("Error fetching client sales:", error);
    throw error;
  }
};

export const convertProspectToClientAndRecordSale = async (
  prospectId: number,
  saleData: Omit<Sale, "id" | "clientId">
): Promise<{ client: Client; sale: Sale }> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const prospect = (await db.getFirstAsync(
      "SELECT * FROM Prospects WHERE id = ?",
      [prospectId]
    )) as Prospect | null;

    if (!prospect) {
      throw new Error("Prospect not found");
    }

    const clientResult = await db.runAsync(
      "INSERT INTO Clients (userId, name, phone, email, company, industry) VALUES (?, ?, ?, ?, ?, ?)",
      [
        prospect.userId,
        prospect.name,
        prospect.phone,
        prospect.email,
        prospect.company,
        "General",
      ]
    );

    const newClient: Client = {
      id: clientResult.lastInsertRowId,
      userId: prospect.userId,
      name: prospect.name,
      phone: prospect.phone,
      email: prospect.email,
      company: prospect.company,
      industry: "General",
    };

    const saleResult = await db.runAsync(
      "INSERT INTO Sales (clientId, date, amount, productOrService) VALUES (?, ?, ?, ?)",
      [newClient.id, saleData.date, saleData.amount, saleData.productOrService]
    );

    const newSale: Sale = {
      id: saleResult.lastInsertRowId,
      clientId: newClient.id,
      ...saleData,
    };

    await db.runAsync("UPDATE Prospects SET status = ? WHERE id = ?", [
      "Won",
      prospectId,
    ]);

    console.log("Prospect converted to client with sale:", {
      newClient,
      newSale,
    });
    return { client: newClient, sale: newSale };
  } catch (error) {
    console.error("Error converting prospect to client:", error);
    throw error;
  }
};

export const addFollowUp = async (
  followUp: Omit<FollowUp, "id">
): Promise<FollowUp> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const result = await db.runAsync(
      "INSERT INTO FollowUps (entityId, isClient, date, notes, isCompleted) VALUES (?, ?, ?, ?, ?)",
      [
        followUp.entityId,
        followUp.isClient,
        followUp.date,
        followUp.notes,
        followUp.isCompleted,
      ]
    );

    return {
      id: result.lastInsertRowId,
      ...followUp,
    };
  } catch (error) {
    console.error("Error adding follow-up:", error);
    throw error;
  }
};

export const getFollowUps = async (userId: number): Promise<FollowUp[]> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const followUps = (await db.getAllAsync(
      `SELECT FollowUps.* FROM FollowUps
       LEFT JOIN Clients ON FollowUps.entityId = Clients.id AND FollowUps.isClient = 1
       LEFT JOIN Prospects ON FollowUps.entityId = Prospects.id AND FollowUps.isClient = 0
       WHERE (Clients.userId = ? OR Prospects.userId = ?)
       ORDER BY FollowUps.date ASC`,
      [userId, userId]
    )) as FollowUp[];

    return followUps;
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    throw error;
  }
};

export const completeFollowUp = async (followUpId: number): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  try {
    await db.runAsync("UPDATE FollowUps SET isCompleted = 1 WHERE id = ?", [
      followUpId,
    ]);
  } catch (error) {
    console.error("Error completing follow-up:", error);
    throw error;
  }
};
