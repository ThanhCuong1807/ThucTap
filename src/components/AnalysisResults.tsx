import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Shield,
  AlertCircle,
  TrendingUp,
  FileText,
  Zap,
  Network,
  Edit3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ThreatAnalysis } from '../services/backendApi';
import {
  getThreatDescription,
  getThreatColor,
  calculateRiskScore,
  formatFileSize,
  formatDateTime,
  getThreatRecommendation,
} from '../services/threatAnalysisUtils';

interface AnalysisResultsProps {
  analysis: ThreatAnalysis;
  isLoading?: boolean;
}

export default function AnalysisResults({ analysis, isLoading = false }: AnalysisResultsProps) {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const threatColor = getThreatColor(analysis.threatLevel);
  const riskScore = calculateRiskScore(analysis.threatLevel);
  const recommendation = getThreatRecommendation(analysis.threatLevel);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'malware':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'scanning':
        return <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusTexts: { [key: string]: string } = {
      pending: 'Chờ xử lý',
      scanning: 'Đang quét...',
      completed: 'An toàn',
      malware: 'Phát hiện mã độc',
    };
    return statusTexts[status] || status;
  };

  const SectionButton = ({
    title,
    icon: Icon,
    badge,
    section,
    children,
  }: {
    title: string;
    icon: React.ReactNode;
    badge: number | string;
    section: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections[section];
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection(section)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="text-gray-600">{Icon}</div>
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
              {badge}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {isExpanded && children}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Đang phân tích file...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className={`border-2 rounded-xl p-6 ${threatColor}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">{getStatusIcon(analysis.status)}</div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">{getStatusText(analysis.status)}</h3>
            <p className="text-sm opacity-90 mb-3">{getThreatDescription(analysis.threatLevel)}</p>
            <div className="text-3xl font-bold">{analysis.threatLevel.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* File Info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Thông Tin File</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Tên file</p>
              <p className="font-semibold text-gray-900 break-all">{analysis.fileName}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Zap className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Kích thước</p>
              <p className="font-semibold text-gray-900">{formatFileSize(analysis.fileSize || 0)}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm text-gray-500">File ID</p>
              <p className="font-mono text-sm text-gray-900 break-all">{analysis.fileId}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Thời gian upload</p>
              <p className="font-semibold text-gray-900">{formatDateTime(analysis.uploadTime)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Score */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Risk Score</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    riskScore <= 25
                      ? 'bg-green-500'
                      : riskScore <= 50
                        ? 'bg-yellow-500'
                        : riskScore <= 75
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                  }`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 w-12 text-right">{riskScore}%</div>
          </div>
        </div>
      </div>

      {/* Analysis Details */}
      {analysis.analysisDetails && (
        <div className="space-y-3">
          {/* Detected Signatures */}
          {analysis.analysisDetails.detectedSignatures?.length > 0 && (
            <SectionButton
              title="Chữ ký Phát Hiện"
              icon={<AlertTriangle className="w-5 h-5" />}
              badge={analysis.analysisDetails.detectedSignatures.length}
              section="signatures"
            >
              <div className="px-6 py-4 bg-red-50 border-t border-gray-200">
                <ul className="space-y-2">
                  {analysis.analysisDetails.detectedSignatures.map((sig, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex gap-2">
                      <span className="font-semibold flex-shrink-0">•</span>
                      <span className="font-mono break-all">{sig}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionButton>
          )}

          {/* Behavior Indicators */}
          {analysis.analysisDetails.behaviorIndicators?.length > 0 && (
            <SectionButton
              title="Chỉ Báo Hành Vi"
              icon={<Zap className="w-5 h-5" />}
              badge={analysis.analysisDetails.behaviorIndicators.length}
              section="behaviors"
            >
              <div className="px-6 py-4 bg-yellow-50 border-t border-gray-200">
                <ul className="space-y-2">
                  {analysis.analysisDetails.behaviorIndicators.map((behavior, idx) => (
                    <li key={idx} className="text-sm text-yellow-800 flex gap-2">
                      <span className="font-semibold flex-shrink-0">•</span>
                      <span>{behavior}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionButton>
          )}

          {/* Suspicious APIs */}
          {analysis.analysisDetails.suspiciousAPIs?.length > 0 && (
            <SectionButton
              title="API Đáng Ngờ"
              icon={<Edit3 className="w-5 h-5" />}
              badge={analysis.analysisDetails.suspiciousAPIs.length}
              section="apis"
            >
              <div className="px-6 py-4 bg-orange-50 border-t border-gray-200">
                <ul className="space-y-2">
                  {analysis.analysisDetails.suspiciousAPIs.map((api, idx) => (
                    <li key={idx} className="text-sm text-orange-800 flex gap-2">
                      <span className="font-semibold flex-shrink-0">•</span>
                      <span className="font-mono break-all">{api}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionButton>
          )}

          {/* Network Connections */}
          {analysis.analysisDetails.networkConnections?.length > 0 && (
            <SectionButton
              title="Kết Nối Mạng"
              icon={<Network className="w-5 h-5" />}
              badge={analysis.analysisDetails.networkConnections.length}
              section="network"
            >
              <div className="px-6 py-4 bg-blue-50 border-t border-gray-200">
                <ul className="space-y-2">
                  {analysis.analysisDetails.networkConnections.map((conn, idx) => (
                    <li key={idx} className="text-sm text-blue-800 flex gap-2">
                      <span className="font-semibold flex-shrink-0">•</span>
                      <span className="font-mono break-all">{conn}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionButton>
          )}
        </div>
      )}

      {/* Confidence & Timestamp */}
      {analysis.analysisDetails && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {analysis.analysisDetails.confidence !== undefined && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Độ Tin Cậy</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${analysis.analysisDetails.confidence}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    {analysis.analysisDetails.confidence}%
                  </span>
                </div>
              </div>
            )}
            {analysis.analysisDetails.timestamp && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Thời Gian Phân Tích</p>
                <p className="font-semibold text-gray-900">{formatDateTime(analysis.analysisDetails.timestamp)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div
        className={`border-2 rounded-xl p-6 ${
          analysis.threatLevel === 'safe'
            ? 'bg-green-50 border-green-300'
            : analysis.threatLevel === 'critical'
              ? 'bg-red-900 border-red-700'
              : 'bg-red-50 border-red-300'
        }`}
      >
        <div className="flex gap-3 items-start">
          {analysis.threatLevel === 'safe' ? (
            <CheckCircle className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
              analysis.threatLevel === 'safe' ? 'text-green-600' : 'text-red-600'
            }`} />
          ) : (
            <AlertCircle
              className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                analysis.threatLevel === 'critical' ? 'text-white' : 'text-red-600'
              }`}
            />
          )}
          <div>
            <h4 className={`font-semibold mb-2 ${
              analysis.threatLevel === 'safe'
                ? 'text-green-900'
                : analysis.threatLevel === 'critical'
                  ? 'text-white'
                  : 'text-red-900'
            }`}>
              {recommendation.title}
            </h4>
            <p className={`text-sm ${
              analysis.threatLevel === 'safe'
                ? 'text-green-800'
                : analysis.threatLevel === 'critical'
                  ? 'text-red-100'
                  : 'text-red-800'
            }`}>
              {recommendation.message}
            </p>
            <div className={`mt-3 inline-block px-3 py-2 rounded font-semibold text-sm ${
              analysis.threatLevel === 'safe'
                ? 'bg-green-200 text-green-900'
                : analysis.threatLevel === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-200 text-red-900'
            }`}>
              {recommendation.action}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
