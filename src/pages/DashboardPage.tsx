import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  LogOut, 
  User, 
  Activity, 
  FileText, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import FileUpload from '../components/FileUpload';
import { backendApi } from '../services/backendApi';

interface AnalysisResult {
  id: string;
  fileId?: string;
  fileName: string;
  status: 'pending' | 'scanning' | 'completed' | 'malware';
  uploadTime: Date | string;
  threatLevel?: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  threatType?: string;
  fileSize?: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
      const interval = setInterval(loadHistory, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await backendApi.getHistory();
      setAnalysisResults(
        (data.items || []).map(item => ({
          id: String(item.id || ''),
          fileId: item.fileId ? String(item.fileId) : undefined,
          fileName: String(item.fileName || 'Unknown'),
          status: item.status || 'pending',
          uploadTime: item.uploadTime ? new Date(item.uploadTime) : new Date(),
          threatLevel: item.threatLevel || 'safe',
          threatType: item.threatType || '',
          fileSize: item.fileSize || 0,
        }))
      );
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getStatusIcon = (status: AnalysisResult['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'malware':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'scanning':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getThreatBadge = (level?: AnalysisResult['threatLevel']) => {
    const levelStr = String(level ?? '');
    if (!levelStr || levelStr === 'undefined' || levelStr === 'null') return null;
    
    const styles: Record<string, string> = {
      safe: 'bg-green-100 text-green-700',
      low: 'bg-yellow-100 text-yellow-700',
      medium: 'bg-orange-100 text-orange-700',
      high: 'bg-red-100 text-red-700',
      critical: 'bg-red-600 text-white',
    };

    const displayText = levelStr === 'critical' ? 'NGUY HIỂM' : levelStr.toUpperCase();
    const style = styles[levelStr] || 'bg-gray-100 text-gray-700';

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
        {displayText}
      </span>
    );
  };

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Malware Detection</h1>
                <p className="text-xs text-gray-500">AWS Powered Analysis</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analysisResults.length}</p>
                <p className="text-sm text-gray-500">Tổng file</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {analysisResults.filter(r => r.status === 'completed' && r.threatLevel === 'safe').length}
                </p>
                <p className="text-sm text-gray-500">An toàn</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {analysisResults.filter(r => r.status === 'malware').length}
                </p>
                <p className="text-sm text-gray-500">Phát hiện mã độc</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {analysisResults.filter(r => r.status === 'scanning' || r.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-500">Đang quét</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8 px-6">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'upload'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Lịch sử phân tích
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'upload' ? (
              <FileUpload />
            ) : (
              <div className="space-y-4">
                {isLoadingHistory && analysisResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-500">Đang tải lịch sử...</p>
                  </div>
                ) : analysisResults.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có file nào được phân tích</p>
                  </div>
                ) : (
                  analysisResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {getStatusIcon(result.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(result.uploadTime)}
                        </p>
                      </div>
                      {getThreatBadge(result.threatLevel)}
                      {result.threatType && (
                        <span className="text-xs text-gray-500">
                          {result.threatType}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
