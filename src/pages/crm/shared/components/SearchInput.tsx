import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SearchInput = ({
  placeholder,
  value,
  onChange,
  className = ""
}: SearchInputProps) => {
  return (
    <div className={`relative w-full sm:w-auto sm:min-w-[220px] sm:flex-1 lg:flex-none lg:min-w-[220px] ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-10 pr-12 sm:pr-4 rounded-lg sm:!rounded-full border border-gray-600 sm:border-0 text-white placeholder:text-gray-500 text-xs w-full bg-gray-800/50 sm:bg-[#FFFFFF1A] mobile-search-input"
        style={{
          boxShadow: "none",
        }}
      />
      {/* Filter Icon - Mobile Only */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:hidden pointer-events-none z-10">
        <svg
          width="20"
          height="20"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M28.3334 16.0001H11.86M6.04535 16.0001H3.66669M6.04535 16.0001C6.04535 15.2292 6.35159 14.4898 6.8967 13.9447C7.4418 13.3996 8.18112 13.0934 8.95202 13.0934C9.72292 13.0934 10.4622 13.3996 11.0073 13.9447C11.5524 14.4898 11.8587 15.2292 11.8587 16.0001C11.8587 16.771 11.5524 17.5103 11.0073 18.0554C10.4622 18.6005 9.72292 18.9067 8.95202 18.9067C8.18112 18.9067 7.4418 18.6005 6.8967 18.0554C6.35159 17.5103 6.04535 16.771 6.04535 16.0001ZM28.3334 24.8094H20.6694M20.6694 24.8094C20.6694 25.5805 20.3624 26.3206 19.8171 26.8659C19.2719 27.4111 18.5324 27.7174 17.7614 27.7174C16.9905 27.7174 16.2511 27.4098 15.706 26.8647C15.1609 26.3196 14.8547 25.5803 14.8547 24.8094M20.6694 24.8094C20.6694 24.0383 20.3624 23.2995 19.8171 22.7543C19.2719 22.209 18.5324 21.9027 17.7614 21.9027C16.9905 21.9027 16.2511 22.209 15.706 22.7541C15.1609 23.2992 14.8547 24.0385 14.8547 24.8094M14.8547 24.8094H3.66669M28.3334 7.19072H24.1934M18.3787 7.19072H3.66669M18.3787 7.19072C18.3787 6.41983 18.6849 5.68051 19.23 5.1354C19.7751 4.59029 20.5145 4.28406 21.2854 4.28406C21.6671 4.28406 22.045 4.35924 22.3977 4.50531C22.7503 4.65139 23.0708 4.86549 23.3407 5.1354C23.6106 5.40531 23.8247 5.72574 23.9708 6.07839C24.1168 6.43104 24.192 6.80902 24.192 7.19072C24.192 7.57243 24.1168 7.9504 23.9708 8.30306C23.8247 8.65571 23.6106 8.97614 23.3407 9.24605C23.0708 9.51596 22.7503 9.73006 22.3977 9.87613C22.045 10.0222 21.6671 10.0974 21.2854 10.0974C20.5145 10.0974 19.7751 9.79115 19.23 9.24605C18.6849 8.70094 18.3787 7.96162 18.3787 7.19072Z"
            stroke="white"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};
