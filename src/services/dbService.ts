import * as SQLite from "expo-sqlite";

// Interfaces (repeated from requirements for completeness)
export interface User {
  id: number;
  username: string;
  passwordHash: string;
  name: string;
}

export interface Client {
  id: number;
  userId: number;
  name: string;
  phone: string;
  email: string;
  company: string;
  industry: string;
}

export interface Prospect {
  id: number;
  userId: number;
  name: string;
  phone: string;
  email: string;
  company: string;
  status: "New" | "Contacted" | "Qualified" | "Won";
  followUpDate: string;
}

export interface Sale {
  id: number;
  clientId: number;
  date: string;
  amount: number;
  productOrService: string;
}

export interface FollowUp {
  id: number;
  entityId: number;
  isClient: 0 | 1;
  date: string;
  notes: string;
  isCompleted: string;
}

// Simple mock hash function (in real app, use bcrypt or similar)
const mockHash = (password: string): string => {
  // This is a simple mock - in production, use a proper hashing library
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString();
};

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = SQLite.openDatabaseSync("sales_tracker.db");
      await this.createTables();
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Users table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS Users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          passwordHash TEXT NOT NULL,
          name TEXT NOT NULL
        );
      `);

      // Clients table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS Clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          company TEXT,
          industry TEXT,
          FOREIGN KEY (userId) REFERENCES Users (id)
        );
      `);

      // Prospects table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS Prospects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          company TEXT,
          status TEXT CHECK(status IN ('New', 'Contacted', 'Qualified', 'Won')) DEFAULT 'New',
          followUpDate TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES Users (id)
        );
      `);

      // Sales table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS Sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clientId INTEGER NOT NULL,
          date TEXT NOT NULL,
          amount REAL NOT NULL,
          productOrService TEXT NOT NULL,
          FOREIGN KEY (clientId) REFERENCES Clients (id)
        );
      `);

      // FollowUps table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS FollowUps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entityId INTEGER NOT NULL,
          isClient INTEGER NOT NULL DEFAULT 0,
          date TEXT NOT NULL,
          notes TEXT,
          isCompleted TEXT NOT NULL
        );
      `);

      console.log("All tables created successfully");
    } catch (error) {
      console.error("Error creating tables:", error);
      throw error;
    }
  }

  // Authentication methods
  async signup(
    username: string,
    password: string,
    name: string
  ): Promise<User> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const passwordHash = mockHash(password);

    try {
      const result = await this.db.runAsync(
        "INSERT INTO Users (username, passwordHash, name) VALUES (?, ?, ?)",
        [username, passwordHash, name]
      );

      const user: User = {
        id: result.lastInsertRowId as number,
        username,
        passwordHash,
        name,
      };
      return user;
    } catch (error) {
      console.error("Error in signup:", error);
      throw error;
    }
  }

  async signin(username: string, password: string): Promise<User | null> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    const passwordHash = mockHash(password);

    try {
      const result = await this.db.getFirstAsync<User>(
        "SELECT * FROM Users WHERE username = ? AND passwordHash = ?",
        [username, passwordHash]
      );
      return result || null;
    } catch (error) {
      console.error("Error in signin:", error);
      throw error;
    }
  }

  // Client CRUD operations
  async getClients(userId: number): Promise<Client[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.getAllAsync<Client>(
        "SELECT * FROM Clients WHERE userId = ?",
        [userId]
      );
      return result;
    } catch (error) {
      console.error("Error getting clients:", error);
      throw error;
    }
  }

  async addClient(client: Omit<Client, "id">): Promise<Client> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.runAsync(
        `INSERT INTO Clients (userId, name, phone, email, company, industry) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          client.userId,
          client.name,
          client.phone,
          client.email,
          client.company,
          client.industry,
        ]
      );

      const newClient: Client = {
        ...client,
        id: result.lastInsertRowId as number,
      };
      return newClient;
    } catch (error) {
      console.error("Error adding client:", error);
      throw error;
    }
  }

  // Prospect CRUD operations
  async getProspects(userId: number): Promise<Prospect[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.getAllAsync<Prospect>(
        "SELECT * FROM Prospects WHERE userId = ?",
        [userId]
      );
      return result;
    } catch (error) {
      console.error("Error getting prospects:", error);
      throw error;
    }
  }

  async addProspect(prospect: Omit<Prospect, "id">): Promise<Prospect> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.runAsync(
        `INSERT INTO Prospects (userId, name, phone, email, company, status, followUpDate) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          prospect.userId,
          prospect.name,
          prospect.phone,
          prospect.email,
          prospect.company,
          prospect.status,
          prospect.followUpDate,
        ]
      );

      const newProspect: Prospect = {
        ...prospect,
        id: result.lastInsertRowId as number,
      };
      return newProspect;
    } catch (error) {
      console.error("Error adding prospect:", error);
      throw error;
    }
  }

  // Sales operations
  async getSalesByClientId(clientId: number): Promise<Sale[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.getAllAsync<Sale>(
        "SELECT * FROM Sales WHERE clientId = ?",
        [clientId]
      );
      return result;
    } catch (error) {
      console.error("Error getting sales:", error);
      throw error;
    }
  }

  async addSale(sale: Omit<Sale, "id">): Promise<Sale> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.runAsync(
        "INSERT INTO Sales (clientId, date, amount, productOrService) VALUES (?, ?, ?, ?)",
        [sale.clientId, sale.date, sale.amount, sale.productOrService]
      );

      const newSale: Sale = {
        ...sale,
        id: result.lastInsertRowId as number,
      };
      return newSale;
    } catch (error) {
      console.error("Error adding sale:", error);
      throw error;
    }
  }

  // Critical function: Convert Prospect to Client and record sale
  async convertProspectToClientAndRecordSale(
    prospectId: number,
    saleData: Omit<Sale, "id" | "clientId">
  ): Promise<{ client: Client; sale: Sale }> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // Use transaction for atomic operation
      await this.db.execAsync("BEGIN TRANSACTION");

      try {
        // Step 1: Get the prospect data
        const prospect = await this.db.getFirstAsync<Prospect>(
          "SELECT * FROM Prospects WHERE id = ?",
          [prospectId]
        );

        if (!prospect) {
          throw new Error("Prospect not found");
        }

        // Step 2: Create new client from prospect data
        const clientResult = await this.db.runAsync(
          `INSERT INTO Clients (userId, name, phone, email, company, industry) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            prospect.userId,
            prospect.name,
            prospect.phone,
            prospect.email,
            prospect.company,
            "Unknown",
          ]
        );

        const newClient: Client = {
          id: clientResult.lastInsertRowId as number,
          userId: prospect.userId,
          name: prospect.name,
          phone: prospect.phone,
          email: prospect.email,
          company: prospect.company,
          industry: "Unknown",
        };

        // Step 3: Record the sale
        const saleResult = await this.db.runAsync(
          "INSERT INTO Sales (clientId, date, amount, productOrService) VALUES (?, ?, ?, ?)",
          [
            newClient.id,
            saleData.date,
            saleData.amount,
            saleData.productOrService,
          ]
        );

        const newSale: Sale = {
          ...saleData,
          id: saleResult.lastInsertRowId as number,
          clientId: newClient.id,
        };

        // Step 4: Update prospect status to 'Won'
        await this.db.runAsync("UPDATE Prospects SET status = ? WHERE id = ?", [
          "Won",
          prospectId,
        ]);

        // Commit transaction
        await this.db.execAsync("COMMIT");

        return { client: newClient, sale: newSale };
      } catch (error) {
        // Rollback transaction on error
        await this.db.execAsync("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("Error converting prospect to client:", error);
      throw error;
    }
  }

  // FollowUp operations
  async getFollowUps(userId: number): Promise<FollowUp[]> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.getAllAsync<FollowUp>(
        `SELECT f.* FROM FollowUps f
         LEFT JOIN Clients c ON f.entityId = c.id AND f.isClient = 1
         LEFT JOIN Prospects p ON f.entityId = p.id AND f.isClient = 0
         WHERE c.userId = ? OR p.userId = ?`,
        [userId, userId]
      );
      return result;
    } catch (error) {
      console.error("Error getting follow-ups:", error);
      throw error;
    }
  }

  async addFollowUp(followUp: Omit<FollowUp, "id">): Promise<FollowUp> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const result = await this.db.runAsync(
        "INSERT INTO FollowUps (entityId, isClient, date, notes, isCompleted) VALUES (?, ?, ?, ?, ?)",
        [
          followUp.entityId,
          followUp.isClient,
          followUp.date,
          followUp.notes,
          followUp.isCompleted,
        ]
      );

      const newFollowUp: FollowUp = {
        ...followUp,
        id: result.lastInsertRowId as number,
      };
      return newFollowUp;
    } catch (error) {
      console.error("Error adding follow-up:", error);
      throw error;
    }
  }
}

export const dbService = new DatabaseService();
