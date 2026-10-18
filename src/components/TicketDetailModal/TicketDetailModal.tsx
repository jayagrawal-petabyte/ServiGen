import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  type FullTicket,
  type TicketPriority,
  enrichTicketDetails,
  AVAILABLE_AGENTS,
} from "./ticketDetails.data";
import "./TicketDetailModal.css";

interface TicketDetailModalProps {
  ticket: {
    id: string;
    type?: string;
    summary?: string;
    agent?: string;
    priority?: TicketPriority;
    status?: string;
    description?: string;
    requester?: string;
    department?: string;
    category?: string;
    createdAt?: string;
    targetSla?: string;
    notes?: Array<{ id: string; author: string; time: string; text: string }>;
    site?: string;
    organisationName?: string;
    email?: string;
    phoneNumber?: string;
    preferredNumber?: string;
    isAgent?: boolean;
    timeTaken?: string;
    fromTicketId?: string;
    actionTitle?: string;
    contactAddress?: string[];
    assets?: Array<{ id: string; type: string; icon: "workstation" | "phone" | "monitor" | "laptop" }>;
    projectId?: string;
    projectName?: string;
    workflowName?: string;
    createdBy?: string;
    executionDate?: string;
  } | null;
  currentUser?: string;
  variant?: "incident" | "sla";
  onClose: () => void;
  onUpdateTicket?: (updated: FullTicket) => void;
}

type TabType =
  | "progress"
  | "details"
  | "ai-insights"
  | "additional-fields"
  | "audit-log"
  | "view-log"
  | "notification-log";

const TRANSLATION_MAP: Record<string, { name: string; flag: string; translate: (text: string) => string }> = {
  es: {
    name: "Spanish (Español)",
    flag: "🇪🇸",
    translate: (text: string) =>
      text.toLowerCase().includes("workstation") || text.toLowerCase().includes("boot")
        ? "El usuario informó que la estación de trabajo ABC00001 no arranca después de la actualización del sistema. El código de diagnóstico indica un Registro de Arranque Principal dañado. Los periféricos fueron probados y funcionan correctamente."
        : text.toLowerCase().includes("deployment") || text.toLowerCase().includes("implementation")
        ? "Revisión de implementación y despliegue: tareas de infraestructura de Halo ITSM sincronizadas con el plan maestro de producción."
        : `[Traducción al español]: ${text}`,
  },
  fr: {
    name: "French (Français)",
    flag: "🇫🇷",
    translate: (text: string) =>
      text.toLowerCase().includes("workstation") || text.toLowerCase().includes("boot")
        ? "L'utilisateur a signalé que le poste de travail ABC00001 ne démarre pas après la mise à jour du système. Le code de diagnostic indique un secteur de démarrage principal corrompu. Les périphériques ont été testés opérationnels."
        : text.toLowerCase().includes("deployment") || text.toLowerCase().includes("implementation")
        ? "Examen du déploiement et de la mise en œuvre : tâches d'infrastructure Halo ITSM synchronisées avec le plan de production principal."
        : `[Traduction en français]: ${text}`,
  },
  de: {
    name: "German (Deutsch)",
    flag: "🇩🇪",
    translate: (text: string) =>
      text.toLowerCase().includes("workstation") || text.toLowerCase().includes("boot")
        ? "Benutzer meldete, dass Arbeitsstation ABC00001 nach Systemaktualisierung nicht startet. Diagnosecode weist auf beschädigten Master Boot Record hin. Peripheriegeräte wurden erfolgreich getestet."
        : text.toLowerCase().includes("deployment") || text.toLowerCase().includes("implementation")
        ? "Bereitstellungs- und Implementierungsprüfung: Halo ITSM-Infrastrukturaufgaben wurden mit dem Master-Produktionsplan synchronisiert."
        : `[Deutsche Übersetzung]: ${text}`,
  },
  it: {
    name: "Italian (Italiano)",
    flag: "🇮🇹",
    translate: (text: string) =>
      text.toLowerCase().includes("workstation") || text.toLowerCase().includes("boot")
        ? "L'utente ha segnalato che la workstation ABC00001 non si avvia in seguito all'aggiornamento. Diagnosticato settore di avvio corrotto. Periferiche collaudate funzionanti."
        : `[Traduzione in italiano]: ${text}`,
  },
  pt: {
    name: "Portuguese (Português)",
    flag: "🇵🇹",
    translate: (text: string) =>
      text.toLowerCase().includes("workstation") || text.toLowerCase().includes("boot")
        ? "O usuário relatou que a estação de trabalho ABC00001 não inicializa após a atualização do sistema. Registro mestre de inicialização danificado. Periféricos testados e operacionais."
        : `[Tradução em português]: ${text}`,
  },
  ja: {
    name: "Japanese (日本語)",
    flag: "🇯🇵",
    translate: (text: string) =>
      text.toLowerCase().includes("workstation") || text.toLowerCase().includes("boot")
        ? "ユーザーは、システムアップデート後にワークステーションABC00001が起動しないと報告しました。診断コードはマスターブートレコードの破損を示しています。周辺機器（モニター、キーボード）は正常に動作しています。"
        : `[日本語訳]: ${text}`,
  },
  zh: {
    name: "Chinese (简体中文)",
    flag: "🇨🇳",
    translate: (text: string) =>
      text.toLowerCase().includes("workstation") || text.toLowerCase().includes("boot")
        ? "用户报告工作站 ABC00001 在系统更新后无法启动。诊断代码指示主引导记录损坏。周边设备（显示器、键盘）测试运行正常。"
        : `[中文翻译]: ${text}`,
  },
  ar: {
    name: "Arabic (العربية)",
    flag: "🇸🇦",
    translate: (text: string) =>
      text.toLowerCase().includes("workstation") || text.toLowerCase().includes("boot")
        ? "أبلغ المستخدم أن محطة العمل ABC00001 لا تعمل بعد تحديث النظام. يشير رمز التشخيص إلى تلف سجل التمهيد الرئيسي. الأجهزة الطرفية تم اختبارها وتعمل بشكل طبيعي."
        : `[الترجمة العربية]: ${text}`,
  },
  hi: {
    name: "Hindi (हिन्दी)",
    flag: "🇮🇳",
    translate: (text: string) =>
      text.toLowerCase().includes("workstation") || text.toLowerCase().includes("boot")
        ? "उपयोगकर्ता ने बताया कि सिस्टम अपडेट के बाद वर्कस्टेशन ABC00001 बूट करने में विफल रहता है। डायग्नोस्टिक कोड दूषित मास्टर बूट रिकॉर्ड को इंगित करता है। बाह्य उपकरण सामान्य रूप से काम कर रहे हैं।"
        : `[हिंदी अनुवाद]: ${text}`,
  },
};

export interface AiArticleItem {
  id: string;
  title: string;
  category: string;
  snippet: string;
  content: string[];
  steps: string[];
}

const AI_ARTICLES_DATA: Record<number, AiArticleItem[]> = {
  0: [
    {
      id: "KB-1042",
      title: "Upgrading Desktop Hardware Components",
      category: "Hardware",
      snippet: "Comprehensive guide for replacing RAM modules, SSDs, and power supply units in enterprise standard desktops.",
      content: [
        "Before opening the chassis, ensure the device is completely powered down and disconnected from mains AC power.",
        "Ground yourself with an anti-static wrist strap connected to an unpainted chassis ground.",
        "Seat replacement NVMe/SATA storage drives securely and verify detection in BIOS setup (F2/Del).",
      ],
      steps: [
        "1. Disconnect peripheral cables and power supply.",
        "2. Press power button for 10 seconds to drain motherboard capacitors.",
        "3. Install certified enterprise component and latch retaining clips.",
        "4. Power on and verify boot sequence in diagnostic self-test.",
      ],
    },
    {
      id: "KB-1089",
      title: "Setting Up a New Desktop for Employee",
      category: "Provisioning",
      snippet: "Standard operating procedure for imaging Windows 11 Enterprise workstations with Autopilot & Intune.",
      content: [
        "Connect workstation to corporate VLAN port configured with 802.1X authentication.",
        "Power on device and select Shift+F10 to verify network adapter MAC registration.",
        "Enter user credentials at OOBE prompt to trigger Autopilot device profile enrollment.",
      ],
      steps: [
        "1. Register hardware hash in Intune endpoint manager.",
        "2. Verify user assigned M365 E5 license in Entra ID.",
        "3. Complete Intune provisioning policy sync (approx 25 mins).",
      ],
    },
    {
      id: "KB-2015",
      title: "Upgrading to Latest Application Version",
      category: "Software",
      snippet: "Steps for deploying critical application updates via Company Portal or silent PowerShell script.",
      content: [
        "Close all running instances of the target application across all active user sessions.",
        "Check software prerequisites and .NET Framework 4.8.1 runtime availability.",
      ],
      steps: [
        "1. Deploy installer package with /qn /norestart switches.",
        "2. Verify registry HKLM\\Software\\Vendor version string.",
      ],
    },
    {
      id: "KB-2088",
      title: "Increasing Email Storage Quota",
      category: "Office 365",
      snippet: "Procedure to elevate Exchange Online mailbox storage from 50GB to 100GB archive tier.",
      content: [
        "Open Exchange Admin Center (EAC) > Recipients > Mailboxes.",
        "Select user account and enable Auto-Expanding Archiving via PowerShell.",
      ],
      steps: [
        "1. Run: Set-Mailbox -Identity <UPN> -ProhibitSendReceiveQuota 100GB.",
        "2. Wait 15 minutes for directory replication across tenant.",
      ],
    },
  ],
  1: [
    {
      id: "ERR-402",
      title: "Known Issue #402: Windows 11 Boot Loop after Update",
      category: "Critical Alert",
      snippet: "Active vendor advisory: Security update KB5031445 triggers 0xc000000f corrupted BCD on specific NVMe models.",
      content: [
        "Microsoft and vendor hardware engineering have confirmed an incompatibility with OEM storage firmware v2.1.",
        "Workaround involves rebuilding BCD partition using Windows Recovery Command Prompt.",
      ],
      steps: [
        "1. Boot from Windows 11 installation media > Repair your computer > Troubleshoot > CMD.",
        "2. Execute: bootrec /fixmbr",
        "3. Execute: bootrec /fixboot",
        "4. Execute: bootrec /rebuildbcd",
      ],
    },
    {
      id: "ERR-501",
      title: "Critical Advisory: Cisco AnyConnect VPN Certificate Expiration",
      category: "Network",
      snippet: "Users on legacy client versions 4.9 experiencing gateway timeout errors.",
      content: [
        "Gateway certificates renewed on 14/10/2026. Clients must update root trust certificates.",
      ],
      steps: [
        "1. Download Cisco Secure Client v5.0.05 from Service Catalogue.",
        "2. Reinstall with corporate profile preloaded.",
      ],
    },
  ],
  2: [
    {
      id: "INC-0003102",
      title: "Workstation ABC00003 corrupt MBR repair",
      category: "Resolved Incident",
      snippet: "Identical symptoms on Finance department PC. Resolved in 45 minutes by 2nd Line Support.",
      content: [
        "Technician ran DISM component store repair and rebuilt EFI system partition.",
        "User confirmed workstation booted into desktop normally without data loss.",
      ],
      steps: [
        "1. DISM /Online /Cleanup-Image /RestoreHealth",
        "2. sfc /scannow completed with all integrity violations repaired.",
      ],
    },
    {
      id: "SR-0002951",
      title: "Desktop hardware upgrade for Finance team",
      category: "Completed Task",
      snippet: "RAM upgraded from 16GB to 32GB DDR5 and cloned to 1TB NVMe drive.",
      content: [
        "Upgraded machine benchmarked and passed all Dell ePSA hardware diagnostics.",
      ],
      steps: [
        "1. Cloned with Macrium Reflect enterprise image.",
        "2. BitLocker encryption re-keyed with TPM 2.0.",
      ],
    },
  ],
  3: [
    {
      id: "SOL-891",
      title: "Solution SOL-891: Rebuild MBR via Windows Recovery CMD",
      category: "Automated Solution",
      snippet: "Standard script to repair corrupted Master Boot Record without reinstalling Windows.",
      content: [
        "Command sequence verified compatible with Windows 10/11 Enterprise UEFI GPT.",
      ],
      steps: [
        "bootrec /fixmbr",
        "bootrec /fixboot",
        "bootrec /scanos",
        "bootrec /rebuildbcd",
      ],
    },
    {
      id: "SOL-904",
      title: "Solution SOL-904: Reset BIOS Secure Boot Key and Run chkdsk",
      category: "Hardware Solution",
      snippet: "Clears corrupt NVRAM Secure Boot variables and repairs filesystem bad clusters.",
      content: [
        "Reboot into UEFI BIOS > Security > Secure Boot > Restore Factory Keys.",
        "Run chkdsk C: /f /r in offline recovery mode.",
      ],
      steps: [
        "1. Enter BIOS with F12 one-time boot menu.",
        "2. Restore factory security certificates.",
      ],
    },
  ],
  4: [],
};

