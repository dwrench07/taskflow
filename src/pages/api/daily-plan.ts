import { NextApiRequest, NextApiResponse } from "next";
import { getUsersCollection } from "../../lib/mongodb"; // Correct relative path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { userId } = req.query;

    if (typeof userId !== "string") {
      return res.status(400).json({ error: "Invalid userId" });
    }

    try {
      const usersCollection = await getUsersCollection();
      console.log("Looking for user with userId:", userId); // Log userId for debugging
      const user = await usersCollection.findOne({ userId });

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
    const { userId, dailyTaskIds } = req.body;

    if (!Array.isArray(dailyTaskIds)) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    try {
      const usersCollection = await getUsersCollection();

      if (userId) {
        // Update the user's dailyTaskIds if userId is provided
        const result = await usersCollection.updateOne(
          { userId },
          { $set: { dailyTaskIds } }
        );

        if (result.modifiedCount === 0) {
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
