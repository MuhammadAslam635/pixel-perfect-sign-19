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
    <div className="min-h-screen w-full relative overflow-hidden bg-[#1a1d29]">
      {/* Logo */}
      <div className="absolute top-8 left-8 z-20">
        <Logo />
      </div>

      {/* Large Orb on Right */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] translate-x-[200px] -translate-y-[100px]">
        <img 
          src={orbImage} 
          alt="" 
          className="w-full h-full object-contain opacity-60"
        />
      </div>

      {/* Content */}
      <div className="min-h-screen flex items-center justify-center relative z-10">
        {/* Login Card */}
        <div className="w-full max-w-[420px]">
          <div className="bg-[#252836]/80 backdrop-blur-xl rounded-3xl p-10 border border-[#363948]">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <img 
                  src={orbImage} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-semibold text-center text-foreground mb-2">
              Login
            </h2>
            <p className="text-center text-muted-foreground text-sm mb-8">
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
                    className="h-12 bg-[#1a1d29] border-[#363948] text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
                    className="h-12 bg-[#1a1d29] border-[#363948] text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-10"
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
                className="w-full h-12 bg-gradient-to-r from-[#4FD1C5] to-[#4299E1] hover:from-[#5FE1D5] hover:to-[#52A9F1] text-white font-medium text-base rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 mt-8"
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
