import { useState, useMemo } from 'react';
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
  Building2,
  Loader2
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kycAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function KYC() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedKYC, setSelectedKYC] = useState<any | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifyComments, setVerifyComments] = useState('');
  const limit = 20;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build filters
  const filters = useMemo(() => {
    const filterParams: any = {
      page,
      limit,
    };

    if (activeTab !== 'all') {
      filterParams.status = activeTab;
    }

    if (searchQuery) {
      filterParams.search = searchQuery;
    }

    return filterParams;
  }, [searchQuery, activeTab, page, limit]);

  // Fetch KYC submissions
  const {
    data: kycResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['kyc', filters],
    queryFn: async () => {
      const response = await kycAPI.getKYCSubmissions(filters);
      
      // Handle different response structures
      if (response) {
        const responseData = response.data as any;
        
        // Case 1: Response has data.items (paginated structure)
        if (responseData && responseData.items && Array.isArray(responseData.items)) {
          return responseData;
        }
        
        // Case 2: Response.data is an array directly
        if (responseData && Array.isArray(responseData)) {
          return {
            items: responseData,
            pagination: {
              page: filters.page || 1,
              limit: filters.limit || 20,
              total: responseData.length,
              totalPages: Math.ceil(responseData.length / (filters.limit || 20)),
            },
          };
        }
        
        // Case 3: Response has kyc array
        if (responseData && responseData.kyc && Array.isArray(responseData.kyc)) {
          return {
            items: responseData.kyc,
            pagination: {
              page: responseData.page || filters.page || 1,
              limit: responseData.limit || filters.limit || 20,
              total: responseData.total || responseData.kyc.length,
              totalPages: responseData.totalPages || Math.ceil((responseData.total || responseData.kyc.length) / (responseData.limit || filters.limit || 20)),
            },
          };
        }
      }
      
      // Fallback
      return {
        items: [],
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total: 0,
          totalPages: 1,
        },
      };
    },
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const kycSubmissions = kycResponse?.items || [];
  const pagination = kycResponse?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  // Fetch KYC details when viewing
  const { data: kycDetails } = useQuery({
    queryKey: ['kyc-details', selectedKYC?.id],
    queryFn: async () => {
      if (!selectedKYC?.id) return null;
      const response = await kycAPI.getKYCDetails(selectedKYC.id);
      return response.data;
    },
    enabled: !!selectedKYC?.id && isViewDialogOpen,
  });

  // Fetch KYC documents
  const { data: kycDocuments } = useQuery({
    queryKey: ['kyc-documents', selectedKYC?.id],
    queryFn: async () => {
      if (!selectedKYC?.id) return null;
      const response = await kycAPI.getKYCDocuments(selectedKYC.id);
      return response.data;
    },
    enabled: !!selectedKYC?.id && isViewDialogOpen,
  });

  // Verify KYC mutation
  const verifyKYCMutation = useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      kycAPI.verifyKYC(id, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
      toast({
        title: 'KYC verified',
        description: 'KYC has been verified successfully',
      });
      setIsVerifyDialogOpen(false);
      setIsViewDialogOpen(false);
      setVerifyComments('');
      setSelectedKYC(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to verify KYC',
        variant: 'destructive',
      });
    },
  });

  // Reject KYC mutation
  const rejectKYCMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      kycAPI.rejectKYC(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
      toast({
        title: 'KYC rejected',
        description: 'KYC has been rejected successfully',
      });
      setIsRejectDialogOpen(false);
      setIsViewDialogOpen(false);
      setRejectionReason('');
      setSelectedKYC(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to reject KYC',
        variant: 'destructive',
      });
    },
  });

  // Calculate stats
  const stats = useMemo(() => {
    const total = pagination.total || kycSubmissions.length;
    const pending = kycSubmissions.filter((k: any) => {
      const status = k.status || k.kyc_status || 'pending';
      return status === 'pending';
    }).length;
    const verified = kycSubmissions.filter((k: any) => {
      const status = k.status || k.kyc_status || 'pending';
      return status === 'verified';
    }).length;
    const rejected = kycSubmissions.filter((k: any) => {
      const status = k.status || k.kyc_status || 'pending';
      return status === 'rejected';
    }).length;

    return { total, pending, verified, rejected };
  }, [kycSubmissions, pagination]);

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return '-';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', {
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

  const handleViewDetails = (kyc: any) => {
    setSelectedKYC(kyc);
    setIsViewDialogOpen(true);
  };

  const handleVerify = (kyc: any) => {
    setSelectedKYC(kyc);
    setIsVerifyDialogOpen(true);
  };

  const handleReject = (kyc: any) => {
    setSelectedKYC(kyc);
    setIsRejectDialogOpen(true);
  };

  const confirmVerify = () => {
    if (selectedKYC?.id) {
      verifyKYCMutation.mutate({
        id: selectedKYC.id,
        comments: verifyComments || undefined,
      });
    }
  };

  const confirmReject = () => {
    if (selectedKYC?.id && rejectionReason) {
      rejectKYCMutation.mutate({
        id: selectedKYC.id,
        reason: rejectionReason,
      });
    }
  };

  const handleDownloadDocuments = async (kycId: string) => {
    try {
      const documents = await kycAPI.getKYCDocuments(kycId);
      // TODO: Implement document download logic
      toast({
        title: 'Download Documents',
        description: 'Document download coming soon',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to download documents',
        variant: 'destructive',
      });
    }
  };

  // Use details if available, otherwise use selected KYC
  const displayKYC = kycDetails || selectedKYC;

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
                {isLoading && !kycResponse ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                )}
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
                {isLoading && !kycResponse ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                )}
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
                {isLoading && !kycResponse ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.verified}</p>
                )}
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
                {isLoading && !kycResponse ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                )}
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Table with Tabs */}
      <Card className="shadow-card">
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          setPage(1);
        }}>
          <div className="border-b border-border px-4">
            <TabsList className="h-12 bg-transparent p-0 gap-6">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                All ({stats.total})
              </TabsTrigger>
              <TabsTrigger 
                value="pending"
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger 
                value="verified"
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Verified ({stats.verified})
              </TabsTrigger>
              <TabsTrigger 
                value="rejected"
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Rejected ({stats.rejected})
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-0">
            {isLoading && !kycResponse ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-8 text-center">
                <p className="text-destructive">
                  Error loading KYC submissions: {error instanceof Error ? error.message : 'Unknown error'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['kyc'] })}
                >
                  Retry
                </Button>
              </div>
            ) : kycSubmissions.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No KYC submissions found</p>
              </div>
            ) : (
              <>
                {isFetching && kycResponse && (
                  <div className="absolute top-0 right-0 p-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
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
                      {kycSubmissions.map((kyc: any) => {
                        const kycId = kyc.id;
                        const userName = kyc.user?.name || kyc.userName || kyc.user_name || 'Unknown';
                        const userEmail = kyc.user?.email || kyc.email || '';
                        const businessName = kyc.businessName || kyc.business_name || kyc.companyName || '-';
                        const gstNumber = kyc.gstNumber || kyc.gst_number || kyc.gst || '-';
                        const panNumber = kyc.panNumber || kyc.pan_number || kyc.pan || '-';
                        const submissionDate = kyc.submittedAt || kyc.submitted_at || kyc.submissionDate || kyc.submission_date || kyc.createdAt || kyc.created_at;
                        const status = kyc.status || kyc.kyc_status || 'pending';

                        return (
                          <TableRow key={kycId} className="hover:bg-secondary/30">
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground">{userName}</p>
                                {userEmail && (
                                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{businessName}</TableCell>
                            <TableCell className="font-mono text-sm">{gstNumber}</TableCell>
                            <TableCell className="font-mono text-sm">{panNumber}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(submissionDate)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(status)}
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
                                  {status === 'pending' && (
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
                                  <DropdownMenuItem onClick={() => handleDownloadDocuments(kycId)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Documents
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Showing <strong>{(page - 1) * limit + 1}</strong> to{' '}
                    <strong>{Math.min(page * limit, pagination.total)}</strong> of{' '}
                    <strong>{pagination.total}</strong> submissions
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
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
          {displayKYC && (
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
                    <p className="font-medium">{displayKYC.user?.name || displayKYC.userName || displayKYC.user_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{displayKYC.user?.email || displayKYC.email || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{displayKYC.user?.phone || displayKYC.phone || displayKYC.phoneNumber || '-'}</p>
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
                    <p className="font-medium">{displayKYC.businessName || displayKYC.business_name || displayKYC.companyName || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">GST Number</Label>
                    <p className="font-mono">{displayKYC.gstNumber || displayKYC.gst_number || displayKYC.gst || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">PAN Number</Label>
                    <p className="font-mono">{displayKYC.panNumber || displayKYC.pan_number || displayKYC.pan || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Submission Date</Label>
                    <p className="font-medium">{formatDate(displayKYC.submittedAt || displayKYC.submitted_at || displayKYC.submissionDate || displayKYC.submission_date || displayKYC.createdAt || displayKYC.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </h3>
                {kycDocuments && Array.isArray(kycDocuments) && kycDocuments.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {kycDocuments.map((doc: any, index: number) => (
                      <Card key={index} className="border-2 border-dashed">
                        <CardContent className="p-4 text-center">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">{doc.type || doc.name || `Document ${index + 1}`}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 w-full"
                            onClick={() => {
                              if (doc.url) {
                                window.open(doc.url, '_blank');
                              }
                            }}
                          >
                            View Document
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-4 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">GST Certificate</p>
                        <Button variant="outline" size="sm" className="mt-2 w-full" disabled>
                          View Document
                        </Button>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-4 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">PAN Card</p>
                        <Button variant="outline" size="sm" className="mt-2 w-full" disabled>
                          View Document
                        </Button>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-dashed">
                      <CardContent className="p-4 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Business License</p>
                        <Button variant="outline" size="sm" className="mt-2 w-full" disabled>
                          View Document
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {(displayKYC.rejectionReason || displayKYC.rejection_reason) && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Rejection Reason:</strong> {displayKYC.rejectionReason || displayKYC.rejection_reason}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          <DialogFooter>
            {displayKYC && (displayKYC.status || displayKYC.kyc_status) === 'pending' && (
              <>
                <Button variant="outline" onClick={() => handleReject(displayKYC)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button variant="gradient" onClick={() => handleVerify(displayKYC)}>
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
              Confirm verification for {selectedKYC?.businessName || selectedKYC?.business_name || 'this business'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="verify-comments">Comments (Optional)</Label>
              <Textarea 
                id="verify-comments" 
                placeholder="Add any comments about this verification"
                rows={3}
                value={verifyComments}
                onChange={(e) => setVerifyComments(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsVerifyDialogOpen(false);
              setVerifyComments('');
            }} disabled={verifyKYCMutation.isPending}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={confirmVerify} disabled={verifyKYCMutation.isPending}>
              {verifyKYCMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verify KYC
                </>
              )}
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
              Provide a reason for rejecting {selectedKYC?.businessName || selectedKYC?.business_name || 'this business'}'s KYC submission
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
            }} disabled={rejectKYCMutation.isPending}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmReject}
              disabled={!rejectionReason || rejectKYCMutation.isPending}
            >
              {rejectKYCMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject KYC
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
