import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Building2,
  Globe,
  Users2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  Linkedin,
  Twitter,
  Facebook,
  ExternalLink,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import type { Client } from "@/services/clients.service";
import { AvatarFallback } from "@/components/ui/avatar-fallback";

interface ProspectDetailsModalProps {
  prospect: Client | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProspectDetailsModal: React.FC<ProspectDetailsModalProps> = ({
  prospect,
  isOpen,
  onClose,
}) => {
  if (!prospect) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Active":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Idle Timeout":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "Disconnected":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const formatNumber = (value: number | null) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const primaryPerson = prospect.people && prospect.people.length > 0 ? prospect.people[0] : null;
  const validEmails = prospect.companyEmails?.filter(e => e !== "not found in search") || [];
  const validPhones = prospect.companyPhones?.filter(p => p !== "not found in search") || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 text-white border-0">
        {/* Glassmorphism Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-lg pointer-events-none" />
        <div className="absolute inset-0 bg-[#0b0f20]/80 backdrop-blur-md rounded-lg pointer-events-none" />
        <div className="absolute inset-[1px] bg-gradient-to-br from-white/5 to-transparent rounded-lg pointer-events-none" />
        <div className="absolute inset-0 border border-white/10 rounded-lg shadow-2xl shadow-black/50 pointer-events-none" />
        
        <div className="relative z-10 overflow-y-auto scrollbar-hide max-h-[90vh] p-9">
          <DialogHeader className="mb-6 pb-4 border-b border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-white drop-shadow-lg flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  {prospect.companyName || "Unknown Company"}
                </DialogTitle>
                <DialogDescription className="text-gray-300/80 mt-2">
                  Prospect company information and contact details
                </DialogDescription>
              </div>
              <Badge className={`${getStatusColor(prospect.status)} rounded-full`}>
                {prospect.status}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Company Overview */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white px-1">
                Company Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {prospect.companyWebsite && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Globe className="w-4 h-4 text-white/60 flex-shrink-0" />
                          <span className="text-xs text-white truncate">{prospect.companyWebsite}</span>
                        </div>
                        <a
                          href={`https://${prospect.companyWebsite}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors ml-2 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Visit <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Website: {prospect.companyWebsite}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors">
                      <Users2 className="w-4 h-4 text-white/60 flex-shrink-0" />
                      <span className="text-xs text-white truncate">
                        {prospect.people?.length || 0} People listed
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total People found: {prospect.people?.length || 0}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white px-1">
                Contact Information
              </h3>
              <div className="space-y-2">
                {validEmails.length > 0 && (
                  <div className="space-y-1">
                    {validEmails.map((email, idx) => (
                      <Tooltip key={`email-${idx}`}>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors">
                            <Mail className="w-4 h-4 text-white/60 flex-shrink-0" />
                            <span className="text-xs text-white truncate">{email}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Company Email: {email}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                )}
                {validPhones.length > 0 && (
                  <div className="space-y-1">
                    {validPhones.map((phone, idx) => (
                      <Tooltip key={`phone-${idx}`}>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors">
                            <Phone className="w-4 h-4 text-white/60 flex-shrink-0" />
                            <span className="text-xs text-white truncate">{phone}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Company Phone: {phone}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                )}
                {validEmails.length === 0 && validPhones.length === 0 && (
                  <div className="p-4 rounded-lg bg-[#1a1a1a] border border-white/10 text-center">
                    <p className="text-xs text-white/40">No contact information found</p>
                  </div>
                )}
              </div>
            </div>

            {/* People */}
            {prospect.people && prospect.people.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                    <Users2 className="w-5 h-5" />
                    People ({prospect.people.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {prospect.people.map((person, idx) => (
                      <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-start gap-4">
                            <AvatarFallback
                              name={person.name}
                              pictureUrl={person.photo_url}
                              size="md"
                            />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-white">{person.name}</h4>
                            {person.title && (
                              <p className="text-sm text-gray-300 mt-1">{person.title}</p>
                            )}
                            {person.headline && (
                              <p className="text-xs text-gray-400 mt-1">{person.headline}</p>
                            )}
                            <div className="flex flex-wrap gap-4 mt-3">
                              {person.email && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  <a href={`mailto:${person.email}`} className="text-blue-400 hover:underline break-all">
                                    {person.email}
                                  </a>
                                </div>
                              )}
                              {person.linkedin_url && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <Linkedin className="w-3 h-3 text-gray-400" />
                                  <a href={person.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                    LinkedIn
                                  </a>
                                </div>
                              )}
                              {person.city && person.country && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                  <MapPin className="w-3 h-3" />
                                  <span>{person.city}, {person.country}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Organization Details (from primary person if available) */}
            {primaryPerson && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white px-1">
                  Organization Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {primaryPerson.estimated_num_employees && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors">
                          <Users2 className="w-4 h-4 text-white/60 flex-shrink-0" />
                          <span className="text-xs text-white truncate">
                            {formatNumber(primaryPerson.estimated_num_employees)} employees
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Estimated Employees: {formatNumber(primaryPerson.estimated_num_employees)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {primaryPerson.organization_founded_year && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors">
                          <Calendar className="w-4 h-4 text-white/60 flex-shrink-0" />
                          <span className="text-xs text-white truncate">
                            Founded in {primaryPerson.organization_founded_year}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Founded Year: {primaryPerson.organization_founded_year}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {primaryPerson.organization_annual_revenue && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors">
                          <DollarSign className="w-4 h-4 text-white/60 flex-shrink-0" />
                          <span className="text-xs text-white truncate">
                            {formatCurrency(primaryPerson.organization_annual_revenue)} / year
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Annual Revenue: {formatCurrency(primaryPerson.organization_annual_revenue)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {primaryPerson.organization_total_funding && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors">
                          <TrendingUp className="w-4 h-4 text-white/60 flex-shrink-0" />
                          <span className="text-xs text-white truncate">
                            {formatCurrency(primaryPerson.organization_total_funding)} total funding
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total Funding: {formatCurrency(primaryPerson.organization_total_funding)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {primaryPerson.organization_city && primaryPerson.organization_country && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors md:col-span-2">
                          <MapPin className="w-4 h-4 text-white/60 flex-shrink-0" />
                          <span className="text-xs text-white truncate">
                            {primaryPerson.organization_city}, {primaryPerson.organization_state && `${primaryPerson.organization_state}, `}{primaryPerson.organization_country}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Location: {primaryPerson.organization_city}, {primaryPerson.organization_state && `${primaryPerson.organization_state}, `}{primaryPerson.organization_country}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {primaryPerson.organization_seo_description && (
                    <div className="md:col-span-2 p-3 rounded-lg bg-[#1a1a1a] border border-white/10">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-1">Description</p>
                      <p className="text-xs text-white leading-relaxed line-clamp-3">
                        {primaryPerson.organization_seo_description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProspectDetailsModal;


