import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, confirmSignUp, isLoading, error, clearError } = useAuth();
  
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const validatePassword = (pwd: string) => {
    const errors = [];
    if (pwd.length < 8) errors.push('Ít nhất 8 ký tự');
    if (!/[A-Z]/.test(pwd)) errors.push('Ít nhất 1 chữ hoa');
    if (!/[a-z]/.test(pwd)) errors.push('Ít nhất 1 chữ thường');
    if (!/[0-9]/.test(pwd)) errors.push('Ít nhất 1 số');
    if (!/[!@#$%^&*]/.test(pwd)) errors.push('Ít nhất 1 ký tự đặc biệt (!@#$%^&*)');
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email || !password || !confirmPassword || !name) {
      setFormError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Mật khẩu xác nhận không khớp');
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setFormError('Mật khẩu cần: ' + passwordErrors.join(', '));
      return;
    }

    try {
      await signUp(email, password, name);
      setStep('verify');
    } catch (err: any) {
      setFormError(err.message || 'Đăng ký thất bại');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!verificationCode) {
      setFormError('Vui lòng nhập mã xác nhận');
      return;
    }

    try {
      await confirmSignUp(email, verificationCode);
      navigate('/login', { replace: true });
    } catch (err: any) {
      setFormError(err.message || 'Xác nhận thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Malware Detection
          </h1>
          <p className="text-primary-200">
            Hệ thống phân tích và phát hiện mã độc
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 'form' ? (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Đăng ký tài khoản
              </h2>

              {(formError || error) && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{formError || error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    placeholder="Nguyễn Văn A"
                    disabled={isLoading}
                  />
                </div>

                {/* Email Field */}
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

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all pr-12"
                      placeholder="Ít nhất 8 ký tự"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    placeholder="Nhập lại mật khẩu"
                    disabled={isLoading}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang đăng ký...
                    </>
                  ) : (
                    'Đăng ký'
                  )}
                </button>
              </form>

              {/* Login Link */}
              <p className="text-center text-gray-600 mt-6">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Đăng nhập
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* Verification Step */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Xác nhận email
                </h2>
                <p className="text-gray-600">
                  Chúng tôi đã gửi mã xác nhận đến email <strong>{email}</strong>
                </p>
              </div>

              {(formError || error) && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{formError || error}</p>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    Mã xác nhận
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
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
                      Đang xác nhận...
                    </>
                  ) : (
                    'Xác nhận'
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-primary-600 hover:text-primary-700 font-medium py-2 mt-4"
              >
                Quay lại
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-primary-200 text-sm mt-6">
          Powered by AWS Cognito & Amazon S3
        </p>
      </div>
    </div>
  );
}
