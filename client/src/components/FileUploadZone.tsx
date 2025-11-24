import { useState, useCallback } from "react";
import { Upload, X, File, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  label: string;
  description?: string;
  accept?: string;
  maxFiles?: number;
  required?: boolean;
  files: string[];
  onFilesChange: (files: string[]) => void;
  onUpload: (file: File) => Promise<string>;
}

export function FileUploadZone({
  label,
  description,
  accept = "image/*,.pdf",
  maxFiles = 5,
  required = false,
  files,
  onFilesChange,
  onUpload
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  }, [files]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      await processFiles(Array.from(selectedFiles));
    }
    e.target.value = "";
  }, [files]);

  const processFiles = async (newFiles: File[]) => {
    if (files.length >= maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const remainingSlots = maxFiles - files.length;
    const filesToUpload = newFiles.slice(0, remainingSlots);

    setUploading(true);
    try {
      const uploadPromises = filesToUpload.map(file => onUpload(file));
      const uploadedPaths = await Promise.all(uploadPromises);
      onFilesChange([...files, ...uploadedPaths]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const getFileName = (path: string) => {
    return path.split('/').pop() || path;
  };

  const isImage = (path: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {files.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {files.length} / {maxFiles} files
          </span>
        )}
      </div>
      
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isDragging && "border-primary bg-primary/5 scale-105",
          !isDragging && "border-muted-foreground/25 hover:border-muted-foreground/50",
          uploading && "opacity-50 pointer-events-none"
        )}
        data-testid={`upload-zone-${label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Upload className={cn(
          "w-12 h-12 mx-auto mb-4 transition-colors",
          isDragging ? "text-primary" : "text-muted-foreground"
        )} />
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {uploading ? "Uploading..." : "Drag and drop files here"}
          </p>
          <p className="text-xs text-muted-foreground">or</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`file-input-${label}`)?.click()}
            disabled={uploading || files.length >= maxFiles}
            data-testid={`button-browse-${label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            Browse Files
          </Button>
          <input
            id={`file-input-${label}`}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading || files.length >= maxFiles}
          />
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          Maximum {maxFiles} files • {accept.split(',').join(', ')}
        </p>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-muted"
              data-testid={`file-item-${index}`}
            >
              {isImage(file) ? (
                <ImageIcon className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <File className="w-5 h-5 text-primary flex-shrink-0" />
              )}
              <span className="text-sm flex-1 truncate">{getFileName(file)}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="flex-shrink-0 hover-elevate active-elevate-2"
                data-testid={`button-remove-${index}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
