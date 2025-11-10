
import { ActionComponent } from './ActionComponent';
import { Navigation } from './Navigation';
import { LogoComponent } from './LogoComponent';



const DashboardHeader = () => {


  return (
    <header className="fixed top-3 left-0 right-0 z-50 flex h-14 items-center gap-4 rounded-full bg-transparent px-0 pt-2">
      <div className="px-5 flex w-full items-center justify-between sm:px-8 lg:px-16 xl:px-[66px]">
      <LogoComponent />
      <Navigation />

      <ActionComponent />

      </div>
    </header>
  );
};

export default DashboardHeader;

