import { useState, useEffect } from "react";
import { useAxios } from "../lib/axios";
import { Search } from "lucide-react"; // Added Search icon import
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button"; // Added Button import
import { Input } from "./ui/input";

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
  const [usersPerPage] = useState(10); // Number of users per page
  const [usersSearchQuery, setUsersSearchQuery] = useState(""); // Search query for users
  const [allNewsletters, setAllNewsletters] = useState<any[]>([]);
  const [newslettersCurrentPage, setNewslettersCurrentPage] = useState(1);
  const [newslettersPerPage] = useState(10); // Number of newsletters per page
  const [newslettersSearchQuery, setNewslettersSearchQuery] = useState(""); // Search query for newsletters

  // Derived state for users pagination and filtering
  const filteredUsers = usersData.filter(user =>
    user.name?.toLowerCase().includes(usersSearchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(usersSearchQuery.toLowerCase())
  );
  const indexOfLastUser = usersCurrentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const usersTotalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Derived state for newsletters pagination and filtering
  const filteredNewsletters = allNewsletters.filter(newsletter =>
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
  const axios = useAxios();

  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'Never';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch total counts
        const [usersCountResponse, newslettersCountResponse, issuesCountResponse, papersCountResponse, activeUsersResponse, allNewslettersResponse] = await Promise.all([
          axios.get(`/users/count`),
          axios.get(`/newsletters/count`),
          axios.get(`/issues/count`),
          axios.get(`/papers/count`),
          axios.get(`/users/active-count`),
          axios.get(`/newsletters/all`), // Fetch all newsletters using the admin route
        ]);

        setStats({
          totalUsers: usersCountResponse.data.count,
          totalNewsletters: newslettersCountResponse.data.count,
          totalIssues: issuesCountResponse.data.count,
          totalPapers: papersCountResponse.data.count,
          activeUsers: activeUsersResponse.data.activeUsers,
        });

        // Fetch users with newsletter counts
        const usersDataResponse = await axios.get(`/users/with-newsletter-count`);
        setUsersData(usersDataResponse.data);

        setAllNewsletters(allNewslettersResponse.data); // Set all newsletters

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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="mb-6">Admin Dashboard</h1>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading stats...</div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">Error: {error}</div>
      ) : (
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
            <h3 className="text-lg font-semibold">Active Users (last 7 days)</h3>
            <p className="text-3xl font-bold text-primary mt-2">{stats.activeUsers}</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <button onClick={onBack} className="text-primary hover:underline">
          Back to Dashboard
        </button>
      </div>

      <h2 className="text-2xl font-bold mt-10 mb-4">Users Overview</h2>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name or email..."
          value={usersSearchQuery}
          onChange={(e) => {
            setUsersSearchQuery(e.target.value);
            setUsersCurrentPage(1); // Reset to first page on search
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
                    <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
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
      <h2 className="text-2xl font-bold mt-10 mb-4">Newsletters Overview</h2>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search newsletters by topic, description, or field..."
          value={newslettersSearchQuery}
          onChange={(e) => {
            setNewslettersSearchQuery(e.target.value);
            setNewslettersCurrentPage(1); // Reset to first page on search
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
                  <TableHead>Creator</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentNewsletters.map((newsletter) => (
                  <TableRow key={newsletter._id}>
                    <TableCell className="font-medium">{newsletter.topic}</TableCell>
                    <TableCell>{newsletter.creatorName || 'N/A'}</TableCell>
                    <TableCell>{newsletter.issueCount}</TableCell>
                    <TableCell>{newsletter.field || 'N/A'}</TableCell>
                    <TableCell>{new Date(newsletter.createdAt).toLocaleDateString()}</TableCell>
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
              onClick={() => setNewslettersCurrentPage((prev) => Math.min(prev + 1, newslettersTotalPages))}
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
