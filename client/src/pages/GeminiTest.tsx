import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const GeminiTest = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const testConnection = async () => {
    try {
      setTestingConnection(true);
      const result = await api.get('/ai/test');
      setConnected(result.connected);
      toast({
        title: "Connection successful",
        description: result.message || "Gemini AI is ready",
      });
    } catch (error: any) {
      setConnected(false);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to Gemini AI",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type - Excel and PDF files
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'application/pdf', // .pdf
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel (.xlsx, .xls) or PDF file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      toast({
        title: "File selected",
        description: `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`,
      });
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitText = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setResponse("");
      
      const result = await api.post('/ai/generate-text', { prompt });
      console.log('API Response:', result); // Debug log
      
      // Check if response contains an error
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Handle both direct response and wrapped response
      const responseText = result.response || result;
      
      // Make sure we're setting a string, not an object
      if (typeof responseText === 'string') {
        setResponse(responseText);
      } else {
        setResponse(JSON.stringify(responseText, null, 2));
      }
      
      toast({
        title: "Success",
        description: "Response generated successfully",
      });
    } catch (error: any) {
      console.error('Error:', error); // Debug log
      toast({
        title: "Error",
        description: error.message || "Failed to generate response",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWithPDF = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    if (!file) {
      toast({
        title: "Error",
        description: "Please upload an Excel or PDF file",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      setResponse("");
      
      // Convert file to base64
      const base64Data = await convertToBase64(file);
      
      console.log('File MIME type:', file.type); // Debug log
      console.log('File name:', file.name); // Debug log
      
      const result = await api.post('/ai/generate-with-pdf', {
        prompt,
        fileData: base64Data,
        mimeType: file.type,
      });
      
      console.log('API Response with file:', result); // Debug log
      
      // Check if response contains an error
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Handle both direct response and wrapped response
      const responseText = result.response || result;
      
      // Make sure we're setting a string, not an object
      if (typeof responseText === 'string') {
        setResponse(responseText);
      } else {
        setResponse(JSON.stringify(responseText, null, 2));
      }
      
      toast({
        title: "Success",
        description: "Response generated with PDF successfully",
      });
    } catch (error: any) {
      console.error('Error:', error); // Debug log
      toast({
        title: "Error",
        description: error.message || "Failed to generate response with file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setPrompt("");
    setResponse("");
    setFile(null);
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gemini AI Test</h1>
          <p className="text-muted-foreground">
            Test Google Gemini 2.0 Flash with text prompts and Excel/PDF files
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            💡 <strong>Tip:</strong> Include a "Project Name" column in your Excel file to automatically fetch tracked project metrics
          </p>
        </div>
        <Button 
          onClick={testConnection} 
          disabled={testingConnection}
          variant="outline"
          className="gap-2"
        >
          {testingConnection ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : connected === true ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              Connected
            </>
          ) : connected === false ? (
            <>
              <XCircle className="h-4 w-4 text-red-500" />
              Not Connected
            </>
          ) : (
            "Test Connection"
          )}
        </Button>
      </div>

      {connected === false && (
        <Alert variant="destructive">
          <AlertDescription>
            Gemini AI is not configured. Please set GEMINI_API_KEY in your server environment variables.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Input</h2>
          
          <div className="space-y-4">
            {/* Prompt Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Prompt</label>
              <Textarea
                placeholder="Enter your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Excel/PDF File (Optional)</label>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="file-upload"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">
                    {file ? file.name : "Click to upload Excel or PDF file"}
                  </span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {file && (
                <div className="mt-2">
                  <Badge variant="secondary">
                    {(file.size / 1024).toFixed(2)} KB
                  </Badge>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmitText}
                disabled={loading || !prompt.trim()}
                className="flex-1 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Text Only
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleSubmitWithPDF}
                disabled={loading || !prompt.trim() || !file}
                variant="secondary"
                className="flex-1 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send with File
                  </>
                )}
              </Button>
            </div>

            <Button
              onClick={clearAll}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Clear All
            </Button>
          </div>
        </Card>

        {/* Output Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Response</h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Generating response...</p>
              </div>
            </div>
          ) : response ? (
            <div className="prose prose-sm max-w-none">
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                {response}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Response will appear here...</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default GeminiTest;
