import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from "../utils/api.js"
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  ChevronDown,
  Calendar,
  Building,
  Tag,
  DollarSign,
  Loader2,
  Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Define a type for the API response items
interface ApiReceiptItem {
  id: number;
  purchase_date: string;
  store_name: string;
  category: string;
  total_amount: string;
  item_name: string;
  quantity: number;
  price: string;
}

// Define a type for the data structure your UI expects
interface ProcessedReceipt {
  id: number;
  date: string;
  retailer: string;
  category: string;
  amount: number;
  status: string;
  items: string[];
}

const ReceiptDataPage = () => {
  const navigate = useNavigate();
  
  // --- Start of API Integration ---

  const [rawReceipts, setRawReceipts] = useState<ApiReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const response = await api.get('/api/receipts/');
        setRawReceipts(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching receipts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, []);

  // 1. Memoized data transformation to group flat items into receipts
  const processedReceipts = useMemo((): ProcessedReceipt[] => {
    if (!rawReceipts.length) return [];

    const grouped = rawReceipts.reduce((acc, item) => {
      // Group by a composite key of store and date
      const key = `${item.store_name}-${item.purchase_date}`;
      if (!acc[key]) {
        acc[key] = {
          id: item.id, // Use the first item's id as the group id
          date: item.purchase_date,
          retailer: item.store_name,
          category: item.category || 'General',
          amount: 0,
          status: 'Processed',
          items: [],
        };
      }
      acc[key].items.push(item.item_name);
      acc[key].amount += parseFloat(item.total_amount);
      return acc;
    }, {} as Record<string, ProcessedReceipt>);
    
    // Sort by date, newest first
    return Object.values(grouped).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [rawReceipts]);

  // 2. Client-side filtering on the processed data
  const filteredReceipts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return processedReceipts;
    
    return processedReceipts.filter(receipt => 
      receipt.retailer.toLowerCase().includes(term) ||
      receipt.category.toLowerCase().includes(term) ||
      receipt.items.some(item => item.toLowerCase().includes(term))
    );
  }, [searchTerm, processedReceipts]);
  
  // --- End of API Integration ---


  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processed': return 'text-success bg-success/10';
      case 'processing': return 'text-warning bg-warning/10';
      case 'failed': return 'text-destructive bg-destructive/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food & beverage': return '🍽️';
      case 'office supplies': return '📎';
      case 'fuel': return '⛽';
      case 'retail': return '🛒';
      case 'online': return '💻';
      case 'groceries': return '🥬';
      default: return '📄';
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
          <h1 className="text-2xl font-bold text-gradient">Receipt Data</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-8">
        {/* Controls */}
        <Card className="glass-card p-6 mb-6 animate-fade-up">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by retailer, category, or item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-glass border-glass-border focus:border-primary"
                />
              </div>
              <Button variant="outline" className="border-glass-border hover:bg-primary/10">
                <Filter className="w-4 h-4 mr-2" /> Filter <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <Button variant="default" className="bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </Card>

        {/* Data Table */}
        <Card className="glass-card p-6 animate-bounce-in">
          <div className="overflow-x-auto">
            {/* Desktop Header */}
            <div className="hidden lg:grid grid-cols-6 gap-4 p-4 bg-muted/10 rounded-lg mb-4 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</div>
              <div className="flex items-center gap-2"><Building className="w-4 h-4" /> Retailer</div>
              <div className="flex items-center gap-2"><Tag className="w-4 h-4" /> Category</div>
              <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Total Amount</div>
              <div>Status</div>
              <div>Actions</div>
            </div>

            {/* Data Rows */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
                  <p>Loading receipts...</p>
                </div>
              ) : filteredReceipts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="w-12 h-12 mx-auto mb-2"/>
                  <h3 className="font-semibold text-primary">No Receipts Found</h3>
                  <p className="text-sm">{searchTerm ? "Try adjusting your search term." : "Upload a receipt to get started."}</p>
                </div>
              ) : (
                filteredReceipts.map((receipt, index) => (
                  <div key={receipt.id} className="glass-card p-4 hover:bg-primary/5 transition-all duration-300 animate-fade-up" style={{ animationDelay: `${index * 0.05}s` }}>
                    {/* Mobile Layout */}
                    <div className="lg:hidden space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCategoryIcon(receipt.category)}</span>
                          <div>
                            <h3 className="font-semibold text-primary">{receipt.retailer}</h3>
                            <p className="text-sm text-muted-foreground">{receipt.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg text-primary">${receipt.amount.toFixed(2)}</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>{receipt.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{receipt.category}</span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10">View Details</Button>
                          <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10">Edit</Button>
                        </div>
                      </div>
                    </div>
                    {/* Desktop Layout */}
                    <div className="hidden lg:grid grid-cols-6 gap-4 items-center">
                      <div className="text-sm text-muted-foreground">{receipt.date}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getCategoryIcon(receipt.category)}</span>
                        <span className="font-medium text-primary">{receipt.retailer}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">{receipt.category}</div>
                      <div className="font-semibold text-primary">${receipt.amount.toFixed(2)}</div>
                      <div><span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>{receipt.status}</span></div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10">View</Button>
                        <Button variant="ghost" size="sm" className="text-xs hover:bg-primary/10">Edit</Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReceiptDataPage;