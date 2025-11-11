import { ReactNode } from 'react';
import DashboardHeader from './DashboardHeader';

type DashboardLayoutProps = {
  children: ReactNode;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden overflow-y-hidden bg-transparent">
      <div className="relative min-h-screen w-full max-w-full bg-transparent text-white flex flex-col">
        <DashboardHeader />
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;

