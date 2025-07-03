import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function SyncProgressButton({ onSyncComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/participants/sync-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`✅ Synced ${data.participant.completedCount}/${data.participant.totalTests} tests`);
        if (onSyncComplete) {
          onSyncComplete(data.participant);
        }
      } else {
        setMessage(`❌ ${data.error || 'Failed to sync progress'}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      setMessage('❌ Network error occurred');
    } finally {
      setIsLoading(false);
      // Clear message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Syncing...' : 'Sync Progress'}
      </button>
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
    </div>
  );
} 