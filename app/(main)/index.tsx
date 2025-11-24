import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useSales } from "../../contexts/SalesContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Calendar,
  Phone,
  BarChart3,
} from "lucide-react-native";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const { user } = useAuth();
  const { clients, prospects, sales, followUpsWithDetails } = useSales();

  const metrics = useMemo(() => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const activeProspects = prospects.filter((p) => p.status !== "Won").length;
    const pendingFollowUps = followUpsWithDetails.filter(
      (f) => f.isCompleted === 0
    ).length;
    const recentSales = sales.slice(0, 5);

    return {
      totalRevenue,
      activeProspects,
      pendingFollowUps,
      recentSales,
      totalClients: clients.length,
      totalProspects: prospects.length,
    };
  }, [clients, prospects, sales, followUpsWithDetails]);

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    color,
    onPress,
  }: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.metricCard, { borderLeftColor: color }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Icon size={24} color={color} strokeWidth={2} />
      </View>
      <View style={styles.metricContent}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || "User"}</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={`UGX ${metrics.totalRevenue.toLocaleString()}`}
          color="#10b981"
          onPress={() => router.push("/(main)/sales")}
        />
        <MetricCard
          icon={Users}
          label="Clients"
          value={metrics.totalClients}
          color="#3b82f6"
          onPress={() => router.push("/(main)/clients")}
        />
        <MetricCard
          icon={Target}
          label="Active Prospects"
          value={metrics.activeProspects}
          color="#f59e0b"
          onPress={() => router.push("/(main)/prospects")}
        />
        <MetricCard
          icon={Calendar}
          label="Pending Follow-ups"
          value={metrics.pendingFollowUps}
          color="#8b5cf6"
          onPress={() => router.push("/(main)/followups")}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sales</Text>
          <TouchableOpacity onPress={() => router.push("/(main)/sales")}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {metrics.recentSales.length === 0 ? (
          <View style={styles.emptyState}>
            <TrendingUp size={48} color="#475569" strokeWidth={1.5} />
            <Text style={styles.emptyText}>No sales yet</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/(main)/sales")}
            >
              <Text style={styles.addButtonText}>Add First Sale</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.salesList}>
            {metrics.recentSales.map((sale) => (
              <View key={sale.id} style={styles.saleItem}>
                <View style={styles.saleInfo}>
                  <Text style={styles.saleClient}>{sale.clientName}</Text>
                  <Text style={styles.saleProduct}>
                    {sale.productOrService}
                  </Text>
                  <Text style={styles.saleDate}>
                    {new Date(sale.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.saleAmount}>
                  UGX {sale.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/(main)/calls")}
          >
            <Phone size={24} color="#3b82f6" strokeWidth={2} />
            <Text style={styles.actionText}>Log Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/(main)/prospects")}
          >
            <Target size={24} color="#f59e0b" strokeWidth={2} />
            <Text style={styles.actionText}>Add Prospect</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/(main)/followups")}
          >
            <Calendar size={24} color="#8b5cf6" strokeWidth={2} />
            <Text style={styles.actionText}>Follow-ups</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/(main)/analytics")}
          >
            <BarChart3 size={24} color="#10b981" strokeWidth={2} />
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    color: "#94a3b8",
  },
  userName: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#fff",
    marginTop: 4,
  },
  metricsGrid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  metricCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: "#94a3b8",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#fff",
  },
  seeAll: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600" as const,
  },
  emptyState: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#94a3b8",
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  salesList: {
    gap: 12,
  },
  saleItem: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saleInfo: {
    flex: 1,
    gap: 4,
  },
  saleClient: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
  },
  saleProduct: {
    fontSize: 14,
    color: "#94a3b8",
  },
  saleDate: {
    fontSize: 12,
    color: "#64748b",
  },
  saleAmount: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#10b981",
  },
  quickActions: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    width: (width - 52) / 2,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#fff",
  },
});
