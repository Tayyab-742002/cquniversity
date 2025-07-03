'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Check admin authentication
  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      setAdminToken(token);
      verifyAdminAccess(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyAdminAccess = async (token) => {
    try {
      const response = await axios.post('/api/admin/verify', { token });
      if (response.data.success) {
        setAuthenticated(true);
        loadDashboardData();
      } else {
        setError('Invalid admin credentials');
        sessionStorage.removeItem('adminToken');
      }
    } catch (err) {
      setError('Authentication failed');
      sessionStorage.removeItem('adminToken');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/admin/login', { token: adminToken });
      if (response.data.success) {
        sessionStorage.setItem('adminToken', adminToken);
        setAuthenticated(true);
        loadDashboardData();
      } else {
        setError('Invalid admin token');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = sessionStorage.getItem('adminToken');
      const [participantsRes, statsRes] = await Promise.all([
        axios.get('/api/admin/participants', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      setParticipants(participantsRes.data.participants);
      setStats(statsRes.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    }
  };

  const exportAllData = async () => {
    setExportLoading(true);
    try {
      const token = sessionStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/export', {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `psycotest_data_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data');
    } finally {
      setExportLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('adminToken');
    setAuthenticated(false);
    setAdminToken('');
    setParticipants([]);
    setStats({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Dashboard</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Admin Token
              </label>
              <input
                type="password"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin token"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">PsycoTest Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={exportAllData}
              disabled={exportLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {exportLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              Export CSV
            </button>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Participants</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalParticipants || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Completed Tests</h3>
            <p className="text-3xl font-bold text-green-600">{stats.completedTests || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Avg Age</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.averageAge || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Today's Tests</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.todaysTests || 0}</p>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Participants</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Demographics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tests Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                        <div className="text-sm text-gray-500">{participant.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Age: {participant.age}, {participant.gender}
                      </div>
                      <div className="text-sm text-gray-500">{participant.educationLevel}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(participant.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {participant.completedTests?.map((test) => (
                          <span key={test} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {test.replace('Test', '')}
                          </span>
                        )) || <span className="text-gray-400 text-sm">None</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedParticipant(participant)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Participant Details Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Participant Details: {selectedParticipant.name}
              </h3>
              <button
                onClick={() => setSelectedParticipant(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Personal Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedParticipant.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedParticipant.email}</p>
                  <p><span className="font-medium">Age:</span> {selectedParticipant.age}</p>
                  <p><span className="font-medium">Gender:</span> {selectedParticipant.gender}</p>
                  <p><span className="font-medium">Education:</span> {selectedParticipant.educationLevel}</p>
                  <p><span className="font-medium">Registered:</span> {new Date(selectedParticipant.registeredAt).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Test Results</h4>
                {selectedParticipant.testResults && selectedParticipant.testResults.length > 0 ? (
                  <div className="space-y-3">
                    {selectedParticipant.testResults.map((result, index) => (
                      <div key={index} className="border rounded p-3">
                        <h5 className="font-medium text-gray-800 mb-1">
                          {result.testId.replace('Test', ' Test')}
                        </h5>
                        <p className="text-sm text-gray-600 mb-2">
                          Completed: {new Date(result.completedAt).toLocaleString()}
                        </p>
                        {result.metrics && (
                          <div className="text-xs text-gray-500">
                            {Object.entries(result.metrics).slice(0, 3).map(([key, value]) => (
                              <span key={key} className="mr-3">
                                {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No test results available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 