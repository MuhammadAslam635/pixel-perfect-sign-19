import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Grid3X3, List } from "lucide-react";
import { Company } from "@/services/admin.service";

type ViewMode = "cards" | "table";

interface CompaniesListProps {
  companies: Company[];
  companiesLoading: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const CompaniesList = ({
  companies,
  companiesLoading,
  viewMode,
  onViewModeChange,
}: CompaniesListProps) => {
  return (
    <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-white/70 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Company Management
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("cards")}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("table")}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {companies.slice(0, 12).map((company) => (
              <div
                key={company._id}
                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-cyan-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-8 h-8 rounded"
                      />
                    ) : (
                      <Building2 className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm line-clamp-1">
                      {company.name}
                    </h3>
                    {company.industry && (
                      <p className="text-white/60 text-xs mt-1">
                        {company.industry}
                      </p>
                    )}
                    {company.employees !== undefined &&
                      company.employees !== null && (
                        <p className="text-white/50 text-xs mt-1">
                          {company.employees.toLocaleString()} employees
                        </p>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/70 text-sm font-medium py-3 px-4">
                    Company
                  </th>
                  <th className="text-left text-white/70 text-sm font-medium py-3 px-4">
                    Industry
                  </th>
                  <th className="text-left text-white/70 text-sm font-medium py-3 px-4">
                    Employees
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.slice(0, 25).map((company) => (
                  <tr
                    key={company._id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          {company.logo ? (
                            <img
                              src={company.logo}
                              alt={company.name}
                              className="w-6 h-6 rounded"
                            />
                          ) : (
                            <Building2 className="w-4 h-4 text-cyan-400" />
                          )}
                        </div>
                        <span className="text-white text-sm font-medium">
                          {company.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white/60 text-sm">
                      {company.industry || "-"}
                    </td>
                    <td className="py-3 px-4 text-white/60 text-sm">
                      {company.employees !== undefined &&
                      company.employees !== null
                        ? company.employees.toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {companies.length === 0 && !companiesLoading && (
          <div className="text-center py-12 text-white/50">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No companies found</p>
          </div>
        )}
        {companiesLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-white/50 mt-4">Loading companies...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
