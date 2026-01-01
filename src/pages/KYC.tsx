import { useState } from 'react';
import { 
  Search, 
  MoreHorizontal, 
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Filter,
  Clock,
  User,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Mock data
const kycSubmissions = [
  {
    id: 1,
    userName: 'Rajesh Kumar',
    businessName: 'Kumar Enterprises',
    gstNumber: '29ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    submissionDate: '2024-01-10',
    status: 'pending',
    email: 'rajesh@kumarenterprises.com',
    phone: '+91 98765 43210',
  },
  {
    id: 2,
    userName: 'Priya Sharma',
    businessName: 'Sharma Trading Co.',
    gstNumber: '27FGHIJ5678G2Z6',
    panNumber: 'FGHIJ5678G',
    submissionDate: '2024-01-12',
    status: 'verified',
    email: 'priya@sharmatrading.com',
    phone: '+91 98765 43211',
  },
  {
    id: 3,
    userName: 'Amit Patel',
    businessName: 'Patel & Sons',
    gstNumber: '24KLMNO9012H3Z7',
    panNumber: 'KLMNO9012H',
    submissionDate: '2024-01-14',
    status: 'pending',
    email: 'amit@patelsons.com',
    phone: '+91 98765 43212',
  },
  {
    id: 4,
    userName: 'Suresh Gupta',
    businessName: 'Gupta Store',
    gstNumber: '19PQRST3456I4Z8',
    panNumber: 'PQRST3456I',
    submissionDate: '2024-01-08',
    status: 'rejected',
    email: 'suresh@guptastore.com',
    phone: '+91 98765 43213',
    rejectionReason: 'Invalid GST certificate',
  },
  {
    id: 5,
    userName: 'Harpreet Singh',
    businessName: 'Singh Retail',
    gstNumber: '07UVWXY7890J5Z9',
    panNumber: 'UVWXY7890J',
    submissionDate: '2024-01-15',
    status: 'pending',
    email: 'harpreet@singhretail.com',
    phone: '+91 98765 43214',
  },
];

export default function KYC() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedKYC, setSelectedKYC] = useState<typeof kycSubmissions[0] | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="delivered">Verified</Badge>;
      case 'rejected':
        return <Badge variant="cancelled">Rejected</Badge>;
      default:
        return <Badge variant="pending">Pending</Badge>;
    }
  };

  const filteredKYC = activeTab === 'all' 
    ? kycSubmissions 
    : kycSubmissions.filter(kyc => kyc.status === activeTab);

  const handleViewDetails = (kyc: typeof kycSubmissions[0]) => {
    setSelectedKYC(kyc);
    setIsViewDialogOpen(true);
  };

  const handleVerify = (kyc: typeof kycSubmissions[0]) => {
    setSelectedKYC(kyc);
    setIsVerifyDialogOpen(true);
  };

  const handleReject = (kyc: typeof kycSubmissions[0]) => {
    setSelectedKYC(kyc);
    setIsRejectDialogOpen(true);
  };

  const pendingCount = kycSubmissions.filter(k => k.status === 'pending').length;
  const verifiedCount = kycSubmissions.filter(k => k.status === 'verified').length;
  const rejectedCount = kycSubmissions.filter(k => k.status === 'rejected').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">KYC Verification</h1>
          <p className="text-muted-foreground">Review and verify business KYC submissions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{kycSubmissions.length}</p>
                <p className="text-xs text-muted-foreground">Total Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{verifiedCount}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{rejectedCount}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, business, GST, or PAN..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Table with Tabs */}
      <Card className="shadow-card">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-border px-4">
            <TabsList className="h-12 bg-transparent p-0 gap-6">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                All ({kycSubmissions.length})
              </TabsTrigger>
              <TabsTrigger 
                value="pending"
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger 
                value="verified"
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Verified ({verifiedCount})
              </TabsTrigger>
              <TabsTrigger 
                value="rejected"
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Rejected ({rejectedCount})
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>User</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>GST Number</TableHead>
                    <TableHead>PAN Number</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKYC.map((kyc) => (
                    <TableRow key={kyc.id} className="hover:bg-secondary/30">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{kyc.userName}</p>
                          <p className="text-xs text-muted-foreground">{kyc.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{kyc.businessName}</TableCell>
                      <TableCell className="font-mono text-sm">{kyc.gstNumber}</TableCell>
                      <TableCell className="font-mono text-sm">{kyc.panNumber}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(kyc.submissionDate)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(kyc.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(kyc)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {kyc.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleVerify(kyc)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Verify
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(kyc)}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download Documents
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Tabs>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Details</DialogTitle>
            <DialogDescription>
              Review all submitted documents and information
            </DialogDescription>
          </DialogHeader>
          {selectedKYC && (
            <div className="space-y-6 py-4">
              {/* User Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{selectedKYC.userName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedKYC.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedKYC.phone}</p>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Business Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Business Name</Label>
                    <p className="font-medium">{selectedKYC.businessName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">GST Number</Label>
                    <p className="font-mono">{selectedKYC.gstNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">PAN Number</Label>
                    <p className="font-mono">{selectedKYC.panNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Submission Date</Label>
                    <p className="font-medium">{formatDate(selectedKYC.submissionDate)}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">GST Certificate</p>
                      <Button variant="outline" size="sm" className="mt-2 w-full">
                        View Document
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">PAN Card</p>
                      <Button variant="outline" size="sm" className="mt-2 w-full">
                        View Document
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Business License</p>
                      <Button variant="outline" size="sm" className="mt-2 w-full">
                        View Document
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {selectedKYC.rejectionReason && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Rejection Reason:</strong> {selectedKYC.rejectionReason}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedKYC?.status === 'pending' && (
              <>
                <Button variant="outline" onClick={() => handleReject(selectedKYC)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button variant="gradient" onClick={() => handleVerify(selectedKYC)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verify
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify KYC</DialogTitle>
            <DialogDescription>
              Confirm verification for {selectedKYC?.businessName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verify-comments">Comments (Optional)</Label>
              <Textarea 
                id="verify-comments" 
                placeholder="Add any comments about this verification"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={() => {
              // Handle verify action
              setIsVerifyDialogOpen(false);
            }}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Verify KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedKYC?.businessName}'s KYC submission
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason *</Label>
              <Textarea 
                id="reject-reason" 
                placeholder="Enter the reason for rejection"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsRejectDialogOpen(false);
              setRejectionReason('');
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                // Handle reject action
                setIsRejectDialogOpen(false);
                setRejectionReason('');
              }}
              disabled={!rejectionReason}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

