import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { type TaskTemplate } from "@/lib/types";
import { add, format, parseISO } from "date-fns";

interface InstantiateTemplateDialogProps {
    template: TaskTemplate;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onInstantiate: (dates: string[]) => void;
}

export function InstantiateTemplateDialog({ template, isOpen, onOpenChange, onInstantiate }: InstantiateTemplateDialogProps) {
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [occurrences, setOccurrences] = useState("1");
    const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");

    const handleGenerate = () => {
        const num = parseInt(occurrences, 10);
        if (!num || num < 1 || num > 30) return; // limit to 30

        const dates: string[] = [];
        let currentDate = parseISO(startDate);

        for (let i = 0; i < num; i++) {
            dates.push(currentDate.toISOString());
            if (frequency === "daily") {
                currentDate = add(currentDate, { days: 1 });
            } else if (frequency === "weekly") {
                currentDate = add(currentDate, { weeks: 1 });
            } else if (frequency === "monthly") {
                currentDate = add(currentDate, { months: 1 });
            }
        }

        onInstantiate(dates);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Instantiate "{template.title}"</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Occurrences (Max 30)</Label>
                            <Input type="number" min="1" max="30" value={occurrences} onChange={(e) => setOccurrences(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Frequency</Label>
                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value as any)}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground pt-4">This will generate {occurrences} task(s) based on this template, scheduled {frequency} starting on {startDate}.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleGenerate}>Generate Tasks</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
