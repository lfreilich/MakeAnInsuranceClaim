import { useRef, useState, useEffect } from "react";
import SignatureCanvasLib from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eraser, Pen } from "lucide-react";

interface SignatureCanvasProps {
  onSignatureChange: (data: string, type: 'drawn' | 'typed') => void;
  value?: string;
  signatureType?: 'drawn' | 'typed';
}

export function SignatureCanvas({ onSignatureChange, value, signatureType }: SignatureCanvasProps) {
  const canvasRef = useRef<SignatureCanvasLib>(null);
  const [typedName, setTypedName] = useState(signatureType === 'typed' ? value : '');
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>(signatureType === 'typed' ? 'type' : 'draw');

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
      // Create a simple text signature
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

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">
        Signature <span className="text-destructive">*</span>
      </Label>
      
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'draw' | 'type')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw" data-testid="tab-draw-signature">
            <Pen className="w-4 h-4 mr-2" />
            Draw
          </TabsTrigger>
          <TabsTrigger value="type" data-testid="tab-type-signature">
            Type Name
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
      </Tabs>
    </div>
  );
}