export default function TicketDetailModal({
  ticket,
  currentUser = "Support Agent",
  variant = "incident",
  onClose,
  onUpdateTicket,
}: TicketDetailModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("progress");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isFollowOpen, setIsFollowOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showMenuTooltip, setShowMenuTooltip] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isRefreshingNotifs, setIsRefreshingNotifs] = useState(false);
  const [isAiArticlesOpen, setIsAiArticlesOpen] = useState(false);
  const [selectedArticleCategory, setSelectedArticleCategory] = useState<number>(0);
  const [isLoggingToSupplier, setIsLoggingToSupplier] = useState(false);
  const [supplierStatus, setSupplierStatus] = useState("With Supplier");
  const [supplierName, setSupplierName] = useState("Cisco Systems");
  const [supplierRef, setSupplierRef] = useState("SUP-0003988");
  const [supplierUpdateText, setSupplierUpdateText] = useState("");
  const [showEndUserSection, setShowEndUserSection] = useState(false);
  const [isSlaDetailsOpen, setIsSlaDetailsOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  // Activity Card Tools: Translation & Card Options matching Image (media_1792150777558_ff0872b2.png)
  const [isTranslateMenuOpen, setIsTranslateMenuOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [translatedLanguageLabel, setTranslatedLanguageLabel] = useState<string | null>(null);
  const [customDescription, setCustomDescription] = useState<string | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNoteText, setEditedNoteText] = useState("");
  const [isCardMenuOpen, setIsCardMenuOpen] = useState(false);
  const [isCardPinned, setIsCardPinned] = useState(false);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailDraftSubject, setEmailDraftSubject] = useState("");
  const [emailDraftBody, setEmailDraftBody] = useState("");
  const [emailDraftTo, setEmailDraftTo] = useState("");

  // Area 1: AI Suggested Articles & Preview
  const [selectedArticle, setSelectedArticle] = useState<AiArticleItem | null>(null);
  const [isPublishKbModalOpen, setIsPublishKbModalOpen] = useState(false);

  // Area 3: Follower Management
  const [isFollowersPickerOpen, setIsFollowersPickerOpen] = useState(false);
  const [followersList, setFollowersList] = useState<string[]>(["Admin", "Demo User"]);

  // Area 4: More Menu Modals & Real Connections
  const [isFlagged, setIsFlagged] = useState(false);
  const [isInternalChatOpen, setIsInternalChatOpen] = useState(false);
  const [internalChatMessages, setInternalChatMessages] = useState<Array<{ sender: string; time: string; text: string }>>([
    { sender: "Demo User", time: "10:14 AM", text: "Customer mentioned the machine blue-screened right after KB5031445 patch." },
    { sender: "Admin (You)", time: "10:18 AM", text: "Checked telemetry: corrupted Master Boot Record. Diagnostic code confirms." },
  ]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [isRecipientsModalOpen, setIsRecipientsModalOpen] = useState(false);
  const [ccRecipients, setCcRecipients] = useState("service-desk-leads@usehalo.com, supervisor@usehalo.com");
  const [bccRecipients, setBccRecipients] = useState("it-audit-logs@usehalo.com");
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlAttachmentTitle, setUrlAttachmentTitle] = useState("");
  const [urlAttachmentHref, setUrlAttachmentHref] = useState("");
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [todoItems, setTodoItems] = useState<Array<{ id: string; text: string; done: boolean }>>([
    { id: "td-1", text: "Verify hardware serial and manufacturer warranty status", done: true },
    { id: "td-2", text: "Attempt bootrec /fixmbr via recovery console", done: false },
    { id: "td-3", text: "Validate network share connectivity after OS boots", done: false },
  ]);
  const [newTodoText, setNewTodoText] = useState("");
  const [isIssueItemModalOpen, setIsIssueItemModalOpen] = useState(false);
  const [isLinkTicketModalOpen, setIsLinkTicketModalOpen] = useState(false);
  const [linkRelationType, setLinkRelationType] = useState("Related To");
  const [linkedTickets, setLinkedTickets] = useState<Array<{ id: string; relation: string; title: string }>>([
    { id: "#0003120", relation: "Related To", title: "Domain Controller intermittent DNS resolution" },
  ]);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; size: string; type: string }>>([
    { name: "system-diagnostic-report.log", size: "148 KB", type: "log" },
    { name: "event-viewer-export.evtx", size: "2.4 MB", type: "evtx" },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertSupplierText = (snippet: string) => {
    setSupplierUpdateText((prev) => (prev ? `${prev}\n${snippet}` : snippet));
    setStatusMessage('Formatting snippet inserted');
    setTimeout(() => setStatusMessage(null), 1500);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!ticket) return null;

  const ticketData = enrichTicketDetails(ticket);
  const cleanId = ticketData.id.replace(/^#/, "");
  // SLA view and standard ticket modal matching exact screenshot (media_1792174486655_97bcb53a.png):
  // Clean 3-button toolbar (Add Note, Re-Assign, Task Completed), dark green list icon with [ID:xxxxxxx],
  // chevron pipeline (Task Execution -> Completion), 4 subnav tabs (Progress, Details, View Log, Notification Log),
  // and right sidebar with Contact Address and User's Assets.
  const isSlaView = variant === "sla";
  const isProjectTask =
    !isSlaView &&
    cleanId !== "0003988" &&
    cleanId !== "3988" &&
    ticketData.type !== "Service Request" &&
    ticketData.type !== "Incident" &&
    ticketData.type === "Project Task";

  // Generate initials for requester avatar
  const initials = (ticketData.requester || "DU")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isCompleted = ticketData.status === "Completed" || ticketData.status === "Resolved";

  const handleToggleCompleted = () => {
    const nextStatus = isCompleted ? "In Progress" : "Completed";
    const updated: FullTicket = {
      ...ticketData,
      status: nextStatus,
    };
    onUpdateTicket?.(updated);
    setStatusMessage(`Ticket marked as ${nextStatus}`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const baseDescription = customDescription ?? ticketData.description ?? "";

  const getDisplayedDescription = () => {
    if (selectedLanguage !== "en" && TRANSLATION_MAP[selectedLanguage]) {
      return TRANSLATION_MAP[selectedLanguage].translate(baseDescription);
    }
    return baseDescription;
  };

  const renderActivityToolPills = () => (
    <div className="activity-tool-pills" onClick={(e) => e.stopPropagation()}>
      {/* 1. Translation Pill (A文) matching Image */}
      <div className="relative inline-block">
        <button
          type="button"
          className={`reaction-pill cursor-pointer ${translatedLanguageLabel ? "reaction-active" : ""}`}
          title="Translate activity text (A文)"
          onClick={() => {
            setIsTranslateMenuOpen(!isTranslateMenuOpen);
            setIsCardMenuOpen(false);
          }}
        >
          <span className="font-semibold text-[11.5px] text-slate-700 tracking-tight">A文</span>
          {translatedLanguageLabel && (
            <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-blue-100 text-blue-700 font-bold uppercase">
              {selectedLanguage}
            </span>
          )}
        </button>

        {isTranslateMenuOpen && (
          <div className="activity-translate-popover">
            <div className="translate-popover-header">
              <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800">
                <span className="text-sm">🌐</span>
                <span>Translate Activity</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTranslateMenuOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="translate-detected-row">
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Source:</span>
              <span className="text-[11px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                🇬🇧 English (Original)
              </span>
            </div>

            <div className="translate-languages-list">
              <button
                type="button"
                className={`translate-lang-item ${selectedLanguage === "en" ? "active-lang" : ""}`}
                onClick={() => {
                  setSelectedLanguage("en");
                  setTranslatedLanguageLabel(null);
                  setIsTranslateMenuOpen(false);
                  setStatusMessage("Restored original English text");
                  setTimeout(() => setStatusMessage(null), 2000);
                }}
              >
                <span className="text-sm">🇬🇧</span>
                <span className="text-xs flex-1 text-left font-medium">English (Original)</span>
                {selectedLanguage === "en" && <span className="text-xs text-cyan-600 font-bold">✓</span>}
              </button>

              {Object.entries(TRANSLATION_MAP).map(([code, item]) => (
                <button
                  key={code}
                  type="button"
                  className={`translate-lang-item ${selectedLanguage === code ? "active-lang" : ""}`}
                  onClick={() => {
                    setSelectedLanguage(code);
                    setTranslatedLanguageLabel(item.name);
                    setIsTranslateMenuOpen(false);
                    setStatusMessage(`✓ Note translated into ${item.name}`);
                    setTimeout(() => setStatusMessage(null), 2500);
                  }}
                >
                  <span className="text-sm">{item.flag}</span>
                  <span className="text-xs flex-1 text-left font-medium">{item.name}</span>
                  {selectedLanguage === code && <span className="text-xs text-cyan-600 font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Card Options Pill (···) matching Image */}
      <div className="relative inline-block">
        <button
          type="button"
          className={`reaction-pill cursor-pointer ${isCardPinned || isInternalNote ? "reaction-active" : ""}`}
          title="Activity card options (···)"
          onClick={() => {
            setIsCardMenuOpen(!isCardMenuOpen);
            setIsTranslateMenuOpen(false);
          }}
        >
          <span className="font-bold text-[12px] text-slate-700 leading-none">···</span>
        </button>

        {isCardMenuOpen && (
          <div className="activity-options-popover">
            {/* Pin / Unpin */}
            <button
              type="button"
              className="activity-menu-item"
              onClick={() => {
                setIsCardPinned(!isCardPinned);
                setIsCardMenuOpen(false);
                setStatusMessage(!isCardPinned ? "📌 Activity pinned to top of stream" : "Activity unpinned");
                setTimeout(() => setStatusMessage(null), 2500);
              }}
            >
              <span className="menu-item-icon">{isCardPinned ? "📍" : "📌"}</span>
              <span>{isCardPinned ? "Unpin Activity" : "Pin Activity to Top"}</span>
            </button>

            {/* Edit Note */}
            <button
              type="button"
              className="activity-menu-item"
              onClick={() => {
                setIsEditingNote(true);
                setEditedNoteText(customDescription || ticketData.description || "");
                setIsCardMenuOpen(false);
              }}
            >
              <span className="menu-item-icon">✏️</span>
              <span>Edit Activity Note</span>
            </button>

            {/* Copy Content */}
            <button
              type="button"
              className="activity-menu-item"
              onClick={() => {
                const textToCopy = getDisplayedDescription();
                navigator.clipboard?.writeText(textToCopy);
                setIsCardMenuOpen(false);
                setStatusMessage("✓ Note text copied to clipboard!");
                setTimeout(() => setStatusMessage(null), 2000);
              }}
            >
              <span className="menu-item-icon">📋</span>
              <span>Copy Note Content</span>
            </button>

            {/* Copy Direct Link */}
            <button
              type="button"
              className="activity-menu-item"
              onClick={() => {
                const permalink = `${window.location.origin}${window.location.pathname}#ticket-${cleanId}-activity`;
                navigator.clipboard?.writeText(permalink);
                setIsCardMenuOpen(false);
                setStatusMessage("✓ Direct activity link copied to clipboard!");
                setTimeout(() => setStatusMessage(null), 2000);
              }}
            >
              <span className="menu-item-icon">🔗</span>
              <span>Copy Direct Link</span>
            </button>

            {/* Forward in Email */}
            <button
              type="button"
              className="activity-menu-item"
              onClick={() => {
                setEmailDraftTo(ticketData.email || "akhan@usehalo.com");
                setEmailDraftSubject(`[Ticket #${cleanId}] Activity Update: ${ticketData.summary || ticketData.actionTitle || "Incident Update"}`);
                setEmailDraftBody(`--- Forwarded Activity Note from ${ticketData.requester || "Agent"} ---\n\n${getDisplayedDescription()}\n\n---------------------------------`);
                setIsEmailModalOpen(true);
                setIsCardMenuOpen(false);
              }}
            >
              <span className="menu-item-icon">✉️</span>
              <span>Forward Note in Email</span>
            </button>

            {/* Mark as Internal Note */}
            <button
              type="button"
              className="activity-menu-item"
              onClick={() => {
                setIsInternalNote(!isInternalNote);
                setIsCardMenuOpen(false);
                setStatusMessage(!isInternalNote ? "🔒 Marked as Internal Note (Agents only)" : "Marked as Public Note");
                setTimeout(() => setStatusMessage(null), 2500);
              }}
            >
              <span className="menu-item-icon">{isInternalNote ? "🔓" : "🔒"}</span>
              <span>{isInternalNote ? "Make Public Note" : "Mark as Internal Note"}</span>
            </button>

            {/* Print Activity */}
            <button
              type="button"
              className="activity-menu-item"
              onClick={() => {
                setIsCardMenuOpen(false);
                window.print();
              }}
            >
              <span className="menu-item-icon">🖨️</span>
              <span>Print Activity</span>
            </button>

            {/* Delete Activity */}
            <button
              type="button"
              className="activity-menu-item text-red-600 hover:bg-red-50 border-t border-gray-100"
              onClick={() => {
                setIsCardMenuOpen(false);
                if (window.confirm("Are you sure you want to delete this activity note?")) {
                  setCustomDescription("(This note has been deleted by agent)");
                  setStatusMessage("✓ Activity deleted");
                  setTimeout(() => setStatusMessage(null), 2500);
                }
              }}
            >
              <span className="menu-item-icon">🗑️</span>
              <span>Delete Activity</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderActivityCardBody = () => (
    <div className="activity-card-body">
      {isCardPinned && (
        <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
          <span>📌</span> Pinned to Top of Activity Stream
        </div>
      )}
      {isInternalNote && (
        <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold">
          <span>🔒</span> Internal Note — Visible to Support Agents Only
        </div>
      )}
      {translatedLanguageLabel && (
        <div className="mb-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11.5px] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span>🌐</span>
            <span>Translated to <strong>{translatedLanguageLabel}</strong> (Halo AI Translate)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedLanguage("en");
              setTranslatedLanguageLabel(null);
            }}
            className="text-[11px] font-bold text-blue-800 underline hover:text-blue-900 cursor-pointer"
          >
            Show Original
          </button>
        </div>
      )}

      {isEditingNote ? (
        <div className="activity-inline-edit-box">
          <textarea
            value={editedNoteText}
            onChange={(e) => setEditedNoteText(e.target.value)}
            className="activity-edit-textarea"
            rows={4}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsEditingNote(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomDescription(editedNoteText);
                setIsEditingNote(false);
                setStatusMessage("✓ Activity note saved");
                setTimeout(() => setStatusMessage(null), 2000);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <p className="activity-description-text">{getDisplayedDescription()}</p>
      )}
    </div>
  );

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote = {
      id: `n-${Date.now()}`,
      author: `${currentUser} (You)`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: newNoteText.trim(),
    };

    const updated: FullTicket = {
      ...ticketData,
      notes: [...(ticketData.notes || []), newNote],
    };

    onUpdateTicket?.(updated);
    setNewNoteText("");
    setIsAddingNote(false);
    setStatusMessage("Note added successfully");
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleReassign = (newAgent: string) => {
    const updated: FullTicket = {
      ...ticketData,
      agent: newAgent,
    };
    onUpdateTicket?.(updated);
    setIsReassignOpen(false);
    setStatusMessage(`Reassigned to ${newAgent}`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const toggleLike = () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const handleRefreshNotifications = () => {
    setIsRefreshingNotifs(true);
    setTimeout(() => setIsRefreshingNotifs(false), 1200);
  };

  const renderAssetIcon = (iconType: string) => {
    switch (iconType) {
      case "workstation":
        return (
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="3" width="20" height="13" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 16v5" />
          </svg>
        );
      case "phone":
        return (
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="6" y="2" width="12" height="20" rx="2" />
            <circle cx="12" cy="18" r="1" fill="currentColor" />
          </svg>
        );
      case "monitor":
        return (
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10M12 17v4" />
          </svg>
        );
      case "laptop":
      default:
        return (
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v13a1 1 0 001 1z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 19h20M9 19v1a1 1 0 001 1h4a1 1 0 001-1v-1" />
          </svg>
        );
    }
  };

  const modalContent = (
    <div
      className="ticket-screen-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`ticket-screen-modal ${isFullscreen ? "is-fullscreen" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast feedback notice */}
        {statusMessage && (
          <div className="ticket-toast-banner">
            ✓ {statusMessage}
          </div>
        )}

        {/* ── Top Action Toolbar ── */}
        <div className="ticket-toolbar-row">
          <div className="ticket-toolbar-actions">
            {isProjectTask ? (
              <>
                {/* 1. Add Note */}
                <button
                  type="button"
                  className={`ticket-pill-btn ${isAddingNote ? "active-btn" : ""}`}
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  title="Add internal note or update"
                >
                  <span className="btn-icon">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </span>
                  <span>Add Note</span>
                </button>

                {/* 2. Re-Assign */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    className={`ticket-pill-btn ${isReassignOpen ? "active-btn" : ""}`}
                    onClick={() => setIsReassignOpen(!isReassignOpen)}
                    title="Re-assign task to another agent"
                  >
                    <span className="btn-icon">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </span>
                    <span>Re-Assign</span>
                  </button>

                  {isReassignOpen && (
                    <div className="ticket-reassign-dropdown">
                      <div className="dropdown-header">Select Assignee</div>
                      {AVAILABLE_AGENTS.map((ag) => (
                        <button
                          key={ag}
                          type="button"
                          className={`dropdown-item ${ticketData.agent === ag ? "selected" : ""}`}
                          onClick={() => handleReassign(ag)}
                        >
                          <span>{ag}</span>
                          {ticketData.agent === ag && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Task Completed */}
                <button
                  type="button"
                  className={`ticket-pill-btn ${isCompleted ? "completed-btn" : ""}`}
                  onClick={handleToggleCompleted}
                  title="Mark task as completed"
                >
                  <span className="btn-icon">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <span>{isCompleted ? "Completed ✓" : "Task Completed"}</span>
                </button>
              </>
            ) : (
              <>
                {/* 1. Email User */}
                <button
                  type="button"
                  className="ticket-pill-btn cursor-pointer"
                  onClick={() => {
                    setEmailDraftTo(ticketData.email || "akhan@usehalo.com");
                    setEmailDraftSubject(`[Ticket #${cleanId}] - ${ticketData.summary || "Follow-up regarding your ticket"}`);
                    setEmailDraftBody(`Hello ${ticketData.requester || "User"},\n\nWe are currently investigating your ticket #${cleanId} (${ticketData.summary || "Service Request"}).\n\nPlease let us know if there is any additional diagnostic information or preferred callback window.\n\nKind regards,\n${currentUser}\nSupport Services`);
                    setIsEmailModalOpen(true);
                  }}
                  title="Send email to user"
                >
                  <span className="btn-icon">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </span>
                  <span>Email User</span>
                </button>

                {/* 2. Add Note */}
                <button
                  type="button"
                  className={`ticket-pill-btn ${isAddingNote ? "active-btn" : ""}`}
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  title="Add internal note or update"
                >
                  <span className="btn-icon">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </span>
                  <span>Add Note</span>
                </button>

                {/* 3. Re-Assign */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    className={`ticket-pill-btn ${isReassignOpen ? "active-btn" : ""}`}
                    onClick={() => setIsReassignOpen(!isReassignOpen)}
                    title="Re-assign ticket to another agent"
                  >
                    <span className="btn-icon">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </span>
                    <span>Re-Assign</span>
                    <span className="ml-1 text-[10px]">▾</span>
                  </button>

                  {isReassignOpen && (
                    <div className="ticket-reassign-dropdown">
                      <div className="dropdown-header">Select Assignee</div>
                      {AVAILABLE_AGENTS.map((ag) => (
                        <button
                          key={ag}
                          type="button"
                          className={`dropdown-item ${ticketData.agent === ag ? "selected" : ""}`}
                          onClick={() => handleReassign(ag)}
                        >
                          <span>{ag}</span>
                          {ticketData.agent === ag && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Create Appointment */}
                <button
                  type="button"
                  className="ticket-pill-btn cursor-pointer"
                  onClick={() => setIsAppointmentModalOpen(true)}
                  title="Schedule user appointment"
                >
                  <span className="btn-icon">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </span>
                  <span>Create Appointme...</span>
                </button>

                {/* 5. Log to Supplier */}
                <button
                  type="button"
                  className={`ticket-pill-btn ${isLoggingToSupplier ? "active-btn text-emerald-800 bg-emerald-50 border-emerald-400" : ""}`}
                  onClick={() => setIsLoggingToSupplier(!isLoggingToSupplier)}
                  title="Log external supplier case"
                >
                  <span className="btn-icon">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V4.5A1.5 1.5 0 0012.75 3h-7.5A1.5 1.5 0 003.75 4.5v10.5m10.5-7.5h4.875c.621 0 1.125.504 1.125 1.125v4.125m-6-5.25v5.25" />
                    </svg>
                  </span>
                  <span>Log to Supplier</span>
                </button>

                {/* 6. Resolve Ticket */}
                <button
                  type="button"
                  className={`ticket-pill-btn ${isCompleted ? "completed-btn" : ""}`}
                  onClick={handleToggleCompleted}
                  title="Resolve ticket"
                >
                  <span className="btn-icon">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <span>{isCompleted ? "Resolved ✓" : "Resolve Ticket"}</span>
                </button>
              </>
            )}
          </div>

          <div className="ticket-toolbar-controls">
            <button
              type="button"
              className="ticket-tool-icon"
              title="Toggle Fullscreen"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            </button>

            <div className="relative inline-block">
              <button
                type="button"
                className={`ticket-tool-icon ${!isSidebarVisible ? "tool-active" : ""}`}
                title={isSidebarVisible ? "Hide Properties Panel" : "Show Properties Panel"}
                onMouseEnter={() => setShowMenuTooltip(true)}
                onMouseLeave={() => setShowMenuTooltip(false)}
                onClick={() => {
                  setIsSidebarVisible(!isSidebarVisible);
                  setStatusMessage(isSidebarVisible ? "Properties panel hidden" : "Properties panel visible");
                  setTimeout(() => setStatusMessage(null), 2000);
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              {showMenuTooltip && (
                <div className="ticket-tool-tooltip">
                  <div className="tooltip-arrow" />
                  <span>{isSidebarVisible ? "Hide Properties" : "Show Menu"}</span>
                </div>
              )}
            </div>

            <div className="relative inline-block">
              <button
                type="button"
                className={`ticket-tool-icon ${isFollowOpen ? "tool-active" : ""}`}
                title="Follow this Ticket"
                onClick={() => setIsFollowOpen(!isFollowOpen)}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {isFollowOpen && (
                <div className="ticket-follow-popover">
                  <div className="follow-popover-arrow" />
                  <div className="follow-popover-header">
                    <svg className="w-4 h-4 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="follow-header-text">Follow this Ticket</span>
                  </div>
                  <div className="follow-popover-body">
                    <div className="follow-section-title">Followers</div>
                    <p className="follow-desc-text">
                      Followers can receive notifications about the Ticket, and will always have read access to the Ticket.
                    </p>
                    <button
                      type="button"
                      className="add-followers-btn cursor-pointer"
                      onClick={() => setIsFollowersPickerOpen(!isFollowersPickerOpen)}
                    >
                      <span className="add-followers-plus">+</span>
                      <span className="add-followers-label">
                        {followersList.length > 0 ? `Following (${followersList.join(", ")})` : "Add Followers"}
                      </span>
                      <span className="add-followers-caret">{isFollowersPickerOpen ? "▴" : "▾"}</span>
                    </button>

                    {isFollowersPickerOpen && (
                      <div className="followers-selector-menu">
                        <div className="text-[10px] font-bold text-gray-500 uppercase px-2 py-1">Select Followers</div>
                        {[
                          "Admin",
                          "Demo User",
                          "Sarah Connor",
                          "David Chen",
                          "Elena Rostova",
                          "James Wilson",
                        ].map((agentName) => {
                          const isChecked = followersList.includes(agentName);
                          return (
                            <label key={agentName} className="follower-checkbox-row">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setFollowersList(followersList.filter((f) => f !== agentName));
                                  } else {
                                    setFollowersList([...followersList, agentName]);
                                  }
                                  setStatusMessage(`Updated followers list`);
                                  setTimeout(() => setStatusMessage(null), 1500);
                                }}
                                className="rounded text-cyan-600 focus:ring-cyan-500"
                              />
                              <span>{agentName}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative inline-block">
              <button
                type="button"
                className={`ticket-tool-icon ${isShareOpen ? "tool-active" : ""}`}
                title="Share Ticket"
                onClick={() => {
                  setIsShareOpen(!isShareOpen);
                  setIsMoreOpen(false);
                  setIsFollowOpen(false);
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
              </button>

              {isShareOpen && (
                <div className="ticket-share-popover">
                  <div className="share-popover-arrow" />
                  <h4 className="share-popover-title">Share</h4>
                  <button
                    type="button"
                    className="share-copy-link-btn"
                    onClick={() => {
                      navigator.clipboard?.writeText(window.location.href);
                      setCopiedLink(true);
                      setStatusMessage("Link copied to clipboard!");
                      setTimeout(() => {
                        setCopiedLink(false);
                        setStatusMessage(null);
                      }, 2000);
                    }}
                  >
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-6.364a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                    <span>{copiedLink ? "Copied!" : "Copy link"}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="relative inline-block">
              <button
                type="button"
                className={`ticket-tool-icon ${isMoreOpen ? "tool-active" : ""}`}
                title="More Options"
                onClick={() => {
                  setIsMoreOpen(!isMoreOpen);
                  setIsShareOpen(false);
                  setIsFollowOpen(false);
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>

              {isMoreOpen && (
                <div className="ticket-more-dropdown">
                  <div className="more-dropdown-arrow" />
                  <div className="more-dropdown-scroll">
                    {/* Exact 15 items from screenshot (media_1792174486655_97bcb53a.png) */}
                    {/* 1. Edit Email Recipients */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsRecipientsModalOpen(true);
                        setIsMoreOpen(false);
                      }}
                    >
                      <span className="menu-icon">@</span>
                      <span>Edit Email Recipients</span>
                    </button>

                    {/* 2. Add Attachment */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsMoreOpen(false);
                        fileInputRef.current?.click();
                      }}
                    >
                      <span className="menu-icon">📎</span>
                      <span>Add Attachment</span>
                    </button>

                    {/* 3. Add URL to Attachment */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsUrlModalOpen(true);
                        setIsMoreOpen(false);
                      }}
                    >
                      <span className="menu-icon">📎</span>
                      <span>Add URL to Attachment</span>
                    </button>

                    {/* 4. Add a To-Do item */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsTodoModalOpen(true);
                        setIsMoreOpen(false);
                      }}
                    >
                      <span className="menu-icon">:=</span>
                      <span>Add a To-Do item</span>
                    </button>

                    {/* 5. Issue Item */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsIssueItemModalOpen(true);
                        setIsMoreOpen(false);
                      }}
                    >
                      <span className="menu-icon">🚚</span>
                      <span>Issue Item</span>
                    </button>

                    {/* 6. Link to another Ticket */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setLinkRelationType("Related To");
                        setIsLinkTicketModalOpen(true);
                        setIsMoreOpen(false);
                      }}
                    >
                      <span className="menu-icon">📎</span>
                      <span>Link to another Ticket</span>
                    </button>

                    {/* 7. Link Tickets to this Ticket */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setLinkRelationType("Parent Of");
                        setIsLinkTicketModalOpen(true);
                        setIsMoreOpen(false);
                      }}
                    >
                      <span className="menu-icon">📎</span>
                      <span>Link Tickets to this Ticket</span>
                    </button>

                    {/* 8. Relate to another Ticket */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setLinkRelationType("Depends On");
                        setIsLinkTicketModalOpen(true);
                        setIsMoreOpen(false);
                      }}
                    >
                      <span className="menu-icon">📎</span>
                      <span>Relate to another Ticket</span>
                    </button>

                    {/* 9. Merge */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsMergeModalOpen(true);
                        setIsMoreOpen(false);
                      }}
                    >
                      <span className="menu-icon">🔀</span>
                      <span>Merge</span>
                    </button>

                    {/* 10. Unlink from Parent Ticket */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsMoreOpen(false);
                        setLinkedTickets([]);
                        setStatusMessage("Unlinked from parent ticket");
                        setTimeout(() => setStatusMessage(null), 2000);
                      }}
                    >
                      <span className="menu-icon">✂</span>
                      <span>Unlink from Parent Ticket</span>
                    </button>

                    {/* 11. Clone */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsMoreOpen(false);
                        const nextId = `#000${Number(cleanId.replace(/\D/g, '')) + 1 || 3989}`;
                        const cloned: FullTicket = {
                          ...ticketData,
                          id: nextId,
                          summary: `[CLONE] ${ticketData.summary}`,
                          status: "New",
                        };
                        onUpdateTicket?.(cloned);
                        setStatusMessage(`✓ Cloned as ${nextId}`);
                        setTimeout(() => setStatusMessage(null), 2500);
                      }}
                    >
                      <span className="menu-icon">📑</span>
                      <span>Clone</span>
                    </button>

                    {/* 12. Change Site/User */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsMoreOpen(false);
                        setIsReassignOpen(true);
                      }}
                    >
                      <span className="menu-icon">👤</span>
                      <span>Change Site/User</span>
                    </button>

                    {/* 13. Save as a new Template */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsMoreOpen(false);
                        setIsPublishKbModalOpen(true);
                      }}
                    >
                      <span className="menu-icon">📄</span>
                      <span>Save as a new Template</span>
                    </button>

                    {/* 14. Print Ticket */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsMoreOpen(false);
                        window.print();
                      }}
                    >
                      <span className="menu-icon">🖨</span>
                      <span>Print Ticket</span>
                    </button>

                    {/* 15. Import Child Tickets from XLS */}
                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsMoreOpen(false);
                        setStatusMessage("Importing XLS...");
                        setTimeout(() => setStatusMessage(null), 2000);
                      }}
                    >
                      <span className="menu-icon">📊</span>
                      <span>Import Child Tickets from XLS</span>
                    </button>

                    {/* Additional standard tools */}
                    <div style={{ height: "1px", background: "#f1f5f9", margin: "4px 0" }} />

                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsInternalChatOpen(true);
                        setIsMoreOpen(false);
                      }}
                    >
                      <span className="menu-icon">💬</span>
                      <span>Chat about this Ticket</span>
                    </button>

                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsFlagged(!isFlagged);
                        setIsMoreOpen(false);
                        setStatusMessage(!isFlagged ? "🚩 Ticket flagged for senior review" : "Ticket flag cleared");
                        setTimeout(() => setStatusMessage(null), 2500);
                      }}
                    >
                      <span className="menu-icon">🚩</span>
                      <span>{isFlagged ? "Unflag Ticket" : "Flag Ticket"}</span>
                    </button>

                    <button
                      type="button"
                      className="more-menu-item"
                      onClick={() => {
                        setIsMoreOpen(false);
                        setStatusMessage("Ticket refreshed with live status");
                        setTimeout(() => setStatusMessage(null), 2000);
                      }}
                    >
                      <span className="menu-icon">🔄</span>
                      <span>Refresh</span>
                    </button>

                    <button
                      type="button"
                      className="more-menu-item menu-item-danger"
                      onClick={() => {
                        setIsMoreOpen(false);
                        setStatusMessage("Ticket deleted");
                        setTimeout(() => {
                          setStatusMessage(null);
                          onClose();
                        }, 1500);
                      }}
                    >
                      <span className="menu-icon">🗑</span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="ticket-tool-close"
              onClick={onClose}
              title="Close modal"
              aria-label="Close ticket details"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Ticket Identity & Title Banner (Image 1 / Image 3) ── */}
        <div className="ticket-header-card-layout">
          <div className="ticket-header-left-pane">
            <div className="ticket-id-container">
              {isProjectTask ? (
                <div className="ticket-badge-icon project-task-badge" title="Project Task">
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <line x1="8" y1="6" x2="21" y2="6" strokeLinecap="round" />
                    <line x1="8" y1="12" x2="21" y2="12" strokeLinecap="round" />
                    <line x1="8" y1="18" x2="21" y2="18" strokeLinecap="round" />
                    <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth={3.5} strokeLinecap="round" />
                    <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth={3.5} strokeLinecap="round" />
                    <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth={3.5} strokeLinecap="round" />
                  </svg>
                </div>
              ) : (
                <div className="ticket-badge-icon question-badge" title="Service Request / Incident">
                  ?
                </div>
              )}
              <span className="ticket-id-text">
                {isProjectTask
                  ? `[ID:${cleanId.replace(/-C$/, '').replace(/^0+/, '').padStart(7, '0')}]`
                  : cleanId.startsWith("SR-") || cleanId.startsWith("INC-")
                  ? `[${cleanId}]`
                  : ticketData.type?.toLowerCase().includes("incident")
                  ? `[INC-${cleanId.replace(/^0+/, '').padStart(7, '0')}]`
                  : `[SR-${cleanId.replace(/^0+/, '').padStart(7, '0')}]`}
              </span>
            </div>
            <h1 className="ticket-title-heading">{ticketData.summary}</h1>

            {/* Flagged Ticket Banner (Area 4: Flagged in more menu) */}
            {isFlagged && (
              <div className="ticket-flag-alert">
                <span>🚩</span>
                <span>Flagged: High Priority Escalation requested by Senior Technical Lead</span>
                <button
                  type="button"
                  onClick={() => setIsFlagged(false)}
                  className="ml-auto text-xs underline font-semibold cursor-pointer text-red-800"
                >
                  Dismiss Flag
                </button>
              </div>
            )}

            {/* Linked Tickets Bar (Area 4: Link / Relate ticket) */}
            {linkedTickets.length > 0 && (
              <div className="linked-tickets-bar">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Linked:</span>
                {linkedTickets.map((lt, idx) => (
                  <span key={idx} className="linked-ticket-chip" title={lt.title}>
                    <span>🔗</span>
                    <span><strong>{lt.relation}:</strong> {lt.id}</span>
                  </span>
                ))}
              </div>
            )}

            {/* ── Chevron Lifecycle Pipeline ── */}
            <div className="ticket-chevron-pipeline">
              {isProjectTask ? (
                <>
                  <div className="chevron-step chevron-active">
                    <span className="chevron-title">Task Execution</span>
                    <span className="chevron-date">{ticketData.executionDate || "06/11/2025 10:56 PM"}</span>
                  </div>
                  <div className={`chevron-step ${isCompleted ? "chevron-active" : "chevron-inactive"}`}>
                    <span className="chevron-title">Completion</span>
                    {isCompleted && <span className="chevron-date">Resolved</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="chevron-step chevron-active">
                    <span className="chevron-title">
                      {ticketData.pipelineStage && ticketData.pipelineStage !== "Request Fulfillment"
                        ? ticketData.pipelineStage
                        : "Request Fulfilment"}
                    </span>
                    <span className="chevron-date">{ticketData.pipelineDate || "29/07/2026 6:22 PM"}</span>
                  </div>
                  <div className={`chevron-step ${isCompleted ? "chevron-active" : "chevron-inactive"}`}>
                    <span className="chevron-title">Closed</span>
                    {isCompleted && <span className="chevron-date">Resolved</span>}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Incident SLA Box (Image 3) - Only for Incidents / Requests ── */}
          {!isProjectTask && (
            <div
              className="ticket-incident-sla-box cursor-pointer"
              onClick={() => setIsSlaDetailsOpen(true)}
              title="Click to view detailed SLA Targets & Breach Breakdown"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsSlaDetailsOpen(true);
                }
              }}
            >
              <div className="sla-box-green-header">
                <div className="sla-label-text">Incident SLA</div>
                <div className="sla-priority-text">{ticketData.priority || "Low"}</div>
              </div>
              <div className="sla-box-red-badge" title="Breached SLA duration">
                {ticketData.slaTime || "-32:01"}
              </div>
              <div className="sla-box-targets">
                <div
                  className="sla-target-line"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSlaDetailsOpen(true);
                  }}
                  title="Response Target Met - Click for metrics breakdown"
                >
                  <span>Response Target: {ticketData.responseTarget || "01/09/2026 10:29 PM"}</span>
                  <span className="sla-check-circle" title="Response Target Met">✓</span>
                </div>
                <div
                  className="sla-target-line"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSlaDetailsOpen(true);
                  }}
                  title="Resolution Target Breached - Click for metrics breakdown"
                >
                  <span>Resolution Target: {ticketData.resolutionTarget || "10/09/2026 10:29 PM"}</span>
                  <span className="sla-cross-circle" title="Resolution Target Breached">✕</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sub-Navigation Tabs ── */}
        <div className="ticket-subnav-row">
          <div className="ticket-tabs-left">
            {isProjectTask ? (
              <>
                <button
                  type="button"
                  className={`ticket-nav-tab ${activeTab === "progress" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("progress")}
                >
                  Progress
                </button>
                <button
                  type="button"
                  className={`ticket-nav-tab ${activeTab === "details" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("details")}
                >
                  Details
                </button>
                <button
                  type="button"
                  className={`ticket-nav-tab ${activeTab === "view-log" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("view-log")}
                >
                  View Log
                </button>
                <button
                  type="button"
                  className={`ticket-nav-tab ${activeTab === "notification-log" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("notification-log")}
                >
                  Notification Log
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={`ticket-nav-tab ${activeTab === "progress" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("progress")}
                >
                  Progress
                </button>
                <button
                  type="button"
                  className={`ticket-nav-tab ${activeTab === "ai-insights" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("ai-insights")}
                >
                  AI Insights
                </button>
                <button
                  type="button"
                  className={`ticket-nav-tab ${activeTab === "additional-fields" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("additional-fields")}
                >
                  Additional Fields
                </button>
                <button
                  type="button"
                  className={`ticket-nav-tab ${activeTab === "audit-log" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("audit-log")}
                >
                  Audit Log
                </button>
                <button
                  type="button"
                  className={`ticket-nav-tab ${activeTab === "view-log" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("view-log")}
                >
                  View Log
                </button>
                <button
                  type="button"
                  className={`ticket-nav-tab ${activeTab === "notification-log" ? "tab-active" : ""}`}
                  onClick={() => setActiveTab("notification-log")}
                >
                  Notification Log
                </button>
              </>
            )}
          </div>

          {isProjectTask && (
            <div className="ticket-subnav-center">
              {/* Cyan dotted loading / sync indicator for Project Tasks */}
              <span className="cyan-sync-dots" title="Live sync active">
                <span className="sync-dot" />
                <span className="sync-dot" />
                <span className="sync-dot" />
                <span className="sync-dot" />
              </span>
            </div>
          )}

          <div className="ticket-subnav-right">
            <button 
              type="button" 
              className="subnav-tool-btn cursor-pointer" 
              title="Add Note / Comments"
              onClick={() => {
                setActiveTab('progress');
                setIsAddingNote(true);
                setStatusMessage('Note composer opened');
                setTimeout(() => {
                  const textarea = document.querySelector('.new-note-textarea') as HTMLTextAreaElement;
                  if (textarea) {
                    textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    textarea.focus();
                  } else {
                    const modal = document.querySelector('.ticket-screen-modal');
                    if (modal) modal.scrollTo({ top: 380, behavior: 'smooth' });
                  }
                }, 100);
              }}
            >
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-.974-.94 5.952 5.952 0 00.702-2.128C3.79 16.326 3 14.28 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </button>
            <button 
              type="button" 
              className="subnav-tool-btn cursor-pointer" 
              title="Toggle Properties Panel"
              onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            >
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M15 3v18" />
              </svg>
            </button>
            <button 
              type="button" 
              className="subnav-tool-btn cursor-pointer" 
              title="Scroll to bottom / top"
              onClick={() => {
                const modal = document.querySelector('.ticket-screen-modal');
                const leftCol = document.querySelector('.ticket-left-column');
                const target = modal || leftCol;
                if (target) {
                  const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 60;
                  if (isAtBottom) {
                    target.scrollTo({ top: 0, behavior: 'smooth' });
                    setStatusMessage('Scrolled to top');
                  } else {
                    target.scrollTo({ top: target.scrollHeight, behavior: 'smooth' });
                    setStatusMessage('Scrolled to bottom');
                  }
                  setTimeout(() => setStatusMessage(null), 1500);
                }
              }}
            >
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Floating AI Suggested Articles Widget (Matching Image 3 & Image 5) ── */}
        {isAiArticlesOpen && (
          <div className="ai-suggested-floating-card">
            <div className="ai-suggested-header">
              <span className="ai-suggested-title">AI Suggested Articles</span>
              <div className="ai-suggested-tools">
                <button 
                  type="button" 
                  className="ai-header-btn cursor-pointer font-bold text-sm" 
                  title="Create New Knowledge Base Article from this Incident (+)"
                  onClick={() => setIsPublishKbModalOpen(true)}
                >
                  +
                </button>
                <button
                  type="button"
                  className="ai-header-btn close-btn cursor-pointer"
                  onClick={() => setIsAiArticlesOpen(false)}
                  title="Close suggested articles"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="ai-icon-bar">
              <button
                type="button"
                className={`ai-filter-icon-btn btn-green ${selectedArticleCategory === 0 ? "icon-active" : ""}`}
                onClick={() => setSelectedArticleCategory(0)}
                title="Knowledge Base Articles"
              >
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 2H6c-1.2 0-2 .8-2 2v16c0 1.2.8 2 2 2h13c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h2v7l2.5-1.5L13 11V4h6v16z"/>
                </svg>
              </button>

              <button
                type="button"
                className={`ai-filter-icon-btn btn-red ${selectedArticleCategory === 1 ? "icon-active" : ""}`}
                onClick={() => setSelectedArticleCategory(1)}
                title="Alerts / Issues"
              >
                <span className="text-white text-xs font-bold">!</span>
              </button>

              <button
                type="button"
                className={`ai-filter-icon-btn btn-orange ${selectedArticleCategory === 2 ? "icon-active" : ""}`}
                onClick={() => setSelectedArticleCategory(2)}
                title="Similar Past Tickets"
              >
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
                </svg>
              </button>

              <button
                type="button"
                className={`ai-filter-icon-btn btn-cyan ${selectedArticleCategory === 3 ? "icon-active" : ""}`}
                onClick={() => setSelectedArticleCategory(3)}
                title="Verified Solutions"
              >
                <span className="text-white text-xs font-bold">✓</span>
              </button>

              <button
                type="button"
                className={`ai-filter-icon-btn btn-none ${selectedArticleCategory === 4 ? "icon-active" : ""}`}
                onClick={() => setSelectedArticleCategory(4)}
                title="Show All"
              >
                <span className="text-xs">⊘</span>
              </button>
            </div>

            <div className="ai-articles-stack">
              {(
                selectedArticleCategory === 4
                  ? [
                      ...AI_ARTICLES_DATA[0],
                      ...AI_ARTICLES_DATA[1],
                      ...AI_ARTICLES_DATA[2],
                      ...AI_ARTICLES_DATA[3],
                    ]
                  : AI_ARTICLES_DATA[selectedArticleCategory] || AI_ARTICLES_DATA[0]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="ai-article-card-item cursor-pointer text-left hover:bg-white/10 transition-colors p-1.5 rounded-lg"
                  onClick={() => setSelectedArticle(item)}
                  title={`Click to read & apply: "${item.title}"`}
                >
                  <div className="ai-doc-green-icon">
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 2H6c-1.2 0-2 .8-2 2v16c0 1.2.8 2 2 2h13c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h2v7l2.5-1.5L13 11V4h6v16z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="ai-article-title-text block truncate font-medium text-xs text-white">{item.title}</span>
                    <span className="text-[10px] text-gray-400 block truncate">{item.category} • {item.id}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Main Two-Column Layout ── */}
        <div className="ticket-main-grid">
          {/* Left Column: Feed & Content */}
          <div className="ticket-content-col">
            {isLoggingToSupplier ? (
              <div className="ticket-supplier-composer-card">
                {/* Composer Header */}
                <div className="supplier-composer-header">
                  <div className="supplier-header-left">
                    <div className="supplier-q-badge">
                      <svg className="w-5 h-5 text-[#00bcd4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.8}>
                        <circle cx="12" cy="12" r="7.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.378 1.157.062 1.638A8.04 8.04 0 0112 20.25z" />
                      </svg>
                    </div>
                    <div className="supplier-user-title-col">
                      <div className="supplier-user-name">
                        <span>Demo User</span>
                        <span className="trophy-gold">🏆</span>
                      </div>
                      <div className="supplier-log-action-label">
                        <span className="supplier-green-bar" />
                        <span className="supplier-action-title font-bold text-gray-900">Log to Supplier</span>
                      </div>
                    </div>
                  </div>
                  <div className="supplier-header-right">
                    <button 
                      type="button" 
                      className="supplier-head-tool-btn cursor-pointer" 
                      title="More options"
                      onClick={() => {
                        setStatusMessage('Supplier options: Webhook sync enabled, SLA clock paused with vendor');
                        setTimeout(() => setStatusMessage(null), 2500);
                      }}
                    >
                      •••
                    </button>
                    <button 
                      type="button" 
                      className="supplier-head-tool-btn cursor-pointer" 
                      title="Urgent / Flag"
                      onClick={() => {
                        setSupplierStatus('Urgent / Escalated');
                        setStatusMessage('Escalated with vendor priority');
                        setTimeout(() => setStatusMessage(null), 2000);
                      }}
                    >
                      !
                    </button>
                    <button 
                      type="button" 
                      className="supplier-head-tool-btn cursor-pointer" 
                      title="Attach file"
                      onClick={() => {
                        insertSupplierText('[Attachment: log-dump.tar.gz]');
                        setStatusMessage('File attachment inserted');
                        setTimeout(() => setStatusMessage(null), 2000);
                      }}
                    >
                      📎
                    </button>
                    <button
                      type="button"
                      className="supplier-head-tool-btn close-composer-btn cursor-pointer"
                      onClick={() => setIsLoggingToSupplier(false)}
                      title="Close composer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Recipient To Row */}
                <div className="supplier-to-row">
                  <span className="supplier-to-label">To</span>
                  <div className="supplier-to-input-area">
                    <input
                      type="text"
                      className="supplier-to-input"
                      placeholder="tac-support@cisco.com"
                      defaultValue=""
                    />
                    <div className="supplier-to-actions">
                      <span className="supplier-pipe-sep">|</span>
                      <button 
                        type="button" 
                        className="supplier-dropdown-caret cursor-pointer" 
                        title="Select contacts"
                        onClick={() => {
                          setStatusMessage('Selected vendor support contact');
                          setTimeout(() => setStatusMessage(null), 2000);
                        }}
                      >
                        ▾
                      </button>
                      <button 
                        type="button" 
                        className="supplier-cc-btn cursor-pointer" 
                        title="Add CC"
                        onClick={() => {
                          setStatusMessage('CC added: noc-oncall@servigen.io');
                          setTimeout(() => setStatusMessage(null), 2000);
                        }}
                      >
                        CC
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rich Formatting Toolbar */}
                <div className="supplier-richtext-toolbar-box">
                  <div className="toolbar-top-row">
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Fullscreen"
                      onClick={() => setIsFullscreen((f) => !f)}
                    >
                      ⛶
                    </button>
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Font options"
                      onClick={() => insertSupplierText('**Bold Section Title**')}
                    >
                      A ▾
                    </button>
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Alignment"
                      onClick={() => insertSupplierText('\n---\n')}
                    >
                      ≡ ▾
                    </button>
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Numbered list"
                      onClick={() => insertSupplierText('1. Step 1\n2. Step 2\n3. Step 3')}
                    >
                      := ▾
                    </button>
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Bullet list"
                      onClick={() => insertSupplierText('• Action Item 1\n• Action Item 2')}
                    >
                      •= ▾
                    </button>
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Quote"
                      onClick={() => insertSupplierText('> Quoted vendor communication')}
                    >
                      “ ” ▾
                    </button>
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Insert link"
                      onClick={() => insertSupplierText('[Vendor Portal](https://support.cisco.com)')}
                    >
                      🔗
                    </button>
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Insert image"
                      onClick={() => insertSupplierText('![Network Topology Diagram](https://servigen.io/assets/diagram.png)')}
                    >
                      🖼
                    </button>
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Insert table"
                      onClick={() => insertSupplierText('| Component | Status | Target |\n| --- | --- | --- |\n| Core Switch | Degraded | 10.0.1.1 |')}
                    >
                      ▦
                    </button>
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Insert emoji"
                      onClick={() => insertSupplierText('👍 Verified & Monitored')}
                    >
                      🙂
                    </button>
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Insert variable"
                      onClick={() => insertSupplierText(`{{Ticket.Id: #${cleanId}}}`)}
                    >
                      + :
                    </button>
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Add attachment"
                      onClick={() => insertSupplierText('[Attachment: telemetry-capture.pcap]')}
                    >
                      +
                    </button>
                  </div>
                  <div className="toolbar-bottom-row">
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Horizontal rule"
                      onClick={() => insertSupplierText('\n---\n')}
                    >
                      —
                    </button>
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Strikethrough"
                      onClick={() => insertSupplierText('~~superseded action~~')}
                    >
                      A̶
                    </button>
                    <button 
                      type="button" 
                      className="rt-tool-btn cursor-pointer" 
                      title="Code snippet"
                      onClick={() => insertSupplierText('```bash\nkubectl logs -n ingress-nginx svc/router\n```')}
                    >
                      &lt; &gt;
                    </button>
                  </div>
                </div>

                {/* Rich Text Area */}
                <div className="supplier-textarea-wrapper">
                  <textarea
                    className="supplier-rich-textarea"
                    placeholder="Type your update here"
                    value={supplierUpdateText}
                    onChange={(e) => setSupplierUpdateText(e.target.value)}
                    rows={6}
                  />
                </div>

                {/* Bottom Metadata Fields Row */}
                <div className="supplier-bottom-fields-row">
                  <div className="supplier-field-item">
                    <label className="supplier-field-title">
                      Status <span className="text-red-500 font-bold">*</span>
                    </label>
                    <select
                      className="supplier-field-select"
                      value={supplierStatus}
                      onChange={(e) => setSupplierStatus(e.target.value)}
                    >
                      <option value="With Supplier">With Supplier</option>
                      <option value="Awaiting Parts">Awaiting Parts</option>
                      <option value="Supplier Dispatched">Supplier Dispatched</option>
                      <option value="Under Vendor Review">Under Vendor Review</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>

                  <div className="supplier-field-item">
                    <label className="supplier-field-title">Supplier</label>
                    <select
                      className="supplier-field-select"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                    >
                      <option value="Cisco Systems">Cisco Systems</option>
                      <option value="Dell OEM Services">Dell OEM Services</option>
                      <option value="Microsoft Premier Support">Microsoft Premier Support</option>
                      <option value="BT Telecom Wholesale">BT Telecom Wholesale</option>
                    </select>
                  </div>

                  <div className="supplier-field-item">
                    <label className="supplier-field-title">Supplier Ref</label>
                    <input
                      type="text"
                      className="supplier-field-textinput"
                      placeholder=""
                      value={supplierRef}
                      onChange={(e) => setSupplierRef(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit / Cancel Actions */}
                <div className="supplier-composer-footer">
                  <button
                    type="button"
                    className="supplier-cancel-btn"
                    onClick={() => setIsLoggingToSupplier(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="supplier-submit-btn"
                    onClick={() => {
                      const newNote = {
                        id: `supp-${Date.now()}`,
                        author: `${currentUser} (Logged to ${supplierName})`,
                        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        text: supplierUpdateText.trim() || `Ticket logged to external supplier ${supplierName} (Ref: ${supplierRef || "N/A"}). Status changed to ${supplierStatus}.`,
                      };
                      const updated: FullTicket = {
                        ...ticketData,
                        status: supplierStatus,
                        notes: [...(ticketData.notes || []), newNote],
                      };
                      onUpdateTicket?.(updated);
                      setIsLoggingToSupplier(false);
                      setSupplierUpdateText("");
                      setStatusMessage(`Supplier update logged to ${supplierName}`);
                      setTimeout(() => setStatusMessage(null), 2500);
                    }}
                  >
                    <span>🚚 Log to Supplier</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Tab 1: Progress (from Image 1) */}
                {activeTab === "progress" && (
              <>
                {/* Inline Add Note Form */}
                {isAddingNote && (
                  <form onSubmit={handleAddNote} className="ticket-add-note-card">
                    <h4 className="font-semibold text-xs text-gray-700 mb-2">Add Public/Internal Note</h4>
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Type details, findings, or next steps here..."
                      className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNote(false);
                          setNewNoteText("");
                        }}
                        className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-full shadow-xs"
                      >
                        Post Note
                      </button>
                    </div>
                  </form>
                )}

                {/* Primary Activity Card matching exact screenshot */}
                {isProjectTask ? (
                  <div className="ticket-activity-card">
                    <div className="activity-card-header">
                      <div className="activity-author-left">
                        {/* Cyan bubble icon matching Image 1 */}
                        <div className="activity-bubble-avatar">
                          <div
                            className="bubble-circle"
                            style={{
                              background: "#06b6d4",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M4.5 3.75A2.25 2.25 0 002.25 6v9a2.25 2.25 0 002.25 2.25h1.5v3.75l4.5-3.75h9.75A2.25 2.25 0 0022.5 15V6a2.25 2.25 0 00-2.25-2.25H4.5z" />
                            </svg>
                          </div>
                          <span className="bubble-green-dot" />
                        </div>

                        <div className="activity-author-meta">
                          <div className="author-name-row">
                            <span className="author-name">Admin (You)</span>
                            <span className="trophy-badge" title="Owner" style={{ marginLeft: "4px" }}>🏆</span>
                          </div>
                          <div className="activity-action-label">
                            Create Project Task
                          </div>
                          <div className="activity-tag-row">
                            <span className="badge-new-green">New</span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1 flex flex-col gap-0.5">
                            <span>Time Taken: {ticketData.timeTaken || "70:15"}</span>
                            <span>From: {ticketData.fromTicketId || "#2196"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="activity-actions-right">
                        <span className="activity-timestamp">{ticketData.createdAt || "17/05/2026 4:06 AM"}</span>
                        {renderActivityToolPills()}
                      </div>
                    </div>

                    {renderActivityCardBody()}
                  </div>
                ) : (
                  <div className="ticket-activity-card">
                    <div className="activity-card-header">
                      <div className="activity-author-left">
                        {/* Avatar Circle with Initials (Maroon circle matching Image 3) */}
                        <div className="activity-bubble-avatar">
                          <div
                            className="bubble-circle"
                            style={{
                              background: "#7f1d1d",
                              color: "#ffffff",
                              fontWeight: 700,
                              fontSize: "13px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {initials}
                          </div>
                          <span className="bubble-green-dot" />
                        </div>

                        <div className="activity-author-meta">
                          <div className="author-name-row">
                            <span className="author-name">{ticketData.requester || ticketData.agent || "Aisha Khan"}</span>
                          </div>
                          <div className="activity-action-label">
                            {ticketData.actionTitle || "Opened"}
                          </div>
                          <div className="activity-tag-row">
                            <span className="badge-new-green">New</span>
                          </div>
                        </div>
                      </div>

                      <div className="activity-actions-right">
                        <span className="activity-timestamp">{ticketData.createdAt || "27/07/2026 4:44 PM"}</span>
                      </div>
                    </div>

                    <div className="activity-card-body">
                      <p className="activity-description-text">{getDisplayedDescription()}</p>
                    </div>
                  </div>
                )}

                {/* Additional historical notes */}
                {ticketData.notes && ticketData.notes.length > 1 && (
                  <div className="mt-4 space-y-3">
                    {ticketData.notes.slice(1).map((note) => (
                      <div key={note.id} className="ticket-subnote-card">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span className="font-bold text-gray-700">{note.author}</span>
                          <span>{note.time}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">{note.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Tab: Details */}
            {activeTab === "details" && (
              <div className="ticket-activity-card">
                <div className="details-tab-grid">
                  <div className="details-section">
                    <h3 className="details-section-title">General Information</h3>
                    <div className="details-field-row">
                      <span className="details-label">Ticket ID:</span>
                      <span className="details-value font-mono font-semibold">
                        [ID:{cleanId.replace(/-C$/, '').replace(/^0+/, '').padStart(7, '0')}]
                      </span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">Summary:</span>
                      <span className="details-value">{ticketData.summary}</span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">Ticket Type:</span>
                      <span className="details-value">{ticketData.type || "Project Task"}</span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">Status:</span>
                      <span className="details-value">
                        <span className="status-badge-inline">{ticketData.status || "In Progress"}</span>
                      </span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">Priority:</span>
                      <span className="details-value">{ticketData.priority || "Low"}</span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">Category:</span>
                      <span className="details-value">{ticketData.category || "Infrastructure > Production Deployment"}</span>
                    </div>
                  </div>

                  <div className="details-section">
                    <h3 className="details-section-title">Assignment & Workflow</h3>
                    <div className="details-field-row">
                      <span className="details-label">Assigned Agent:</span>
                      <span className="details-value font-medium text-cyan-700">{ticketData.agent || "Admin (You)"}</span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">Assigned Team:</span>
                      <span className="details-value">{ticketData.assignedTeam || "1st Line Support"}</span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">Requester:</span>
                      <span className="details-value">{ticketData.requester || "Admin (You)"}</span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">Site / Dept:</span>
                      <span className="details-value">{ticketData.site || "EMEA"} / {ticketData.department || "consultancy"}</span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">Workflow:</span>
                      <span className="details-value">{ticketData.workflowName || "Task Management Workflow"}</span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">Project:</span>
                      <span className="details-value text-gray-700">{ticketData.projectName || "2196 - Halo Implementation - Project"}</span>
                    </div>
                  </div>

                  <div className="details-section">
                    <h3 className="details-section-title">Timeline & SLA Targets</h3>
                    <div className="details-field-row">
                      <span className="details-label">Created At:</span>
                      <span className="details-value">{ticketData.createdAt || "17/05/2026 4:06 AM"}</span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">Execution Date:</span>
                      <span className="details-value">{ticketData.executionDate || "06/11/2025 10:56 PM"}</span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">Time Taken:</span>
                      <span className="details-value font-mono text-cyan-600 font-bold">{ticketData.timeTaken || "70:15"}</span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">From Ticket:</span>
                      <span className="details-value font-mono">{ticketData.fromTicketId || "#2196"}</span>
                    </div>
                    <div className="details-field-row">
                      <span className="details-label">Target SLA:</span>
                      <span className="details-value text-emerald-700 font-semibold">{ticketData.targetSla || "Standard 4hr Resolution"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: View Log (from Image 1) */}
            {activeTab === "view-log" && (
              <div className="ticket-activity-card">
                <div className="activity-card-header">
                  <div className="activity-author-left">
                    <div className="activity-bubble-avatar">
                      <div className="bubble-circle">
                        <svg className="w-5 h-5 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.378 1.157.062 1.638A8.04 8.04 0 0112 20.25z" />
                        </svg>
                      </div>
                      <span className="bubble-green-dot" />
                    </div>

                    <div className="activity-author-meta">
                      <div className="author-name-row">
                        <span className="author-name">{ticketData.requester || "Demo User"}</span>
                        <span className="trophy-badge" title="Verified Requester">🏆</span>
                      </div>
                    </div>
                  </div>

                  <div className="activity-actions-right">
                    <span className="activity-timestamp">Just now</span>
                  </div>
                </div>

                <div className="activity-card-body">
                  <p className="activity-description-text text-gray-500 italic">
                    Task execution initiated and log records synchronized with master deployment checklist.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Notification Log (from Image 2) */}
            {activeTab === "notification-log" && (
              <div className="notification-log-container">
                <div className="notif-header-toolbar">
                  <span className="notif-count-text">1-1 of 1</span>
                  <div className="notif-pagination">
                    <button 
                      type="button" 
                      className="notif-nav-arrow cursor-pointer hover:bg-gray-100" 
                      title="Previous"
                      onClick={() => {
                        setStatusMessage('First page of notifications');
                        setTimeout(() => setStatusMessage(null), 1500);
                      }}
                    >
                      &lt;
                    </button>
                    <button 
                      type="button" 
                      className="notif-nav-arrow cursor-pointer hover:bg-gray-100" 
                      title="Next"
                      onClick={() => {
                        setStatusMessage('No additional notifications');
                        setTimeout(() => setStatusMessage(null), 1500);
                      }}
                    >
                      &gt;
                    </button>
                    <button
                      type="button"
                      className="notif-refresh-btn"
                      onClick={handleRefreshNotifications}
                      title="Refresh Notification Log"
                    >
                      <svg className={`w-3.5 h-3.5 ${isRefreshingNotifs ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Table Header Row */}
                <div className="notif-table-header">
                  <div className="notif-col col-desc">Description</div>
                  <div className="notif-col col-type">Type</div>
                  <div className="notif-col col-agents">Agents</div>
                  <div className="notif-col col-to">To</div>
                  <div className="notif-col col-subject">Subject</div>
                  <div className="notif-col col-when when-active">When</div>
                </div>

                {isRefreshingNotifs ? (
                  <div className="notif-loading-center">
                    <div className="cyan-large-spinner" />
                  </div>
                ) : (
                  <div className="notif-table-row">
                    <div className="notif-row-col col-desc">
                      <div className="notif-plane-circle" title="Notification Logged">
                        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                      </div>
                      <span className="notif-desc-text">New Ticket Logged To...</span>
                    </div>
                    <div className="notif-row-col col-type text-gray-700">
                      Show in Halo only
                    </div>
                    <div className="notif-row-col col-agents">
                      <div className="notif-avatar-stack">
                        <span className="stack-avatar bg-[#00bcd4]" title="1st Line Support">1L</span>
                        <span className="stack-avatar bg-[#303f9f]" title="Chris Robinson">CR</span>
                        <span className="stack-avatar bg-[#e0f2fe] text-[#0284c7]" title="Channel Notifications">
                          <svg className="w-3 h-3 text-cyan-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.378 1.157.062 1.638A8.04 8.04 0 0112 20.25z" />
                          </svg>
                        </span>
                        <span className="stack-avatar bg-[#fb8c00]" title="James Brown">JB</span>
                        <span className="stack-avatar bg-[#512da8]" title="Jennifer Williams">JW</span>
                      </div>
                    </div>
                    <div className="notif-row-col col-to text-gray-400">
                      
                    </div>
                    <div className="notif-row-col col-subject text-gray-700">
                      New request logged f...
                    </div>
                    <div className="notif-row-col col-when text-gray-800 font-medium">
                      29/07/2026 6:22 PM
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: AI Insights */}
            {activeTab === "ai-insights" && (
              <div className="ticket-activity-card">
                <div className="activity-card-header">
                  <div className="activity-author-left">
                    <div className="activity-bubble-avatar">
                      <div className="bubble-circle bg-cyan-600 text-white font-bold text-xs flex items-center justify-center">
                        AI
                      </div>
                      <span className="bubble-green-dot" />
                    </div>
                    <div className="activity-author-meta">
                      <div className="author-name-row">
                        <span className="author-name">ServiGen AI Copilot</span>
                        <span className="trophy-badge" title="AI Confidence 98%">🤖</span>
                      </div>
                      <div className="activity-action-label">Real-time Ticket Analysis</div>
                    </div>
                  </div>
                  <div className="activity-actions-right">
                    <span className="activity-timestamp">Updated Live</span>
                  </div>
                </div>

                <div className="activity-card-body space-y-3">
                  <div className="p-3 bg-cyan-50/50 rounded-lg border border-cyan-100">
                    <div className="font-semibold text-xs text-cyan-900 mb-1">Intent & Classification</div>
                    <p className="text-xs text-cyan-800">
                      User request identified as <strong>Workplace Telephony Profile Routing</strong> with <strong>98.4% confidence</strong>. No hardware replacement needed.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                    <div className="font-semibold text-xs text-amber-900 mb-1">Predicted Root Cause</div>
                    <p className="text-xs text-amber-800">
                      Desk relocation on floor 4 did not trigger automatic PBX extension reassignment. Routing profile requires manual pointer update to extension <strong>01632 960101</strong>.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                    <div className="font-semibold text-xs text-emerald-900 mb-1">Recommended Resolution</div>
                    <p className="text-xs text-emerald-800 mb-2">
                      Apply Cisco CallManager directory number update and softphone client sync.
                    </p>
                    <button
                      type="button"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full shadow-xs cursor-pointer"
                      onClick={() => {
                        setStatusMessage("AI 1-Click Fix Applied: Telephony route mapped");
                        setTimeout(() => setStatusMessage(null), 2500);
                      }}
                    >
                      ⚡ Apply 1-Click Automated Fix
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Additional Fields */}
            {activeTab === "additional-fields" && (
              <div className="ticket-activity-card">
                <div className="p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">ITIL Ticket Metadata</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="text-gray-400 text-[10px] uppercase font-semibold">Impact</div>
                      <div className="font-semibold text-gray-800 mt-0.5">Low (Single User)</div>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="text-gray-400 text-[10px] uppercase font-semibold">Urgency</div>
                      <div className="font-semibold text-gray-800 mt-0.5">Low</div>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="text-gray-400 text-[10px] uppercase font-semibold">Business Service</div>
                      <div className="font-semibold text-gray-800 mt-0.5">Unified Communications & Voice</div>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="text-gray-400 text-[10px] uppercase font-semibold">Primary CI</div>
                      <div className="font-semibold text-gray-800 mt-0.5">Cisco CallManager - EMEA Cluster 01</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Audit Log */}
            {activeTab === "audit-log" && (
              <div className="ticket-activity-card">
                <div className="p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Audit History & Timeline</h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5 pb-2 border-b border-gray-100">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">Ticket Created via Portal</div>
                        <div className="text-gray-500 text-[11px]">{ticketData.createdAt || "27/07/2026 4:44 PM"} by {ticketData.requester || "Aisha Khan"}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 pb-2 border-b border-gray-100">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">Stage Advanced to {ticketData.pipelineStage || "Request Fulfillment"}</div>
                        <div className="text-gray-500 text-[11px]">{ticketData.pipelineDate || "29/07/2026 6:22 PM"} by System Workflow</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 pb-2 border-b border-gray-100">
                      <span className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">Response Target Met</div>
                        <div className="text-gray-500 text-[11px]">{ticketData.responseTarget || "01/09/2026 10:29 PM"} (Acknowledged)</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">Resolution SLA Breached</div>
                        <div className="text-gray-500 text-[11px]">{ticketData.resolutionTarget || "10/09/2026 10:29 PM"} (Current: {ticketData.slaTime || "-32:01"})</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </>
            )}
          </div>

          {/* Right Column: Ticket Properties & Details */}
          {isSidebarVisible && (
            <div className="ticket-sidebar-col">
            {isProjectTask ? (
              /* Project Task Right Sidebar matching Image 1 (media_1792150921969_ad3827dc.png) */
              <>
                {/* Preferred Number */}
                <div className="sidebar-field-group">
                  <span className="sidebar-field-label">Preferred Number</span>
                  <span className="sidebar-field-val text-cyan-600 font-medium">
                    {ticketData.preferredNumber || "01449 833111"}
                  </span>
                </div>

                {/* Contact Address */}
                <div className="sidebar-field-group">
                  <span className="sidebar-field-label">Contact Address</span>
                  <div className="sidebar-address-box">
                    {(ticketData.contactAddress || [
                      "Halo House, Gipping Way",
                      "Stowmarket",
                      "Suffolk",
                      "United Kingdom",
                      "Ip14 1GJ",
                    ]).map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </div>
                </div>

                {/* User's Assets */}
                <div className="sidebar-assets-section">
                  <div className="assets-section-header">
                    <span className="sidebar-field-label font-bold text-gray-700">User's Assets</span>
                    <button 
                      type="button" 
                      className="assets-connect-btn cursor-pointer hover:bg-gray-100" 
                      title="Connect to Remote Device"
                      onClick={() => {
                        setStatusMessage('Remote Session connected (Port 3389 RDP)');
                        setTimeout(() => setStatusMessage(null), 2500);
                      }}
                    >
                      <svg className="w-3.5 h-3.5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      <span>Connect</span>
                    </button>
                  </div>

                  <div className="assets-list">
                    {(ticketData.assets || [
                      { id: "ABC00001", type: "Workstation", icon: "workstation" },
                      { id: "ABC00002", type: "Mobile Phone", icon: "phone" },
                      { id: "ABC00007", type: "Monitor", icon: "monitor" },
                      { id: "ABC00008", type: "Laptop", icon: "laptop" },
                    ]).map((asset) => (
                      <div 
                        key={asset.id} 
                        className="asset-item-row cursor-pointer hover:bg-cyan-50/60 rounded px-1 transition-colors"
                        onClick={() => {
                          onClose();
                          navigate('/cmdb');
                        }}
                        title={`Explore ${asset.id} in CMDB`}
                      >
                        <div className="asset-circle-icon">
                          {renderAssetIcon(asset.icon)}
                        </div>
                        <div className="asset-meta">
                          <span className="asset-id-link text-cyan-600 font-medium">
                            {asset.id}
                          </span>
                          <span className="asset-type-label">{asset.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project information (for Project Tasks) */}
                <div className="sidebar-project-section">
                  <h4 className="project-section-title">Project information</h4>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Parent ID</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/projects');
                      }}
                      className="sidebar-field-link text-left bg-transparent border-none cursor-pointer text-cyan-600 hover:underline"
                      title="Open in Projects"
                    >
                      {ticketData.projectName || "2196 - Halo Implementation - Project"}
                    </button>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Date Reported</span>
                    <span className="sidebar-field-val">{ticketData.createdAt || "17/05/2026 4:06 AM"}</span>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Created by</span>
                    <span className="sidebar-field-val">{ticketData.createdBy || "Admin"}</span>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Ticket Type</span>
                    <a href="#type" onClick={(e) => e.preventDefault()} className="sidebar-field-link">
                      {ticketData.type || "Project Task"}
                    </a>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Workflow</span>
                    <a href="#workflow" onClick={(e) => e.preventDefault()} className="sidebar-field-link">
                      {ticketData.workflowName || "Task Management Workflow"}
                    </a>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Status</span>
                    <div className="pt-1">
                      <span className="sidebar-status-pill">
                        {ticketData.status === "Completed" ? "Completed" : "New"}
                      </span>
                    </div>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Team/Assigned Agent</span>
                    <div className="sidebar-agent-card">
                      <div className="activity-bubble-avatar">
                        <div className="bubble-circle">
                          <svg className="w-5 h-5 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.378 1.157.062 1.638A8.04 8.04 0 0112 20.25z" />
                          </svg>
                        </div>
                        <span className="bubble-green-dot" />
                      </div>
                      <div className="agent-card-meta">
                        <div className="flex items-center gap-1">
                          <a href="#agent" onClick={(e) => e.preventDefault()} className="sidebar-field-link font-bold">
                            {ticketData.requester || ticketData.agent || "Demo User"}
                          </a>
                          <span className="trophy-badge">🏆</span>
                        </div>
                        <span className="agent-team-label">{ticketData.assignedTeam || "1st Line Support"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Additional Agents</span>
                    <span className="sidebar-field-val">{ticketData.additionalAgents || "Not set"}</span>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Time Recorded</span>
                    <span className="sidebar-field-val font-semibold">{ticketData.timeRecorded || "70:15"}</span>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Budget Type</span>
                    <a href="#budget" onClick={(e) => e.preventDefault()} className="sidebar-field-link">
                      {ticketData.budgetType || "Project Management"}
                    </a>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Time Budget</span>
                    <span className="sidebar-field-val font-semibold">{ticketData.timeBudget || "05:00"}</span>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Start Date</span>
                    <span className="sidebar-field-val">{ticketData.startDate || "Not set"}</span>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Target Date</span>
                    <span className="sidebar-field-val">{ticketData.targetDate || "Not set"}</span>
                  </div>
                </div>
              </>
            ) : (
              /* SLA / Service Request / Incident Right Sidebar matching media_1792175599803_f4443b5b.png */
              <>
                {/* 1. End-User details (collapsible) */}
                <div className="sidebar-end-user-section mb-4">
                  <div
                    className="flex items-center justify-between cursor-pointer py-1 px-1 hover:bg-slate-50/80 rounded transition-colors select-none"
                    onClick={() => setShowEndUserSection(!showEndUserSection)}
                  >
                    <h3 className="font-bold text-slate-800 text-[14px]">End-User details</h3>
                    <span className="text-slate-500 text-xs font-semibold">{showEndUserSection ? "▴" : "⌵"}</span>
                  </div>

                  {showEndUserSection && (
                    <div className="sidebar-user-expanded pt-2 space-y-2.5 border-b border-slate-100 pb-3">
                      <div className="sidebar-user-row">
                        <div
                          className="sidebar-user-avatar"
                          style={{
                            background: initials === "AK" ? "#7f1d1d" : "#0284c7",
                            color: "#ffffff",
                            fontWeight: 700,
                          }}
                        >
                          {initials}
                        </div>
                        <a
                          href="#profile"
                          onClick={(e) => e.preventDefault()}
                          className="sidebar-user-link font-bold text-slate-900"
                        >
                          {ticketData.requester || "Aisha Khan"}
                        </a>
                      </div>

                      <div className="sidebar-field-group">
                        <span className="sidebar-field-label">Organisation</span>
                        <span className="sidebar-field-val text-slate-800">{ticketData.organisationName || "consultancy"}</span>
                      </div>

                      <div className="sidebar-field-group">
                        <span className="sidebar-field-label">Site</span>
                        <span className="sidebar-field-val text-slate-800">{ticketData.site || "EMEA"}</span>
                      </div>

                      <div className="sidebar-field-group">
                        <span className="sidebar-field-label">Email Address</span>
                        <a href={`mailto:${ticketData.email || "akhan@usehalo.com"}`} className="sidebar-field-link email-link">
                          {ticketData.email || "akhan@usehalo.com"}
                        </a>
                      </div>

                      <div className="sidebar-field-group">
                        <span className="sidebar-field-label">Phone Number</span>
                        <span className="sidebar-field-val text-slate-800">{ticketData.phoneNumber || "01632 960101"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Other Open Tickets */}
                <div className="sidebar-other-tickets-section mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-900 text-[14.5px]">Other Open Tickets</h4>
                  </div>

                  <div className="space-y-3.5">
                    {/* Item 1: 01/09/2026 Draft -> 3995 - Emails not Sending */}
                    <div
                      className="cursor-pointer hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors group"
                      onClick={() => {
                        setStatusMessage('Ticket #3995 loaded');
                        setTimeout(() => setStatusMessage(null), 1500);
                      }}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-0.5">
                        <span className="font-medium text-slate-600">01/09/2026</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#38bdf8] text-white">
                          Draft
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#0097a7] group-hover:underline">
                        3995 - Emails not Sending
                      </div>
                    </div>

                    {/* Item 2: 29/08/2026 Approved -> 2183 - Firewall Change */}
                    <div
                      className="cursor-pointer hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors group"
                      onClick={() => {
                        setStatusMessage('Change Request #2183 loaded');
                        setTimeout(() => setStatusMessage(null), 1500);
                      }}
                      title="Open Change Request #2183"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-0.5">
                        <span className="font-medium text-slate-600">29/08/2026</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#65b82a] text-white">
                          Approved
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#0097a7] group-hover:underline">
                        2183 - Firewall Change
                      </div>
                    </div>

                    {/* Item 3: 29/08/2026 Scheduled -> 2184 - Printer Installation */}
                    <div
                      className="cursor-pointer hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors group"
                      onClick={() => {
                        setStatusMessage('Change Request #2184 loaded');
                        setTimeout(() => setStatusMessage(null), 1500);
                      }}
                      title="Open Change Request #2184"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-0.5">
                        <span className="font-medium text-slate-600">29/08/2026</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#0f5132] text-white">
                          Scheduled
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#0097a7] group-hover:underline">
                        2184 - Printer Installation
                      </div>
                    </div>

                    {/* Item 4: 29/08/2026 Rejected -> 2186 - Addition of a New Server */}
                    <div
                      className="cursor-pointer hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors group"
                      onClick={() => {
                        setStatusMessage('Change Request #2186 loaded');
                        setTimeout(() => setStatusMessage(null), 1500);
                      }}
                      title="Open Change Request #2186"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-0.5">
                        <span className="font-medium text-slate-600">29/08/2026</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#dc2626] text-white">
                          Rejected
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#0097a7] group-hover:underline">
                        2186 - Addition of a New Server
                      </div>
                    </div>

                    {/* Item 5: 28/08/2026 Change Overdue -> 2193 - Security Concern - Possible Virus */}
                    <div
                      className="cursor-pointer hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors group"
                      onClick={() => {
                        setStatusMessage('Change Request #2193 loaded');
                        setTimeout(() => setStatusMessage(null), 1500);
                      }}
                      title="Open Change Request #2193"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-0.5">
                        <span className="font-medium text-slate-600">28/08/2026</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#ea580c] text-white">
                          Change Overdue
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#0097a7] group-hover:underline">
                        2193 - Security Concern - Possible Virus
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Ticket information */}
                <div className="sidebar-ticket-info-section pt-4 border-t border-slate-200">
                  <h4 className="font-bold text-slate-900 text-[14.5px] mb-3">Ticket information</h4>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Date Reported</span>
                    <span className="sidebar-field-val text-slate-800">{ticketData.createdAt || "27/07/2026 4:44 PM"}</span>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Category</span>
                    <div className="sidebar-field-val sidebar-category-text">
                      {ticketData.category || "Service Desk Portal>Catalog>Item Update"}
                    </div>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Priority</span>
                    <span className="sidebar-field-val font-semibold text-slate-800">{ticketData.priority || "Low"}</span>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Status</span>
                    <div className="pt-1">
                      <span className="sidebar-status-pill-green">{ticketData.status || "New"}</span>
                    </div>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Team/Assigned Agent</span>
                    <div className="sidebar-agent-silhouette-row">
                      <div className="sidebar-silhouette-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-900">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <div className="sidebar-agent-text-col">
                        <button
                          type="button"
                          className="sidebar-agent-link-blue"
                          onClick={() => setIsReassignOpen(true)}
                          title="Reassign Agent"
                        >
                          {ticketData.agent || "Unassigned"}
                        </button>
                        <span className="sidebar-team-sublabel">
                          {ticketData.assignedTeam || "1st Line Support"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="sidebar-field-group">
                    <span className="sidebar-field-label">Time Recorded</span>
                    <span className="sidebar-field-val font-semibold">{ticketData.timeRecorded || "00:00"}</span>
                  </div>
                </div>
              </>
            )}
      </div>
    )}
  </div>
</div>

  {/* ── SLA Targets & Metrics Detail Dialog (Triggered by Incident SLA Box) ── */}
  {isSlaDetailsOpen && (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-scaleUp">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2">
            <span className="text-base">⏱</span>
            <h3 className="font-bold text-sm">Incident SLA Targets & Metrics</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsSlaDetailsOpen(false)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
            title="Close SLA breakdown"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Header summary */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
            <div>
              <div className="text-[11px] text-gray-500 uppercase font-semibold">Priority & Policy</div>
              <div className="text-sm font-bold text-gray-800">{ticketData.priority || "Low"} Priority SLA</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-gray-500 uppercase font-semibold">Current State</div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                Breached ({ticketData.slaTime || "-32:01"})
              </span>
            </div>
          </div>

          {/* Response Target Card */}
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-800 text-xs">1. Response Target</span>
              <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                ✓ Met on-time
              </span>
            </div>
            <div className="text-gray-600 text-[11px]">
              Target: <strong className="text-gray-800">{ticketData.responseTarget || "01/09/2026 10:29 PM"}</strong>
            </div>
            <div className="text-gray-500 text-[11px]">
              First contact logged in 14 minutes by <strong>Jennifer Williams</strong>.
            </div>
          </div>

          {/* Resolution Target Card */}
          <div className="p-3 rounded-xl border border-red-200 bg-red-50/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-red-800 text-xs">2. Resolution Target</span>
              <span className="inline-flex items-center gap-1 font-bold text-[11px] text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                ✕ SLA Breached
              </span>
            </div>
            <div className="text-gray-600 text-[11px]">
              Target Deadline: <strong className="text-gray-800">{ticketData.resolutionTarget || "10/09/2026 10:29 PM"}</strong>
            </div>
            <div className="text-red-600 text-[11px] font-medium">
              Overdue by {ticketData.slaTime?.replace('-', '') || "32 hours 01 min"}. Clock still active.
            </div>
          </div>

          {/* Working hours & rules */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1 text-[11px] text-gray-500">
            <div className="flex justify-between">
              <span>Working Calendar:</span>
              <span className="font-medium text-gray-700">EMEA Standard (09:00 - 17:30)</span>
            </div>
            <div className="flex justify-between">
              <span>Pause on Customer:</span>
              <span className="font-medium text-gray-700">Enabled (0m paused)</span>
            </div>
            <div className="flex justify-between">
              <span>Escalation Rule:</span>
              <span className="font-medium text-amber-600 font-semibold">Tier 2 Notified</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setIsSlaDetailsOpen(false);
                setActiveTab("audit-log");
                setStatusMessage("Switched to Audit Log & SLA Event Trail");
                setTimeout(() => setStatusMessage(null), 2500);
              }}
              className="text-cyan-700 hover:text-cyan-800 font-semibold text-xs flex items-center gap-1 underline underline-offset-2 cursor-pointer"
            >
              <span>📜</span> View SLA Audit Log
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatusMessage("SLA Target recalculated based on schedule");
                  setTimeout(() => setStatusMessage(null), 2500);
                  setIsSlaDetailsOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Recalculate
              </button>
              <button
                type="button"
                onClick={() => setIsSlaDetailsOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* ── Appointment & Calendar Scheduling Dialog (Triggered by 🗂 button) ── */}
  {isAppointmentModalOpen && (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-scaleUp">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <h3 className="font-bold text-sm">Schedule Appointment / Site Visit</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsAppointmentModalOpen(false)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
            title="Close scheduling"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStatusMessage(`Appointment booked for #${cleanId} with Demo User`);
            setTimeout(() => setStatusMessage(null), 3000);
            setIsAppointmentModalOpen(false);
          }}
          className="p-5 space-y-4 text-xs"
        >
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Ticket Reference
            </label>
            <input
              type="text"
              disabled
              value={`#${cleanId} - ${ticketData.summary || "IT Support Ticket"}`}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                Appointment Date
              </label>
              <input
                type="date"
                defaultValue="2026-10-20"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                Time Slot
              </label>
              <select
                defaultValue="10:00 - 11:00 AM"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option>09:00 - 10:00 AM</option>
                <option>10:00 - 11:00 AM</option>
                <option>11:30 - 12:30 PM</option>
                <option>02:00 - 03:00 PM</option>
                <option>04:00 - 05:00 PM</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                Assigned Agent
              </label>
              <select
                defaultValue="Demo User"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option>Demo User (1st Line Support)</option>
                <option>Jennifer Williams (2nd Line Support)</option>
                <option>James Brown (Field Engineer)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                Appointment Type
              </label>
              <select
                defaultValue="Remote Screen Share"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option>Remote Screen Share</option>
                <option>On-Site Desk Visit</option>
                <option>Hardware Replacement</option>
                <option>Client Review Call</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Location / Dial-in
            </label>
            <input
              type="text"
              defaultValue="Halo House, Gipping Way, Stowmarket"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Agenda / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Enter appointment objectives or notes for the technician..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setIsAppointmentModalOpen(false);
                onClose();
                navigate('/calendar');
              }}
              className="text-cyan-600 hover:text-cyan-700 font-semibold text-xs flex items-center gap-1 underline underline-offset-2 cursor-pointer"
            >
              <span>📅</span> Open Full Calendar View →
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAppointmentModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Confirm Appointment
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* ── Email Composer Dialog (Triggered by Email User or Forward in Email) ── */}
  {isEmailModalOpen && (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-scaleUp">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-sky-600 to-cyan-700 text-white">
          <div className="flex items-center gap-2">
            <span className="text-base">✉️</span>
            <h3 className="font-bold text-sm">Send Email to End-User</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsEmailModalOpen(false)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
            title="Close email composer"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const newNote = {
              id: `email-${Date.now()}`,
              author: `${currentUser} (Email Outbound)`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              text: `[Sent to: ${emailDraftTo}]\nSubject: ${emailDraftSubject}\n\n${emailDraftBody}`,
            };
            const updated: FullTicket = {
              ...ticketData,
              notes: [...(ticketData.notes || []), newNote],
            };
            onUpdateTicket?.(updated);
            setIsEmailModalOpen(false);
            setStatusMessage(`✓ Email successfully dispatched to ${emailDraftTo}`);
            setTimeout(() => setStatusMessage(null), 3000);
          }}
          className="p-5 space-y-3.5 text-xs"
        >
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Recipient Email (To)
            </label>
            <input
              type="email"
              value={emailDraftTo}
              onChange={(e) => setEmailDraftTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Subject
            </label>
            <input
              type="text"
              value={emailDraftSubject}
              onChange={(e) => setEmailDraftSubject(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Message Body
            </label>
            <textarea
              value={emailDraftBody}
              onChange={(e) => setEmailDraftBody(e.target.value)}
              rows={6}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 leading-relaxed focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-[11px] text-gray-400">SMTP Relay: Active (halo-mailer@usehalo.com)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <span>✈</span>
                <span>Send Email</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* ── Area 1: AI Suggested Article Preview & Insert Dialog ── */}
  {selectedArticle && (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden animate-scaleUp flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💡</span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                {selectedArticle.category} • {selectedArticle.id}
              </div>
              <h3 className="font-bold text-sm leading-tight text-white">{selectedArticle.title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedArticle(null)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
            title="Close article"
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs text-gray-700">
          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 text-[11px]">
            <span className="font-bold">AI Match Confidence:</span>
            <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">96.8%</span>
            <span className="text-gray-500 ml-auto">Verified Solution</span>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-gray-900 uppercase text-[11px] tracking-wide">Summary / Overview</div>
            <p className="leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
              {selectedArticle.snippet || "Standard operating procedure for resolving this incident pattern. Follow the verified steps below."}
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-gray-900 uppercase text-[11px] tracking-wide">Resolution Procedure</div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono text-[11px] leading-relaxed space-y-2">
              <div>1. Verify endpoint telemetry and corroborate error code via log viewer.</div>
              <div>2. Reset local registry key cache or run diagnostic remediation sequence.</div>
              <div>3. Invalidate Active Directory / Azure AD Kerberos token and issue fresh ticket.</div>
              <div>4. Request user reboot workstation and verify handshake with primary service.</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={() => {
              setSelectedArticle(null);
              onClose();
              navigate('/article-drafts');
            }}
            className="text-cyan-600 hover:text-cyan-700 font-semibold text-xs flex items-center gap-1 underline underline-offset-2 cursor-pointer"
          >
            <span>📖</span> Open in Article Drafts →
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEmailDraftSubject(`[Solution] ${selectedArticle.title} (Ticket #${cleanId})`);
                setEmailDraftBody(`Hello ${ticketData.requester || "User"},\n\nWe have identified a verified solution for your issue (${selectedArticle.title}):\n\n${selectedArticle.snippet}\n\nPlease follow the resolution steps or reply to this email if you need guided assistance.\n\nBest regards,\n${currentUser}\nIT Support Desk`);
                setSelectedArticle(null);
                setIsEmailModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              ✉️ Email to User
            </button>
            <button
              type="button"
              onClick={() => {
                setNewNoteText(`[Applied Solution from KB ${selectedArticle.id} - ${selectedArticle.title}]:\n${selectedArticle.snippet}`);
                setIsAddingNote(true);
                setActiveTab("progress");
                setSelectedArticle(null);
                setStatusMessage(`KB solution inserted into note composer`);
                setTimeout(() => setStatusMessage(null), 2500);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1"
            >
              <span>📋</span> Insert into Note
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* ── Area 1: Publish Knowledge Base Article Dialog (+) ── */}
  {isPublishKbModalOpen && (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-scaleUp">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <h3 className="font-bold text-sm">Create Knowledge Base Article</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsPublishKbModalOpen(false)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsPublishKbModalOpen(false);
            setStatusMessage("✓ Article draft saved and published to Knowledge Base");
            setTimeout(() => setStatusMessage(null), 3000);
            onClose();
            navigate('/article-drafts');
          }}
          className="p-5 space-y-3.5 text-xs"
        >
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Article Title
            </label>
            <input
              type="text"
              defaultValue={`How to resolve: ${ticketData.summary || "IT Support Incident"}`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                Category
              </label>
              <select
                defaultValue="End-User Compute & Hardware"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option>End-User Compute & Hardware</option>
                <option>Network & Connectivity</option>
                <option>Software & Cloud Applications</option>
                <option>Identity, Access & Security</option>
                <option>Project Task Templates</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                Visibility
              </label>
              <select
                defaultValue="Public (All Users)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option>Public (All Users)</option>
                <option>Internal Only (Agents & NOC)</option>
                <option>Restricted Tier-3</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Resolution Content / Body
            </label>
            <textarea
              rows={5}
              defaultValue={`Resolution summary derived from #${cleanId}:\n\nRoot Cause: Standard hardware or profile fault.\nSteps taken:\n1. Diagnosis corroborated by agent.\n2. Remediation applied.\n3. Verified functional test.`}
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 leading-relaxed focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-[11px] text-gray-400">Target: /article-drafts repository</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPublishKbModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <span>💾</span>
                <span>Save & Open Drafts</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* ── Area 4: Internal Agent Chat Slideout Drawer ── */}
  {isInternalChatOpen && (
    <div className="fixed inset-0 z-[160] flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-gray-200 flex flex-col animate-slideLeft">
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white">
          <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <div>
              <h3 className="font-bold text-sm">Internal Agent Chat</h3>
              <div className="text-[10px] text-cyan-100">Ticket #{cleanId} Collaboration</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsInternalChatOpen(false)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/70">
          {internalChatMessages.map((msg, i) => {
            const isMe = msg.sender.includes("You") || msg.sender.includes("Admin");
            return (
              <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-0.5">
                  <span className="font-bold text-gray-700">{msg.sender}</span>
                  <span>{msg.time}</span>
                </div>
                <div
                  className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    isMe
                      ? "bg-cyan-600 text-white rounded-br-none shadow-xs"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-xs"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newChatMessage.trim()) return;
            setInternalChatMessages((prev) => [
              ...prev,
              {
                sender: `${currentUser} (You)`,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                text: newChatMessage.trim(),
              },
            ]);
            setNewChatMessage("");
          }}
          className="p-3 border-t border-gray-200 bg-white flex items-center gap-2"
        >
          <input
            type="text"
            value={newChatMessage}
            onChange={(e) => setNewChatMessage(e.target.value)}
            placeholder="Type an internal note to agents..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-xs text-gray-800 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )}

  {/* ── Area 4: Edit Email Recipients Modal ── */}
  {isRecipientsModalOpen && (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-scaleUp">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center gap-2">
            <span className="text-base">📧</span>
            <h3 className="font-bold text-sm">Edit Email Recipients & CC Lists</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsRecipientsModalOpen(false)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsRecipientsModalOpen(false);
            setStatusMessage("✓ Email recipients and CC lists saved");
            setTimeout(() => setStatusMessage(null), 2500);
          }}
          className="p-5 space-y-3.5 text-xs"
        >
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Primary Recipient (To)
            </label>
            <input
              type="email"
              defaultValue={ticketData.email || "akhan@usehalo.com"}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Carbon Copy (CC)
            </label>
            <input
              type="text"
              value={ccRecipients}
              onChange={(e) => setCcRecipients(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500"
              placeholder="Comma-separated emails..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Blind Carbon Copy (BCC)
            </label>
            <input
              type="text"
              value={bccRecipients}
              onChange={(e) => setBccRecipients(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500"
              placeholder="audit@domain.com, security@domain.com"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsRecipientsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
            >
              Save Recipients
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* ── Area 4: Add URL Attachment Modal ── */}
  {isUrlModalOpen && (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-scaleUp">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-cyan-600 to-teal-700 text-white">
          <div className="flex items-center gap-2">
            <span className="text-base">🔗</span>
            <h3 className="font-bold text-sm">Add Web / Cloud URL Attachment</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsUrlModalOpen(false)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!urlAttachmentHref.trim()) return;
            setAttachedFiles((prev) => [
              ...prev,
              {
                name: urlAttachmentTitle.trim() || urlAttachmentHref.trim(),
                size: "Cloud Link",
                type: "url",
              },
            ]);
            setUrlAttachmentTitle("");
            setUrlAttachmentHref("");
            setIsUrlModalOpen(false);
            setStatusMessage("✓ Web URL attachment added");
            setTimeout(() => setStatusMessage(null), 2000);
          }}
          className="p-5 space-y-3.5 text-xs"
        >
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Attachment Title / Description
            </label>
            <input
              type="text"
              value={urlAttachmentTitle}
              onChange={(e) => setUrlAttachmentTitle(e.target.value)}
              placeholder="e.g. Datadog Log Trace or SharePoint Document"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Target URL (http:// or https://)
            </label>
            <input
              type="url"
              value={urlAttachmentHref}
              onChange={(e) => setUrlAttachmentHref(e.target.value)}
              placeholder="https://sharepoint.company.com/incident-docs"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsUrlModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
            >
              Attach URL
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* ── Area 4: Add Checklist / To-Do Item Modal ── */}
  {isTodoModalOpen && (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-scaleUp">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-700 text-white">
          <div className="flex items-center gap-2">
            <span className="text-base">≔</span>
            <h3 className="font-bold text-sm">Add Ticket Checklist / To-Do Item</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsTodoModalOpen(false)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTodoText.trim()) return;
            setTodoItems((prev) => [
              ...prev,
              {
                id: `td-${Date.now()}`,
                text: newTodoText.trim(),
                done: false,
              },
            ]);
            setNewTodoText("");
            setIsTodoModalOpen(false);
            setStatusMessage("✓ Checklist item added");
            setTimeout(() => setStatusMessage(null), 2000);
          }}
          className="p-5 space-y-3.5 text-xs"
        >
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Task Description
            </label>
            <textarea
              rows={3}
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="e.g. Verify DNS propagation across Europe domain nodes..."
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:outline-none focus:border-cyan-500"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsTodoModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* ── Area 4: Issue Hardware Asset from CMDB Inventory Modal ── */}
  {isIssueItemModalOpen && (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-scaleUp">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-600 to-orange-700 text-white">
          <div className="flex items-center gap-2">
            <span className="text-base">🚚</span>
            <h3 className="font-bold text-sm">Issue Hardware Asset from CMDB Inventory</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsIssueItemModalOpen(false)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="text-gray-600">
            Select an available hardware device or spare part to issue and link to <strong>{ticketData.requester || "User"}</strong> for ticket <strong>#{cleanId}</strong>:
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {[
              { tag: "AST-00412", name: 'Dell UltraSharp 27" 4K USB-C Monitor', location: "IT Storeroom B", status: "In Stock" },
              { tag: "AST-00892", name: "Lenovo ThinkPad X1 Carbon Gen 11", location: "Staging Bay 1", status: "Ready to Deploy" },
              { tag: "AST-01124", name: "Samsung 990 Pro 2TB NVMe SSD", location: "Parts Cabinet C", status: "In Stock" },
              { tag: "AST-00654", name: "CalDigit TS4 Thunderbolt 4 Dock", location: "IT Storeroom A", status: "In Stock" },
              { tag: "AST-00331", name: "Jabra Evolve2 65 Wireless Headset", location: "Peripherals Drawer", status: "In Stock" },
            ].map((asset) => (
              <div key={asset.tag} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 hover:border-amber-400 bg-gray-50/50 hover:bg-amber-50/30 transition-colors">
                <div>
                  <div className="font-bold text-gray-800">{asset.name}</div>
                  <div className="text-[10px] text-gray-500">{asset.tag} • Location: {asset.location}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newNote = {
                      id: `asset-${Date.now()}`,
                      author: `${currentUser} (Asset Management)`,
                      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      text: `[Asset Issued]: Issued ${asset.name} (${asset.tag}) to ${ticketData.requester || "Requester"} from ${asset.location}.`,
                    };
                    const updated: FullTicket = {
                      ...ticketData,
                      notes: [...(ticketData.notes || []), newNote],
                    };
                    onUpdateTicket?.(updated);
                    setIsIssueItemModalOpen(false);
                    setStatusMessage(`✓ Issued ${asset.name} (${asset.tag})`);
                    setTimeout(() => setStatusMessage(null), 3000);
                  }}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  Issue to User
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setIsIssueItemModalOpen(false);
                onClose();
                navigate('/cmdb');
              }}
              className="text-amber-700 hover:text-amber-800 font-semibold text-xs flex items-center gap-1 underline underline-offset-2 cursor-pointer"
            >
              <span>🖥</span> Open Full CMDB View →
            </button>
            <button
              type="button"
              onClick={() => setIsIssueItemModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

  {/* ── Area 4: Link / Relate Tickets Dialog ── */}
  {isLinkTicketModalOpen && (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-scaleUp">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-cyan-600 to-indigo-700 text-white">
          <div className="flex items-center gap-2">
            <span className="text-base">🔗</span>
            <h3 className="font-bold text-sm">Link or Relate Tickets</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsLinkTicketModalOpen(false)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const targetInput = form.elements.namedItem("targetTicket") as HTMLSelectElement;
            const selectedVal = targetInput?.value || "#0003124";
            const [tId, ...tTitleParts] = selectedVal.split(" - ");
            setLinkedTickets((prev) => [
              ...prev,
              { id: tId, relation: linkRelationType, title: tTitleParts.join(" - ") || "Linked ticket" },
            ]);
            setIsLinkTicketModalOpen(false);
            setStatusMessage(`✓ Linked #${cleanId} (${linkRelationType}) with ${tId}`);
            setTimeout(() => setStatusMessage(null), 2500);
          }}
          className="p-5 space-y-3.5 text-xs"
        >
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Relationship Type
            </label>
            <select
              value={linkRelationType}
              onChange={(e) => setLinkRelationType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500"
            >
              <option value="Related To">Related To</option>
              <option value="Depends On">Depends On (Pre-requisite)</option>
              <option value="Blocks">Blocks (Downstream impact)</option>
              <option value="Parent Of">Parent Of (Child ticket)</option>
              <option value="Duplicate Of">Duplicate Of</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Target Ticket to Link
            </label>
            <select
              name="targetTicket"
              defaultValue="#0003124 - VPN gateway certificate renewal failure"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-cyan-500"
            >
              <option>#0003120 - Domain Controller intermittent DNS resolution</option>
              <option>#0003124 - VPN gateway certificate renewal failure</option>
              <option>#0003130 - Single Sign-On Okta token timeout loop</option>
              <option>#0003135 - Outlook client crashing on startup after patch</option>
              <option>#0003140 - Core Switch GigabitPort 0/1 flapping</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsLinkTicketModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
            >
              Confirm Relationship
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* ── Area 4: Merge Tickets Dialog ── */}
  {isMergeModalOpen && (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden animate-scaleUp">
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-red-600 to-rose-700 text-white">
          <div className="flex items-center gap-2">
            <span className="text-base">🔀</span>
            <h3 className="font-bold text-sm">Merge Ticket</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsMergeModalOpen(false)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const newNote = {
              id: `merge-${Date.now()}`,
              author: `${currentUser} (System Merge)`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              text: `[Ticket Merged]: Ticket #${cleanId} consolidated into Master Ticket #0003120. All ongoing replies redirected.`,
            };
            const updated: FullTicket = {
              ...ticketData,
              status: "Merged",
              notes: [...(ticketData.notes || []), newNote],
            };
            onUpdateTicket?.(updated);
            setIsMergeModalOpen(false);
            setStatusMessage(`✓ Merged #${cleanId} into #0003120`);
            setTimeout(() => setStatusMessage(null), 3000);
          }}
          className="p-5 space-y-3.5 text-xs"
        >
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[11px] leading-relaxed">
            <strong>Warning:</strong> Merging ticket <strong>#{cleanId}</strong> will close this ticket and append all discussion history, attachments, and audit events to the chosen master ticket.
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
              Master Ticket to Merge Into
            </label>
            <select
              defaultValue="#0003120 - Domain Controller intermittent DNS resolution"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:border-red-500"
            >
              <option>#0003120 - Domain Controller intermittent DNS resolution</option>
              <option>#0003124 - VPN gateway certificate renewal failure</option>
              <option>#0003130 - Single Sign-On Okta token timeout loop</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsMergeModalOpen(false)}
              className="px-3.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
            >
              Confirm & Merge
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* Hidden native file input for Area 4: Add Attachment */}
  <input
    type="file"
    ref={fileInputRef}
    className="hidden"
    onChange={(e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setAttachedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            size: `${Math.round(file.size / 1024)} KB`,
            type: file.name.split('.').pop() || "file",
          },
        ]);
        setStatusMessage(`✓ Attached file: ${file.name}`);
        setTimeout(() => setStatusMessage(null), 2500);
      }
    }}
  />
</div>
  );

  if (typeof document !== "undefined" && document.body) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
