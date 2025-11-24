import { Platform } from "react-native";
import CryptoJS from "crypto-js";
import {
  User,
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
    db = await SQLite.openDatabaseAsync("salestrackerdb.db");

    await db.execAsync(`
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
        entityType TEXT NOT NULL,
        date TEXT NOT NULL,
        notes TEXT NOT NULL,
        isCompleted INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS PhoneNumbers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        number TEXT NOT NULL,
        lastCalledDate TEXT NOT NULL,
        isProspect INTEGER NOT NULL DEFAULT 0,
        prospectId INTEGER,
        UNIQUE(userId, number),
        FOREIGN KEY (userId) REFERENCES Users(id),
        FOREIGN KEY (prospectId) REFERENCES Prospects(id)
      );
      
      CREATE TABLE IF NOT EXISTS CallLogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phoneNumberId INTEGER NOT NULL,
        date TEXT NOT NULL,
        feedback TEXT NOT NULL,
        duration INTEGER NOT NULL DEFAULT 0,
        shortNotes TEXT NOT NULL,
        nextFollowUpDate TEXT,
        FOREIGN KEY (phoneNumberId) REFERENCES PhoneNumbers(id)
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

export const updateClient = async (
  clientId: number,
  updates: Partial<Omit<Client, "id" | "userId">>
): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const updateFields: string[] = [];
    const values: (string | number)[] = [];

    if (updates.name !== undefined) {
      updateFields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.phone !== undefined) {
      updateFields.push("phone = ?");
      values.push(updates.phone);
    }
    if (updates.email !== undefined) {
      updateFields.push("email = ?");
      values.push(updates.email);
    }
    if (updates.company !== undefined) {
      updateFields.push("company = ?");
      values.push(updates.company);
    }
    if (updates.industry !== undefined) {
      updateFields.push("industry = ?");
      values.push(updates.industry);
    }

    if (updateFields.length === 0) return;

    values.push(clientId);

    await db.runAsync(
      `UPDATE Clients SET ${updateFields.join(", ")} WHERE id = ?`,
      values
    );
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};

export const deleteClient = async (clientId: number): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  try {
    // Delete related follow-ups
    await db.runAsync(
      "DELETE FROM FollowUps WHERE entityId = ? AND entityType = 'client'",
      [clientId]
    );
    // Delete related sales
    await db.runAsync("DELETE FROM Sales WHERE clientId = ?", [clientId]);
    // Delete the client
    await db.runAsync("DELETE FROM Clients WHERE id = ?", [clientId]);
  } catch (error) {
    console.error("Error deleting client:", error);
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

export const updateProspect = async (
  prospectId: number,
  updates: Partial<Omit<Prospect, "id" | "userId">>
): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const updateFields: string[] = [];
    const values: (string | number)[] = [];

    if (updates.name !== undefined) {
      updateFields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.phone !== undefined) {
      updateFields.push("phone = ?");
      values.push(updates.phone);
    }
    if (updates.email !== undefined) {
      updateFields.push("email = ?");
      values.push(updates.email);
    }
    if (updates.company !== undefined) {
      updateFields.push("company = ?");
      values.push(updates.company);
    }
    if (updates.status !== undefined) {
      updateFields.push("status = ?");
      values.push(updates.status);
    }
    if (updates.followUpDate !== undefined) {
      updateFields.push("followUpDate = ?");
      values.push(updates.followUpDate);
    }

    if (updateFields.length === 0) return;

    values.push(prospectId);

    await db.runAsync(
      `UPDATE Prospects SET ${updateFields.join(", ")} WHERE id = ?`,
      values
    );
  } catch (error) {
    console.error("Error updating prospect:", error);
    throw error;
  }
};

export const deleteProspect = async (prospectId: number): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  try {
    // Delete related follow-ups
    await db.runAsync(
      "DELETE FROM FollowUps WHERE entityId = ? AND entityType = 'prospect'",
      [prospectId]
    );
    // Delete the prospect
    await db.runAsync("DELETE FROM Prospects WHERE id = ?", [prospectId]);
  } catch (error) {
    console.error("Error deleting prospect:", error);
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

export const updateSale = async (
  saleId: number,
  updates: Partial<Omit<Sale, "id" | "clientId">>
): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const updateFields: string[] = [];
    const values: (string | number)[] = [];

    if (updates.date !== undefined) {
      updateFields.push("date = ?");
      values.push(updates.date);
    }
    if (updates.amount !== undefined) {
      updateFields.push("amount = ?");
      values.push(updates.amount);
    }
    if (updates.productOrService !== undefined) {
      updateFields.push("productOrService = ?");
      values.push(updates.productOrService);
    }

    if (updateFields.length === 0) return;

    values.push(saleId);

    await db.runAsync(
      `UPDATE Sales SET ${updateFields.join(", ")} WHERE id = ?`,
      values
    );
  } catch (error) {
    console.error("Error updating sale:", error);
    throw error;
  }
};

export const deleteSale = async (saleId: number): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  try {
    await db.runAsync("DELETE FROM Sales WHERE id = ?", [saleId]);
  } catch (error) {
    console.error("Error deleting sale:", error);
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
  followUp: Omit<FollowUp, "id" | "createdAt">
): Promise<FollowUp> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const createdAt = new Date().toISOString();
    const result = await db.runAsync(
      "INSERT INTO FollowUps (entityId, entityType, date, notes, isCompleted, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [
        followUp.entityId,
        followUp.entityType,
        followUp.date,
        followUp.notes,
        followUp.isCompleted,
        createdAt,
      ]
    );

    return {
      id: result.lastInsertRowId,
      createdAt,
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
       LEFT JOIN Clients ON FollowUps.entityId = Clients.id AND FollowUps.entityType = 'client'
       LEFT JOIN Prospects ON FollowUps.entityId = Prospects.id AND FollowUps.entityType = 'prospect'
       LEFT JOIN PhoneNumbers ON FollowUps.entityId = PhoneNumbers.id AND FollowUps.entityType = 'phoneNumber'
       WHERE Clients.userId = ? OR Prospects.userId = ? OR PhoneNumbers.userId = ?
       ORDER BY FollowUps.date ASC`,
      [userId, userId, userId]
    )) as FollowUp[];

    return followUps;
  } catch (error) {
    console.error("Error fetching follow-ups:", error);
    throw error;
  }
};

