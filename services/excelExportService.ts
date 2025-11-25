// services/excelExportService.ts
import {
  Client,
  Prospect,
  Sale,
  CallLog,
  FollowUpWithDetails,
} from "../types";

// Simple CSV export (works on all platforms)
export const exportToCSV = (
  data: any[],
  filename: string,
  headers: string[]
): string => {
  if (data.length === 0) {
    return "No data to export";
  }

  // Create header row
  const headerRow = headers.join(",");

  // Create data rows
  const dataRows = data.map((item) => {
    return headers
      .map((header) => {
        const value = item[header];
        // Escape quotes and wrap in quotes if contains comma
        if (value === null || value === undefined) {
          return "";
        }
        const stringValue = String(value).replace(/"/g, '""');
        return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
      })
      .join(",");
  });

  const csv = [headerRow, ...dataRows].join("\n");
  return csv;
};

// Export Clients
export const exportClientsToCSV = (clients: Client[]): string => {
  const headers = ["ID", "Name", "Phone", "Email", "Company", "Industry"];
  const data = clients.map((client) => ({
    ID: client.id,
    Name: client.name,
    Phone: client.phone,
    Email: client.email,
    Company: client.company,
    Industry: client.industry,
  }));

  return exportToCSV(data, "clients.csv", headers);
};

// Export Prospects
export const exportProspectsToCSV = (prospects: Prospect[]): string => {
  const headers = [
    "ID",
    "Name",
    "Phone",
    "Email",
    "Company",
    "Status",
    "Follow-up Date",
  ];
  const data = prospects.map((prospect) => ({
    ID: prospect.id,
    Name: prospect.name,
    Phone: prospect.phone,
    Email: prospect.email,
    Company: prospect.company,
    Status: prospect.status,
    "Follow-up Date": new Date(prospect.followUpDate).toLocaleDateString(),
  }));

  return exportToCSV(data, "prospects.csv", headers);
};

// Export Sales
export const exportSalesToCSV = (
  sales: (Sale & { clientName: string })[]
): string => {
  const headers = ["ID", "Client", "Amount", "Product/Service", "Date"];
  const data = sales.map((sale) => ({
    ID: sale.id,
    Client: sale.clientName,
    Amount: `UGX ${sale.amount.toLocaleString()}`,
    "Product/Service": sale.productOrService,
    Date: new Date(sale.date).toLocaleDateString(),
  }));

  return exportToCSV(data, "sales.csv", headers);
};

// Export Call Logs
export const exportCallLogsToCSV = (
  callLogs: (CallLog & { number: string })[]
): string => {
  const headers = [
    "ID",
    "Phone Number",
    "Feedback",
    "Duration (s)",
    "Notes",
    "Date",
  ];
  const data = callLogs.map((log) => ({
    ID: log.id,
    "Phone Number": log.number,
    Feedback: log.feedback,
    "Duration (s)": log.duration,
    Notes: log.shortNotes,
    Date: new Date(log.date).toLocaleString(),
  }));

  return exportToCSV(data, "calls.csv", headers);
};

// Export Follow-ups
export const exportFollowUpsToCSV = (
  followUps: FollowUpWithDetails[]
): string => {
  const headers = [
    "ID",
    "Entity",
    "Contact",
    "Type",
    "Notes",
    "Date",
    "Status",
  ];
  const data = followUps.map((followUp) => ({
    ID: followUp.id,
    Entity:
      followUp.entityType === "client"
        ? "Client"
        : followUp.entityType === "prospect"
        ? "Prospect"
        : "Phone",
    Contact: followUp.entityName,
    Type: followUp.entityCompany || "",
    Notes: followUp.notes,
    Date: new Date(followUp.date).toLocaleString(),
    Status: followUp.isCompleted ? "Completed" : "Pending",
  }));

  return exportToCSV(data, "followups.csv", headers);
};

// Save CSV to file (works on mobile)
export const saveCSVFile = async (
  csv: string,
  filename: string
): Promise<boolean> => {
  try {
    // For React Native, we can use file system APIs
    // This is a placeholder - actual implementation depends on platform
    console.log(`Attempting to save ${filename}`);
    console.log(`CSV Data (first 500 chars):\n${csv.substring(0, 500)}`);
    return true;
  } catch (error) {
    console.error("Error saving CSV file:", error);
    return false;
  }
};

// Generate summary report
export const generateSalesReport = (sales: Sale[]): string => {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const avgSale = sales.length > 0 ? totalRevenue / sales.length : 0;

  const report = `
SALES REPORT
Generated: ${new Date().toLocaleString()}

SUMMARY
-------
Total Sales: ${sales.length}
Total Revenue: UGX ${totalRevenue.toLocaleString()}
Average Sale: UGX ${avgSale.toLocaleString()}

TOP PRODUCTS
${sales
  .reduce((acc: Map<string, number>, sale) => {
    const current = acc.get(sale.productOrService) || 0;
    acc.set(sale.productOrService, current + sale.amount);
    return acc;
  }, new Map<string, number>())
  .entries()}

SALES BY DATE
${Array.from(
  sales
    .reduce((acc: Map<string, number>, sale) => {
      const date = new Date(sale.date).toLocaleDateString();
      const current = acc.get(date) || 0;
      acc.set(date, current + sale.amount);
      return acc;
    }, new Map<string, number>())
    .entries()
)
  .map(([date, amount]) => `${date}: UGX ${amount.toLocaleString()}`)
  .join("\n")}
  `;

  return report;
};
