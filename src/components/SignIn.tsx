import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginStart, loginSuccess, loginFailure } from '@/store/slices/authSlice';
import { RootState } from '@/store/store';
import { toast } from 'sonner';
import orbImage from '@/assets/orb-cyan.jpg';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    dispatch(loginStart());
    
    // Simulate API call
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
    <div className="min-h-screen w-full bg-empa-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating Orbs - Background */}
      <div className="absolute top-10 right-10 w-96 h-96 orb-glow float-animation opacity-30" />
      <div className="absolute bottom-20 left-10 w-72 h-72 orb-glow float-animation opacity-20" style={{ animationDelay: '2s' }} />
      
      {/* Main Orb with Image */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none opacity-40">
        <img 
          src={orbImage} 
          alt="" 
          className="w-full h-full object-contain"
        />
      </div>

      {/* Sign In Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="card-glow bg-card/90 backdrop-blur-xl rounded-2xl p-8 border border-border/50">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold gradient-text mb-2">EMPA TECH</h1>
            <p className="text-muted-foreground text-sm">Sign in to your account</p>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 input-glow bg-input border-border text-foreground placeholder:text-muted-foreground h-12"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 input-glow bg-input border-border text-foreground placeholder:text-muted-foreground h-12"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-border bg-input accent-primary"
                />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <a href="#" className="text-primary hover:text-primary-glow transition-colors font-medium">
                Forgot password?
              </a>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary-glow text-primary-foreground font-semibold text-base btn-glow"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Sign Up Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <a href="#" className="text-primary hover:text-primary-glow font-medium transition-colors">
                Sign up
              </a>
            </div>
          </form>
        </div>

        {/* Footer Text */}
        <p className="text-center text-muted-foreground text-xs mt-6">
          © 2024 Empa Tech. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default SignIn;
