import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useSales } from "../../contexts/SalesContext";
import { AnalyticsData } from "../../types";
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  Package,
  BarChart3,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

type DateFilter = "all" | "year" | "month" | "week" | "day";

export default function AnalyticsScreen() {
  const { getAnalyticsData } = useSales();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange(dateFilter);
      const data = await getAnalyticsData(startDate, endDate);
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = (
    filter: DateFilter
  ): { startDate?: string; endDate?: string } => {
    const now = new Date();
    const endDate = now.toISOString();

    switch (filter) {
      case "day": {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return { startDate: start.toISOString(), endDate };
      }
      case "week": {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        return { startDate: start.toISOString(), endDate };
      }
      case "month": {
        const start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        return { startDate: start.toISOString(), endDate };
      }
      case "year": {
        const start = new Date(now);
        start.setFullYear(now.getFullYear() - 1);
        return { startDate: start.toISOString(), endDate };
      }
      default:
        return {};
    }
  };

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    color,
    subtext,
  }: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
    subtext?: string;
  }) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View
        style={[styles.metricIconContainer, { backgroundColor: color + "20" }]}
      >
        <Icon size={20} color={color} strokeWidth={2} />
      </View>
      <View style={styles.metricContent}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
        {subtext ? <Text style={styles.metricSubtext}>{subtext}</Text> : null}
      </View>
    </View>
  );

  const ChartBar = ({
    label,
    value,
    maxValue,
    color,
  }: {
    label: string;
    value: number;
    maxValue: number;
    color: string;
  }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    const barWidth = Math.max((percentage / 100) * (width - 120), 20);

    return (
      <View style={styles.chartBarContainer}>
        <Text style={styles.chartBarLabel}>{label}</Text>
        <View style={styles.chartBarTrack}>
          <View
            style={[
              styles.chartBarFill,
              { width: barWidth, backgroundColor: color },
            ]}
          >
            <Text style={styles.chartBarValue}>{value}</Text>
          </View>
        </View>
      </View>
    );
  };

  const SimpleChart = ({
    title,
    data,
    color,
  }: {
    title: string;
    data: { label: string; value: number }[];
    color: string;
  }) => {
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    return (
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.chartContainer}>
          {data.length === 0 ? (
            <Text style={styles.emptyChartText}>No data available</Text>
          ) : (
            data.map((item, index) => (
              <ChartBar
                key={index}
                label={item.label}
                value={item.value}
                maxValue={maxValue}
                color={color}
              />
            ))
          )}
        </View>
      </View>
    );
  };

  const chartData = useMemo(() => {
    if (!analyticsData) return null;

    return {
      salesByMonth: analyticsData.salesByMonth.slice(-6).map((s) => ({
        label: new Date(s.month + "-01").toLocaleDateString("en", {
          month: "short",
          year: "2-digit",
        }),
        value: s.revenue,
      })),
      topProducts: analyticsData.topProducts.map((p) => ({
        label:
          p.product.length > 15 ? p.product.slice(0, 15) + "..." : p.product,
        value: p.revenue,
      })),
      prospectsByStatus: analyticsData.prospectsByStatus.map((p) => ({
        label: p.status,
        value: p.count,
      })),
      callsByFeedback: analyticsData.callsByFeedback.map((c) => ({
        label: c.feedback,
        value: c.count,
      })),
    };
  }, [analyticsData]);

  if (isLoading || !analyticsData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {(["all", "day", "week", "month", "year"] as DateFilter[]).map(
            (filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  dateFilter === filter && styles.filterButtonActive,
                ]}
                onPress={() => setDateFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    dateFilter === filter && styles.filterButtonTextActive,
                  ]}
                >
                  {filter === "all"
                    ? "All Time"
                    : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon={DollarSign}
            label="Total Revenue"
            value={`UGX ${analyticsData.totalRevenue.toLocaleString()}`}
            color="#10b981"
            subtext={`Avg: UGX ${Math.round(
              analyticsData.averageSaleAmount
            ).toLocaleString()}`}
          />
          <MetricCard
            icon={Users}
            label="Total Clients"
            value={analyticsData.totalClients}
            color="#3b82f6"
          />
          <MetricCard
            icon={Target}
            label="Total Prospects"
            value={analyticsData.totalProspects}
            color="#f59e0b"
            subtext={`${analyticsData.conversionRate.toFixed(1)}% conversion`}
          />
          <MetricCard
            icon={Phone}
            label="Total Calls"
            value={analyticsData.totalCalls}
            color="#8b5cf6"
          />
        </View>

        <Text style={styles.sectionTitle}>Follow-ups</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            icon={Calendar}
            label="Total Follow-ups"
            value={analyticsData.totalFollowUps}
            color="#06b6d4"
          />
          <MetricCard
            icon={Clock}
            label="Pending"
            value={analyticsData.pendingFollowUps}
            color="#f59e0b"
          />
          <MetricCard
            icon={CheckCircle}
            label="Completed"
            value={analyticsData.completedFollowUps}
            color="#10b981"
          />
        </View>

        {chartData && (
          <>
            <SimpleChart
              title="Revenue by Month"
              data={chartData.salesByMonth}
              color="#10b981"
            />

            <SimpleChart
              title="Top Products/Services"
              data={chartData.topProducts}
              color="#3b82f6"
            />

            <SimpleChart
              title="Prospects by Status"
              data={chartData.prospectsByStatus}
              color="#f59e0b"
            />

            <SimpleChart
              title="Calls by Feedback"
              data={chartData.callsByFeedback}
              color="#8b5cf6"
            />
          </>
        )}

        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
          <View style={styles.insightCard}>
            <TrendingUp size={24} color="#10b981" strokeWidth={2} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Conversion Rate</Text>
              <Text style={styles.insightText}>
                {analyticsData.conversionRate.toFixed(1)}% of prospects
                converted to clients
              </Text>
            </View>
          </View>
          <View style={styles.insightCard}>
            <BarChart3 size={24} color="#3b82f6" strokeWidth={2} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Average Sale</Text>
              <Text style={styles.insightText}>
                UGX{" "}
                {Math.round(analyticsData.averageSaleAmount).toLocaleString()}{" "}
                per transaction
              </Text>
            </View>
          </View>
          <View style={styles.insightCard}>
            <Package size={24} color="#f59e0b" strokeWidth={2} />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Top Performer</Text>
              <Text style={styles.insightText}>
                {analyticsData.topProducts[0]?.product || "N/A"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#94a3b8",
  },
  filterContainer: {
    backgroundColor: "#1e293b",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
  },
  filterButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#94a3b8",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 16,
    marginTop: 8,
  },
  metricsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 4,
  },
  metricIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  metricContent: {
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 13,
    color: "#94a3b8",
  },
  metricSubtext: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  chartSection: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 16,
  },
  chartContainer: {
    gap: 12,
  },
  chartBarContainer: {
    gap: 4,
  },
  chartBarLabel: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },
  chartBarTrack: {
    height: 32,
    backgroundColor: "#0f172a",
    borderRadius: 6,
    overflow: "hidden",
  },
  chartBarFill: {
    height: "100%",
    borderRadius: 6,
    justifyContent: "center",
    paddingHorizontal: 12,
    minWidth: 40,
  },
  chartBarValue: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#fff",
  },
  emptyChartText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    paddingVertical: 20,
  },
  insightsSection: {
    marginTop: 8,
  },
  insightCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#e2e8f0",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: "#94a3b8",
  },
});
