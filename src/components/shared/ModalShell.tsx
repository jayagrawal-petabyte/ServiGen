import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  hideHeader?: boolean;
  hideCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  truncateTitle?: boolean;
  'aria-describedby'?: string;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
};

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  headerActions,
  children,
  footer,
  size = 'md',
  className = '',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
  hideHeader = false,
  hideCloseButton = false,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  truncateTitle = false,
  'aria-describedby': ariaDescribedBy,
}) => {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200" />
        <Dialog.Content
          onInteractOutside={(e) => {
            if (!closeOnOutsideClick) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (!closeOnEsc) {
              e.preventDefault();
            }
          }}
          aria-describedby={ariaDescribedBy}
          className={`fixed inset-0 m-auto bg-white rounded-3xl shadow-2xl border border-slate-200 w-[95vw] ${SIZE_CLASSES[size]} h-fit max-h-[92vh] z-50 flex flex-col overflow-hidden outline-none ${className}`}
        >
          {!hideHeader ? (
            <div
              className={`p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0 ${headerClassName}`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-3">
                {icon && (
                  <div className="w-9 h-9 rounded-xl bg-[#C96F55]/10 text-[#C96F55] border border-[#C96F55]/20 flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                )}
                <div className="min-w-0">
                  {title ? (
                    typeof title === 'string' ? (
                      <Dialog.Title className={`text-base sm:text-lg font-bold text-slate-900 leading-snug ${truncateTitle ? 'truncate' : 'break-words'}`}>
                        {title}
                      </Dialog.Title>
                    ) : (
                      <Dialog.Title asChild>
                        <div className={`text-base sm:text-lg font-bold text-slate-900 leading-snug ${truncateTitle ? 'truncate' : 'break-words'}`}>
                          {title}
                        </div>
                      </Dialog.Title>
                    )
                  ) : (
                    <Dialog.Title className="sr-only">Dialog</Dialog.Title>
                  )}
                  {description && (
                    <Dialog.Description className="text-xs text-slate-500 mt-0.5 leading-normal">
                      {description}
                    </Dialog.Description>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {headerActions}
                {!hideCloseButton && (
                  <Dialog.Close
                    asChild
                    onClick={onClose}
                  >
                    <button
                      type="button"
                      aria-label="Close dialog"
                      className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                )}
              </div>
            </div>
          ) : (
            <>
              {title ? (
                <Dialog.Title className="sr-only">
                  {typeof title === 'string' ? title : 'Dialog'}
                </Dialog.Title>
              ) : (
                <Dialog.Title className="sr-only">Dialog</Dialog.Title>
              )}
              {description && (
                <Dialog.Description className="sr-only">
                  {typeof description === 'string' ? description : 'Dialog Details'}
                </Dialog.Description>
              )}
            </>
          )}

          <div className={`overflow-y-auto flex-1 ${bodyClassName}`}>
            {children}
          </div>

          {footer && (
            <div
              className={`p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0 ${footerClassName}`}
            >
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ModalShell;
