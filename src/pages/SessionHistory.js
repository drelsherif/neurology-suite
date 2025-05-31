import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { ArrowLeft, ClipboardList, Calendar, TrendingUp, Download, Eye, Filter, Search } from 'lucide-react';

const SessionHistory = ({ onPageChange }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock session data
  const mockSessions = [
    {
      id: 'session1',
      testType: 'faceSymmetry',
      testName: 'Face Symmetry',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      duration: '2m 34s',
      status: 'completed',
      summaryResults: { 
        averageFaceSymmetry: '0.923',
        symmetryRange: { min: '0.891', max: '0.967' },
        dataPoints: 157,
        overallScore: 92
      },
      notes: 'Good performance, consistent measurements'
    },
    {
      id: 'session2',
      testType: 'fingerTapSpeed',
      testName: 'Finger Tap Speed',
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
      duration: '1m 45s',
      status: 'completed',
      summaryResults: { 
        finalTapCount: 42,
        averageSpeed: '2.1 taps/sec',
        testDuration: 20,
        overallScore: 85
      },
      notes: 'Slight improvement from last session'
    },
    {
      id: 'session3',
      testType: 'visualTremor',
      testName: 'Visual Tremor',
      timestamp: new Date(Date.now() - 259200000), // 3 days ago
      duration: '2m 12s',
      status: 'completed',
      summaryResults: { 
        averageTremorMagnitude: '0.002341',
        maxTremor: '0.004567',
        tremorStability: '0.887',
        overallScore: 88
      },
      notes: 'Very stable performance'
    },
    {
      id: 'session4',
      testType: 'pupilResponse',
      testName: 'Pupil Response',
      timestamp: new Date(Date.now() - 432000000), // 5 days ago
      duration: '3m 01s',
      status: 'completed',
      summaryResults: { 
        averageConstriction: '24.3%',
        averageResponseTime: '347 ms',
        normalResponses: '4/5',
        overallScore: 91
      },
      notes: 'Normal pupil response detected'
    },
    {
      id: 'session5',
      testType: 'eyeTracking',
      testName: 'Eye Tracking',
      timestamp: new Date(Date.now() - 518400000), // 6 days ago
      duration: '2m 58s',
      status: 'incomplete',
      summaryResults: null,
      notes: 'Test interrupted due to poor lighting'
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setSessions(mockSessions);
      setLoading(false);
    }, 1000);
  }, []);

  const openSessionModal = (session) => {
    setSelectedSession(session);
    setIsSessionModalOpen(true);
  };

  const closeSessionModal = () => {
    setSelectedSession(null);
    setIsSessionModalOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'incomplete': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const filteredSessions = sessions.filter(session => {
    const matchesFilter = filterType === 'all' || session.testType === filterType;
    const matchesSearch = session.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.testType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTestTypeIcon = (testType) => {
    // This would normally import the appropriate icon
    return ClipboardList;
  };

  const testTypes = [...new Set(sessions.map(s => s.testType))];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center text-xl text-slate-300">
          Loading session history...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Button
          onClick={() => onPageChange('home')}
          variant="secondary"
          className="mr-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-blue-300">Session History</h1>
          <p className="text-slate-300 mt-1">Track your neurological test results over time</p>
        </div>
        <Button variant="outline" className="ml-4">
          <Download size={20} className="mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-400">{sessions.length}</div>
          <div className="text-sm text-slate-300">Total Sessions</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-400">
            {sessions.filter(s => s.status === 'completed').length}
          </div>
          <div className="text-sm text-slate-300">Completed</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-400">{testTypes.length}</div>
          <div className="text-sm text-slate-300">Test Types</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {sessions.filter(s => s.summaryResults?.overallScore >= 85).length}
          </div>
          <div className="text-sm text-slate-300">High Scores</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Tests</option>
            {testTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2 flex-1">
          <Search size={20} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 flex-1"
          />
        </div>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList size={64} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">No Sessions Found</h3>
          <p className="text-slate-500">
            {sessions.length === 0 
              ? "Run some tests to start building your session history!" 
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map(session => {
            const TestIcon = getTestTypeIcon(session.testType);
            return (
              <div
                key={session.id}
                className="bg-slate-800 p-6 rounded-lg hover:bg-slate-750 transition-colors cursor-pointer"
                onClick={() => openSessionModal(session)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <TestIcon size={24} className="text-blue-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{session.testName}</h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-300">
                        <span className="flex items-center">
                          <Calendar size={16} className="mr-1" />
                          {session.timestamp.toLocaleDateString()}
                        </span>
                        <span>Duration: {session.duration}</span>
                        <span className={`capitalize ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {session.summaryResults?.overallScore && (
                      <div className={`text-2xl font-bold ${getScoreColor(session.summaryResults.overallScore)}`}>
                        {session.summaryResults.overallScore}%
                      </div>
                    )}
                    <Button variant="outline" size="small" className="mt-2">
                      <Eye size={16} className="mr-1" />
                      View
                    </Button>
                  </div>
                </div>
                
                {session.notes && (
                  <div className="mt-3 text-sm text-slate-400 italic">
                    "{session.notes}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Session Detail Modal */}
      <Modal
        isOpen={isSessionModalOpen}
        title="Session Details"
        onClose={closeSessionModal}
        size="large"
      >
        {selectedSession && (
          <div className="space-y-6">
            {/* Session Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Test Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-slate-400">Test Type:</span> {selectedSession.testName}</p>
                  <p><span className="text-slate-400">Date:</span> {selectedSession.timestamp.toLocaleString()}</p>
                  <p><span className="text-slate-400">Duration:</span> {selectedSession.duration}</p>
                  <p>
                    <span className="text-slate-400">Status:</span> 
                    <span className={`ml-1 capitalize ${getStatusColor(selectedSession.status)}`}>
                      {selectedSession.status}
                    </span>
                  </p>
                </div>
              </div>
              
              {selectedSession.summaryResults?.overallScore && (
                <div>
                  <h4 className="font-semibold text-white mb-2">Performance Score</h4>
                  <div className={`text-4xl font-bold ${getScoreColor(selectedSession.summaryResults.overallScore)}`}>
                    {selectedSession.summaryResults.overallScore}%
                  </div>
                  <div className="text-sm text-slate-400 mt-1">Overall Performance</div>
                </div>
              )}
            </div>

            {/* Detailed Results */}
            {selectedSession.summaryResults && (
              <div>
                <h4 className="font-semibold text-white mb-3">Detailed Results</h4>
                <div className="bg-slate-900 p-4 rounded-lg">
                  <pre className="text-sm text-slate-200 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedSession.summaryResults, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedSession.notes && (
              <div>
                <h4 className="font-semibold text-white mb-2">Notes</h4>
                <p className="text-slate-300 italic">"{selectedSession.notes}"</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-slate-700">
              <Button variant="outline" size="small">
                <Download size={16} className="mr-1" />
                Export Session
              </Button>
              <Button variant="outline" size="small">
                <TrendingUp size={16} className="mr-1" />
                View Trends
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SessionHistory;