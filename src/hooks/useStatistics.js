import { useEffect, useState } from "react";
import { account, databases } from "@/app/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = "pomodoro_sessions_db";
const DAILY_LOGS_COLLECTION_ID = "daily_logs";

export function useStatistics(timeRange) {
  const [user, setUser] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    totalPomodoros: 0,
  });

  useEffect(() => {
    async function init() {
      try {
        const userData = await account.get();
        setUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (user?.$id) {
      loadData();
    }
  }, [user, timeRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate;
      let dateFormat;

      if (timeRange === "week") {
        const sunday = new Date(now);
        sunday.setDate(now.getDate() - now.getDay());
        sunday.setHours(0, 0, 0, 0);
        startDate = sunday;
        dateFormat = (d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
      } else if (timeRange === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFormat = (d) => d.getDate().toString();
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
        dateFormat = (d) =>
          ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
            d.getMonth()
          ];
      }

      const logs = await databases.listDocuments(DATABASE_ID, DAILY_LOGS_COLLECTION_ID, [
        Query.equal("userId", user.$id),
        Query.greaterThanEqual("date", startDate.toLocaleString().split("T")[0]),
        Query.orderAsc("date"),
        Query.limit(100),
      ]);

      const data = processData(logs.documents, startDate, dateFormat, now);
      setChartData(data);

      const total = data.reduce((sum, d) => sum + d.minutes, 0);
      const totalPomodoros = data.reduce((sum, d) => sum + d.pomodoros, 0);
      setStats({ total, totalPomodoros });
    } catch (error) {
      console.error("Error loading data:", error);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const processData = (logs, startDate, dateFormat, now) => {
    const dataMap = new Map();

    logs.forEach((log) => {
      dataMap.set(log.date, {
        pomodoros: log.pomodorosCompleted || 0,
        minutes: log.totalFocusTime || 0,
      });
    });

    const data = [];
    const todayStr = now.toLocaleString().split("T")[0];

    if (timeRange === "week") {
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toLocaleString().split("T")[0];
        const logData = dataMap.get(dateStr) || { pomodoros: 0, minutes: 0 };

        data.push({
          name: dateFormat(date),
          date: dateStr,
          pomodoros: logData.pomodoros,
          minutes: logData.minutes,
          isToday: dateStr === todayStr,
        });
      }
    } else if (timeRange === "month") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), i);
        const dateStr = date.toLocaleString().split("T")[0];
        const logData = dataMap.get(dateStr) || { pomodoros: 0, minutes: 0 };

        data.push({
          name: dateFormat(date),
          date: dateStr,
          pomodoros: logData.pomodoros,
          minutes: logData.minutes,
          isToday: dateStr === todayStr,
        });
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), i, 1);
        const monthStart = date.toLocaleString().split("T")[0];
        const monthEnd = new Date(now.getFullYear(), i + 1, 0).toLocaleString().split("T")[0];

        const monthLogs = logs.filter((log) => log.date >= monthStart && log.date <= monthEnd);
        const totalMinutes = monthLogs.reduce((sum, log) => sum + (log.totalFocusTime || 0), 0);
        const totalPomodoros = monthLogs.reduce(
          (sum, log) => sum + (log.pomodorosCompleted || 0),
          0
        );

        data.push({
          name: dateFormat(date),
          date: monthStart,
          pomodoros: totalPomodoros,
          minutes: totalMinutes,
          isToday: i === now.getMonth(),
        });
      }
    }

    return data;
  };

  return { chartData, loading, stats };
}
