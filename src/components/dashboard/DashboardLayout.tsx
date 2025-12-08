import { ReactNode } from "react";
import DashboardHeader, { AdminHeader } from "./DashboardHeader";

type DashboardLayoutProps = {
  children: ReactNode;
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="h-screen w-full overflow-x-hidden overflow-y-auto scrollbar-hide bg-transparent">
      <div className="relative min-h-screen w-full max-w-full bg-transparent md:bg-transparent text-white flex flex-col">
        {/* Mobile background elements */}
        <div
          className="pointer-events-none fixed inset-0 md:hidden"
          style={{
            backdropFilter: "blur(40px)",
            borderRadius: "40px",
            zIndex: 0,
          }}
        >
          {/* Base background with rounded corners */}
          <div
            className="absolute inset-0 bg-[#1A1A1A]"
            style={{ borderRadius: "40px" }}
          />

          {/* Mobile gradient ellipse - top left with filter blur */}
          <div
            className="absolute md:hidden"
            style={{
              width: "352.78277587890625px",
              height: "497.08837890625px",
              top: "-114.3px",
              left: "-148.17px",
              opacity: 1,
              background:
                "linear-gradient(180deg, rgba(103, 176, 183, 0.2) 0%, rgba(64, 102, 179, 0.2) 100%)",
              filter: "blur(125px)",
              borderRadius: "50%",
            }}
          />

          {/* Mobile gradient circle - bottom right with #69B3B7 color and blur */}
          <div
            className="absolute md:hidden"
            style={{
              width: "501px",
              height: "501px",
              bottom: "-200px",
              right: "-100px",
              background: "#69B3B7",
              opacity: 0.5,
              filter: "blur(150px)",
              backdropFilter: "blur(617.0355834960938px)",
              borderRadius: "50%",
              mixBlendMode: "screen",
            }}
          />

          <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-[#6CB4B91C] blur-[90px]" />
          <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-[#37507A1F] blur-[110px]" />
        </div>

        <div className="relative z-10 flex flex-col">
          <DashboardHeader />
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

// Admin Layout - Same styling as regular dashboard for admin users
export const AdminLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="h-screen w-full overflow-x-hidden overflow-y-auto scrollbar-hide bg-transparent">
      <div className="relative min-h-screen w-full max-w-full bg-transparent md:bg-transparent text-white flex flex-col">
        {/* Mobile background elements - Same as regular dashboard */}
        <div
          className="pointer-events-none fixed inset-0 md:hidden"
          style={{
            backdropFilter: "blur(40px)",
            borderRadius: "40px",
            zIndex: 0,
          }}
        >
          {/* Base background with rounded corners */}
          <div
            className="absolute inset-0 bg-[#1A1A1A]"
            style={{ borderRadius: "40px" }}
          />

          {/* Mobile gradient ellipse - top left with filter blur */}
          <div
            className="absolute md:hidden"
            style={{
              width: "352.78277587890625px",
              height: "497.08837890625px",
              top: "-114.3px",
              left: "-148.17px",
              opacity: 1,
              background:
                "linear-gradient(180deg, rgba(103, 176, 183, 0.2) 0%, rgba(64, 102, 179, 0.2) 100%)",
              filter: "blur(125px)",
              borderRadius: "50%",
            }}
          />

          {/* Mobile gradient circle - bottom right with #69B3B7 color and blur */}
          <div
            className="absolute md:hidden"
            style={{
              width: "501px",
              height: "501px",
              bottom: "-200px",
              right: "-100px",
              background: "#69B3B7",
              opacity: 0.5,
              filter: "blur(150px)",
              backdropFilter: "blur(617.0355834960938px)",
              borderRadius: "50%",
              mixBlendMode: "screen",
            }}
          />

          <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-[#6CB4B91C] blur-[90px]" />
          <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-[#37507A1F] blur-[110px]" />
        </div>

        <div className="relative z-10 flex flex-col">
          <AdminHeader />
          {children}
        </div>
      </div>
    </div>
  );
};