export const getFollowUpsWithDetails = async (
  userId: number
): Promise<FollowUpWithDetails[]> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const followUps = (await db.getAllAsync(
      `SELECT 
        FollowUps.*,
        CASE 
          WHEN FollowUps.entityType = 'client' THEN Clients.name
          WHEN FollowUps.entityType = 'prospect' THEN Prospects.name
          WHEN FollowUps.entityType = 'phoneNumber' THEN PhoneNumbers.number
        END as entityName,
        CASE 
          WHEN FollowUps.entityType = 'client' THEN Clients.phone
          WHEN FollowUps.entityType = 'prospect' THEN Prospects.phone
          WHEN FollowUps.entityType = 'phoneNumber' THEN PhoneNumbers.number
        END as entityPhone,
        CASE 
          WHEN FollowUps.entityType = 'client' THEN Clients.company
          WHEN FollowUps.entityType = 'prospect' THEN Prospects.company
        END as entityCompany
      FROM FollowUps
      LEFT JOIN Clients ON FollowUps.entityId = Clients.id AND FollowUps.entityType = 'client'
      LEFT JOIN Prospects ON FollowUps.entityId = Prospects.id AND FollowUps.entityType = 'prospect'
      LEFT JOIN PhoneNumbers ON FollowUps.entityId = PhoneNumbers.id AND FollowUps.entityType = 'phoneNumber'
      WHERE Clients.userId = ? OR Prospects.userId = ? OR PhoneNumbers.userId = ?
      ORDER BY FollowUps.isCompleted ASC, FollowUps.date ASC`,
      [userId, userId, userId]
    )) as FollowUpWithDetails[];

    return followUps.filter((f) => f.entityName);
  } catch (error) {
    console.error("Error fetching follow-ups with details:", error);
    throw error;
  }
};

