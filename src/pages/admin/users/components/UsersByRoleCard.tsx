import React, { useState } from "react";
import { UserCog, Users, Building2, AlertTriangle, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Company } from "@/services/companies.service";

interface User {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    companyId?: string;
    companyName?: string;
    role?: string;
    status?: "active" | "inactive";
    hasTwilioConfig?: boolean;
    hasElevenLabsConfig?: boolean;
}

interface RoleTab {
    value: string;
    label: string;
    count: number;
}

interface UserWithCompany extends User {
    company: Company;
}

interface UsersByRoleCardProps {
    loading: boolean;
    roleTabs: RoleTab[];
    filteredUsers: (User | UserWithCompany)[];
    activeRoleTab: string;
    setActiveRoleTab: (value: string) => void;
    searchTerm?: string;
    statusFilter?: string;
    handleStatusToggle: (companyId: string, userId: string, currentStatus: string) => void;
    setSelectedUserForProvisioning: (user: User) => void;
    setProvisioningModalOpen: (open: boolean) => void;
    getRoleBadgeColor: (role: string) => string;
    getRoleDisplayName: (user: User) => string;
    navigate: (url: string) => void;
}

function isUserWithCompany(user: User): user is UserWithCompany {
    return (user as UserWithCompany).company !== undefined;
}

export const UsersByRoleCard: React.FC<UsersByRoleCardProps> = ({
    loading,
    roleTabs,
    filteredUsers,
    activeRoleTab,
    setActiveRoleTab,
    searchTerm,
    statusFilter,
    handleStatusToggle,
    setSelectedUserForProvisioning,
    setProvisioningModalOpen,
    getRoleBadgeColor,
    getRoleDisplayName,
    navigate,
}) => {
    return (
        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
            <CardHeader>
                <CardTitle className="text-white/70 flex items-center gap-2">
                    <UserCog className="w-5 h-5" />
                    Users by Role
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
                        <p className="text-white/60 text-sm">Loading users...</p>
                    </div>
                ) : (
                    <Tabs value={activeRoleTab} onValueChange={setActiveRoleTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 mb-6 bg-transparent p-0 gap-2">
                            {roleTabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-white/20 text-white/60 transition-all duration-300 hover:border-[#67B0B7] hover:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#67B0B7] data-[state=active]:to-[#4066B3] data-[state=active]:border-transparent data-[state=active]:text-white data-[state=active]:shadow-[0_5px_18px_rgba(103,176,183,0.35)] group"
                                >
                                    {tab.label}
                                    <Badge className="ml-2 bg-white/10 text-white/70 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white transition-colors">
                                        {tab.count}
                                    </Badge>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {roleTabs.map((tab) => (
                            <TabsContent key={tab.value} value={tab.value} className="mt-0">
                                {filteredUsers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 px-4">
                                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                                            <Users className="w-6 h-6 text-white/30" />
                                        </div>
                                        <p className="text-white/70 text-base font-medium mb-1">
                                            {searchTerm || statusFilter !== "all"
                                                ? "No users found"
                                                : `No ${tab.label.toLowerCase()} found`}
                                        </p>
                                        <p className="text-white/50 text-sm text-center max-w-md">
                                            {searchTerm || statusFilter !== "all"
                                                ? "Try adjusting your filters or search terms."
                                                : `There are no users with the ${tab.label.toLowerCase()} role.`}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">User</th>
                                                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">Company</th>
                                                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">Role</th>
                                                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">Status</th>
                                                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">Config Status</th>
                                                    <th className="text-left py-3 px-4 text-white/70 text-sm font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredUsers.map((user) => (
                                                    <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        {/* User Info */}
                                                        <td className="py-4 px-4">
                                                            <div>
                                                                <p className="text-white font-medium">
                                                                    {user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email.split("@")[0]}
                                                                </p>
                                                                <p className="text-white/60 text-sm">{user.email}</p>
                                                            </div>
                                                        </td>
                                                        {/* Company */}
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <Building2 className="h-4 w-4 text-white/50" />
                                                                <span className="text-white/70 text-sm">
                                                                    {isUserWithCompany(user) ? user.company.name : "Unknown"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        {/* Role */}
                                                        <td className="py-4 px-4">
                                                            <Badge className={`${getRoleBadgeColor(user.role || "")} rounded-full px-3 py-1 text-xs`}>
                                                                {getRoleDisplayName(user)}
                                                            </Badge>
                                                        </td>
                                                        {/* Status */}
                                                        <td className="py-4 px-4">
                                                            {user.status === "active" ? (
                                                                <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full px-3 py-1 text-xs">Active</Badge>
                                                            ) : (
                                                                <Badge className="bg-red-600/20 text-red-300 border border-red-600/30 rounded-full px-3 py-1 text-xs">Inactive</Badge>
                                                            )}
                                                        </td>
                                                        {/* Config Status */}
                                                        <td className="py-4 px-4">
                                                            {(() => {
                                                                const hasTwilio = user.hasTwilioConfig ?? false;
                                                                const hasElevenLabs = user.hasElevenLabsConfig ?? false;
                                                                const needsConfig = !hasTwilio || !hasElevenLabs;

                                                                if (!user.companyId && user.role !== "Company") return <span className="text-white/40 text-xs">N/A</span>;

                                                                if (needsConfig) {
                                                                    return (
                                                                        <Button
                                                                            onClick={() => {
                                                                                setSelectedUserForProvisioning(user);
                                                                                setProvisioningModalOpen(true);
                                                                            }}
                                                                            className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 rounded-full px-4 py-2 text-xs"
                                                                            size="sm"
                                                                        >
                                                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                                                            Fix Config
                                                                        </Button>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 rounded-full px-3 py-1 text-xs flex items-center gap-1 w-fit">
                                                                            <CheckCircle2 className="h-3 w-3" /> Configured
                                                                        </Badge>
                                                                    );
                                                                }
                                                            })()}
                                                        </td>
                                                        {/* Actions */}
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                {user.role === "Company" && (
                                                                    <Button
                                                                        onClick={() => {
                                                                            const companyName = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email.split("@")[0];
                                                                            navigate(`/admin/settings?tab=ai-research-prompt&companyId=${user._id}&companyName=${encodeURIComponent(companyName)}`);
                                                                        }}
                                                                        className="bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 rounded-full px-4 py-2 text-xs"
                                                                        size="sm"
                                                                    >
                                                                        <Sparkles className="h-4 w-4 mr-2" /> AI Prompt
                                                                    </Button>
                                                                )}
                                                                {(user.companyId || user.role === "Company") && (
                                                                    <Button
                                                                        onClick={() =>
                                                                            handleStatusToggle(user.role === "Company" ? user._id : user.companyId!, user._id, user.status || "inactive")
                                                                        }
                                                                        className={`${user.status === "active"
                                                                            ? "bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30"
                                                                            : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"} rounded-full px-4 py-2 text-xs`}
                                                                        size="sm"
                                                                    >
                                                                        {user.status === "active" ? (
                                                                            <>
                                                                                <XCircle className="h-4 w-4 mr-2" /> Deactivate
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <CheckCircle2 className="h-4 w-4 mr-2" /> Activate
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </CardContent>
        </Card>
    );
};
