import { Bot, UserRound } from 'lucide-react';
import SourceReference from './SourceReference.jsx';

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  return (
    <article className={`message-row ${isUser ? 'message-row-user' : 'message-row-assistant'}`}>
      <span className={`message-avatar ${isUser ? 'user-avatar' : 'assistant-avatar'}`}>
        {isUser ? <UserRound size={16} /> : <Bot size={16} />}
      </span>
      <div className="message-content">
        <span className="message-author">{isUser ? 'You' : 'QueryCare'}</span>
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}${message.isError ? ' message-error' : ''}`}>
          {message.text}
        </div>
        {isAssistant && message.sources?.map((source, index) => (
          <SourceReference
            key={`${source.filename}-${source.chunkIndex ?? index}`}
            source={source}
          />
        ))}
      </div>
    </article>
  );
}

export default ChatMessage;
