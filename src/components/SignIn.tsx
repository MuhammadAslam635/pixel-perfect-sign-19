import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginStart, loginSuccess, loginFailure } from '@/store/slices/authSlice';
import { RootState } from '@/store/store';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import orbImage from '@/assets/orb-cyan.jpg';
import iconCyan from '@/assets/icon-cyan.png';
import gridPattern from '@/assets/grid-pattern.png';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const { loading } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    dispatch(loginStart());
    
    setTimeout(() => {
      if (email && password.length >= 6) {
        dispatch(loginSuccess({ email, name: 'User' }));
        toast.success('Login successful!');
      } else {
        dispatch(loginFailure('Invalid credentials'));
        toast.error('Invalid credentials');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#1A1A1A]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0">
        <div 
          className="absolute bottom-0 left-0 right-0 h-[400px] opacity-30"
          style={{
            backgroundImage: `url(${gridPattern})`,
            backgroundSize: 'cover',
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      </div>

      {/* Logo */}
      <div className="absolute top-8 left-8 z-20">
        <Logo />
      </div>

      {/* Content */}
      <div className="min-h-screen flex items-center justify-center relative z-10">
        {/* Login Card */}
        <div className="w-full max-w-[420px] relative">
          {/* Gradient Circle at top-right corner behind card */}
          <div className="absolute -top-20 -right-20 w-[260px] h-[260px] -z-10">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#66B0B7] to-[#3E64B3]" />
          </div>

          <div className="bg-[#3f4451]/60 backdrop-blur-2xl rounded-3xl p-10 border border-[#565b6b]/40 shadow-2xl">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12">
                <svg width="48" height="48" viewBox="0 0 222 222" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path opacity="0.7" d="M21.2201 3.13507C15.5524 3.13507 10.6715 6.5898 8.58143 11.5076H10.2781C12.2697 7.4627 16.413 4.68417 21.2078 4.68417C27.6746 4.68417 32.9735 9.73717 33.3669 16.0934H33.3424C33.7972 16.4991 34.2767 16.9294 34.7439 17.372C34.8669 17.2367 34.9283 17.0646 34.9283 16.8679C34.9529 9.29457 28.7934 3.13507 21.2201 3.13507ZM21.2201 6.1595C17.2736 6.1595 13.8188 8.31102 11.9624 11.5076H13.8065C15.4786 9.20851 18.1711 7.70859 21.2201 7.70859C24.8592 7.70859 28.0803 9.81093 29.5557 13.0567C29.5557 13.0567 30.2442 13.5361 31.2523 14.3353C31.2646 14.3107 31.2892 14.2984 31.3015 14.2738C31.449 14.0771 31.4859 13.8189 31.4121 13.5853C29.986 9.14703 25.8919 6.1595 21.2201 6.1595ZM21.2201 0C13.7943 0 7.47493 4.8317 5.23735 11.5076H6.87251C9.04862 5.69231 14.6672 1.5368 21.2324 1.5368C29.6786 1.5368 36.5635 8.40937 36.5635 16.8556C36.5635 17.581 36.5143 18.3187 36.4037 19.0317C36.8217 19.4866 37.2274 19.9661 37.5962 20.4333C37.7069 20.3226 37.7806 20.1874 37.8052 20.0399C38.0019 18.9949 38.1003 17.9252 38.1003 16.8556C38.1003 7.56105 30.5269 0 21.2201 0Z" fill="url(#paint0_linear_112_188)"/>
                  <defs>
                    <linearGradient id="paint0_linear_112_188" x1="24.8206" y1="11.0304" x2="18.2069" y2="18.8346" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#66B0B7"/>
                      <stop offset="1" stopColor="#3E64B3"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-semibold text-center text-foreground mb-1">
              Login
            </h2>
            <p className="text-center text-muted-foreground/60 text-xs mb-6">
              <Link to="/signup" className="hover:text-primary transition-colors">
                Register to continue
              </Link>
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80 text-sm font-normal">
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 bg-[#3a3d4a] border-[#565b6b] text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground/80 text-sm font-normal">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter Your Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 bg-[#3a3d4a] border-[#565b6b] text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#66B0B7] to-[#3E64B3] hover:from-[#76C0C7] hover:to-[#4E74C3] text-white font-medium text-base rounded-xl shadow-lg transition-all duration-300 mt-8"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:text-primary-glow font-medium transition-colors">
                  Register here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
