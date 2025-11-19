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
  isCompleted: 0 | 1;
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
  private db: any = null;

  async init(): Promise<void> {
    try {
      this.db = SQLite.openDatabaseSync("sales_tracker.db");
      await this.createTables();
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  private createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

    this.db.transaction(
      (tx: any) => {
        // Users table
        tx.executeSql(`
        CREATE TABLE IF NOT EXISTS Users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          passwordHash TEXT NOT NULL,
          name TEXT NOT NULL
        );
        `);

        // Clients table
        tx.executeSql(`
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
        tx.executeSql(`
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
        tx.executeSql(`
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
        tx.executeSql(`
        CREATE TABLE IF NOT EXISTS FollowUps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entityId INTEGER NOT NULL,
          isClient INTEGER NOT NULL DEFAULT 0,
          date TEXT NOT NULL,
          notes TEXT,
          isCompleted INTEGER NOT NULL DEFAULT 0
        );
        `);
      },
      (error: any) => {
        console.error("Error creating tables:", error);
        reject(error);
      },
      (): void => {
        console.log("All tables created successfully");
        resolve();
      }
    );
    });
  }

  // Authentication methods
  async signup(
    username: string,
    password: string,
    name: string
  ): Promise<User> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const passwordHash = mockHash(password);

      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            "INSERT INTO Users (username, passwordHash, name) VALUES (?, ?, ?)",
            [username, passwordHash, name],
            (_: any, result: any) => {
              const user: User = {
                id: result.insertId,
                username,
                passwordHash,
                name,
              };
              resolve(user);
            },
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  async signin(username: string, password: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const passwordHash = mockHash(password);

      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            "SELECT * FROM Users WHERE username = ? AND passwordHash = ?",
            [username, passwordHash],
            (_: any, result: any) => {
              if (result.rows.length > 0) {
                resolve(result.rows.item(0) as User);
              } else {
                resolve(null);
              }
            },
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  // Client CRUD operations
  async getClients(userId: number): Promise<Client[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            "SELECT * FROM Clients WHERE userId = ?",
            [userId],
            (_: any, result: any) => {
              const clients: Client[] = [];
              for (let i = 0; i < result.rows.length; i++) {
                clients.push(result.rows.item(i) as Client);
              }
              resolve(clients);
            },
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  async addClient(client: Omit<Client, "id">): Promise<Client> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            `INSERT INTO Clients (userId, name, phone, email, company, industry) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              client.userId,
              client.name,
              client.phone,
              client.email,
              client.company,
              client.industry,
            ],
            (_: any, result: any) => {
              const newClient: Client = {
                ...client,
                id: result.insertId,
              };
              resolve(newClient);
            },
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  // Prospect CRUD operations
  async getProspects(userId: number): Promise<Prospect[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            "SELECT * FROM Prospects WHERE userId = ?",
            [userId],
            (_: any, result: any) => {
              const prospects: Prospect[] = [];
              for (let i = 0; i < result.rows.length; i++) {
                prospects.push(result.rows.item(i) as Prospect);
              }
              resolve(prospects);
            },
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  async addProspect(prospect: Omit<Prospect, "id">): Promise<Prospect> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
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
            ],
            (_: any, result: any) => {
              const newProspect: Prospect = {
                ...prospect,
                id: result.insertId,
              };
              resolve(newProspect);
            },
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  // Sales operations
  async getSalesByClientId(clientId: number): Promise<Sale[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            "SELECT * FROM Sales WHERE clientId = ?",
            [clientId],
            (_: any, result: any) => {
              const sales: Sale[] = [];
              for (let i = 0; i < result.rows.length; i++) {
                sales.push(result.rows.item(i) as Sale);
              }
              resolve(sales);
            },
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  async addSale(sale: Omit<Sale, "id">): Promise<Sale> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            "INSERT INTO Sales (clientId, date, amount, productOrService) VALUES (?, ?, ?, ?)",
            [sale.clientId, sale.date, sale.amount, sale.productOrService],
            (_: any, result: any) => {
              const newSale: Sale = {
                ...sale,
                id: result.insertId,
              };
              resolve(newSale);
            },
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  // Critical function: Convert Prospect to Client and record sale
  async convertProspectToClientAndRecordSale(
    prospectId: number,
    saleData: Omit<Sale, "id" | "clientId">
  ): Promise<{ client: Client; sale: Sale }> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.transaction(
        (tx: any) => {
          // Step 1: Get the prospect data
          tx.executeSql(
            "SELECT * FROM Prospects WHERE id = ?",
            [prospectId],
            (_: any, prospectResult: any) => {
              if (prospectResult.rows.length === 0) {
                reject(new Error("Prospect not found"));
                return;
              }

              const prospect = prospectResult.rows.item(0) as Prospect;

              // Step 2: Create new client from prospect data
              tx.executeSql(
                `INSERT INTO Clients (userId, name, phone, email, company, industry) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  prospect.userId,
                  prospect.name,
                  prospect.phone,
                  prospect.email,
                  prospect.company,
                  "Unknown",
                ],
                (_: any, clientResult: any) => {
                  const newClient: Client = {
                    id: clientResult.insertId,
                    userId: prospect.userId,
                    name: prospect.name,
                    phone: prospect.phone,
                    email: prospect.email,
                    company: prospect.company,
                    industry: "Unknown",
                  };

                  // Step 3: Record the sale
                  tx.executeSql(
                    "INSERT INTO Sales (clientId, date, amount, productOrService) VALUES (?, ?, ?, ?)",
                    [
                      clientResult.insertId,
                      saleData.date,
                      saleData.amount,
                      saleData.productOrService,
                    ],
                    (_: any, saleResult: any) => {
                      const newSale: Sale = {
                        ...saleData,
                        id: saleResult.insertId,
                        clientId: clientResult.insertId,
                      };

                      // Step 4: Update prospect status to 'Won'
                      tx.executeSql(
                        "UPDATE Prospects SET status = ? WHERE id = ?",
                        ["Won", prospectId],
                        () => {
                          resolve({ client: newClient, sale: newSale });
                        },
                        (_: any, error: any) => {
                          reject(error);
                          return false;
                        }
                      );
                    },
                    (_: any, error: any) => {
                      reject(error);
                      return false;
                    }
                  );
                },
                (_: any, error: any) => {
                  reject(error);
                  return false;
                }
              );
            },
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  // FollowUp operations
  async getFollowUps(userId: number): Promise<FollowUp[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            `SELECT f.* FROM FollowUps f
             LEFT JOIN Clients c ON f.entityId = c.id AND f.isClient = 1
             LEFT JOIN Prospects p ON f.entityId = p.id AND f.isClient = 0
             WHERE c.userId = ? OR p.userId = ?`,
            [userId, userId],
            (_: any, result: any) => {
              const followUps: FollowUp[] = [];
              for (let i = 0; i < result.rows.length; i++) {
                followUps.push(result.rows.item(i) as FollowUp);
              }
              resolve(followUps);
            },
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }

  async addFollowUp(followUp: Omit<FollowUp, "id">): Promise<FollowUp> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.transaction(
        (tx: any) => {
          tx.executeSql(
            "INSERT INTO FollowUps (entityId, isClient, date, notes, isCompleted) VALUES (?, ?, ?, ?, ?)",
            [
              followUp.entityId,
              followUp.isClient,
              followUp.date,
              followUp.notes,
              followUp.isCompleted,
            ],
            (_: any, result: any) => {
              const newFollowUp: FollowUp = {
                ...followUp,
                id: result.insertId,
              };
              resolve(newFollowUp);
            },
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error: any) => {
          reject(error);
        }
      );
    });
  }
}

export const dbService = new DatabaseService();
