"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Clock, AlertTriangle, Flame, Smartphone, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  isNativeApp,
  getNotificationPreferences,
  saveNotificationPreferences,
  requestNotificationPermission,
  checkNotificationPermission,
  type NotificationPreferences,
} from "@/lib/notifications";

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(getNotificationPreferences());
  const [isNative, setIsNative] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    setIsNative(isNativeApp());
    if (isNativeApp()) {
      checkNotificationPermission().then(setHasPermission);
    }
  }, []);

  const updatePref = <K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    saveNotificationPreferences(updated);
  };

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    if (granted) {
      updatePref('enabled', true);
    }
  };

  // Unsupported on web — show info card
  if (!isNative) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Notifications
            <Badge variant="secondary" className="ml-auto text-[10px]">Android App Only</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-xl">
            <Smartphone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Notifications require the Dash Android app. Install the APK to get deadline reminders, overdue alerts, and habit nudges — even when the app is closed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Notifications
          {prefs.enabled && hasPermission ? (
            <Badge className="ml-auto text-[10px] bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
          ) : (
            <Badge variant="secondary" className="ml-auto text-[10px]">Disabled</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasPermission ? (
          <Button onClick={handleEnable} className="w-full" variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
        ) : (
          <>
            {/* Master toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {prefs.enabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm font-medium">All Notifications</span>
              </div>
              <Switch checked={prefs.enabled} onCheckedChange={v => updatePref('enabled', v)} />
            </div>

            {prefs.enabled && (
              <div className="space-y-3 pt-2 border-t border-border/30">
                {/* Test notification button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-[10px] uppercase tracking-wider font-bold h-8 border border-dashed border-border/50 hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={async () => {
                    if (isNative) {
                      const { LocalNotifications } = await import('@capacitor/local-notifications');
                      await LocalNotifications.schedule({
                        notifications: [{
                          id: 9999,
                          title: "🚀 Test Notification",
                          body: "Great! Your native Dash notifications are working perfectly.",
                          schedule: { at: new Date(Date.now() + 5000) }, // 5 seconds from now
                          sound: 'default',
                          smallIcon: 'ic_stat_icon',
                        }]
                      });
                      alert("Test scheduled! Close the app or lock your screen and wait 5 seconds.");
                    }
                  }}
                >
                  <Zap className="h-3 w-3 mr-1.5" />
                  Send Test Notification (5s)
                </Button>

                {/* Deadline reminders */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                    <span className="text-xs">Deadline Reminders</span>
                  </div>
                  <Switch checked={prefs.deadlineReminders} onCheckedChange={v => updatePref('deadlineReminders', v)} />
                </div>

                {/* Overdue alerts */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                    <span className="text-xs">Overdue Alerts</span>
                  </div>
                  <Switch checked={prefs.overdueAlerts} onCheckedChange={v => updatePref('overdueAlerts', v)} />
                </div>

                {/* Habit nudges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-xs">Habit Nudges</span>
                  </div>
                  <Switch checked={prefs.habitNudges} onCheckedChange={v => updatePref('habitNudges', v)} />
                </div>

                {/* Time pickers */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/20">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Morning Brief</label>
                    <select
                      className="w-full text-xs bg-muted/20 border border-border/30 rounded-lg px-2 py-1.5"
                      value={prefs.morningBriefingHour}
                      onChange={e => updatePref('morningBriefingHour', Number(e.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 5).map(h => (
                        <option key={h} value={h}>{h}:00 {h < 12 ? 'AM' : 'PM'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Habit Nudge</label>
                    <select
                      className="w-full text-xs bg-muted/20 border border-border/30 rounded-lg px-2 py-1.5"
                      value={prefs.habitNudgeHour}
                      onChange={e => updatePref('habitNudgeHour', Number(e.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 12).map(h => (
                        <option key={h} value={h}>{h > 12 ? h - 12 : 12}:00 PM</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
