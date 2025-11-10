import { ClipboardList, ArrowUpRight } from 'lucide-react';

const proposals = [
  {
    title: 'Send Proposal to ABC Corp',
    subtitle: 'Website Redesign',
    status: 'Sent',
  },
  {
    title: 'Prepare Deck for Delta Group',
    subtitle: 'Branding Presentation',
    status: 'Pending',
  },
];

const ProposalsToSendCard = () => {
  return (
    <article className="section-card">
      <div className="section-card__top">
        <div className="section-card__top-left">
          <div className="section-card__top-icon">
            <ClipboardList size={18} />
          </div>
          <span className="section-card__top-title">Proposals To Send</span>
        </div>
        <button className="section-card__action section-card__action--outline" type="button">
          View All <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="section-card__inner">
        <header className="section-card__header">
          <span>Proposals To Send</span>
          <span>View All</span>
        </header>

        {proposals.map((item) => (
          <div className="section-card__row" key={item.title}>
            <div>
              <div className="section-card__title">{item.title}</div>
              <div className="section-card__subtitle">{item.subtitle}</div>
            </div>
            <div className="tag-chip">{item.status}</div>
          </div>
        ))}
      </div>
    </article>
  );
};

export default ProposalsToSendCard;

