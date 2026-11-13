import { ArrowUpRight, PackageX, RotateCcw, Truck, WalletCards } from 'lucide-react';

const questions = [
  { text: 'What is the return policy?', label: 'Returns', Icon: RotateCcw },
  { text: 'How long does delivery take?', label: 'Delivery', Icon: Truck },
  { text: 'What is the refund process?', label: 'Refunds', Icon: WalletCards },
  { text: 'Can I return a damaged product?', label: 'Damaged items', Icon: PackageX },
];

function SuggestedQuestions({ onSelect, disabled }) {
  return (
    <div className="suggestion-list">
      {questions.map(({ text, label, Icon }) => (
        <button
          className="btn suggestion-card"
          key={text}
          type="button"
          onClick={() => onSelect(text)}
          disabled={disabled}
        >
          <span className="suggestion-icon"><Icon size={17} /></span>
          <span className="suggestion-copy">
            <span className="suggestion-category">{label}</span>
            <span className="suggestion-question">{text}</span>
          </span>
          <ArrowUpRight className="suggestion-arrow" size={16} />
        </button>
      ))}
    </div>
  );
}

export default SuggestedQuestions;
