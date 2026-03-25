"use client";

import { useEffect, useRef } from "react";
import { getAllTasks, getActiveFocusSession } from "@/lib/data";
import { requestNotificationPermission, sendNotification } from "@/lib/notification-service";
import { parseISO, isBefore, addMinutes, isAfter } from "date-fns";
import { useAuth } from "@/context/AuthContext";

export function ReminderManager() {
  const { user, isLoading } = useAuth();
  const notifiedTasksRef = useRef<Set<string>>(new Set());
  const activeSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;

    // Try to request permission right away (might require user interaction in some browsers, but worth a try)
    requestNotificationPermission();

    const checkRemindersAndTimers = async () => {
      try {
        const tasks = await getAllTasks();
        if (Array.isArray(tasks)) {
          const now = new Date();
          const soon = addMinutes(now, 15);

          tasks.forEach(task => {
            if (task.status === "done") return;
            
            if (task.endDate) {
              const dueDate = parseISO(task.endDate);
              // If due within 15 minutes, and haven't notified yet, and hasn't past due significantly
              if (isBefore(dueDate, soon) && isAfter(dueDate, now)) {
                if (!notifiedTasksRef.current.has(task.id)) {
                  sendNotification("Task Due Soon", {
                    body: `"${task.title}" is due in less than 15 minutes.`,
                  });
                  notifiedTasksRef.current.add(task.id);
                }
              }
            }
          });
        }
      } catch (error) {
        console.error("Failed to check task reminders", error);
      }

      try {
        const session = await getActiveFocusSession();
        if (session && session.status === 'active' && session.mode !== 'stopwatch' && session.expectedEndTime) {
          const endTime = parseISO(session.expectedEndTime);
          const now = new Date();

          if (isBefore(endTime, now)) {
            // Timer has ended!
            if (activeSessionRef.current !== session.id) {
               sendNotification("Focus Session Complete!", {
                 body: "Great job focusing! Time to take a break.",
               });
               activeSessionRef.current = session.id;
            }
          } else {
            // Still active, clear the ref in case we start a new one
            activeSessionRef.current = null;
          }
        } else {
             activeSessionRef.current = null;
        }
      } catch (error) {
         console.error("Failed to check active timer", error);
      }
    };

    // Check immediately and then every minute
    checkRemindersAndTimers();
    const interval = setInterval(checkRemindersAndTimers, 60000);

    return () => clearInterval(interval);
  }, [user, isLoading]);

  return null;
}
