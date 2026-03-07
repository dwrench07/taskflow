import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "../../lib/auth";
import { getDailyPlanAsync, updateDailyPlanAsync } from "../../lib/data-service";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const decoded = await verifyToken(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const userId = decoded.userId;

  if (req.method === "GET") {
    try {
      const date = req.query.date as string | undefined;
      const tasks = await getDailyPlanAsync(date, userId);
      return res.status(200).json({ dailyTaskIds: tasks });
    } catch (error) {
      console.error("Failed to fetch daily plan:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "POST") {
    const { dailyTaskIds, date } = req.body;

    if (!Array.isArray(dailyTaskIds)) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    try {
      await updateDailyPlanAsync(dailyTaskIds, date, userId);
      return res.status(200).json({ message: "Daily plan updated successfully" });
    } catch (error) {
      console.error("Failed to update daily plan:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
