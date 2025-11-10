import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Reset link sent to your email');
    }, 1000);
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle={<Link to="/" className="hover:text-primary transition-colors">Back to login</Link>}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email" className="text-foreground/80 text-sm font-normal">Email</Label>
          <Input id="email" type="email" placeholder="Enter Your Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" className="w-full h-[46px] bg-gradient-to-r from-[#66B0B7] to-[#3E64B3] text-white rounded-xl mt-4" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Didn’t receive it? <Link to="/resend-email" className="text-primary hover:text-primary-glow">Resend email</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;