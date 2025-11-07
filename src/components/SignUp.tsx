import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import orbImage from '@/assets/orb-cyan.jpg';
import iconCyan from '@/assets/icon-cyan.png';

const SignUp = () => {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName || !industry || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Registration successful!');
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#1a1d29]">
      {/* Geometric Pattern Background */}
      <div className="absolute inset-0 opacity-[0.08]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(79, 209, 197, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(79, 209, 197, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Logo */}
      <div className="absolute top-8 left-8 z-20">
        <Logo />
      </div>

      {/* Content */}
      <div className="min-h-screen flex items-center justify-center py-12 relative z-10">
        {/* Register Card */}
        <div className="w-full max-w-[420px] relative">
          {/* Large Gradient Circle at top-right corner behind card */}
          <div className="absolute -top-24 -right-24 w-[280px] h-[280px] -z-10">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#4FD1C5] via-[#5FB8E8] to-[#4299E1] blur-3xl opacity-40" />
            <div className="absolute inset-0 rounded-full border-2 border-[#4FD1C5]/30" />
          </div>

          <div className="bg-[#252836]/40 backdrop-blur-2xl rounded-3xl p-10 border border-[#363948]/50 shadow-2xl">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <img 
                  src={iconCyan} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-semibold text-center text-foreground mb-2">
              Register
            </h2>
            <p className="text-center text-muted-foreground text-sm mb-8">
              <Link to="/" className="hover:text-primary transition-colors">
                Sign in to continue
              </Link>
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-foreground/80 text-sm font-normal">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Enter Your Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-12 bg-[#1a1d29] border-[#363948] text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  disabled={loading}
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-foreground/80 text-sm font-normal">
                  Industry
                </Label>
                <Input
                  id="industry"
                  type="text"
                  placeholder="Enter Your Industry Name"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="h-12 bg-[#1a1d29] border-[#363948] text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80 text-sm font-normal">
                  Email
                </Label>
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground/80 text-sm font-normal">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Enter Your Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 bg-[#1a1d29] border-[#363948] text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#4FD1C5] to-[#4299E1] hover:from-[#5FE1D5] hover:to-[#52A9F1] text-white font-medium text-base rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 mt-8"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register'}
              </Button>

              {/* Sign In Link */}
              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{' '}
                <Link to="/" className="text-primary hover:text-primary-glow font-medium transition-colors">
                  Login here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
