import { useRef, useState, useEffect } from "react";
import SignatureCanvasLib from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eraser, Pen, Upload, X } from "lucide-react";

interface SignatureCanvasProps {
  onSignatureChange: (data: string, type: 'drawn' | 'typed' | 'uploaded') => void;
  value?: string;
  signatureType?: 'drawn' | 'typed' | 'uploaded';
}

export function SignatureCanvas({ onSignatureChange, value, signatureType }: SignatureCanvasProps) {
  const canvasRef = useRef<SignatureCanvasLib>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [typedName, setTypedName] = useState(signatureType === 'typed' ? value : '');
  const [uploadedImage, setUploadedImage] = useState<string>(signatureType === 'uploaded' ? value || '' : '');
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>(
    signatureType === 'typed' ? 'type' : signatureType === 'uploaded' ? 'upload' : 'draw'
  );

  useEffect(() => {
    if (signatureType === 'drawn' && value && canvasRef.current) {
      canvasRef.current.fromDataURL(value);
    }
  }, []);

  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      onSignatureChange('', 'drawn');
    }
  };

  const handleDrawEnd = () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL();
      onSignatureChange(dataURL, 'drawn');
    }
  };

  const handleTypedNameChange = (name: string) => {
    setTypedName(name);
    if (name.trim()) {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.font = '48px "Brush Script MT", cursive, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, canvas.width / 2, canvas.height / 2);
        const dataURL = canvas.toDataURL();
        onSignatureChange(dataURL, 'typed');
      }
    } else {
      onSignatureChange('', 'typed');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target?.result as string;
      setUploadedImage(dataURL);
      onSignatureChange(dataURL, 'uploaded');
    };
    reader.readAsDataURL(file);
  };

  const handleClearUpload = () => {
    setUploadedImage('');
    onSignatureChange('', 'uploaded');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">
        Signature <span className="text-destructive">*</span>
      </Label>
      
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'draw' | 'type' | 'upload')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="draw" data-testid="tab-draw-signature">
            <Pen className="w-4 h-4 mr-2" />
            Draw
          </TabsTrigger>
          <TabsTrigger value="type" data-testid="tab-type-signature">
            Type Name
          </TabsTrigger>
          <TabsTrigger value="upload" data-testid="tab-upload-signature">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="draw" className="space-y-3">
          <div className="border-2 border-muted rounded-lg overflow-hidden bg-white">
            <SignatureCanvasLib
              ref={canvasRef}
              canvasProps={{
                className: 'w-full h-[200px]',
                'data-testid': 'canvas-signature'
              }}
              onEnd={handleDrawEnd}
              backgroundColor="rgb(255, 255, 255)"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            data-testid="button-clear-signature"
          >
            <Eraser className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <p className="text-xs text-muted-foreground">
            Draw your signature above using your mouse or touchscreen
          </p>
        </TabsContent>
        
        <TabsContent value="type" className="space-y-3">
          <Input
            type="text"
            placeholder="Enter your full name"
            value={typedName}
            onChange={(e) => handleTypedNameChange(e.target.value)}
            className="text-3xl font-serif italic text-center h-16"
            data-testid="input-typed-name"
          />
          <p className="text-xs text-muted-foreground text-center">
            Type your full legal name - this will serve as your electronic signature
          </p>
        </TabsContent>

        <TabsContent value="upload" className="space-y-3">
          {!uploadedImage ? (
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center bg-muted/20">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="signature-upload"
                data-testid="input-upload-signature"
              />
              <label
                htmlFor="signature-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Click to upload signature image</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG, or GIF (max 5MB)</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative border-2 border-muted rounded-lg overflow-hidden bg-white p-4">
                <img
                  src={uploadedImage}
                  alt="Uploaded signature"
                  className="max-h-[150px] w-auto mx-auto object-contain"
                  data-testid="img-uploaded-signature"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearUpload}
                data-testid="button-clear-upload"
              >
                <X className="w-4 h-4 mr-2" />
                Remove & Upload Different
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Upload an image of your handwritten signature
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
