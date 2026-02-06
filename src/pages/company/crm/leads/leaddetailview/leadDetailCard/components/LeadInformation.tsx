import { Phone, Mail, Linkedin, Globe, Clock, MapPin, CheckCircle, Edit2, Save, X, CalendarPlus, Sparkles, Loader2, } from "lucide-react";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CompanyLogoFallback } from "@/components/ui/company-logo-fallback";


interface LeadInformationProps {
    lead: any;
    avatarSrc?: string;
    // states
    isEditing: boolean;
    isSaving: boolean;
    fillingData: boolean;
    editData: any;
    // permissions
    canEdit: (module: string) => boolean;
    // handlers
    setEditData: (data: any) => void;
    handleEdit: () => void;
    handleSave: () => void;
    handleCancel: () => void;
    handleFillPersonData: () => void;
    handlePhoneClick: () => void;
    handleWhatsAppClick: () => void;
    handleEmailClick: () => void;
    handleLinkedinClick: () => void;
    resetScheduleForm: () => void;
    setScheduleDialogOpen: (val: boolean) => void;
}

const LeadInformation: React.FC<LeadInformationProps> = ({
    lead,
    avatarSrc,
    isEditing,
    isSaving,
    fillingData,
    editData,
    setEditData,
    canEdit,
    handleEdit,
    handleSave,
    handleCancel,
    handleFillPersonData,
    handlePhoneClick,
    handleWhatsAppClick,
    handleEmailClick,
    handleLinkedinClick,
    resetScheduleForm,
    setScheduleDialogOpen,
}) => {
    return (
        <Card
            className="w-full flex flex-col overflow-hidden h-[calc(100vh-200px)] min-h-0"
            style={{
                background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                border: "1px solid #FFFFFF0D",
            }}>
            <CardContent className="p-4 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                <div className="flex flex-col items-center mb-6">
                    <AvatarFallback name={lead.name} pictureUrl={avatarSrc} size="lg" className="mb-3 border-2 border-white/20" />
                    <h2 className="text-xs sm:text-sm font-semibold text-white mb-1 text-center break-words">{lead.name}</h2>
                    {isEditing ? (
                        <div className="w-full px-2 mb-3">
                            <Input value={editData.position} onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                                className="h-6 text-[10px] bg-white/5 border-white/20 text-white focus-visible:ring-1 focus-visible:ring-white/30 px-2" placeholder="Position" />
                        </div>
                    ) : (
                        <p className="text-[10px] text-white/80 text-center break-words leading-tight">
                            {lead.companyName || "Company"} |{" "}
                            {lead.position || "Chief Executive Officer"}
                        </p>
                    )}
                    <div className="flex flex-col gap-2 w-full">
                        {!isEditing ? (
                            <>
                                <div className="mt-3 flex items-center justify-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={handleFillPersonData}
                                                disabled={fillingData || !lead._id || !lead.companyId}
                                                className={`flex h-8 w-8 items-center justify-center rounded-full border text-white transition-colors ${fillingData
                                                    ? "bg-white/15 border-white/25 cursor-wait opacity-70"
                                                    : "bg-white/5 border-white/20 hover:bg-white/15"
                                                    }`}
                                            >
                                                {fillingData ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-3 h-3" />
                                                )}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Fill missing info
                                        </TooltipContent>
                                    </Tooltip>
                                    {canEdit("leads") && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={handleEdit}
                                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15 transition-colors"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Edit details
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                disabled={!lead._id}
                                                onClick={() => {
                                                    resetScheduleForm();
                                                    setScheduleDialogOpen(true);
                                                }}
                                                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <CalendarPlus className="w-3 h-3" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Schedule meeting
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </>
                        ) : (
                            <>
                                <Button onClick={handleSave} disabled={isSaving} className="w-full justify-center text-[10px] h-8 bg-white/25 hover:bg-white/35 text-white border border-white/30">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-3 h-3 mr-1" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    disabled={isSaving}
                                    className="w-full justify-center text-[10px] h-8 bg-white/5 hover:bg-white/15 text-white border border-white/15"
                                >
                                    <X className="w-3 h-3 mr-1" />
                                    Cancel
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Contact Section */}
                <div className="mb-4">
                    <h3 className="text-xs sm:text-sm font-semibold text-white mb-2">Contact</h3>
                    <div className="space-y-1.5">
                        {/* Phone */}
                        <div className="flex flex-col gap-0.5">
                            {isEditing ? (
                                <div
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                                    style={{
                                        background: "#1a1a1a",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                    }}
                                >
                                    <Input
                                        value={editData.phone}
                                        onChange={(e) =>
                                            setEditData({ ...editData, phone: e.target.value })
                                        }
                                        className="flex-1 h-6 text-[10px] bg-transparent border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-0"
                                        placeholder="Phone number"
                                    />
                                </div>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20 cursor-pointer"
                                            onClick={handlePhoneClick}
                                        >
                                            <Phone className="w-3 h-3 text-white/60 flex-shrink-0" />
                                            <span className="text-[10px] text-white flex-1 truncate">
                                                {lead.phone || "N/A"}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{lead.phone || "No phone available"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>

                        {/* WhatsApp */}
                        <div className="flex flex-col gap-0.5">
                            {isEditing ? (
                                <div
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                                    style={{
                                        background: "#1a1a1a",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                    }}
                                >
                                    <Input
                                        value={editData.whatsapp}
                                        onChange={(e) =>
                                            setEditData({ ...editData, whatsapp: e.target.value })
                                        }
                                        className="flex-1 h-6 text-[10px] bg-transparent border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-0"
                                        placeholder="WhatsApp number"
                                    />
                                </div>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20 cursor-pointer"
                                            onClick={handleWhatsAppClick}
                                        >
                                            <svg
                                                className="w-3 h-3 text-white/60 flex-shrink-0"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.742.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                            <span className="text-[10px] text-white flex-1 truncate">
                                                {lead.whatsapp || "N/A"}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{lead.whatsapp || "No WhatsApp available"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-0.5">
                            {isEditing ? (
                                <div
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                                    style={{
                                        background: "#1a1a1a",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                    }}
                                >
                                    <Input
                                        type="email"
                                        value={editData.email}
                                        onChange={(e) =>
                                            setEditData({ ...editData, email: e.target.value })
                                        }
                                        className="flex-1 h-6 text-[10px] bg-transparent border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-0"
                                        placeholder="Email address"
                                    />
                                </div>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20 cursor-pointer"
                                            onClick={handleEmailClick}
                                        >
                                            <Mail className="w-3 h-3 text-white/60 flex-shrink-0" />
                                            <span className="text-[10px] text-white flex-1 truncate">
                                                {lead.email || "N/A"}
                                            </span>
                                            {lead.isVerifiedEmail && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Verified Email</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{lead.email || "No email available"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>

                        {/* LinkedIn */}
                        <div className="flex flex-col gap-0.5">
                            {isEditing ? (
                                <div
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                                    style={{
                                        background: "#1a1a1a",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                    }}
                                >
                                    <Input
                                        value={editData.linkedinUrl}
                                        onChange={(e) =>
                                            setEditData({
                                                ...editData,
                                                linkedinUrl: e.target.value,
                                            })
                                        }
                                        className="flex-1 h-6 text-[10px] bg-transparent border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-0"
                                        placeholder="LinkedIn URL or username"
                                    />
                                </div>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20 cursor-pointer"
                                            onClick={handleLinkedinClick}
                                        >
                                            <Linkedin className="w-3 h-3 text-white/60 flex-shrink-0" />
                                            <span className="text-[10px] text-white flex-1 truncate">
                                                {lead.linkedinUrl
                                                    ? `@${lead.linkedinUrl
                                                        .replace(
                                                            /^https?:\/\/(www\.)?linkedin\.com\//,
                                                            ""
                                                        )
                                                        .replace(/^\//, "")}`
                                                    : "N/A"}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{lead.linkedinUrl || "No LinkedIn available"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </div>

                {/* Personal Section */}
                <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-white mb-2">Personal</h3>
                    <div className="space-y-1.5">
                        {/* Country */}
                        <div className="flex flex-col gap-0.5">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20"
                                    >
                                        <Globe className="w-3 h-3 text-white/60 flex-shrink-0" />
                                        <span className="text-[10px] text-white truncate">
                                            {lead.country || "N/A"}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{lead.country || "Country not available"}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Timezone */}
                        <div className="flex flex-col gap-0.5">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20"
                                    >
                                        <Clock className="w-3 h-3 text-white/60 flex-shrink-0" />
                                        <span className="text-[10px] text-white truncate">
                                            {lead.timezone || "N/A"}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{lead.timezone || "Timezone not available"}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Region */}
                        <div className="flex flex-col gap-0.5">
                            {isEditing ? (
                                <div
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                                    style={{
                                        background: "#1a1a1a",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                    }}
                                >
                                    <MapPin className="w-3 h-3 text-white/60 flex-shrink-0" />
                                    <Input
                                        value={editData.location}
                                        onChange={(e) =>
                                            setEditData({ ...editData, location: e.target.value })
                                        }
                                        className="flex-1 h-6 text-[10px] bg-transparent border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-0"
                                        placeholder="Location"
                                    />
                                </div>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20"
                                        >
                                            <MapPin className="w-3 h-3 text-white/60 flex-shrink-0" />
                                            <span className="text-[10px] text-white truncate">
                                                {lead.location || lead.companyLocation || "N/A"}
                                            </span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{lead.location || lead.companyLocation || "No location specified"}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>

                    </div>
                </div>

                {/* Departments */}
                {lead.departments && lead.departments.length > 0 && (
                    <div className="mt-4">
                        <h3 className="text-xs sm:text-sm font-semibold text-white mb-2">Departments</h3>
                        <div className="flex flex-col gap-1.5">
                            {lead.departments.map((dept: string, index: number) => (
                                <div key={index} className="w-full px-2 py-1 rounded-lg bg-[#1a1a1a] border border-white/10 text-[10px] text-white/80 truncate">
                                    {dept.replace(/_/g, ' ')}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Employment History Section */}
                {lead.employmentHistory && lead.employmentHistory.length > 0 && (
                    <div className="mt-4">
                        <h3 className="text-xs sm:text-sm font-semibold text-white mb-2">Experience</h3>
                        <div className="space-y-2">
                            {lead.employmentHistory.map((job) => {
                                const isCurrentCompany =
                                    (lead.company?.name && job.organizationName?.toLowerCase() === lead.company.name.toLowerCase()) ||
                                    (lead.companyName && job.organizationName?.toLowerCase() === lead.companyName.toLowerCase());

                                const logoUrl = isCurrentCompany ? lead.company?.logo : undefined;

                                return (
                                    <div key={job._id || job.title} className="flex gap-3 items-start p-2 rounded-lg bg-[#1a1a1a] border border-white/5">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <CompanyLogoFallback
                                                name={job.organizationName}
                                                logo={logoUrl}
                                                size="sm"
                                                className="rounded"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-[11px] font-semibold text-white truncate">{job.title}</h4>
                                            <p className="text-[10px] text-white/70 truncate">{job.organizationName}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {job.current ? (
                                                    <span className="text-[9px] text-emerald-400 font-medium">Present</span>
                                                ) : (
                                                    <span className="text-[9px] text-white/40">
                                                        {job.from ? new Date(job.from).getFullYear() : ''} - {job.to ? new Date(job.to).getFullYear() : 'Present'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default LeadInformation;
