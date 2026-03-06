import { NextApiRequest, NextApiResponse } from "next";
import { getUsersCollection } from "../../lib/mongodb"; // Correct relative path
import { verifyToken } from "../../lib/auth";

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
      const usersCollection = await getUsersCollection();
      const user = await usersCollection.findOne({ _id: userId } as any) || await usersCollection.findOne({ login_id: userId } as any);

      if (!user) {
        console.warn("User not found for userId:", userId); // Warn if user is not found
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({ dailyTaskIds: user.dailyTaskIds || [] });
    } catch (error) {
      console.error("Failed to fetch daily plan:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "POST") {
    const { dailyTaskIds } = req.body;

    if (!Array.isArray(dailyTaskIds)) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    try {
      const usersCollection = await getUsersCollection();

      if (userId) {
        // Update the user's dailyTaskIds using either the new string _id or legacy login_id
        const result = await usersCollection.updateOne(
          { $or: [{ _id: userId }, { login_id: userId }] } as any,
          { $set: { dailyTaskIds } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "User not found" });
        }
      }

      // If userId is not provided, simply return success without updating the database
      return res.status(200).json({ message: "Daily plan updated successfully" });
    } catch (error) {
      console.error("Failed to update daily plan:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    // Return a 405 Method Not Allowed error for unsupported methods
    return res.status(405).json({ error: "Method not allowed" });
  }
}
