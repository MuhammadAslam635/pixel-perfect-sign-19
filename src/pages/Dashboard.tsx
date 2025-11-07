import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { LogOut, User, Settings, BarChart3, FileText } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-empa-gradient relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url('/src/assets/grid-pattern.png')`,
          backgroundSize: '100px 100px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Glowing Orbs */}
      <div className="absolute top-20 right-20 w-96 h-96 orb-glow opacity-40 float-animation" />
      <div className="absolute bottom-20 left-20 w-80 h-80 orb-glow opacity-30" style={{ animationDelay: '2s' }} />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2 gradient-text">
              Welcome to Your Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your account and explore your data
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="p-6 card-glow bg-card/50 backdrop-blur-sm border-border/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">1,234</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 card-glow bg-card/50 backdrop-blur-sm border-border/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Analytics</p>
                  <p className="text-2xl font-bold">89%</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 card-glow bg-card/50 backdrop-blur-sm border-border/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/20 rounded-lg">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reports</p>
                  <p className="text-2xl font-bold">45</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 card-glow bg-card/50 backdrop-blur-sm border-border/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-glow/20 rounded-lg">
                  <Settings className="w-6 h-6 text-primary-glow" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Settings</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2 p-6 card-glow bg-card/50 backdrop-blur-sm border-border/50">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-smooth">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold">
                      {item}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Activity Item {item}</p>
                      <p className="text-sm text-muted-foreground">Description of the activity</p>
                    </div>
                    <p className="text-sm text-muted-foreground">2h ago</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6 card-glow bg-card/50 backdrop-blur-sm border-border/50">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button className="w-full btn-glow" variant="default">
                  New Project
                </Button>
                <Button className="w-full" variant="outline">
                  View Reports
                </Button>
                <Button className="w-full" variant="secondary">
                  Settings
                </Button>
                <Button className="w-full" variant="ghost">
                  Help & Support
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
