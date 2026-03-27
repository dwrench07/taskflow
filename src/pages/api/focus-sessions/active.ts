import type { NextApiRequest, NextApiResponse } from 'next';
import { getActiveFocusSessionAsync, updateFocusSessionAsync, addFocusSessionAsync, finalizeOrphanedSessionsAsync } from '../../../lib/data-service';
import { verifyToken } from '../../../lib/auth';
import type { FocusSession } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const decoded = await verifyToken(token);
        let userId = decoded?.userId;

        // Self-healing fallback if token was generated prior to the bugfix
        if (decoded && !userId && decoded.email) {
            const { getUserByEmailAsync } = await import('../../../lib/data-service');
            const user = await getUserByEmailAsync(decoded.email);
            if (user && user.id && user.id !== '') {
                userId = user.id;
            }
        }

        if (!decoded || !userId) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        switch (req.method) {
            case 'GET':
                // Auto-finalize any orphaned timers that should have ended while the user was away
                await finalizeOrphanedSessionsAsync(userId);
                const session = await getActiveFocusSessionAsync(userId);
                return res.status(200).json(session || null);

            case 'POST':
                const body = req.body;
                const { action, payload } = body;

                // payload might contain: mode, expectedDuration (in minutes), taskId, etc. for 'start'
                // or just the timestamp and event type

                const timestamp = new Date().toISOString();

                if (action === 'start') {
                    // Check if there's already an active session. If so, forcibly complete it 
                    // truncated to this exact start time.
                    const activeSession = await getActiveFocusSessionAsync(userId);
                    if (activeSession) {
                        activeSession.status = 'completed';
                        activeSession.endTime = timestamp;
                        if (!activeSession.events) activeSession.events = [];
                        activeSession.events.push({ type: 'stop', timestamp });

                        // Recalculate duration 
                        const startEvent = activeSession.events.find(e => e.type === 'start');
                        if (startEvent) {
                            const ms = new Date(timestamp).getTime() - new Date(startEvent.timestamp).getTime();
                            activeSession.duration = Math.max(0, Math.floor(ms / 60000));
                        }
                        await updateFocusSessionAsync(activeSession, userId);
                    }

                    // Create a brand new active session
                    const expectedDuration = payload?.expectedDuration || 25; // default 25m
                    const expectedEndTime = new Date(new Date(timestamp).getTime() + expectedDuration * 60000).toISOString();

                    const newSession: Omit<FocusSession, 'id'> = {
                        userId,
                        taskId: payload?.taskId,
                        startTime: timestamp,
                        duration: 0,
                        mode: payload?.mode || 'pomodoro',
                        distractions: [],
                        status: 'active',
                        expectedEndTime,
                        strategy: payload?.strategy,
                        preEmotion: payload?.preEmotion,
                        events: [{ type: 'start', timestamp }]
                    };
                    const created = await addFocusSessionAsync(newSession, userId);
                    return res.status(201).json(created);
                }

                if (action === 'pause' || action === 'resume' || action === 'stop') {
                    const activeSession = await getActiveFocusSessionAsync(userId);
                    if (!activeSession) {
                        return res.status(404).json({ error: 'No active session found' });
                    }

                    if (!activeSession.events) activeSession.events = [];
                    activeSession.events.push({ type: action, timestamp });

                    if (action === 'stop') {
                        activeSession.status = 'completed';
                        activeSession.endTime = timestamp;

                        // Recalculate ultimate duration based on start and stop
                        const startEvent = activeSession.events.find(e => e.type === 'start');
                        if (startEvent) {
                            const ms = new Date(timestamp).getTime() - new Date(startEvent.timestamp).getTime();
                            activeSession.duration = Math.max(0, Math.floor(ms / 60000));
                        }

                        // Append any extra payload data like productivity score
                        if (payload?.productivityScore) activeSession.productivityScore = payload.productivityScore;
                        if (payload?.energyLevel) activeSession.energyLevel = payload.energyLevel;
                        if (payload?.distractions !== undefined) {
                            activeSession.distractions = payload.distractions;
                        }
                        if (payload?.deepWorkScore !== undefined) {
                            activeSession.deepWorkScore = payload.deepWorkScore;
                        }
                        if (payload?.postEmotion) {
                            activeSession.postEmotion = payload.postEmotion;
                        }
                    }

                    await updateFocusSessionAsync(activeSession, userId);
                    return res.status(200).json(activeSession);
                }

                return res.status(400).json({ error: 'Invalid action' });

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error(`[API] Error handling focus-sessions active:`, error.message ?? error);
        return res.status(500).json({ error: `Failed to ${req.method?.toLowerCase()} active focus session` });
    }
}
