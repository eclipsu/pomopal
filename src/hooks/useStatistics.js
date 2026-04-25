import { useState, useEffect, useCallback } from "react";
import axiosClient from "@/utils/axios";

export function useStatistics(timeRange) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, totalPomodoros: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let from, to, dateFormat;

      if (timeRange === "week") {
        const sunday = new Date(now);
        sunday.setDate(now.getDate() - now.getDay());
        sunday.setHours(0, 0, 0, 0);
        from = sunday.toISOString().split("T")[0];
        to = now.toISOString().split("T")[0];
        dateFormat = (d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
      } else if (timeRange === "month") {
        from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        to = now.toISOString().split("T")[0];
        dateFormat = (d) => d.getDate().toString();
      } else {
        from = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
        to = now.toISOString().split("T")[0];
        dateFormat = (d) =>
          ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
            d.getMonth()
          ];
      }

      const res = await axiosClient.get("/analytics/calendar", { params: { from, to } });
      const logs = res.data ?? [];

      const dataMap = new Map();
      logs.forEach((log) => {
        dataMap.set(log.date, {
          pomodoros: log.session_count || 0,
          minutes: log.total_focus_minutes || 0,
        });
      });

      const data = [];
      const todayStr = now.toISOString().split("T")[0];
      const start = new Date(from);

      if (timeRange === "week") {
        for (let i = 0; i < 7; i++) {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];
          const logData = dataMap.get(dateStr) || { pomodoros: 0, minutes: 0 };
          data.push({
            name: dateFormat(date),
            date: dateStr,
            ...logData,
            isToday: dateStr === todayStr,
          });
        }
      } else if (timeRange === "month") {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          const date = new Date(now.getFullYear(), now.getMonth(), i);
          const dateStr = date.toISOString().split("T")[0];
          const logData = dataMap.get(dateStr) || { pomodoros: 0, minutes: 0 };
          data.push({
            name: dateFormat(date),
            date: dateStr,
            ...logData,
            isToday: dateStr === todayStr,
          });
        }
      } else {
        for (let i = 0; i < 12; i++) {
          const date = new Date(now.getFullYear(), i, 1);
          const monthStart = date.toISOString().split("T")[0];
          const monthEnd = new Date(now.getFullYear(), i + 1, 0).toISOString().split("T")[0];
          const monthLogs = logs.filter((l) => l.date >= monthStart && l.date <= monthEnd);
          data.push({
            name: dateFormat(date),
            date: monthStart,
            pomodoros: monthLogs.reduce((s, l) => s + (l.session_count || 0), 0),
            minutes: monthLogs.reduce((s, l) => s + (l.total_focus_minutes || 0), 0),
            isToday: i === now.getMonth(),
          });
        }
      }

      setChartData(data);
      setStats({
        total: data.reduce((sum, d) => sum + d.minutes, 0),
        totalPomodoros: data.reduce((sum, d) => sum + d.pomodoros, 0),
      });
    } catch (error) {
      console.error("Error loading statistics:", error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const processData = (logs, startDate, dateFormat, now) => {
    const dataMap = new Map();
    logs.forEach((log) => {
      dataMap.set(log.date, {
        pomodoros: log.session_count || 0,
        minutes: log.total_focus_minutes || 0,
      });
    });

    const data = [];
    const todayStr = now.toISOString().split("T")[0];

    if (timeRange === "week") {
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        const logData = dataMap.get(dateStr) || { pomodoros: 0, minutes: 0 };
        data.push({
          name: dateFormat(date),
          date: dateStr,
          ...logData,
          isToday: dateStr === todayStr,
        });
      }
    } else if (timeRange === "month") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), i);
        const dateStr = date.toISOString().split("T")[0];
        const logData = dataMap.get(dateStr) || { pomodoros: 0, minutes: 0 };
        data.push({
          name: dateFormat(date),
          date: dateStr,
          ...logData,
          isToday: dateStr === todayStr,
        });
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), i, 1);
        const monthStart = date.toISOString().split("T")[0];
        const monthEnd = new Date(now.getFullYear(), i + 1, 0).toISOString().split("T")[0];
        const monthLogs = logs.filter((l) => l.date >= monthStart && l.date <= monthEnd);
        data.push({
          name: dateFormat(date),
          date: monthStart,
          pomodoros: monthLogs.reduce((s, l) => s + (l.pomodorosCompleted || 0), 0),
          minutes: monthLogs.reduce((s, l) => s + (l.totalFocusTime || 0), 0),
          isToday: i === now.getMonth(),
        });
      }
    }

    return data;
  };

  return { chartData, loading, stats };
}
