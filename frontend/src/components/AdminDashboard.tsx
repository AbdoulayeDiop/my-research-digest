import { useState, useEffect, useCallback } from "react";
import { useAxios } from "../lib/axios";
import { toast } from "sonner";
import { Search, AlertTriangle, CheckCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface CycleLogEntry {
  topic: string;
  newsletter_id: string;
  status: string;
  papers_found: number;
  issue_id: string | null;
}

interface WorkerStatus {
  status: 'idle' | 'running' | 'stopping';
  cycle_started_at: string | null;
  cycle_completed_at: string | null;
  next_cycle_at: string | null;
  total_newsletters: number;
  processed_count: number;
  current_newsletter_topic: string | null;
  current_step: string | null;
  cycle_log: CycleLogEntry[];
}

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNewsletters: 0,
    totalIssues: 0,
    totalPapers: 0,
    activeUsers: 0,
  });
  const [usersData, setUsersData] = useState<any[]>([]);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [allNewsletters, setAllNewsletters] = useState<any[]>([]);
  const [newslettersCurrentPage, setNewslettersCurrentPage] = useState(1);
  const [newslettersPerPage] = useState(10);
  const [newslettersSearchQuery, setNewslettersSearchQuery] = useState("");
  const [overdueNewsletters, setOverdueNewsletters] = useState<any[]>([]);
  const [queuingIds, setQueuingIds] = useState<Set<string>>(new Set());

  const [announcementSubject, setAnnouncementSubject] = useState("");
  const [announcementHtml, setAnnouncementHtml] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; total: number } | null>(null);

  const filteredUsers = usersData.filter(
    (user) =>
      user.name?.toLowerCase().includes(usersSearchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(usersSearchQuery.toLowerCase())
  );
  const indexOfLastUser = usersCurrentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const usersTotalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const filteredNewsletters = allNewsletters.filter(
    (newsletter) =>
      newsletter.topic?.toLowerCase().includes(newslettersSearchQuery.toLowerCase()) ||
      newsletter.description?.toLowerCase().includes(newslettersSearchQuery.toLowerCase()) ||
      newsletter.field?.toLowerCase().includes(newslettersSearchQuery.toLowerCase())
  );
  const indexOfLastNewsletter = newslettersCurrentPage * newslettersPerPage;
  const indexOfFirstNewsletter = indexOfLastNewsletter - newslettersPerPage;
  const currentNewsletters = filteredNewsletters.slice(indexOfFirstNewsletter, indexOfLastNewsletter);
  const newslettersTotalPages = Math.ceil(filteredNewsletters.length / newslettersPerPage);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [workerActionLoading, setWorkerActionLoading] = useState(false);
  const axios = useAxios();
  const pythonApiUrl = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
  const axiosPython = useAxios(pythonApiUrl);

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const formatFutureTime = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const diffMs = date.getTime() - Date.now();
    if (diffMs <= 0) return "soon";
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `in ${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    return `in ${diffHours}h`;
  };

  const fetchOverdue = useCallback(async () => {
    const res = await axios.get(`/newsletters/overdue`);
    setOverdueNewsletters(res.data);
  }, [axios]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [
          usersCountResponse,
          newslettersCountResponse,
          issuesCountResponse,
          papersCountResponse,
          activeUsersResponse,
          allNewslettersResponse,
          overdueResponse,
        ] = await Promise.all([
          axios.get(`/users/count`),
          axios.get(`/newsletters/count`),
          axios.get(`/issues/count`),
          axios.get(`/papers/count`),
          axios.get(`/users/active-count`),
          axios.get(`/newsletters/all`),
          axios.get(`/newsletters/overdue`),
        ]);

        setStats({
          totalUsers: usersCountResponse.data.count,
          totalNewsletters: newslettersCountResponse.data.count,
          totalIssues: issuesCountResponse.data.count,
          totalPapers: papersCountResponse.data.count,
          activeUsers: activeUsersResponse.data.activeUsers,
        });

        const usersDataResponse = await axios.get(`/users/with-newsletter-count`);
        setUsersData(usersDataResponse.data);
        setAllNewsletters(allNewslettersResponse.data);
        setOverdueNewsletters(overdueResponse.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch admin data.");
        console.error("Error fetching admin data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [axios]);

  useEffect(() => {
    const poll = () =>
      axiosPython.get('/worker/status').then(r => setWorkerStatus(r.data)).catch(() => {});
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [axiosPython]);

  const handleWorkerTrigger = async () => {
    setWorkerActionLoading(true);
    try {
      await axiosPython.post('/worker/trigger');
      toast.success("Cycle started — status will update shortly.");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(detail || "Failed to trigger worker cycle.");
    } finally {
      setWorkerActionLoading(false);
    }
  };

  const handleWorkerStop = async () => {
    setWorkerActionLoading(true);
    try {
      await axiosPython.post('/worker/stop');
      toast.success("Stop requested — will halt after the current newsletter finishes.");
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(detail || "Failed to stop worker cycle.");
    } finally {
      setWorkerActionLoading(false);
    }
  };

  const handleSendAnnouncement = async () => {
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await axios.post(`/announcements/send`, {
        subject: announcementSubject,
        html: announcementHtml,
      });
      setSendResult(res.data);
    } catch (err) {
      console.error("Failed to send announcement:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleQueue = async (newsletterId: string) => {
    setQueuingIds((prev) => new Set(prev).add(newsletterId));
    try {
      await axios.post(`/newsletters/${newsletterId}/reset-last-search`);
      await fetchOverdue();
      // Optimistically remove from the overdue list
      setOverdueNewsletters((prev) => prev.filter((n) => n._id !== newsletterId));
      // Update lastSearch in the main table
      setAllNewsletters((prev) =>
        prev.map((n) => (n._id === newsletterId ? { ...n, lastSearch: null } : n))
      );
    } catch (err) {
      console.error("Failed to queue newsletter:", err);
    } finally {
      setQueuingIds((prev) => {
        const next = new Set(prev);
        next.delete(newsletterId);
        return next;
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="mb-6">Admin Dashboard</h1>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading stats...</div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">Error: {error}</div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="text-lg font-semibold">Total Users</h3>
              <p className="text-3xl font-bold text-primary mt-2">{stats.totalUsers}</p>
            </div>
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="text-lg font-semibold">Total Newsletters</h3>
              <p className="text-3xl font-bold text-primary mt-2">{stats.totalNewsletters}</p>
            </div>
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="text-lg font-semibold">Total Issues</h3>
              <p className="text-3xl font-bold text-primary mt-2">{stats.totalIssues}</p>
            </div>
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="text-lg font-semibold">Total Papers</h3>
              <p className="text-3xl font-bold text-primary mt-2">{stats.totalPapers}</p>
            </div>
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="text-lg font-semibold">Active Users (7d)</h3>
              <p className="text-3xl font-bold text-primary mt-2">{stats.activeUsers}</p>
            </div>
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="text-lg font-semibold">Active Newsletters</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {allNewsletters.filter((n) => n.status === "active").length}
              </p>
            </div>
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="text-lg font-semibold">Inactive Newsletters</h3>
              <p className="text-3xl font-bold text-muted-foreground mt-2">
                {allNewsletters.filter((n) => n.status === "inactive").length}
              </p>
            </div>
          </div>

          {/* Pipeline status */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Pipeline Status</h2>
            {overdueNewsletters.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border rounded-lg p-4">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                All active newsletters are up to date.
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {overdueNewsletters.length} newsletter{overdueNewsletters.length > 1 ? "s" : ""} overdue for generation (last run &gt;7 days ago or never run)
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueNewsletters.map((newsletter) => (
                      <TableRow key={newsletter._id}>
                        <TableCell className="font-medium">{newsletter.topic}</TableCell>
                        <TableCell>{newsletter.creatorName || "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatRelativeTime(newsletter.lastSearch)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={queuingIds.has(newsletter._id)}
                            onClick={() => handleQueue(newsletter._id)}
                          >
                            {queuingIds.has(newsletter._id) ? "Queuing..." : "Queue for next run"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Worker Monitor */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Worker Monitor</h2>
            <div className="bg-card border rounded-lg p-6 space-y-4">
              {!workerStatus ? (
                <p className="text-sm text-muted-foreground">Connecting to worker...</p>
              ) : (
                <>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={workerStatus.status === 'running' ? 'default' : workerStatus.status === 'stopping' ? 'outline' : 'secondary'}
                        className={workerStatus.status === 'running' ? 'animate-pulse' : ''}
                      >
                        {workerStatus.status}
                      </Badge>
                      {workerStatus.status === 'running' && (
                        <span className="text-sm text-muted-foreground">
                          {workerStatus.processed_count} / {workerStatus.total_newsletters} newsletters
                          {workerStatus.current_newsletter_topic && (
                            <> — <span className="font-medium text-foreground">{workerStatus.current_newsletter_topic}</span> ({workerStatus.current_step})</>
                          )}
                        </span>
                      )}
                      {workerStatus.status === 'idle' && (
                        <span className="text-sm text-muted-foreground">
                          {workerStatus.next_cycle_at && <>Next cycle {formatFutureTime(workerStatus.next_cycle_at)}</>}
                          {workerStatus.cycle_completed_at && <> · Last completed {formatRelativeTime(workerStatus.cycle_completed_at)}</>}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {workerStatus.status === 'running' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={workerActionLoading}
                          onClick={handleWorkerStop}
                        >
                          Stop after current
                        </Button>
                      )}
                      <Button
                        size="sm"
                        disabled={workerStatus.status !== 'idle' || workerActionLoading}
                        onClick={handleWorkerTrigger}
                      >
                        Run Now
                      </Button>
                    </div>
                  </div>

                  {workerStatus.cycle_log.length > 0 && (
                    <div className="rounded-md border mt-2">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Topic</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Papers</TableHead>
                            <TableHead>Issue</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {workerStatus.cycle_log.map((entry, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium max-w-[200px] truncate">{entry.topic}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  entry.status === 'success' ? 'default' :
                                  entry.status === 'skipped' || entry.status === 'inactive' ? 'secondary' :
                                  'destructive'
                                }>
                                  {entry.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{entry.papers_found}</TableCell>
                              <TableCell className="text-muted-foreground text-xs">
                                {entry.issue_id ? entry.issue_id.slice(-6) : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

          {/* Announcements */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Send Announcement</h2>
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <Input
                  placeholder="e.g. New feature: issue feedback from email"
                  value={announcementSubject}
                  onChange={(e) => setAnnouncementSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Body (HTML — use <code>{"{{name}}"}</code> for the recipient's name)
                </label>
                <Textarea
                  placeholder="<p>Hi {{name}}, ...</p>"
                  value={announcementHtml}
                  onChange={(e) => setAnnouncementHtml(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              {sendResult && (
                <div className="flex items-center gap-2 text-sm rounded-md border px-4 py-3 bg-muted">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Sent to <strong>{sendResult.sent}</strong> of <strong>{sendResult.total}</strong> users
                  {sendResult.failed > 0 && (
                    <span className="text-destructive ml-1">({sendResult.failed} failed)</span>
                  )}
                </div>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={isSending || !announcementSubject.trim() || !announcementHtml.trim()}
                  >
                    {isSending ? "Sending..." : `Send to all ${stats.totalUsers} users`}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Send announcement to all users?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will send <strong>"{announcementSubject}"</strong> to all{" "}
                      <strong>{stats.totalUsers}</strong> users. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSendAnnouncement}>
                      Yes, send it
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

      <div className="mt-8">
        <button onClick={onBack} className="text-primary hover:underline">
          Back to Dashboard
        </button>
      </div>

      {/* Users table */}
      <h2 className="text-2xl font-bold mt-10 mb-4">Users Overview</h2>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={usersSearchQuery}
          onChange={(e) => {
            setUsersSearchQuery(e.target.value);
            setUsersCurrentPage(1);
          }}
          className="pl-9"
        />
      </div>
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No users found.</div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Newsletters</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.newsletterCount}</TableCell>
                    <TableCell>{formatRelativeTime(user.lastLoginAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              onClick={() => setUsersCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={usersCurrentPage === 1}
            >
              Previous
            </Button>
            <Button
              onClick={() => setUsersCurrentPage((prev) => Math.min(prev + 1, usersTotalPages))}
              disabled={usersCurrentPage === usersTotalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {/* Newsletters table */}
      <h2 className="text-2xl font-bold mt-10 mb-4">Newsletters Overview</h2>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search newsletters by topic, description, or field..."
          value={newslettersSearchQuery}
          onChange={(e) => {
            setNewslettersSearchQuery(e.target.value);
            setNewslettersCurrentPage(1);
          }}
          className="pl-9"
        />
      </div>
      {filteredNewsletters.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No newsletters found.</div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Ranking</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Last Issue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentNewsletters.map((newsletter) => (
                  <TableRow key={newsletter._id}>
                    <TableCell className="font-medium">{newsletter.topic}</TableCell>
                    <TableCell>
                      <Badge
                        variant={newsletter.status === "active" ? "success" : "secondary"}
                      >
                        {newsletter.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{newsletter.creatorName || "N/A"}</TableCell>
                    <TableCell>{newsletter.issueCount}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {newsletter.issueFormat === "state_of_the_art" ? "SotA" : "Classic"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {newsletter.rankingStrategy === "embedding_based" ? "Embedding" : "Author"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {{ weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly" }[newsletter.frequency as string] ?? "Weekly"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(newsletter.lastSearch)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(newsletter.lastIssueDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              onClick={() => setNewslettersCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={newslettersCurrentPage === 1}
            >
              Previous
            </Button>
            <Button
              onClick={() =>
                setNewslettersCurrentPage((prev) => Math.min(prev + 1, newslettersTotalPages))
              }
              disabled={newslettersCurrentPage === newslettersTotalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
