import { ClipboardList, ArrowUpRight } from "lucide-react";

const proposals = [
  {
    title: "Send Proposal to ABC Corp",
    subtitle: "Website Redesign",
    status: "Sent",
  },
  {
    title: "Prepare Deck for Delta Group",
    subtitle: "Branding Presentation",
    status: "Pending",
  },
];

const ProposalsToSendCard = () => {
  return (
    <article className="section-card !p-3 lg:!p-[54px_12px_20px]">
      <div className="section-card__top !top-[8px] lg:!top-[12px] !left-[12px] lg:!left-[18px] !right-[12px] lg:!right-[18px]">
        <div className="section-card__top-left gap-1.5 lg:gap-3">
          <div className="section-card__top-icon !w-7 !h-7 lg:!w-[35px] lg:!h-[35px]">
            <ClipboardList size={14} className="lg:w-[18px] lg:h-[18px]" />
          </div>
          <span className="section-card__top-title !text-[10px] lg:!text-sm leading-tight">
            Proposals To Send
          </span>
        </div>
        <button
          className="section-card__action section-card__action--outline !h-7 lg:!h-[35px] !min-w-7 lg:!min-w-[35px] !p-0 !px-2 lg:!px-[14px] !text-[8px] lg:!text-[10px] gap-1 lg:gap-2"
          type="button"
        >
          View All{" "}
          <ArrowUpRight size={10} className="lg:w-[14px] lg:h-[14px]" />
        </button>
      </div>

      <div className="section-card__inner !p-2 lg:!p-3 gap-2 lg:gap-4">
        <header className="section-card__header !text-[9px] lg:!text-xs !pb-1.5 lg:!pb-2.5">
          <span>Proposals To Send</span>
          <span>View All</span>
        </header>

        {proposals.map((item) => (
          <div
            className="section-card__row !p-1.5 !px-2 lg:!p-2 lg:!px-3"
            key={item.title}
          >
            <div className="min-w-0 flex-1">
              <div className="section-card__title !text-[10px] lg:!text-xs leading-tight truncate">
                {item.title}
              </div>
              <div className="section-card__subtitle !text-[9px] lg:!text-[10px]">
                {item.subtitle}
              </div>
            </div>
            <div className="tag-chip !text-[8px] lg:!text-[10px] !px-1.5 lg:!px-2 !py-0.5 lg:!py-1 flex-shrink-0">
              {item.status}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};

export default ProposalsToSendCard;
