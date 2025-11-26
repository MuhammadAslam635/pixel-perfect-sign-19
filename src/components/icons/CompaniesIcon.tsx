import React from "react";

interface CompaniesIconProps {
  className?: string;
}

const CompaniesIcon: React.FC<CompaniesIconProps> = ({ className }) => {
  const mergedClass =
    (className ? `${className} ` : "w-16 h-16 ");

  return (
    <img
      src="/assets/companies-icon.png"
      alt="Companies"
      className={mergedClass}
    />
  );
};

export default CompaniesIcon;
