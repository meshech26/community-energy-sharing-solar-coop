import client from "./client";

// Goal
export const fetchGoal = () => client.get("/sustainability/goal").then((r) => r.data);
export const createGoal = (targetPercentReduction, suggestedByApp) =>
  client.post("/sustainability/goal", { targetPercentReduction, suggestedByApp }).then((r) => r.data);
export const updateGoal = (fields) =>
  client.put("/sustainability/goal", fields).then((r) => r.data);
export const deleteGoal = () => client.delete("/sustainability/goal").then((r) => r.data);
export const fetchSuggestedTarget = () =>
  client.get("/sustainability/goal/suggestion").then((r) => r.data);
export const toggleLeaderboardOptIn = (leaderboardOptIn) =>
  client.patch("/sustainability/goal/leaderboard-opt-in", { leaderboardOptIn }).then((r) => r.data);

// Progress & CO2
export const logProgress = (month, usageKwh) =>
  client.post("/sustainability/progress", { month, usageKwh }).then((r) => r.data);
export const fetchProgress = () => client.get("/sustainability/progress").then((r) => r.data);
export const fetchComparison = () =>
  client.get("/sustainability/progress/comparison").then((r) => r.data);
export const deleteProgressEntry = (month) =>
  client.delete(`/sustainability/progress/${month}`).then((r) => r.data);
export const fetchWeeklyTip = () => client.get("/sustainability/tip").then((r) => r.data);

// Co-op
export const fetchLeaderboard = () => client.get("/sustainability/coop/leaderboard").then((r) => r.data);