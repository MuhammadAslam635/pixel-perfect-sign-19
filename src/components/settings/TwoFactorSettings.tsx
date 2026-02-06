import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Loader2, Copy, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast"; // Using ui/use-toast specific to this project
import { authService, Setup2FAResponse } from "@/services/auth.service";
import { RootState } from "@/store/store";
import { updateUser } from "@/store/slices/authSlice";

export const TwoFactorSettings = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  
  // Setup State
  const [setupStep, setSetupStep] = useState<"loading" | "qr" | "verify" | "backup">("loading");
  const [qrData, setQrData] = useState<Setup2FAResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Disable State
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const startSetup = async () => {
    setIsSetupOpen(true);
    setSetupStep("loading");
    setLoading(true);
    try {
      const data = await authService.setup2FA();
      setQrData(data);
      setSetupStep("qr");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to start 2FA setup",
        variant: "destructive",
      });
      setIsSetupOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verifyCode.length !== 6) return;
    setLoading(true);
    try {
      const response = await authService.enable2FA({ token: verifyCode });
      if (response.success) {
        setBackupCodes((response as any).backupCodes || []);
        setSetupStep("backup");
        dispatch(updateUser({ twoFactorEnabled: true }));
        toast({
          title: "Success",
          description: "Two-Factor Authentication enabled successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.response?.data?.message || "Invalid code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.disable2FA({
        password: disablePassword,
        token: disableCode || undefined,
      });
      if (response.success) {
        setIsDisableOpen(false);
        setDisablePassword("");
        setDisableCode("");
        dispatch(updateUser({ twoFactorEnabled: false }));
        toast({
          title: "Success",
          description: "Two-Factor Authentication disabled.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to disable 2FA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast({ description: "Backup codes copied to clipboard" });
  };

  if (user?.twoFactorEnabled) {
    return (
      <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-green-500/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
             <Check className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">2FA is Enabled</h3>
            <p className="text-sm text-white/60">Your account is secured with two-factor authentication.</p>
          </div>
        </div>
        <Dialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">Disable 2FA</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Disable 2FA</DialogTitle>
              <DialogDescription className="text-white/60">
                Are you sure? This will remove the extra layer of security from your account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleDisable} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password">Info</Label>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />
                    <p className="text-sm text-yellow-200/80">You will need to verify your password and a 2FA code (or backup code).</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Current Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">2FA Code or Backup Code</Label>
                <Input
                  id="code"
                  placeholder="Enter code"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>
              <DialogFooter>
                 <Button type="button" variant="ghost" onClick={() => setIsDisableOpen(false)}>Cancel</Button>
                 <Button type="submit" variant="destructive" disabled={loading}>
                   {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disable 2FA"}
                 </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
             <div className="h-5 w-5 rounded-sm border-2 border-white/40" />
          </div>
          <div>
            <h3 className="font-medium text-white">Enable 2FA</h3>
            <p className="text-sm text-white/60">Secure your account with TOTP (Google Authenticator).</p>
          </div>
        </div>
        
        <Dialog open={isSetupOpen} onOpenChange={(open) => {
            if (!open && setupStep === 'backup') {
                 // Close fully
                 setIsSetupOpen(false);
            } else if (!open) {
                // Confirm abort?
                if(window.confirm("Abort 2FA setup?")) {
                    setIsSetupOpen(false);
                    setVerifyCode("");
                }
            } else {
                startSetup();
            }
        }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300">Enable</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            </DialogHeader>

            {setupStep === 'loading' && (
                <div className="py-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
            )}

            {(setupStep === 'qr' || setupStep === 'verify') && qrData && (
                 <div className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-2 bg-white rounded-lg">
                            <img src={qrData.qrCode} alt="QR Code" className="w-48 h-48" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm text-white/60">Scan with Google Authenticator or Authy</p>
                            <p className="text-xs text-white/40 font-mono select-all cursor-pointer" onClick={() => {
                                navigator.clipboard.writeText(qrData.secret);
                                toast({ description: "Secret copied!" });
                            }}>
                                Secret: {qrData.secret}
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <Label className="text-center block text-white/80">Enter 6-digit verification code</Label>
                        <div className="flex justify-center">
                            <InputOTP
                                maxLength={6}
                                value={verifyCode}
                                onChange={(val) => {
                                    setVerifyCode(val);
                                    if (val.length === 6 && setupStep === 'qr') {
                                        // Manual trigger or button? allow button click
                                    }
                                }}
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} className="border-white/20 bg-white/5" />
                                    <InputOTPSlot index={1} className="border-white/20 bg-white/5" />
                                    <InputOTPSlot index={2} className="border-white/20 bg-white/5" />
                                </InputOTPGroup>
                                <div className="w-2" />
                                <InputOTPGroup>
                                    <InputOTPSlot index={3} className="border-white/20 bg-white/5" />
                                    <InputOTPSlot index={4} className="border-white/20 bg-white/5" />
                                    <InputOTPSlot index={5} className="border-white/20 bg-white/5" />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                    </div>

                    <DialogFooter>
                         <Button onClick={verifyAndEnable} disabled={verifyCode.length !== 6 || loading} className="w-full bg-cyan-600 hover:bg-cyan-500">
                             {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Verify & Enable
                         </Button>
                    </DialogFooter>
                 </div>
            )}

            {setupStep === 'backup' && (
                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2 text-green-400 justify-center mb-2">
                        <Check className="h-6 w-6" />
                        <span className="font-semibold text-lg">2FA Enabled!</span>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto" />
                    <p className="text-center text-sm text-white/80">
                        Save these backup codes in a secure place. You will need them if you lose access to your authenticator app.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 p-4 bg-black/40 rounded-lg border border-white/10 font-mono text-sm text-center">
                        {backupCodes.map((code) => (
                            <span key={code} className="text-cyan-400 select-all">{code}</span>
                        ))}
                    </div>

                    <DialogFooter className="flex-col sm:flex-col gap-2">
                        <Button variant="outline" className="w-full gap-2 border-white/20" onClick={copyBackupCodes}>
                            <Copy className="h-4 w-4" /> Copy All Codes
                        </Button>
                        <Button className="w-full bg-green-600 hover:bg-green-500" onClick={() => setIsSetupOpen(false)}>
                            I have saved these codes
                        </Button>
                    </DialogFooter>
                </div>
            )}
          </DialogContent>
        </Dialog>
    </div>
  );
};
