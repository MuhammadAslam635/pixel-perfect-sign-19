
import { ActionComponent } from './ActionComponent';
import { Navigation } from './Navigation';
import Logo from '../Logo';



const DashboardHeader = () => {


  return (
    <header className="fixed top-3 left-0 right-0 z-50 flex h-14 items-center gap-4 rounded-full bg-transparent px-0 pt-2 max-w-full overflow-hidden">
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] flex w-full max-w-full items-center justify-between gap-3 sm:gap-4 lg:gap-0">
      <Logo />
      <Navigation />

      <ActionComponent />

      </div>
    </header>
  );
};

export default DashboardHeader;