export const getFollowUpsByEntity = async (
  entityId: number,
  entityType: FollowUpEntityType
): Promise<FollowUp[]> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const followUps = (await db.getAllAsync(
      "SELECT * FROM FollowUps WHERE entityId = ? AND entityType = ? ORDER BY date DESC",
      [entityId, entityType]
    )) as FollowUp[];

    return followUps;
  } catch (error) {
    console.error("Error fetching entity follow-ups:", error);
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

export const updateFollowUp = async (
  followUpId: number,
  data: Partial<Pick<FollowUp, "date" | "notes">>
): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (data.date) {
      updates.push("date = ?");
      values.push(data.date);
    }
    if (data.notes) {
      updates.push("notes = ?");
      values.push(data.notes);
    }

    if (updates.length === 0) return;

    values.push(followUpId);

    await db.runAsync(
      `UPDATE FollowUps SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
  } catch (error) {
    console.error("Error updating follow-up:", error);
    throw error;
  }
};

export const deleteFollowUp = async (followUpId: number): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  try {
    await db.runAsync("DELETE FROM FollowUps WHERE id = ?", [followUpId]);
  } catch (error) {
    console.error("Error deleting follow-up:", error);
    throw error;
  }
};

export const recordNewCall = async (
  userId: number,
  callData: {
    number: string;
    logData: Omit<CallLog, "id" | "phoneNumberId">;
  }
): Promise<{ phoneNumber: PhoneNumber; callLog: CallLog }> => {
  if (!db) throw new Error("Database not initialized");

  try {
    let phoneNumber = (await db.getFirstAsync(
      "SELECT * FROM PhoneNumbers WHERE userId = ? AND number = ?",
      [userId, callData.number]
    )) as PhoneNumber | null;

    if (!phoneNumber) {
      const result = await db.runAsync(
        "INSERT INTO PhoneNumbers (userId, number, lastCalledDate, isProspect, prospectId) VALUES (?, ?, ?, 0, NULL)",
        [userId, callData.number, callData.logData.date]
      );

      phoneNumber = {
        id: result.lastInsertRowId,
        userId,
        number: callData.number,
        lastCalledDate: callData.logData.date,
        isProspect: 0,
        prospectId: null,
      };
    } else {
      await db.runAsync(
        "UPDATE PhoneNumbers SET lastCalledDate = ? WHERE id = ?",
        [callData.logData.date, phoneNumber.id]
      );
      phoneNumber.lastCalledDate = callData.logData.date;
    }

    const logResult = await db.runAsync(
      "INSERT INTO CallLogs (phoneNumberId, date, feedback, duration, shortNotes, nextFollowUpDate) VALUES (?, ?, ?, ?, ?, ?)",
      [
        phoneNumber.id,
        callData.logData.date,
        callData.logData.feedback,
        callData.logData.duration,
        callData.logData.shortNotes,
        callData.logData.nextFollowUpDate,
      ]
    );

    const newCallLog: CallLog = {
      id: logResult.lastInsertRowId,
      phoneNumberId: phoneNumber.id,
      ...callData.logData,
    };

    if (callData.logData.nextFollowUpDate) {
      const createdAt = new Date().toISOString();
      await db.runAsync(
        "INSERT INTO FollowUps (entityId, entityType, date, notes, isCompleted, createdAt) VALUES (?, ?, ?, ?, 0, ?)",
        [
          phoneNumber.id,
          "phoneNumber",
          callData.logData.nextFollowUpDate,
          `Follow-up call for ${callData.number}`,
          createdAt,
        ]
      );
    }

    console.log("Call recorded:", { phoneNumber, newCallLog });
    return { phoneNumber, callLog: newCallLog };
  } catch (error) {
    console.error("Error recording call:", error);
    throw error;
  }
};

export const getPhoneNumbers = async (
  userId: number
): Promise<PhoneNumber[]> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const phoneNumbers = (await db.getAllAsync(
      "SELECT * FROM PhoneNumbers WHERE userId = ? ORDER BY lastCalledDate DESC",
      [userId]
    )) as PhoneNumber[];

    return phoneNumbers;
  } catch (error) {
    console.error("Error fetching phone numbers:", error);
    throw error;
  }
};

export const getCallLogs = async (
  userId: number
): Promise<(CallLog & { number: string })[]> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const callLogs = (await db.getAllAsync(
      `SELECT CallLogs.*, PhoneNumbers.number 
       FROM CallLogs 
       INNER JOIN PhoneNumbers ON CallLogs.phoneNumberId = PhoneNumbers.id 
       WHERE PhoneNumbers.userId = ? 
       ORDER BY CallLogs.date DESC`,
      [userId]
    )) as (CallLog & { number: string })[];

    return callLogs;
  } catch (error) {
    console.error("Error fetching call logs:", error);
    throw error;
  }
};

export const getCallLogsByPhoneNumber = async (
  phoneNumberId: number
): Promise<CallLog[]> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const callLogs = (await db.getAllAsync(
      "SELECT * FROM CallLogs WHERE phoneNumberId = ? ORDER BY date DESC",
      [phoneNumberId]
    )) as CallLog[];

    return callLogs;
  } catch (error) {
    console.error("Error fetching call logs by phone number:", error);
    throw error;
  }
};

export const updateCallLog = async (
  callLogId: number,
  updates: Partial<Omit<CallLog, "id" | "phoneNumberId">>
): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const updateFields: string[] = [];
    const values: (string | number)[] = [];

    if (updates.date !== undefined) {
      updateFields.push("date = ?");
      values.push(updates.date);
    }
    if (updates.feedback !== undefined) {
      updateFields.push("feedback = ?");
      values.push(updates.feedback);
    }
    if (updates.duration !== undefined) {
      updateFields.push("duration = ?");
      values.push(updates.duration);
    }
    if (updates.shortNotes !== undefined) {
      updateFields.push("shortNotes = ?");
      values.push(updates.shortNotes);
    }
    if (updates.nextFollowUpDate !== undefined) {
      updateFields.push("nextFollowUpDate = ?");
      values.push(updates.nextFollowUpDate as string);
    }

    if (updateFields.length === 0) return;

    values.push(callLogId);

    await db.runAsync(
      `UPDATE CallLogs SET ${updateFields.join(", ")} WHERE id = ?`,
      values
    );
  } catch (error) {
    console.error("Error updating call log:", error);
    throw error;
  }
};

export const deleteCallLog = async (callLogId: number): Promise<void> => {
  if (!db) throw new Error("Database not initialized");

  try {
    await db.runAsync("DELETE FROM CallLogs WHERE id = ?", [callLogId]);
  } catch (error) {
    console.error("Error deleting call log:", error);
    throw error;
  }
};

export const getDailyCallStats = async (
  userId: number,
  date: string
): Promise<DailyCallStats> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const startOfDay = date.split("T")[0];

    const callLogs = (await db.getAllAsync(
      `SELECT CallLogs.feedback 
       FROM CallLogs 
       INNER JOIN PhoneNumbers ON CallLogs.phoneNumberId = PhoneNumbers.id 
       WHERE PhoneNumbers.userId = ? AND DATE(CallLogs.date) = DATE(?)
       ORDER BY CallLogs.date DESC`,
      [userId, startOfDay]
    )) as { feedback: CallLog["feedback"] }[];

    const stats: DailyCallStats = {
      totalCalls: callLogs.length,
      successful: 0,
      busy: 0,
      notAnswered: 0,
      dnc: 0,
      leads: 0,
    };

    callLogs.forEach((log) => {
      switch (log.feedback) {
        case "Successful":
          stats.successful++;
          break;
        case "Busy":
          stats.busy++;
          break;
        case "Not Answered":
          stats.notAnswered++;
          break;
        case "DNC":
          stats.dnc++;
          break;
        case "Connected-Lead":
          stats.leads++;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error("Error fetching daily call stats:", error);
    throw error;
  }
};

export const convertPhoneNumberToProspect = async (
  phoneNumberId: number,
  prospectData: Omit<Prospect, "id" | "userId" | "phone">
): Promise<Prospect> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const phoneNumber = (await db.getFirstAsync(
      "SELECT * FROM PhoneNumbers WHERE id = ?",
      [phoneNumberId]
    )) as PhoneNumber | null;

    if (!phoneNumber) {
      throw new Error("Phone number not found");
    }

    const result = await db.runAsync(
      "INSERT INTO Prospects (userId, name, phone, email, company, status, followUpDate) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        phoneNumber.userId,
        prospectData.name,
        phoneNumber.number,
        prospectData.email,
        prospectData.company,
        prospectData.status,
        prospectData.followUpDate,
      ]
    );

    const newProspect: Prospect = {
      id: result.lastInsertRowId,
      userId: phoneNumber.userId,
      phone: phoneNumber.number,
      ...prospectData,
    };

    await db.runAsync(
      "UPDATE PhoneNumbers SET isProspect = 1, prospectId = ? WHERE id = ?",
      [newProspect.id, phoneNumberId]
    );

    await db.runAsync(
      "UPDATE FollowUps SET isCompleted = 1 WHERE entityId = ? AND entityType = ?",
      [phoneNumberId, "phoneNumber"]
    );

    console.log("Phone number converted to prospect:", newProspect);
    return newProspect;
  } catch (error) {
    console.error("Error converting phone number to prospect:", error);
    throw error;
  }
};

export const getAnalyticsData = async (
  userId: number,
  startDate?: string,
  endDate?: string
): Promise<AnalyticsData> => {
  if (!db) throw new Error("Database not initialized");

  try {
    const dateFilter =
      startDate && endDate ? `AND Sales.date BETWEEN ? AND ?` : "";
    const dateParams =
      startDate && endDate ? [userId, startDate, endDate] : [userId];

    const sales = (await db.getAllAsync(
      `SELECT * FROM Sales 
       INNER JOIN Clients ON Sales.clientId = Clients.id 
       WHERE Clients.userId = ? ${dateFilter} 
       ORDER BY Sales.date DESC`,
      dateParams
    )) as Sale[];

    const clients = await getClients(userId);
    const prospects = await getProspects(userId);
    const callLogs = await getCallLogs(userId);
    const followUps = await getFollowUps(userId);

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const averageSaleAmount =
      sales.length > 0 ? totalRevenue / sales.length : 0;

    const wonProspects = prospects.filter((p) => p.status === "Won").length;
    const totalProspects = prospects.length;
    const conversionRate =
      totalProspects > 0 ? (wonProspects / totalProspects) * 100 : 0;

    const productMap = new Map<string, { count: number; revenue: number }>();
    sales.forEach((sale) => {
      const existing = productMap.get(sale.productOrService) || {
        count: 0,
        revenue: 0,
      };
      productMap.set(sale.productOrService, {
        count: existing.count + 1,
        revenue: existing.revenue + sale.amount,
      });
    });
    const topProducts = Array.from(productMap.entries())
      .map(([product, data]) => ({ product, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const monthMap = new Map<string, { revenue: number; count: number }>();
    sales.forEach((sale) => {
      const month = new Date(sale.date).toISOString().slice(0, 7);
      const existing = monthMap.get(month) || { revenue: 0, count: 0 };
      monthMap.set(month, {
        revenue: existing.revenue + sale.amount,
        count: existing.count + 1,
      });
    });
    const salesByMonth = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const statusMap = new Map<string, number>();
    prospects.forEach((prospect) => {
      statusMap.set(prospect.status, (statusMap.get(prospect.status) || 0) + 1);
    });
    const prospectsByStatus = Array.from(statusMap.entries()).map(
      ([status, count]) => ({ status, count })
    );

    const feedbackMap = new Map<string, number>();
    callLogs.forEach((log) => {
      feedbackMap.set(log.feedback, (feedbackMap.get(log.feedback) || 0) + 1);
    });
    const callsByFeedback = Array.from(feedbackMap.entries()).map(
      ([feedback, count]) => ({ feedback, count })
    );

    return {
      totalRevenue,
      totalClients: clients.length,
      totalProspects,
      totalCalls: callLogs.length,
      totalFollowUps: followUps.length,
      completedFollowUps: followUps.filter((f) => f.isCompleted === 1).length,
      pendingFollowUps: followUps.filter((f) => f.isCompleted === 0).length,
      conversionRate,
      averageSaleAmount,
      topProducts,
      salesByMonth,
      prospectsByStatus,
      callsByFeedback,
    };
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    throw error;
  }
};
