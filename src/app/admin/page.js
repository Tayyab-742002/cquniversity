"use client";

import { useState, useEffect } from "react";
import { Users,CheckCheck, User, Clock, Download, Filter } from "lucide-react";
export default function AdminDashboard() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [participantFilter, setParticipantFilter] = useState("all"); // all, research, public
  const [isExporting, setIsExporting] = useState(false);

  // Always start logged out - no auto-login
  useEffect(() => {
    // Clear any saved token on component mount to force fresh login
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    setDashboardData(null);
    setToken("");
    setError("");
  }, []);

  const validateAndLoadData = async (tokenToValidate) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          token: tokenToValidate,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsAuthenticated(true);
        setDashboardData(result.data);
        // No localStorage - always require fresh login
      } else {
        setError(result.error || "Invalid token");
      }
    } catch (err) {
      setError("Failed to connect to server");
      console.error("Validation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError("Please enter the admin token");
      return;
    }
    await validateAndLoadData(token.trim());
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setDashboardData(null);
    setToken("");
    setError("");
  };

  const handleRefresh = async () => {
    if (token) {
      await validateAndLoadData(token);
    } else {
      // Logout
      setIsAuthenticated(false);
      setDashboardData(null);
      setToken("");
      setError("");
      setParticipantFilter("all");
    }
  };

  const exportData = async (filterType = "all") => {
    if (!token) {
      setError("Please log in to export data");
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "export-data",
          token: token,
          filterType: filterType
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        const filterNames = {
          "all": "all_participants",
          "research": "research_participants", 
          "public": "public_participants"
        };
        
        const date = new Date().toISOString().split('T')[0];
        a.download = `psycotest_${filterNames[filterType]}_${date}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError("Failed to export data");
      }
    } catch (err) {
      setError("Failed to export data");
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const viewParticipantDetails = async (participantId) => {
    // Always require fresh token for participant details
    if (!token) {
      setError("Please log in again to view participant details");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "participant-details",
          token: token,
          participantId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSelectedParticipant(result.participant);
        setShowModal(true);
      } else {
        setError("Failed to load participant details");
      }
    } catch (err) {
      setError("Failed to load participant details");
      console.error("Participant details error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedParticipant(null);
  };

  // Filter participants based on selected filter
  const getFilteredParticipants = () => {
    const participants = dashboardData?.participants || [];
    
    switch (participantFilter) {
      case "research":
        return participants.filter(p => p.userType === "research");
      case "public":
        return participants.filter(p => p.userType === "general");
      case "all":
      default:
        return participants;
    }
  };

  // Get statistics for filtered participants
  const getFilteredStats = () => {
    const filteredParticipants = getFilteredParticipants();
    const stats = dashboardData?.stats || {};
    
    // Calculate filtered stats
    const filteredStats = {
      ...stats,
      totalParticipants: filteredParticipants.length,
      activeParticipants: filteredParticipants.filter(p => (p.testsCompleted || 0) > 0).length,
      completedParticipants: filteredParticipants.filter(p => (p.testsCompleted || 0) >= 4).length,
      averageTestsCompleted: filteredParticipants.length > 0 
        ? filteredParticipants.reduce((sum, p) => sum + (p.testsCompleted || 0), 0) / filteredParticipants.length 
        : 0
    };
    
    return filteredStats;
  };

  // Format metric values for display
  const formatMetricValue = (key, value) => {

    // if the key is completedAt or the type of value is date then format the date to dd/mm/yyyy
    if (key === "completedAt") {
      const date = new Date(value);
      if (isNaN(date)) return "Invalid Date"; // optional handling
      return date.toLocaleDateString("en-GB");
    }

    // Handle null/undefined values
    if (value === null || value === undefined) return "N/A";

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return "Empty Array";
      if (value.length <= 3) {
        return value
          .map((v) => (typeof v === "object" ? JSON.stringify(v) : v))
          .join(", ");
      }
      return `Array (${value.length} items)`;
    }

    // Handle objects
    if (typeof value === "object") {
      if (Object.keys(value).length === 0) return "Empty Object";

      // it should return the value of the object as a string 
      return value;
     
    }

    // Handle numbers with proper formatting
    if (typeof value === "number") {
      // Time-related metrics
      if (
        key.toLowerCase().includes("time") ||
        key.toLowerCase().includes("rt") ||
        key.toLowerCase().includes("latency") ||
        key.toLowerCase().includes("duration")
      ) {
        return `${Math.round(value)}ms`;
      }

      // Percentage/accuracy metrics
      if (
        key.toLowerCase().includes("accuracy") ||
        key.toLowerCase().includes("percent") ||
        key.toLowerCase().includes("rate") ||
        (value <= 1 && value >= 0 && key.toLowerCase().includes("proportion"))
      ) {
        return `${value.toFixed(2)}%`;
      }

      // Regular numbers
      return Math.round(value * 100) / 100;
    }

    // Handle strings and other types
    return value.toString();
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen px-4 flex items-center justify-center">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-300">
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-2 text-sm">
              Secure access to CQUniversity research analytics
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
              <div className="flex">
                <svg
                  className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Admin Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Enter your admin token"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition duration-200 text-sm sm:text-base"
            >
              {isLoading ? "Authenticating..." : "Access Dashboard"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Authorized personnel only</p>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Screen
  const stats = getFilteredStats();
  const participants = getFilteredParticipants();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
                CQUniversity Admin
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">Research Dashboard & Analytics</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleRefresh}
                className="bg-gray-100 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-200 transition duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Logout</span>
              </button>
              <button
                onClick={() => exportData("all")}
                disabled={isExporting}
                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export CSV"}</span>
                <span className="sm:hidden">{isExporting ? "..." : "Export"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  Total Participants
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {stats.totalParticipants || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  Tests Completed
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {stats.completedTests || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                <CheckCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Average Age</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                  {stats.averageAge || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                <User className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                  Today's Tests
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                  {stats.todaysTests || 0}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Test Types Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              Test Completion Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.testTypes || {}).map(([testId, count]) => (
                <div key={testId} className="flex justify-between items-center">
                  <span className="text-gray-700 capitalize text-sm sm:text-base truncate flex-1 mr-3">
                    {testId
                      .replace(/([A-Z])/g, " $1")
                      .replace("Test", "")
                      .trim()}
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (count /
                              Math.max(
                                ...Object.values(stats.testTypes || {}),
                                1
                              )) *
                              100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="font-semibold text-gray-800 min-w-[1.5rem] sm:min-w-[2rem] text-sm sm:text-base">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demographics */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              Demographics
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  Gender Distribution
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.genderBreakdown || {}).map(
                    ([gender, count]) => (
                      <div
                        key={gender}
                        className="flex justify-between text-sm"
                      >
                        <span className="capitalize text-gray-600">
                          {gender.replace(/-/g, " ")}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  Education Level
                </h4>
                <div className="space-y-2">
                  {Object.entries(stats.educationBreakdown || {}).map(
                    ([education, count]) => (
                      <div
                        key={education}
                        className="flex justify-between text-sm"
                      >
                        <span className="capitalize text-gray-600">
                          {education.replace(/-/g, " ")}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Filter and Export Controls */}
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Participants ({participants.length})
                </h2>
                
                {/* Filter Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto">
                  <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                    <button
                      onClick={() => setParticipantFilter("all")}
                      className={`px-2 sm:px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                        participantFilter === "all"
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span className="hidden sm:inline">All ({dashboardData?.participants?.length || 0})</span>
                      <span className="sm:hidden">All</span>
                    </button>
                    <button
                      onClick={() => setParticipantFilter("research")}
                      className={`px-2 sm:px-3 py-1 text-xs font-medium transition-colors border-l border-gray-200 whitespace-nowrap ${
                        participantFilter === "research"
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span className="hidden sm:inline">Research ({dashboardData?.participants?.filter(p => p.userType === "research").length || 0})</span>
                      <span className="sm:hidden">Research</span>
                    </button>
                    <button
                      onClick={() => setParticipantFilter("public")}
                      className={`px-2 sm:px-3 py-1 text-xs font-medium transition-colors border-l border-gray-200 whitespace-nowrap ${
                        participantFilter === "public"
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <span className="hidden sm:inline">Public ({dashboardData?.participants?.filter(p => p.userType === "general").length || 0})</span>
                      <span className="sm:hidden">Public</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-sm text-gray-600">Export:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => exportData("all")}
                    disabled={isExporting}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    All
                  </button>
                  <button
                    onClick={() => exportData("research")}
                    disabled={isExporting}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    Research
                  </button>
                  <button
                    onClick={() => exportData("public")}
                    disabled={isExporting}
                    className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3 h-3" />
                    Public
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Demographics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Study Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant, index) => (
                  <tr
                    key={participant.id || index}
                    className="hover:bg-gray-50 transition duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {participant.name || "Unknown User"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {participant.email || "No email"}
                        </div>
                        {participant.participantCode && (
                          <div className="text-xs text-blue-600 font-mono">
                            Code: {participant.participantCode}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          participant.userType === "research"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {participant.userType === "research" ? "Research" : "Public"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="space-y-1">
                        <div>Age: {participant.age || "N/A"}</div>
                        <div>Gender: {participant.gender || "N/A"}</div>
                        <div>
                          Education:{" "}
                          {(participant.education || "N/A").replace(/-/g, " ")}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          participant.studyStatus === "completed"
                            ? "bg-green-100 text-green-800"
                            : participant.studyStatus === "in-progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {(participant.studyStatus || "registered").replace(
                          /-/g,
                          " "
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {participant.testsCompleted || 0} / 4 tests
                        </div>
                        <div className="ml-3 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                ((participant.testsCompleted || 0) / 4) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {participant.registeredAt
                        ? new Date(
                            participant.registeredAt
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => viewParticipantDetails(participant.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition duration-200 text-xs font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            <div className="space-y-4 p-4">
              {participants.map((participant, index) => (
                <div
                  key={participant.id || index}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {participant.name || "Unknown User"}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {participant.email || "No email"}
                          </p>
                          {participant.participantCode && (
                            <p className="text-xs text-blue-600 font-mono">
                              Code: {participant.participantCode}
                            </p>
                          )}
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 flex-shrink-0 ${
                            participant.userType === "research"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {participant.userType === "research" ? "Research" : "Public"}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Age:</span> {participant.age || "N/A"}
                        </div>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Gender:</span> {participant.gender || "N/A"}
                        </div>
                        <div className="text-xs text-gray-600 sm:col-span-2">
                          <span className="font-medium">Education:</span>{" "}
                          {(participant.education || "N/A").replace(/-/g, " ")}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full self-start ${
                            participant.studyStatus === "completed"
                              ? "bg-green-100 text-green-800"
                              : participant.studyStatus === "in-progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {(participant.studyStatus || "registered").replace(/-/g, " ")}
                        </span>
                        
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Registered:</span>{" "}
                          {participant.registeredAt
                            ? new Date(participant.registeredAt).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <span className="text-xs font-medium text-gray-900 mr-2">
                            {participant.testsCompleted || 0} / 4 tests
                          </span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${((participant.testsCompleted || 0) / 4) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => viewParticipantDetails(participant.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition duration-200 text-xs font-medium ml-3"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Participant Details Modal */}
      {showModal && selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 border-b border-gray-200 gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Participant Details
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Complete profile and test results
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition duration-200 self-end sm:self-auto"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)]">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Name
                      </label>
                      <p className="text-gray-900">
                        {selectedParticipant.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Email
                      </label>
                      <p className="text-gray-900">
                        {selectedParticipant.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Age
                      </label>
                      <p className="text-gray-900">
                        {selectedParticipant.age || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Gender
                      </label>
                      <p className="text-gray-900 capitalize">
                        {(selectedParticipant.gender || "N/A").replace(
                          /-/g,
                          " "
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Education Level
                      </label>
                      <p className="text-gray-900 capitalize">
                        {(selectedParticipant.education || "N/A").replace(
                          /-/g,
                          " "
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Study Status
                      </label>
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          selectedParticipant.studyStatus === "completed"
                            ? "bg-green-100 text-green-800"
                            : selectedParticipant.studyStatus === "in-progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {(
                          selectedParticipant.studyStatus || "registered"
                        ).replace(/-/g, " ")}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Registration Date
                      </label>
                      <p className="text-gray-900">
                        {selectedParticipant.registeredAt
                          ? new Date(
                              selectedParticipant.registeredAt
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Participant ID
                      </label>
                      <p className="text-gray-900 font-mono text-sm">
                        {selectedParticipant.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Test Progress Summary */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Test Progress Summary
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Tests Completed
                      </label>
                      <div className="flex items-center mt-1">
                        <p className="text-xl sm:text-2xl font-bold text-blue-600 mr-3">
                          {selectedParticipant.testsCompleted?.length || 0} / 4
                        </p>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                ((selectedParticipant.testsCompleted?.length ||
                                  0) /
                                  4) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">
                        Completed Tests
                      </label>
                      <div className="mt-1">
                        {selectedParticipant.testsCompleted &&
                        selectedParticipant.testsCompleted.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {selectedParticipant.testsCompleted.map(
                              (testId, index) => (
                                <span
                                  key={index}
                                  className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded"
                                >
                                  {testId
                                    .replace(/([A-Z])/g, " $1")
                                    .replace("Test", "")
                                    .trim()}
                                </span>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No tests completed yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Results */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-200 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Detailed Test Results (
                    {selectedParticipant.testResults?.length || 0})
                  </h3>

                  {selectedParticipant.testResults &&
                  selectedParticipant.testResults.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {selectedParticipant.testResults.map((result, index) => (
                        <div key={index} className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 capitalize">
                                {result.testId
                                  .replace(/([A-Z])/g, " $1")
                                  .replace("Test", "")
                                  .trim()}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Completed:{" "}
                                {new Date(
                                  result.completedAt || result.timestamp
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                              Completed
                            </span>
                          </div>

                          {/* Test Metrics */}
                          {result.metrics && (
                            <div className="bg-gray-50 rounded-lg p-3 mt-3">
                              <h5 className="font-bold text-purple-600 mb-2 text-left">
                                Performance Metrics
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {Object.entries(result.metrics).map(
                                  ([key, value]) => (
                                    <div key={key} className="text-center">
                                      <p className="text-xs text-pink-600 uppercase tracking-wide font-bold text-left mb-2">
                                        {key
                                          .replace(/([A-Z])/g, " $1")
                                          .replace(/_/g, " ")
                                          .trim()}
                                      </p>
                                     
                                        {typeof formatMetricValue(key, value) ===
                                        "object"
                                          ? // we have to format the object we have to separate the keys and value and show them in columns
                                          <div className="grid grid-cols-1 gap-2 text-left">
                                            {Object.entries(formatMetricValue(key, value)).map(([k, v]) => (
                                              <div key={k}>
                                                <span className="text-gray-500 text-sm">{k}:</span>
                                                <span className="ml-1 text-sm text-gray-800 font-bold">{v}</span>
                                              </div>
                                            ))}
                                          </div>
                                          :  <p className="text-sm font-semibold text-gray-900 text-left">{formatMetricValue(key, value)}</p>
                                      }
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                          {/* Raw Data Summary */}
                          {result.rawData && (
                            <div className="mt-3">
                              <details className="group">
                                <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                                  View Raw Data (
                                  {Array.isArray(result.rawData)
                                    ? `${result.rawData.length} trials`
                                    : "Data object"}
                                  )
                                </summary>
                                <div className="mt-2 bg-gray-100 rounded p-3 text-xs">
                                  {Array.isArray(result.rawData) &&
                                  result.rawData.length > 0 ? (
                                    <div className="space-y-2">
                                      <div className="text-gray-600 font-medium mb-2">
                                        Trial Data Summary (first 5 trials):
                                      </div>
                                      {result.rawData
                                        .slice(0, 5)
                                        .map((trial, idx) => (
                                          <div
                                            key={idx}
                                            className="border-l-2 border-blue-200 pl-2"
                                          >
                                            <div className="font-medium text-gray-700">
                                              Trial {idx + 1}:
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                              {Object.entries(trial)
                                                .slice(0, 6)
                                                .map(([k, v]) => (
                                                  <div key={k}>
                                                    <span className="text-gray-500">
                                                      {k}:
                                                    </span>
                                                    <span className="ml-1 text-gray-800">
                                                      {typeof v === "object"
                                                        ? JSON.stringify(v)
                                                        : v}
                                                    </span>
                                                  </div>
                                                ))}
                                            </div>
                                          </div>
                                        ))}
                                      {result.rawData.length > 5 && (
                                        <div className="text-gray-500 text-center mt-2">
                                          ... and {result.rawData.length - 5}{" "}
                                          more trials
                                        </div>
                                      )}
                                      <details className="mt-3">
                                        <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                                          View Complete Raw JSON
                                        </summary>
                                        <pre className="whitespace-pre-wrap text-gray-700 max-h-40 overflow-y-auto mt-2 bg-white p-2 rounded border">
                                          {JSON.stringify(
                                            result.rawData,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </details>
                                    </div>
                                  ) : (
                                    <pre className="whitespace-pre-wrap text-gray-700 max-h-40 overflow-y-auto">
                                      {JSON.stringify(result.rawData, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <svg
                        className="w-12 h-12 text-gray-400 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-gray-500">No test results available</p>
                      <p className="text-sm text-gray-400 mt-1">
                        This participant hasn't completed any tests yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end items-center p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeModal}
                className="bg-gray-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-700 transition duration-200 text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 