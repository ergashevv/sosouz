import type { ReactNode } from 'react';
import StartupHeader from './StartupHeader';
import StartupFooter from './StartupFooter';

type Props = {
  children: ReactNode;
};

/**
 * Public English marketing shell for the startup program: no i18n, no auth gates.
 */
export default function StartupPageShell({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f6f4] text-stone-900">
      <StartupHeader />
      <div className="flex-1">{children}</div>
      <StartupFooter />
    </div>
  );
}
