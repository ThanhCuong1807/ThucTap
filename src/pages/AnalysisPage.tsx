import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AnalysisResults from '../components/AnalysisResults';
import { ThreatAnalysis, backendApi } from '../services/backendApi';

export default function AnalysisPage() {
  const { fileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [analysis, setAnalysis] = useState<ThreatAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!fileId) {
      navigate('/dashboard');
      return;
    }

    loadAnalysis();
  }, [fileId, isAuthenticated, authLoading]);

  const loadAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Lấy kết quả hiện tại
      const result = await backendApi.getResult(fileId!);
      setAnalysis(result);

      // Nếu đang xử lý, bắt đầu polling
      if (result.status === 'pending' || result.status === 'scanning') {
        setIsPolling(true);
        try {
          const finalResult = await backendApi.pollAnalysisResult(fileId!, 120, 3000);
          setAnalysis(finalResult);
        } catch (pollError: any) {
          setError(`Lỗi khi đợi kết quả: ${pollError.message}`);
        } finally {
          setIsPolling(false);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết phân tích');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAnalysis();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải thông tin phân tích...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Kết Quả Phân Tích</h1>
            <p className="text-xs text-gray-500 font-mono">{fileId}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isPolling}
            className="ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${isPolling ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">
              <strong>Lỗi:</strong> {error}
            </p>
            <button
              onClick={handleRefresh}
              className="mt-3 text-sm text-red-600 hover:text-red-700 underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {analysis && (
          <>
            {isPolling && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Đang phân tích file...</p>
                  <p className="text-xs text-blue-700 mt-1">Vui lòng chờ, quá trình này có thể mất vài phút</p>
                </div>
              </div>
            )}

            <AnalysisResults analysis={analysis} isLoading={isPolling} />
          </>
        )}
      </main>
    </div>
  );
}
