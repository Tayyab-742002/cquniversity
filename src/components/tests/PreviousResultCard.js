import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, RotateCcw, ArrowLeft, Calendar, Clock } from 'lucide-react';

export default function PreviousResultCard({ 
  testName, 
  testId, 
  result, 
  onRetake, 
  formatResults 
}) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);



  if (!result) {
    return null;
  }

  const formattedResult = formatResults ? formatResults(result) : result;
  
  const completedDate = new Date(result.completedAt || result.metrics?.completedAt || new Date());

  const getTestMetrics = () => {
    switch (testId) {
      case 'stroopTest':
        const stroopMetrics = [
          { label: 'Total Trials', value: formattedResult.totalTrials || 0 },
          { label: 'Accuracy', value: `${formattedResult.accuracy || 0}%` },
          { label: 'Avg Response Time', value: `${formattedResult.averageRT || 0}ms` },
          { label: 'Stroop Effect', value: `${formattedResult.stroopEffect || 0}ms` }
        ];
        return stroopMetrics;
      case 'trailMakingTest':
        return [
          { label: 'Trial A Time', value: `${formattedResult.trialA?.time?.toFixed(2) || 0}s` },
          { label: 'Trial B Time', value: `${formattedResult.trialB?.time?.toFixed(2) || 0}s` },
          { label: 'B-A Difference', value: `${formattedResult.bMinusA?.toFixed(2) || 0}s` },
          { label: 'Total Errors', value: (formattedResult.trialA?.errors || 0) + (formattedResult.trialB?.errors || 0) }
        ];
      case 'corsiBlocksTest':
        return [
          { label: 'Forward Span', value: formattedResult.forwardSpan || 0 },
          { label: 'Backward Span', value: formattedResult.backwardSpan || 0 },
          { label: 'Total Span', value: formattedResult.totalSpan || 0 },
          { label: 'Overall Accuracy', value: `${formattedResult.accuracy || 0}%` }
        ];
      case 'fivePointsTest':
        return [
          { label: 'New Designs', value: formattedResult.newDesigns || 0 },
          { label: 'Total Designs', value: formattedResult.totalDesigns || 0 },
          { label: 'Repetitions', value: formattedResult.repetitions || 0 },
          { label: 'Mistakes', value: formattedResult.mistakes || 0 }
        ];
      default:
        return [];
    }
  };

  const metrics = getTestMetrics();

  return (
    <div className="max-w-4xl mx-auto py-6 px-2 sm:px-4">
      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-border px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Test Already Completed</h2>
                <p className="text-muted-foreground text-sm sm:text-base">{testName}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4 mr-1" />
                {completedDate.toLocaleDateString()}
              </div>
              <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                {completedDate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {metrics.slice(0, 4).map((metric, index) => (
              <div 
                key={index}
                className="text-center p-3 sm:p-4 bg-muted/30 rounded-lg border border-border"
              >
                <div className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                  {metric.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Results Toggle */}
          {metrics.length > 4 && (
            <div className="mb-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                {showDetails ? 'Hide Details' : 'Show More Details'}
              </button>
              
              {showDetails && (
                <div className="mt-4 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {metrics.slice(4).map((metric, index) => (
                    <div 
                      key={index}
                      className="text-center p-2 sm:p-3 bg-muted/20 rounded-lg"
                    >
                      <div className="text-base sm:text-lg font-semibold text-foreground">
                        {metric.value}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/tests')}
              className="flex items-center justify-center px-6 py-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 