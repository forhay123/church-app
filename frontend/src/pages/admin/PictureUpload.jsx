import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, Upload, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
// Corrected imports to match the new API function names
import { getRoles, uploadPortalItem } from "@/utils/api";

// Multi-Select Component for Roles
const RoleMultiSelect = ({ selectedRoles, onRoleChange, availableRoles }) => {
  const [open, setOpen] = useState(false);

  const handleToggleRole = (roleName) => {
    const isSelected = selectedRoles.includes(roleName);
    if (isSelected) {
      onRoleChange(selectedRoles.filter((r) => r !== roleName));
    } else {
      onRoleChange([...selectedRoles, roleName]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[2.75rem] h-auto py-2"
        >
          {selectedRoles.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedRoles.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {role}
                </Badge>
              ))}
            </div>
          ) : (
            "Select portals..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search roles..." />
          <CommandEmpty>No roles found.</CommandEmpty>
          <CommandGroup>
            {availableRoles.map((role) => (
              <CommandItem
                key={role.name}
                onSelect={() => {
                  handleToggleRole(role.name);
                }}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Checkbox
                  checked={selectedRoles.includes(role.name)}
                  onCheckedChange={() => handleToggleRole(role.name)}
                />
                <span>{role.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default function PictureUpload() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const fetchRolesData = async () => {
      try {
        // Changed `fetchRoles` to `getRoles`
        const roles = await getRoles();
        const formattedRoles = roles.map(role => ({ name: role }));
        setAllRoles(formattedRoles);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        toast({
          title: "Error",
          description: "Failed to load roles. Please try again.",
          variant: "destructive",
        });
      }
    };
    fetchRolesData();
  }, [toast]);

  const handleFileChange = (file) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!imageFile || selectedRoles.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select an image and at least one portal.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("roles", JSON.stringify(selectedRoles));

      // Changed `uploadPicture` to `uploadPortalItem`
      await uploadPortalItem(formData);

      toast({
        title: "Success",
        description: "Picture uploaded successfully!",
      });

      // Reset form
      setImageFile(null);
      setImagePreview(null);
      setSelectedRoles([]);
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: error.response?.data?.detail || "Picture upload failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="container-responsive py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Upload Picture to Portals</h1>
          <p className="text-muted-foreground">Share images with specific user groups in your organization</p>
        </div>

        <Card className="dashboard-card border-0 shadow-[var(--shadow-medium)]">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-primary" />
              Picture Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-8">
              {/* File Upload Area */}
              <div className="space-y-2">
                <Label htmlFor="picture" className="text-base font-semibold">Select Picture</Label>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Drop your image here, or click to browse</p>
                    <p className="text-sm text-muted-foreground">
                      Supports: JPG, PNG, GIF • Max size: 5MB
                    </p>
                  </div>
                  <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => document.getElementById('picture').click()}
                  >
                    Choose File
                  </Button>
                </div>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Image Preview</Label>
                    <Button type="button" variant="outline" size="sm" onClick={clearImage}>
                      Remove
                    </Button>
                  </div>
                  <div className="dashboard-card p-4">
                    <div className="w-full h-64 sm:h-80 overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      <p><strong>File:</strong> {imageFile?.name}</p>
                      <p><strong>Size:</strong> {(imageFile?.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Roles Selection */}
              <div className="space-y-4">
                <Label htmlFor="roles" className="text-base font-semibold">
                  Select Portals to Display In
                </Label>
                <RoleMultiSelect
                  selectedRoles={selectedRoles}
                  onRoleChange={setSelectedRoles}
                  availableRoles={allRoles}
                />
                {selectedRoles.length > 0 && (
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Selected portals ({selectedRoles.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold" 
                disabled={isLoading || !imageFile || selectedRoles.length === 0}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Picture
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
