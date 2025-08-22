import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Upload, FileText, CheckCircle, Clock, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import api from "../utils/api.js"

// Define a type for our upload objects
interface UploadItem {
  id: number;
  name: string;
  status: 'processing' | 'processed' | 'failed';
  date: string;
  amount: string;
  fileObject: File; // Store the original file
  errorMessage?: string; // Optional error message
}

// Define a type for the extracted OCR data
interface ExtractedData {
  items: { item_name: string; quantity: number; price: string }[];
  store_name: string;
  purchase_date: string;
  total_amount: string;
}


const UploadPage = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // --- Start of API Integration ---

  // Manage the list of uploads with state
  const [recentUploads, setRecentUploads] = useState<UploadItem[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // State to hold the data extracted from the latest successful upload
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  // The main function to handle the entire upload and processing flow
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setError('');
    setSuccess('');
    setExtractedData(null); // Clear previous data on new upload

    // 1. Immediately update the UI with the new file in "processing" state
    const newUpload: UploadItem = {
      id: Date.now(), // Use timestamp for a unique key
      name: file.name,
      status: 'processing',
      date: new Date().toISOString().split('T')[0],
      amount: '...',
      fileObject: file,
    };
    setRecentUploads(prev => [newUpload, ...prev]);

    // --- Step 1: Process Receipt via OCR API ---
    const formData = new FormData();
    formData.append('image', file);
    let ocrResult;

    try {
      const response = await api.post('/api/ocr/process/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      ocrResult = response.data;
      // If data is successfully extracted, store it in state to display in the table
      if (ocrResult?.structured_data) {
        setExtractedData(ocrResult.structured_data);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error processing receipt';
      setError(`Upload Failed: ${errorMessage}`);
      // Update the specific upload item's status to 'failed'
      setRecentUploads(prev => prev.map(item => 
        item.id === newUpload.id ? { ...item, status: 'failed', errorMessage } : item
      ));
      return; // Stop the process
    }
    
    // --- Step 2: Automatically Save Processed Items ---
    if (!ocrResult?.structured_data?.items) {
      const errorMessage = 'No items were found on the receipt to save.';
      setError(errorMessage);
      setRecentUploads(prev => prev.map(item => 
        item.id === newUpload.id ? { ...item, status: 'failed', errorMessage } : item
      ));
      return;
    }

    try {
      const { items, store_name, purchase_date, total_amount } = ocrResult.structured_data;
      const receiptItemsPromises = items.map((item: any) => 
        axios.post('/api/receipts/', {
          receipt_id: `${store_name}_${Date.now()}`,
          item_name: item.item_name,
          quantity: item.quantity,
          price: item.price,
          category: 'General', // Default category
          store_name: store_name,
          purchase_date: purchase_date || new Date().toISOString().split('T')[0]
        })
      );

      await Promise.all(receiptItemsPromises);

      // 3. Update the UI to "processed" on full success
      setSuccess(`Successfully processed and saved ${items.length} items from ${file.name}!`);
      setRecentUploads(prev => prev.map(item => 
        item.id === newUpload.id ? { ...item, status: 'processed', amount: `$${total_amount}` } : item
      ));

    } catch (err: any) {
      const errorMessage = 'Processed receipt, but failed to save items.';
      setError(errorMessage);
      setRecentUploads(prev => prev.map(item => 
        item.id === newUpload.id ? { ...item, status: 'failed', errorMessage } : item
      ));
    }
  };

  // --- End of API Integration ---

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const onBrowseClick = () => {
    inputRef.current?.click();
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-warning animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'text-success';
      case 'processing': return 'text-warning';
      case 'failed': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Header */}
      <header className="glass-panel m-4 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-primary hover:bg-primary/10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gradient">Upload Receipts</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-8">
        {/* Upload Area */}
        <Card className="glass-card p-8 mb-8 animate-fade-up">
          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div 
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
              dragActive 
                ? 'border-primary bg-primary/5 scale-105' 
                : 'border-glass-border hover:border-primary/50'
            }`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                Drop your receipts here
              </h3>
              <p className="text-muted-foreground mb-4">
                or click to browse your files
              </p>
              <Button onClick={onBrowseClick} variant="default" className="bg-primary hover:bg-primary/90">
                Browse Files
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Supports JPG, PNG, PDF files up to 10MB
              </p>
            </div>
          </div>
        </Card>

        {/* --- Notification Area --- */}
        {error && 
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5"/> {error}
          </div>
        }
        {success && 
          <div className="bg-success/10 border border-success/20 text-success text-sm rounded-lg p-3 mb-6 flex items-center gap-3">
            <CheckCircle className="w-5 h-5"/> {success}
          </div>
        }
        
        {/* --- Extracted Data Table --- */}
        {extractedData && (
          <Card className="glass-card p-6 mb-8 animate-fade-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div>
                <h3 className="text-xl font-semibold text-primary">Extracted Details</h3>
                <p className="text-sm text-muted-foreground">
                  From <span className="font-medium text-primary/90">{extractedData.store_name || 'N/A'}</span> on <span className="font-medium text-primary/90">{extractedData.purchase_date || 'N/A'}</span>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-gradient">${extractedData.total_amount || '0.00'}</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-glass-border">
              <table className="w-full text-left">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-muted-foreground">Item Name</th>
                    <th className="p-3 text-sm font-semibold text-muted-foreground text-center">Quantity</th>
                    <th className="p-3 text-sm font-semibold text-muted-foreground text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedData.items && extractedData.items.map((item, index) => (
                    <tr key={index} className="border-b border-glass-border last:border-b-0 hover:bg-primary/5">
                      <td className="p-3 text-primary font-medium">{item.item_name}</td>
                      <td className="p-3 text-muted-foreground text-center">{item.quantity}</td>
                      <td className="p-3 text-primary text-right">${parseFloat(item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Recent Uploads */}
        {recentUploads.length > 0 && (
          <Card className="glass-card p-6 animate-bounce-in">
            <h3 className="text-xl font-semibold text-primary mb-6">Recent Uploads</h3>
            <div className="overflow-hidden rounded-lg">
              <div className="hidden md:grid grid-cols-5 gap-4 p-3 bg-muted/20 text-sm font-medium text-muted-foreground border-b border-glass-border">
                <div>File Name</div> <div>Status</div> <div>Date</div> <div>Amount</div> <div>Actions</div>
              </div>
              <div className="divide-y divide-glass-border">
                {recentUploads.map((upload, index) => (
                  <div key={upload.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 hover:bg-primary/5 transition-colors animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-primary truncate">{upload.name}</span>
                    </div>
                    <div className="flex items-center gap-2 md:justify-start justify-between">
                      <span className="md:hidden text-sm text-muted-foreground">Status:</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(upload.status)}
                        <span className={`text-sm capitalize ${getStatusColor(upload.status)}`}>{upload.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center md:justify-start justify-between">
                      <span className="md:hidden text-sm text-muted-foreground">Date:</span>
                      <span className="text-sm text-muted-foreground">{upload.date}</span>
                    </div>
                    <div className="flex items-center md:justify-start justify-between">
                      <span className="md:hidden text-sm text-muted-foreground">Amount:</span>
                      <span className="text-sm font-medium text-primary">{upload.amount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10" disabled={upload.status !== 'processed'}>View</Button>
                      <Button variant="ghost" size="sm" className="text-xs hover:bg-destructive/10 text-destructive">Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UploadPage;