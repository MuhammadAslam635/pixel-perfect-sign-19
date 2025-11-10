import { Button } from '@/components/ui/button';
import AuthLayout from '@/components/AuthLayout';
import { Link } from 'react-router-dom';

const VerifyEmail = () => {
  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle={<span className="text-xs">We sent a verification link to your email.</span>}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Click the link in your inbox to verify your account.
        </p>
        <Button className="w-full h-[46px] bg-gradient-to-r from-[#66B0B7] to-[#3E64B3] text-white rounded-xl">
          Open Email App
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Didn’t get it? <Link to="/resend-email" className="text-primary hover:text-primary-glow">Resend email</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;