import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { UserProgress } from '@/lib/types';
import { getUserProgressAsync, upsertUserProgressAsync } from '@/lib/data-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = await verifyToken(token);
    let userId = decoded?.userId;
    
    // Self-healing fallback if token was generated prior to the bugfix
    if (decoded && !userId && decoded.email) {
        const { getUserByEmailAsync } = await import('@/lib/data-service');
        const user = await getUserByEmailAsync(decoded.email);
        if (user && user.id && user.id !== '') userId = user.id;
    }

    if (!decoded || !userId) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    switch (req.method) {
      case 'GET':
        let progress = await getUserProgressAsync(userId);
        
        if (!progress) {
          progress = {
            userId,
            xp: 0,
            level: 1,
            inventory: { streakShields: 0, predictionCrystals: 0, freshStartTokens: 0, composureCoins: 0, anchorWeights: 0, stretchTokens: 0, timeBenderHourglasses: 0, dawnDiamonds: 0, goldenBookmarks: 0, embersOfContinuity: 0 },
            activeBuffs: [],
            lastActiveDate: new Date().toISOString(),
            seasonStartDate: new Date().toISOString(),
            unlockedRelics: [],
            legacyBadges: [],
            bonsai: { level: 1, experience: 0 },
          };
          await upsertUserProgressAsync(progress);
        } else {
          // Hydrate older progress objects with new phase 5 fields
          let needsUpdate = false;
          if (!progress.seasonStartDate) { progress.seasonStartDate = new Date().toISOString(); needsUpdate = true; }
          if (!progress.unlockedRelics) { progress.unlockedRelics = []; needsUpdate = true; }
          if (!progress.legacyBadges) { progress.legacyBadges = []; needsUpdate = true; }
          if (!progress.bonsai) {
            progress.bonsai = { level: 1, experience: 0 };
            needsUpdate = true;
          }

          // Update lastActiveDate to today on every visit — frozen should only
          // trigger when the user hasn't opened the app in 3+ days, not just
          // because they haven't completed a task/focus session.
          const todayStr = new Date().toISOString().split('T')[0];
          const lastActiveDayStr = progress.lastActiveDate?.split('T')[0];
          if (lastActiveDayStr !== todayStr) {
            progress.lastActiveDate = new Date().toISOString();
            needsUpdate = true;
          }

          if (needsUpdate) {
            await upsertUserProgressAsync(progress);
          }
        }
        return res.status(200).json(progress);

      case 'PUT':
        const updatedProgress = req.body as UserProgress;
        if (updatedProgress.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const result = await upsertUserProgressAsync(updatedProgress);
        return res.status(200).json(result);

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('UserProgress API Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
