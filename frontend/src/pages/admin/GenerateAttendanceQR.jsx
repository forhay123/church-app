import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Link, Download, RefreshCw, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/utils/apiClient"; // Use apiClient instead of axios

// Import UI components from your shared component library
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner"; // Assuming you use a toast library like sonner

export default function GenerateAttendanceQR() {
  const [qrToken, setQrToken] = useState(null);
  const [qrFullLink, setQrFullLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateQR = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/attendance-qr/generate");
      
      const generatedToken = res.data.token;
      setQrToken(generatedToken);

      // --- 🟢 THIS IS THE KEY CHANGE ---
      // Use the 'link' property returned directly from the backend API.
      // This link already contains the correct IP address from your backend/.env file.
      const fullLink = res.data.link;
      setQrFullLink(fullLink);
      // --- 🟢 END OF CHANGE ---

      toast.success("New QR code and link generated successfully.");
      
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.detail || "Error generating QR code";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (qrFullLink) {
      navigator.clipboard.writeText(qrFullLink).then(() => {
        toast.success("Link copied to clipboard!");
      }).catch(err => {
        console.error("Failed to copy link:", err);
        toast.error("Failed to copy link.");
      });
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById("attendance-qr-canvas");
    if (!canvas) {
      toast.error("QR code is not ready for download.");
      return;
    }
    
    try {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `attendance-${format(new Date(), 'yyyyMMdd-HHmmss')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success("QR code downloaded successfully!");
    } catch (err) {
      console.error("Failed to download QR code:", err);
      toast.error("An error occurred during download.");
    }
  };

  return (
    <Card className="max-w-xl mx-auto mt-10 p-6">
      <CardHeader>
        <CardTitle className="text-center">Generate Attendance QR/Link</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={generateQR}
          disabled={loading}
          className="w-full h-10 transition-all duration-300 ease-in-out"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <Link className="h-4 w-4" />
              <span>Generate QR/Link</span>
            </span>
          )}
        </Button>

        {error && <p className="text-sm text-center text-red-500 mt-4">{error}</p>}

        {qrFullLink && (
          <div className="space-y-6 mt-6">
            <div className="flex flex-col items-center">
              <Label htmlFor="qr-link" className="text-sm text-muted-foreground mb-2">
                Attendance Link
              </Label>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  id="qr-link"
                  type="text"
                  value={qrFullLink}
                  readOnly
                  className="text-center"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={copyLink} variant="outline" size="icon">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy Link</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 border rounded-lg bg-white shadow-inner">
                <QRCodeCanvas
                  id="attendance-qr-canvas"
                  value={qrFullLink}
                  size={200}
                />
              </div>
              <Button onClick={downloadQR} variant="outline" className="w-48">
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
