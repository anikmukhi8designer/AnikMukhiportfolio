import React, { useState } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onLogin: () => void;
}

type AuthStep = 'LOGIN' | 'FORGOT' | 'OTP' | 'RESET';

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<AuthStep>('LOGIN');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Validation
  const passwordCriteria = {
      length: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Hardcoded check (matches previous implementation)
    if (email.toLowerCase() === 'admin@newgenre.studio' && password === 'password') {
        onLogin();
    } else {
        setError('Invalid credentials');
    }
    setLoading(false);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setStep('OTP');
      setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock OTP check
      if (otp.length === 6) {
          setStep('RESET');
      } else {
          setError('Please enter a 6-digit code');
      }
      setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      
      if (newPassword !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
      }
      
      if (!Object.values(passwordCriteria).every(Boolean)) {
           setError('Password does not meet requirements');
           setLoading(false);
           return;
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      alert("Password reset successfully! (Simulation)");
      setStep('LOGIN');
      setPassword(''); 
      setLoading(false);
  };

  // --- Render Helpers ---

  const InputField = ({ 
      label, 
      type = "text", 
      value, 
      onChange, 
      placeholder,
      isPassword = false 
  }: any) => (
      <div className="space-y-2">
          <label className="block text-sm text-neutral-600">{label}</label>
          <div className="relative">
              <input 
                  type={isPassword ? (showPassword ? "text" : "password") : type}
                  required
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-[#005F99] focus:border-[#005F99] outline-none transition-all placeholder:text-neutral-300"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
              />
              {isPassword && (
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
              )}
          </div>
      </div>
  );

  const SubmitButton = ({ children }: { children: React.ReactNode }) => (
      <button 
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-[#005F99] hover:bg-[#004d7a] text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-6"
      >
        {loading ? 'Please wait...' : children}
      </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 font-sans">
      <div className="w-full max-w-[480px] bg-white p-8 sm:p-12 rounded-2xl border border-neutral-100 shadow-2xl shadow-neutral-100/50">
        
        {/* LOGIN VIEW */}
        {step === 'LOGIN' && (
            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#005F99] mb-1">Login</h1>
                    <p className="text-sm text-neutral-400">Welcome back to the CMS</p>
                </div>
                
                <InputField 
                    label="Email" 
                    type="email" 
                    value={email} 
                    onChange={setEmail} 
                    placeholder="Enter your email ID" 
                />
                
                <div className="space-y-2">
                    <InputField 
                        label="Password" 
                        isPassword
                        value={password} 
                        onChange={setPassword} 
                        placeholder="Enter your password" 
                    />
                    <div className="flex justify-start">
                        <button 
                            type="button" 
                            onClick={() => setStep('FORGOT')}
                            className="text-xs text-[#005F99] hover:underline"
                        >
                            Forgot Password ?
                        </button>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <SubmitButton>Submit</SubmitButton>

                {/* Hint for demo purposes */}
                <div className="mt-8 pt-6 border-t border-neutral-100 text-center text-xs text-neutral-400">
                    <p>Demo: <span className="font-mono text-neutral-600">admin@newgenre.studio</span> / <span className="font-mono text-neutral-600">password</span></p>
                </div>
            </form>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {step === 'FORGOT' && (
            <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                    <button type="button" onClick={() => setStep('LOGIN')} className="flex items-center gap-1 text-neutral-400 hover:text-neutral-900 mb-4 text-xs">
                        <ArrowLeft className="w-3 h-3" /> Back
                    </button>
                    <h1 className="text-2xl font-bold text-[#005F99] mb-2">Forgot your password</h1>
                    <p className="text-sm text-neutral-500 leading-relaxed">
                        Please enter the email address you'd like your password reset information sent to.
                    </p>
                </div>

                <InputField 
                    label="Email" 
                    type="email" 
                    value={email} 
                    onChange={setEmail} 
                    placeholder="Enter your email ID" 
                />

                <SubmitButton>Send OTP</SubmitButton>
            </form>
        )}

        {/* OTP VERIFICATION VIEW */}
        {step === 'OTP' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
                 <div>
                    <button type="button" onClick={() => setStep('FORGOT')} className="flex items-center gap-1 text-neutral-400 hover:text-neutral-900 mb-4 text-xs">
                        <ArrowLeft className="w-3 h-3" /> Back
                    </button>
                    <h1 className="text-2xl font-bold text-[#005F99] mb-2">OTP verification</h1>
                    <p className="text-sm text-neutral-500 leading-relaxed">
                        Enter the code sent to <span className="font-medium text-neutral-800">{email}</span> to reset password.
                    </p>
                </div>

                <InputField 
                    label="OTP" 
                    value={otp} 
                    onChange={setOtp} 
                    placeholder="Enter 6 Digit Code here" 
                />
                
                <div className="flex justify-start">
                    <button type="button" className="text-xs text-[#005F99] hover:underline">
                        Resend Code ?
                    </button>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <SubmitButton>Verify OTP</SubmitButton>
            </form>
        )}

        {/* RESET PASSWORD VIEW */}
        {step === 'RESET' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#005F99] mb-1">Reset password</h1>
                    <p className="text-sm text-neutral-400">Create a new strong password</p>
                </div>

                <InputField 
                    label="New Password" 
                    isPassword
                    value={newPassword} 
                    onChange={setNewPassword} 
                    placeholder="Enter New Password" 
                />

                <div className="text-xs text-neutral-500 space-y-1 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    <p className="mb-2 font-medium text-neutral-700">Password requirements:</p>
                    <div className="grid grid-cols-1 gap-1">
                        <li className={passwordCriteria.length ? "text-green-600" : ""}>Min 8 characters</li>
                        <li className={passwordCriteria.upper ? "text-green-600" : ""}>1 upper case</li>
                        <li className={passwordCriteria.lower ? "text-green-600" : ""}>1 lower case</li>
                        <li className={passwordCriteria.special ? "text-green-600" : ""}>1 special character</li>
                        <li className={passwordCriteria.number ? "text-green-600" : ""}>1 number</li>
                    </div>
                </div>

                <InputField 
                    label="Confirm Password" 
                    isPassword
                    value={confirmPassword} 
                    onChange={setConfirmPassword} 
                    placeholder="Enter Confirm Password" 
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <SubmitButton>Submit</SubmitButton>
            </form>
        )}

      </div>
    </div>
  );
};

export default AdminLogin;