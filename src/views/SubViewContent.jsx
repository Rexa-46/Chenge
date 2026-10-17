import { AccountsTree } from "../components/accounts/AccountsTree.jsx";
import { AccountsManager } from "./accounts/AccountsManager.jsx";
import { AssetsManager } from "./assets/AssetsManager.jsx";
import { BillsManager } from "./bills/BillsManager.jsx";
import { BudgetsManager } from "./budgets/BudgetsManager.jsx";
import { CalculatorView } from "./calculator/CalculatorView.jsx";
import { CalendarViewSub } from "./calendar/CalendarViewSub.jsx";
import { CategoriesManager } from "./categories/CategoriesManager.jsx";
import { ChecksManager } from "./checks/ChecksManager.jsx";
import { CurrenciesManager } from "./currencies/CurrenciesManager.jsx";
import { DebtsManager } from "./debts/DebtsManager.jsx";
import { GoalsManager } from "./goals/GoalsManager.jsx";
import { LoansManager } from "./loans/LoansManager.jsx";
import { FiscalPeriodsManager } from "./periods/FiscalPeriodsManager.jsx";
import { PersonsManager } from "./persons/PersonsManager.jsx";
import { RecurringManager } from "./recurring/RecurringManager.jsx";
import { AboutView } from "./settings/AboutView.jsx";
import { AccessView } from "./settings/AccessView.jsx";
import { BackupView } from "./settings/BackupView.jsx";
import { BasicSettingsView } from "./settings/BasicSettingsView.jsx";
import { CloudSyncView } from "./settings/CloudSyncView.jsx";
import { ProfileView } from "./settings/ProfileView.jsx";
import { RateAppView } from "./settings/RateAppView.jsx";
import { SettingsView } from "./settings/SettingsView.jsx";
import { ShareAppView } from "./settings/ShareAppView.jsx";
import { TutorialView } from "./settings/TutorialView.jsx";
import { ShortcutsManager } from "./shortcuts/ShortcutsManager.jsx";
import { SlipScanView } from "./slip/SlipScanView.jsx";
import { BankSmsManager } from "./sms/BankSmsManager.jsx";
import { SupportView } from "./support/SupportView.jsx";
import { MembersEventsProjectsManager } from "./tags/MembersEventsProjectsManager.jsx";

export function SubViewContent({ subView, ctx, onBack }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 112px", paddingTop: "calc(20px + env(safe-area-inset-top, 0px))" }}>
      {subView === "goals" && <GoalsManager {...ctx} />}
      {subView === "coa" && <AccountsTree {...ctx} />}
      {subView === "cloud" && <CloudSyncView {...ctx} />}
      {subView === "persons" && <PersonsManager {...ctx} />}
      {subView === "debts" && <DebtsManager {...ctx} />}
      {subView === "currencies" && <CurrenciesManager {...ctx} />}
      {subView === "calculator" && <CalculatorView {...ctx} />}
      {subView === "support" && <SupportView {...ctx} />}
      {subView === "shortcuts" && <ShortcutsManager {...ctx} />}
      {subView === "accounts" && <AccountsManager {...ctx} />}
      {subView === "categories" && <CategoriesManager {...ctx} />}
      {subView === "budgets" && <BudgetsManager {...ctx} />}
      {subView === "recurring" && <RecurringManager {...ctx} />}
      {subView === "checks" && <ChecksManager {...ctx} />}
      {subView === "loans" && <LoansManager {...ctx} />}
      {subView === "bills" && <BillsManager {...ctx} />}
      {subView === "assets" && <AssetsManager {...ctx} />}
      {subView === "calendar" && <CalendarViewSub {...ctx} />}
      {subView === "settings" && <SettingsView {...ctx} />}
      {subView === "profile" && <ProfileView {...ctx} />}
      {subView === "backup" && <BackupView {...ctx} />}
      {subView === "access" && <AccessView {...ctx} />}
      {subView === "basic" && <BasicSettingsView {...ctx} />}
      {subView === "tutorial" && <TutorialView {...ctx} />}
      {subView === "share" && <ShareAppView {...ctx} />}
      {subView === "rate" && <RateAppView {...ctx} />}
      {subView === "about" && <AboutView {...ctx} />}
      {subView === "tags" && <MembersEventsProjectsManager {...ctx} />}
      {subView === "periods" && <FiscalPeriodsManager {...ctx} />}
      {subView === "sms" && <BankSmsManager {...ctx} onBack={onBack} />}
      {subView === "slip" && <SlipScanView {...ctx} onBack={onBack} />}
    </div>
  );
}
