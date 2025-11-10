import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import AuthLayout from '@/components/AuthLayout';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) return toast.error('Fill both fields');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Password reset successfully');
    }, 1000);
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle={<Link to="/" className="hover:text-primary transition-colors">Back to login</Link>}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="password" className="text-foreground/80 text-sm font-normal">New Password</Label>
          <Input id="password" type="password" placeholder="Enter New Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="confirm" className="text-foreground/80 text-sm font-normal">Confirm Password</Label>
          <Input id="confirm" type="password" placeholder="Confirm New Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <Button type="submit" className="w-full h-[46px] bg-gradient-to-r from-[#66B0B7] to-[#3E64B3] text-white rounded-xl mt-4" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;