import {
  CheckIcon,
  CopyClipboardIcon,
  EditIcon,
  InsertIcon,
  RegenerateIcon,
} from "@/components/Icons";
import { USER_SENDER } from "@/constants";
import { ChatMessage } from "@/sharedState";
import React from "react";

interface ChatButtonsProps {
  message: ChatMessage;
  onCopy: () => void;
  isCopied: boolean;
  onInsertAtCursor?: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
}

export const ChatButtons: React.FC<ChatButtonsProps> = ({
  message,
  onCopy,
  isCopied,
  onInsertAtCursor,
  onRegenerate,
  onEdit,
}) => {
  return (
    <div className="chat-message-buttons">
      <button onClick={onCopy} className="clickable-icon" title="复制">
        {isCopied ? <CheckIcon /> : <CopyClipboardIcon />}
      </button>
      {message.sender === USER_SENDER ? (
        <button onClick={onEdit} className="clickable-icon" title="编辑">
          <EditIcon />
        </button>
      ) : (
        <>
          <button
            onClick={onInsertAtCursor}
            className="clickable-icon"
            title="插入笔记"
          >
            <InsertIcon />
          </button>
          <button onClick={onRegenerate} className="clickable-icon" title="重新生成">
            <RegenerateIcon />
          </button>
        </>
      )}
    </div>
  );
};
