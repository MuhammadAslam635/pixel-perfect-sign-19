import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

interface InboxHeaderProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    unreadEmails: number;
    totalEmails: number;
}

const InboxHeader = ({
    searchTerm,
    onSearchChange,
    unreadEmails,
    totalEmails,
}: InboxHeaderProps) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { canCreate } = usePermissions();

    const handleCompose = () => {
        if (!canCreate("emails")) {
            toast({
                title: "Unable to create template",
                description: "CompanyViewer accounts have read-only access.",
                variant: "destructive",
            });
            return;
        }
        navigate("/emails/compose");
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Inbox</h1>
                    <p className="text-white/60 text-sm mt-1">
                        {unreadEmails} unread of {totalEmails} total
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        size="sm"
                        onClick={handleCompose}
                        className="relative h-10 px-5 rounded-full border-0 text-white text-sm hover:bg-[#2F2F2F]/60 transition-all overflow-hidden"
                        style={{
                            background: "#FFFFFF1A",
                            boxShadow:
                                "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                        }}
                    >
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[150px] h-[150px] rounded-full pointer-events-none"
                            style={{
                                background:
                                    "radial-gradient(circle, #66AFB7 0%, transparent 70%)",
                                backdropFilter: "blur(50px)",
                                WebkitBackdropFilter: "blur(50px)",
                                zIndex: -1,
                            }}
                        ></div>
                        <Plus className="w-4 h-4 mr-2 relative z-10" />
                        <span className="relative z-10">Compose</span>
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            {/* <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <Input
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 h-9 rounded-full border-0 text-gray-300 placeholder:text-gray-500 text-xs w-full"
                    style={{
                        background: "#FFFFFF1A",
                        boxShadow:
                            "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                        borderRadius: "9999px",
                    }}
                />
            </div> */}
        </div>
    );
};

export default InboxHeader;