import axiosClient from "@/utils/axios";

export async function getStreak() {
  const res = await axiosClient.get("/streaks");
  return res.data?.streak ?? 0;
}

export async function incrementStreak() {}

export async function getStudyHours(date) {
  const res = await axiosClient.get("/analytics/calendar", { params: { date } });
  return res.data;
}

export async function getDailyAnalytics() {
  const res = await axiosClient.get("/analytics/daily");
  return res.data;
}
