import { useState, useEffect } from "react";
import { useAxios } from "../lib/axios";

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNewsletters: 0,
    totalIssues: 0,
    totalPapers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const axios = useAxios();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        // Fetch total users
        const usersResponse = await axios.get(`/users/count`);
        // Fetch total newsletters
        const newslettersResponse = await axios.get(`/newsletters/count`);
        // Fetch total issues
        const issuesResponse = await axios.get(`/issues/count`);
        // Fetch total papers
        const papersResponse = await axios.get(`/papers/count`);

        setStats({
          totalUsers: usersResponse.data.count,
          totalNewsletters: newslettersResponse.data.count,
          totalIssues: issuesResponse.data.count,
          totalPapers: papersResponse.data.count,
        });
        setError(null);
      } catch (err) {
        setError("Failed to fetch admin stats.");
        console.error("Error fetching admin stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [axios]);

  return (
    <div className="container mx-auto p-6">
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
        </div>
      )}

      <div className="mt-8">
        <button onClick={onBack} className="text-primary hover:underline">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
