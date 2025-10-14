"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "./ui/badge"

interface TagInputProps {
    tags: string[];
    allTags: string[];
    onUpdateTags: (tags: string[]) => Promise<void>;
    placeholder?: string;
}

export function TagInput({ tags, allTags, onUpdateTags, placeholder }: TagInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleSelect = async (tag: string) => {
    if (!tags.includes(tag)) {
      await onUpdateTags([...tags, tag]);
    }
    setInputValue("")
  };

  const handleCreate = (tag: string) => {
    const newTag = tag.trim();
    if (newTag && !tags.includes(newTag)) {
      onUpdateTags([...tags, newTag]);
    }
    setInputValue("")
    setOpen(false)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateTags(tags.filter(tag => tag !== tagToRemove));
  };

  const filteredTags = allTags.filter(tag => !tags.includes(tag));

  return (
    <div className="w-full">
        <div className="flex flex-wrap gap-1 mb-2">
            {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="rounded-full hover:bg-muted-foreground/20">
                        <XIcon className="h-3 w-3" />
                    </button>
                </Badge>
            ))}
        </div>
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between font-normal text-muted-foreground"
                >
                {placeholder || "Select tags..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput 
                        placeholder="Search or create tag..."
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {inputValue.trim() ? (
                                <CommandItem
                                    onSelect={() => handleCreate(inputValue)}
                                    className="flex items-center gap-2"
                                    >
                                    <PlusCircle className="h-4 w-4" />
                                    Create "{inputValue}"
                                </CommandItem>
                            ) : (
                                "No tags found."
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                        {filteredTags.map((tag) => (
                            <CommandItem
                                key={tag}
                                value={tag}
                                onSelect={async (currentValue) => {
                                    await handleSelect(currentValue)
                                    setOpen(false)
                                }}
                            >
                            <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                tags.includes(tag) ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {tag}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    </div>
  )
}
