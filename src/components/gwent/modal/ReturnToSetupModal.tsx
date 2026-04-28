import type React from "react";

import { Modal, ModalButton } from "./Modal";

export interface ReturnToSetupModalProps {
  readonly open: boolean;
  readonly onStay: () => void;
  readonly onLeave: () => void;
}

export const ReturnToSetupModal: React.FC<ReturnToSetupModalProps> = ({ open, onStay, onLeave }) => (
  <Modal
    open={open}
    kind="confirm"
    eyebrow="leave match?"
    title="Return to setup?"
    body="The current match will be discarded. Local decks and saved setup choices remain available."
    onCancel={onStay}
    onConfirm={onLeave}
    testId="authentic-abandon-confirmation"
    actions={
      <>
        <ModalButton variant="ghost" onClick={onStay}>
          stay
        </ModalButton>
        <ModalButton variant="destructive" onClick={onLeave} data-testid="authentic-confirm-abandon">
          return to setup
        </ModalButton>
      </>
    }
  />
);
