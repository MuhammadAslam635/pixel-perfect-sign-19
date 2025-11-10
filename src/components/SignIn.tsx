import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginStart, loginSuccess, loginFailure } from '@/store/slices/authSlice';
import { RootState } from '@/store/store';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
        navigate('/dashboard');
      } else {
        dispatch(loginFailure('Invalid credentials'));
        toast.error('Invalid credentials');
      }
    }, 1500);
  };

  return (
    <AuthLayout
      title="Login"
      subtitle={<Link to="/signup" className="hover:text-primary transition-colors">Register to continue</Link>}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email */}
        <div className="space-y-1">
          <Label htmlFor="email" className="text-foreground/80 text-sm font-normal">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-foreground placeholder:text-muted-foreground/60 transition-all"
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
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
              className="text-foreground placeholder:text-muted-foreground/60 transition-all pr-10"
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
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">Forgot password?</Link>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-[46px] bg-gradient-to-r from-[#66B0B7] to-[#3E64B3] hover:from-[#76C0C7] hover:to-[#4E74C3] text-white font-medium text-base rounded-xl shadow-lg transition-all duration-300 mt-4"
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
    </AuthLayout>
  );
};

export default SignIn;
