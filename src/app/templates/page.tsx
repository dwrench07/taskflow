
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  getAllTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  getAllTasks,
} from "@/lib/data";
import { type TaskTemplate, type Priority, type Task } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ClipboardList, FileText, PlusCircle, Edit, Trash2, ListTodo, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TemplateForm } from "@/components/template-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";

const priorityStyles: Record<Priority, string> = {
  high: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30",
};

function TemplateListItem({ template, onSelect, isSelected }: { template: TaskTemplate; onSelect: () => void; isSelected: boolean }) {
  return (
    <button onClick={onSelect} className={cn(
        "block w-full text-left p-3 rounded-lg border-2 transition-colors",
        isSelected ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'
    )}>
      <div className="flex justify-between items-start">
        <p className="font-semibold">{template.title}</p>
        <Badge variant="outline" className={cn("capitalize", priorityStyles[template.priority])}>
          {template.priority}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mt-1 truncate">{template.description}</p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
        <ListTodo className="w-3 h-3"/>
        <span>{template.subtasks.length} subtasks</span>
      </div>
    </button>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const refreshData = () => {
    setLoading(true);
    const templatesData = getAllTemplates();
    const tasksData = getAllTasks();
    setTemplates(templatesData);
    setAllTasks(tasksData);
    
    if(selectedTemplate) {
        const refreshedSelected = templatesData.find(t => t.id === selectedTemplate.id);
        setSelectedTemplate(refreshedSelected || null);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    const templatesData = getAllTemplates();
    setTemplates(templatesData);
    setAllTasks(getAllTasks());
    if (!isMobile && templatesData.length > 0) {
      setSelectedTemplate(templatesData[0]);
    }
    setLoading(false);
  }, [isMobile]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    const processTags = (tags: string[] | undefined) => tags?.forEach(tag => tagSet.add(tag));
    
    allTasks.forEach(task => {
        processTags(task.tags);
        task.subtasks?.forEach(subtask => processTags(subtask.tags));
    });
    templates.forEach(template => {
        processTags(template.tags);
        template.subtasks?.forEach(subtask => processTags(subtask.tags));
    });

    return Array.from(tagSet).sort();
  }, [templates, allTasks]);

  const handleAddTemplate = (newTemplateData: Omit<TaskTemplate, 'id'>) => {
    const addedTemplate = addTemplate(newTemplateData);
    refreshData();
    setSelectedTemplate(addedTemplate);
    toast({ title: "Template created!", description: "Your new task template has been saved."});
  };

  const handleUpdateTemplate = (updatedTemplate: TaskTemplate) => {
    updateTemplate(updatedTemplate);
    refreshData();
    toast({ title: "Template updated!", description: "Your changes have been saved."});
  };

  const handleDeleteTemplate = (templateId: string) => {
    deleteTemplate(templateId);
    setSelectedTemplate(null);
    refreshData();
    toast({ title: "Template deleted!", variant: "destructive" });
  };
  
  const handleSelectTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
  };
  
  const showTemplateList = !isMobile || (isMobile && !selectedTemplate);
  const showTemplateDetails = !isMobile || (isMobile && selectedTemplate);

  return (
    <div className="h-full">
       <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Task Templates</h1>
                <p className="text-muted-foreground">Create and manage reusable task structures.</p>
            </div>
             {selectedTemplate && isMobile && (
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Back
                </Button>
            )}
        </div>
      <div className={cn(
          "grid gap-6 h-[calc(100vh-theme(spacing.36))]",
          selectedTemplate ? "md:grid-cols-4" : "grid-cols-1"
      )}>
        {showTemplateList && (
            <Card className={cn(
              "h-full flex flex-col",
              selectedTemplate ? "md:col-span-1" : "col-span-1"
            )}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>All Templates</CardTitle>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button size="icon" variant="outline">
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Template</DialogTitle>
                            </DialogHeader>
                            <TemplateForm 
                                allTags={allTags}
                                onSubmit={(data) => {
                                    handleAddTemplate(data);
                                    setIsFormOpen(false);
                                }}
                            />
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <CardContent className="space-y-3">
                        {loading ? (
                            <div className="flex justify-center items-center h-full pt-10">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : templates.length > 0 ? (
                            templates.map(template => (
                                <TemplateListItem 
                                    key={template.id} 
                                    template={template}
                                    isSelected={selectedTemplate?.id === template.id}
                                    onSelect={() => handleSelectTemplate(template)} 
                                />
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground pt-10">
                                <ClipboardList className="w-12 h-12 mx-auto mb-2"/>
                                <p>No templates yet. Create one to get started!</p>
                            </div>
                        )}
                    </CardContent>
                </ScrollArea>
            </Card>
        )}
        
        {showTemplateDetails && selectedTemplate ? (
            <div className="md:col-span-3 h-full">
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                               <div className="flex justify-between items-start">
                                    <div>
                                        <Badge variant="outline" className={cn("capitalize w-fit", priorityStyles[selectedTemplate.priority])}>
                                            {selectedTemplate.priority}
                                        </Badge>
                                        <CardTitle className="text-2xl pt-2">{selectedTemplate.title}</CardTitle>
                                        <CardDescription className="pt-1 whitespace-pre-wrap">{selectedTemplate.description}</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="icon">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Edit Template</DialogTitle>
                                                </DialogHeader>
                                                <TemplateForm 
                                                    template={selectedTemplate}
                                                    allTags={allTags}
                                                    onSubmit={(data) => handleUpdateTemplate({ ...selectedTemplate, ...data })}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the template.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleDeleteTemplate(selectedTemplate.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                                    <>
                                        <Separator className="my-2" />
                                        <div className="py-4">
                                            <h4 className="font-semibold mb-2">Tags</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTemplate.tags.map(tag => (
                                                    <Badge key={tag} variant="secondary">{tag}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                                <Separator className="my-2" />
                                <div className="py-4">
                                    <h4 className="font-semibold my-3">Subtasks</h4>
                                    <div className="space-y-3">
                                        {selectedTemplate.subtasks.map(subtask => (
                                            <div key={subtask.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                                                <ListTodo className="h-4 w-4 mt-1" />
                                                <div className="flex-1">
                                                    <p className="font-medium">{subtask.title}</p>
                                                     {subtask.tags && subtask.tags.length > 0 && (
                                                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                            {subtask.tags.map(tag => (
                                                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {selectedTemplate.subtasks.length === 0 && (
                                            <p className="text-sm text-muted-foreground">No subtasks in this template.</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            </div>
        ) : showTemplateList && !isMobile ? (
                 <div className="md:col-span-3 h-full items-center justify-center flex">
                    <div className="text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-2"/>
                        <p>Select a template to see its details or create a new one.</p>
                    </div>
                </div>
        ) : null}
      </div>
    </div>
  );
}
