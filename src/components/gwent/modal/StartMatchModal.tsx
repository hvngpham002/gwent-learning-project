import type React from "react";

import { Modal, ModalButton } from "./Modal";

export interface StartMatchModalProps {
  readonly open: boolean;
  readonly onReviewHand: () => void;
  readonly onStart: () => void;
}

export const StartMatchModal: React.FC<StartMatchModalProps> = ({ open, onReviewHand, onStart }) => (
  <Modal
    open={open}
    kind="check"
    eyebrow="mulligan complete"
    title="Start the match?"
    body="Both hands are set. Round 1 will begin under the seed shown above; mulligans cannot be revisited."
    onCancel={onReviewHand}
    onConfirm={onStart}
    scrimOpacity={0.5}
    testId="authentic-start-match-confirmation"
    actions={
      <>
        <ModalButton variant="ghost" onClick={onReviewHand} data-testid="authentic-start-match-review">
          review hand
        </ModalButton>
        <ModalButton variant="primary" onClick={onStart} data-testid="authentic-start-match-confirm">
          start match →
        </ModalButton>
      </>
    }
  />
);
