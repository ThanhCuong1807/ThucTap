import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPasswordPage() {
  const { forgotPassword, resetPassword, isLoading, error, clearError } = useAuth();
  
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email) {
      setFormError('Vui lòng nhập email');
      return;
    }

    try {
      await forgotPassword(email);
      setStep('reset');
      setSuccess('Mã xác nhận đã được gửi đến email của bạn');
    } catch (err: any) {
      setFormError(err.message || 'Gửi mã thất bại');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!code || !newPassword || !confirmPassword) {
      setFormError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      await resetPassword(email, code, newPassword);
      setSuccess('Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      setFormError(err.message || 'Đặt lại mật khẩu thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại trang đăng nhập
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 'email' ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Quên mật khẩu?
              </h2>
              <p className="text-gray-600 mb-6">
                Nhập email của bạn để nhận mã xác nhận đặt lại mật khẩu.
              </p>

              {(formError || error) && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{formError || error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    placeholder="email@example.com"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi mã xác nhận'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Nhập mã xác nhận
                </h2>
                <p className="text-gray-600">
                  Mã đã được gửi đến <strong>{email}</strong>
                </p>
              </div>

              {(formError || error) && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{formError || error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Mã xác nhận
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    placeholder="Nhập mật khẩu mới"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    placeholder="Nhập lại mật khẩu mới"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Đặt lại mật khẩu'
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setSuccess('');
                }}
                className="w-full text-primary-600 hover:text-primary-700 font-medium py-2 mt-4"
              >
                Gửi lại mã
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
