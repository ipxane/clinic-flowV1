import { useState } from "react";
import { Eye, MoreHorizontal, CheckCircle, XCircle, Clock, CalendarX, Trash2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, Status } from "@/components/ui/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookingRequests, BookingRequest, BookingRequestStatus } from "@/hooks/useBookingRequests";
import { ViewBookingRequestDialog } from "@/components/booking-requests/ViewBookingRequestDialog";
import { ConfirmBookingDialog } from "@/components/booking-requests/ConfirmBookingDialog";
import { PostponeBookingDialog } from "@/components/booking-requests/PostponeBookingDialog";
import { CancelBookingDialog } from "@/components/booking-requests/CancelBookingDialog";
import { format } from "date-fns";

export default function BookingRequests() {
  const { bookingRequests, isLoading, confirmBookingRequest, postponeBookingRequest, cancelBookingRequest } = useBookingRequests();

  const [activeTab, setActiveTab] = useState<BookingRequestStatus>("pending");
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isPostponeDialogOpen, setIsPostponeDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const filteredRequests = bookingRequests.filter((request) => request.status === activeTab);

  const getStatusCount = (status: BookingRequestStatus) =>
    bookingRequests.filter((r) => r.status === status).length;

  const handleView = (request: BookingRequest) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  const handleConfirmAction = (request: BookingRequest) => {
    setSelectedRequest(request);
    setIsConfirmDialogOpen(true);
  };

  const handlePostponeAction = (request: BookingRequest) => {
    setSelectedRequest(request);
    setIsPostponeDialogOpen(true);
  };

  const handleCancelAction = (request: BookingRequest) => {
    setSelectedRequest(request);
    setIsCancelDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const columns = [
    {
      key: "patient",
      header: "Patient",
      cell: (request: BookingRequest) => (
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{request.patient_name}</p>
              {request.is_new && (
                <Badge variant="default" className="bg-primary text-[10px] h-4 px-1 animate-pulse">
                  New
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {request.contact_type === "phone" ? "📞" : "✉️"} {request.contact_info}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "service",
      header: "Service",
      cell: (request: BookingRequest) => (
        <Badge variant="secondary">{request.service_name}</Badge>
      ),
    },
    {
      key: "requestedDay",
      header: "Requested Date",
      cell: (request: BookingRequest) => formatDate(request.requested_date),
    },
    {
      key: "requestedPeriod",
      header: "Period",
      cell: (request: BookingRequest) => request.requested_period,
    },
    {
      key: "status",
      header: "Status",
      cell: (request: BookingRequest) => <StatusBadge status={request.status as Status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      cell: (request: BookingRequest) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleView(request)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {request.status === "pending" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-status-confirmed"
                  onClick={() => handleConfirmAction(request)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-status-postponed"
                  onClick={() => handlePostponeAction(request)}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Postpone
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleCancelAction(request)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              </>
            )}
            {request.status === "confirmed" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-status-postponed"
                  onClick={() => handlePostponeAction(request)}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Postpone
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleCancelAction(request)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              </>
            )}
            {request.status === "postponed" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-status-confirmed"
                  onClick={() => handleConfirmAction(request)}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleCancelAction(request)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const publicBookingUrl = `${window.location.origin}/book`;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Booking Requests"
        description="Review and manage patient booking requests from the public booking page."
        actions={
          <Button variant="outline" size="sm" asChild>
            <a href="/book" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Public Booking Page
            </a>
          </Button>
        }
      />

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BookingRequestStatus)} className="mb-6">
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
            <Badge variant="secondary" className="ml-1">{getStatusCount("pending")}</Badge>
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Confirmed
            <Badge variant="secondary" className="ml-1">{getStatusCount("confirmed")}</Badge>
          </TabsTrigger>
          <TabsTrigger value="postponed" className="gap-2">
            <CalendarX className="h-4 w-4" />
            Postponed
            <Badge variant="secondary" className="ml-1">{getStatusCount("postponed")}</Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-2">
            <XCircle className="h-4 w-4" />
            Cancelled
            <Badge variant="secondary" className="ml-1">{getStatusCount("cancelled")}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredRequests}
              emptyMessage={`No ${activeTab} booking requests.`}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ViewBookingRequestDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        request={selectedRequest}
        onConfirm={() => {
          setIsViewDialogOpen(false);
          if (selectedRequest) handleConfirmAction(selectedRequest);
        }}
        onPostpone={() => {
          setIsViewDialogOpen(false);
          if (selectedRequest) handlePostponeAction(selectedRequest);
        }}
        onCancel={() => {
          setIsViewDialogOpen(false);
          if (selectedRequest) handleCancelAction(selectedRequest);
        }}
      />

      <ConfirmBookingDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        request={selectedRequest}
        onConfirm={confirmBookingRequest}
      />

      <PostponeBookingDialog
        open={isPostponeDialogOpen}
        onOpenChange={setIsPostponeDialogOpen}
        request={selectedRequest}
        onPostpone={postponeBookingRequest}
      />

      <CancelBookingDialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        request={selectedRequest}
        onCancel={cancelBookingRequest}
      />
    </div>
  );
}
