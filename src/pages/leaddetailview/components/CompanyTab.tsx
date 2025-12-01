import { FC } from "react";
import { Lead } from "@/services/leads.service";

type CompanyTabProps = {
  lead?: Lead;
};

const CompanyTab: FC<CompanyTabProps> = ({ lead }) => {
  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-bold text-white mb-4">Company</h2>
      <p className="text-sm text-white/70">
        Company view is under work currently
        {lead?.companyName ? ` for ${lead.companyName}.` : "."}
      </p>
    </div>
  );
};

export default CompanyTab;


