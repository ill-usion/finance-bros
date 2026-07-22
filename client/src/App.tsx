// Student Spending Tracker & Analyzer
// React + TypeScript — single-file frontend.
//
// Styling mimics Google Fit (activity rings, soft elevated cards, a center FAB)
// and Cronometer (dense per-category data bars). Currency is the Omani rial,
// rendered as the official Central Bank of Oman sign (not yet in Unicode) and
// formatted to 3 decimals (baisa).
//
// Backend touch-points are clearly marked with `BACKEND:` comments. The bank
// statement upload and its processing are stubbed with a simulated live feed so
// you can drop a real API / websocket in later. State persists to localStorage,
// so reloading the app lands a returning user straight on the Home page.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  Home as HomeIcon,
  Pencil,
  BookOpen,
  Settings as SettingsIcon,
  Camera,
  Image as ImageIcon,
  Plus,
  X,
  Check,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  ArrowRight,
  Wallet,
  PiggyBank,
  TrendingUp,
  Receipt,
  Utensils,
  Bus,
  Film,
  CreditCard,
  ShoppingCart,
  MoreHorizontal,
  Upload,
  FileText,
  Sparkles,
  RotateCcw,
  BadgePlus,
  Radio,
} from "lucide-react";

/* ================================================================== */
/* Types & constants                                                  */
/* ================================================================== */

type Lang = "en" | "ar";
type Theme = "light" | "dark";
type CategoryId =
  | "food"
  | "groceries"
  | "transport"
  | "leisure"
  | "subscription"
  | "other";

type Screen =
  | "language"
  | "income"
  | "budget"
  | "savings"
  | "upload"
  | "processing"
  | "forecast"
  | "home"
  | "edit"
  | "settings"
  | "guide";

interface Spending {
  id: string;
  amount: number;
  category: CategoryId;
  note: string;
  date: string; // ISO
}

// A one-time income top-up (scholarship, gift, side gig, refund, …).
interface IncomeBoost {
  id: string;
  amount: number;
  mode: "week" | "spread"; // add to this week, or spread across 4 weeks
  savePct: number; // 0–100, how much of it to set aside
  date: string;
}

interface AppData {
  onboarded: boolean;
  lang: Lang;
  theme: Theme;
  income: number;
  weeklyBudget: number;
  savingsPct: number;
  spendings: Spending[];
  boosts: IncomeBoost[];
}

const GUIDE_TOTAL = 5;

const CATEGORY_META: {
  id: CategoryId;
  color: string;
  tint: string;
  share: number; // default share of the weekly spendable budget
  forecastFactor: number; // mocked projection vs budget
}[] = [
  { id: "food", color: "#FF7043", tint: "rgba(255,112,67,.14)", share: 0.24, forecastFactor: 1.08 },
  { id: "groceries", color: "#66BB6A", tint: "rgba(102,187,106,.14)", share: 0.2, forecastFactor: 0.92 },
  { id: "transport", color: "#42A5F5", tint: "rgba(66,165,245,.14)", share: 0.16, forecastFactor: 1.2 },
  { id: "leisure", color: "#AB47BC", tint: "rgba(171,71,188,.14)", share: 0.16, forecastFactor: 1.34 },
  { id: "subscription", color: "#26A69A", tint: "rgba(38,166,154,.14)", share: 0.1, forecastFactor: 1.0 },
  { id: "other", color: "#78909C", tint: "rgba(120,144,156,.14)", share: 0.14, forecastFactor: 0.8 },
];

const CAT_ICON: Record<CategoryId, typeof Utensils> = {
  food: Utensils,
  groceries: ShoppingCart,
  transport: Bus,
  leisure: Film,
  subscription: CreditCard,
  other: MoreHorizontal,
};

/* ================================================================== */
/* i18n                                                               */
/* ================================================================== */

type Dict = Record<string, string>;

const EN: Dict = {
  appName: "Spendly",
  tagline: "Spend smart. Save without thinking.",
  chooseLanguage: "Choose your language",
  continue: "Continue",
  back: "Back",
  next: "Next",
  step: "Step",
  of: "of",

  incomeTitle: "What's your monthly income?",
  incomeSub: "We use this to shape realistic limits — you can change it later.",
  budgetTitle: "What's your weekly budget?",
  budgetSub: "How much you're comfortable spending each week.",
  perMonth: "/ month",
  perWeek: "/ week",

  savingsTitle: "How much do you want to save?",
  savingsSub: "Drag to set aside part of your budget before you spend.",
  savingsRate: "Savings rate",
  dailyToSpend: "Safe to spend daily",
  savedWeekly: "Saved each week",

  uploadTitle: "Add your bank statement",
  uploadSub: "We'll read your recent transactions to learn your habits.",
  chooseFile: "Choose file",
  statementSelected: "Statement ready",
  noFile: "PDF or CSV export from your bank",
  analyze: "Analyze statement",

  processingTitle: "Analyzing your statement",
  liveFeed: "Live from your bank",
  procUpload: "Uploading securely",
  procRead: "Reading transactions",
  procCategorize: "Sorting into categories",
  procForecast: "Building your forecast",
  procDone: "Done",
  whileYouWait: "While it works, here's how to use the app",

  forecastTitle: "Your spending forecast",
  forecastSub: "Based on your statement, here's next week's projection.",
  projected: "Projected",
  budget: "Budget",
  rating: "Your rating",
  onTrack: "On track",
  watch: "Watch spending",
  over: "Over budget",
  onTrackMsg: "Nicely balanced — you should end the week with money saved.",
  watchMsg: "A couple of categories are creeping up. Small tweaks will fix it.",
  overMsg: "You're set to overspend. Let's trim leisure and transport a little.",
  seeApp: "Go to my dashboard",

  greeting: "Hi there",
  today: "Today",
  dailyLimit: "Daily limit",
  remaining: "left today",
  over_: "over today",
  savedThisWeek: "Saved this week",
  boosted: "Boosted",
  categories: "Categories",
  thisWeek: "This week",

  quickActions: "Quick actions",
  scanReceipt: "Scan receipt",
  fromGallery: "From gallery",
  extraIncome: "Extra income",

  navHome: "Home",
  navSpendings: "Spending",
  navGuide: "Guide",
  navSettings: "Settings",

  editTitle: "Your spending",
  todayLabel: "Today",
  yesterdayLabel: "Yesterday",
  noEntries: "Nothing logged yet. Tap + to add your first spend.",

  addSpending: "Add spending",
  editSpending: "Edit spending",
  logManually: "Enter manually",
  amount: "Amount",
  category: "Category",
  note: "Note",
  notePlaceholder: "e.g. Lunch at the cafe",
  save: "Save",
  delete: "Delete",
  cancel: "Cancel",

  boostTitle: "Add extra income",
  boostAmount: "How much did you receive?",
  boostUse: "How should we use it?",
  boostThisWeek: "Add to this week",
  boostThisWeekSub: "Raises this week's daily limit",
  boostSpread: "Spread over 4 weeks",
  boostSpreadSub: "A little more room each week",
  boostSave: "How much to save?",
  boostToSpend: "Added to spending",
  boostToSave: "Added to savings",
  boostAdd: "Add income",

  settingsTitle: "Settings",
  language: "Language",
  appearance: "Appearance",
  light: "Light",
  dark: "Dark",
  data: "Data",
  resetOnboarding: "Reset & set up again",

  guideTitle: "How to use Spendly",
  g1t: "Log a purchase",
  g1d: "Tap the + button, then scan a receipt, add a photo from your gallery, or type it in. Pick a category and save — it takes seconds.",
  g2t: "Watch your daily limit",
  g2d: "The ring on Home fills as you spend today. Keep it from closing to finish the day within your safe-to-spend amount.",
  g3t: "Track every category",
  g3d: "Food, transport, leisure and more each get a weekly limit. Their bars fill as you spend and turn red if you go over.",
  g4t: "Add extra income",
  g4d: "Got one-time money — a gift, refund, or side gig? Use Extra income to choose whether to spend or save it, and by how much.",
  g5t: "Edit anytime",
  g5d: "Open Spending to review entries by day and hour. Tap any item to change its amount, category, or note — or delete it.",
};

const AR: Dict = {
  appName: "سبِندلي",
  tagline: "أنفق بذكاء. وادّخر دون تفكير.",
  chooseLanguage: "اختر لغتك",
  continue: "متابعة",
  back: "رجوع",
  next: "التالي",
  step: "الخطوة",
  of: "من",

  incomeTitle: "كم دخلك الشهري؟",
  incomeSub: "نستخدمه لوضع حدود واقعية — يمكنك تغييره لاحقًا.",
  budgetTitle: "كم ميزانيتك الأسبوعية؟",
  budgetSub: "المبلغ الذي تريد إنفاقه بأريحية كل أسبوع.",
  perMonth: "/ شهريًا",
  perWeek: "/ أسبوعيًا",

  savingsTitle: "كم تريد أن تدّخر؟",
  savingsSub: "اسحب لتخصيص جزء من ميزانيتك قبل الإنفاق.",
  savingsRate: "نسبة الادخار",
  dailyToSpend: "المتاح للإنفاق يوميًا",
  savedWeekly: "المدّخر أسبوعيًا",

  uploadTitle: "أضف كشف حسابك البنكي",
  uploadSub: "سنقرأ عملياتك الأخيرة لنتعرّف على عاداتك.",
  chooseFile: "اختر ملفًا",
  statementSelected: "الكشف جاهز",
  noFile: "ملف PDF أو CSV من بنكك",
  analyze: "تحليل الكشف",

  processingTitle: "جارٍ تحليل كشفك",
  liveFeed: "مباشر من بنكك",
  procUpload: "رفع آمن للملف",
  procRead: "قراءة العمليات",
  procCategorize: "التصنيف إلى فئات",
  procForecast: "بناء التوقّعات",
  procDone: "اكتمل",
  whileYouWait: "بينما يعمل، إليك طريقة استخدام التطبيق",

  forecastTitle: "توقّع إنفاقك",
  forecastSub: "بناءً على كشفك، هذا توقّع الأسبوع القادم.",
  projected: "المتوقّع",
  budget: "الميزانية",
  rating: "تقييمك",
  onTrack: "على المسار",
  watch: "انتبه لإنفاقك",
  over: "تجاوزت الميزانية",
  onTrackMsg: "توازن جيّد — من المتوقّع أن تنهي الأسبوع بمبلغ مدّخر.",
  watchMsg: "بعض الفئات ترتفع قليلًا. تعديلات بسيطة ستحلّ الأمر.",
  overMsg: "أنت في طريقك لتجاوز الميزانية. لنقلّل الترفيه والمواصلات قليلًا.",
  seeApp: "الذهاب إلى لوحتي",

  greeting: "مرحبًا",
  today: "اليوم",
  dailyLimit: "الحد اليومي",
  remaining: "متبقٍّ اليوم",
  over_: "زيادة اليوم",
  savedThisWeek: "المدّخر هذا الأسبوع",
  boosted: "معزّز",
  categories: "الفئات",
  thisWeek: "هذا الأسبوع",

  quickActions: "إجراءات سريعة",
  scanReceipt: "تصوير إيصال",
  fromGallery: "من المعرض",
  extraIncome: "دخل إضافي",

  navHome: "الرئيسية",
  navSpendings: "المصروفات",
  navGuide: "الدليل",
  navSettings: "الإعدادات",

  editTitle: "مصروفاتك",
  todayLabel: "اليوم",
  yesterdayLabel: "أمس",
  noEntries: "لا شيء مسجّل بعد. اضغط + لإضافة أول مصروف.",

  addSpending: "إضافة مصروف",
  editSpending: "تعديل مصروف",
  logManually: "إدخال يدوي",
  amount: "المبلغ",
  category: "الفئة",
  note: "ملاحظة",
  notePlaceholder: "مثال: غداء في المقهى",
  save: "حفظ",
  delete: "حذف",
  cancel: "إلغاء",

  boostTitle: "إضافة دخل إضافي",
  boostAmount: "كم المبلغ الذي استلمته؟",
  boostUse: "كيف نستخدمه؟",
  boostThisWeek: "أضِفه لهذا الأسبوع",
  boostThisWeekSub: "يرفع الحد اليومي لهذا الأسبوع",
  boostSpread: "وزّعه على 4 أسابيع",
  boostSpreadSub: "مساحة أكبر قليلًا كل أسبوع",
  boostSave: "كم تريد أن تدّخر منه؟",
  boostToSpend: "أُضيف للإنفاق",
  boostToSave: "أُضيف للادخار",
  boostAdd: "إضافة الدخل",

  settingsTitle: "الإعدادات",
  language: "اللغة",
  appearance: "المظهر",
  light: "فاتح",
  dark: "داكن",
  data: "البيانات",
  resetOnboarding: "إعادة الضبط والإعداد من جديد",

  guideTitle: "كيف تستخدم سبِندلي",
  g1t: "سجّل عملية شراء",
  g1d: "اضغط زر +، ثم صوّر إيصالًا أو أضف صورة من معرضك أو أدخِلها يدويًا. اختر الفئة واحفظ — لا يستغرق سوى ثوانٍ.",
  g2t: "راقب حدّك اليومي",
  g2d: "تمتلئ الحلقة في الرئيسية كلما أنفقت اليوم. حافظ عليها لتنهي اليوم ضمن المبلغ الآمن للإنفاق.",
  g3t: "تابع كل فئة",
  g3d: "لكل فئة — طعام ومواصلات وترفيه وغيرها — حدّ أسبوعي. تمتلئ الأشرطة كلما أنفقت وتتحوّل للأحمر عند التجاوز.",
  g4t: "أضف دخلًا إضافيًا",
  g4d: "حصلت على مبلغ لمرة واحدة — هدية أو استرداد أو عمل جانبي؟ استخدم «دخل إضافي» لتقرّر إنفاقه أو ادخاره وبأي نسبة.",
  g5t: "عدّل في أي وقت",
  g5d: "افتح «المصروفات» لمراجعة العمليات حسب اليوم والساعة. اضغط أي عنصر لتغيير المبلغ أو الفئة أو الملاحظة — أو لحذفه.",
};

const CATEGORY_NAMES: Record<Lang, Record<CategoryId, string>> = {
  en: {
    food: "Food",
    groceries: "Groceries",
    transport: "Transport",
    leisure: "Leisure",
    subscription: "Subscriptions",
    other: "Other",
  },
  ar: {
    food: "طعام",
    groceries: "بقالة",
    transport: "مواصلات",
    leisure: "ترفيه",
    subscription: "اشتراكات",
    other: "أخرى",
  },
};

/* ================================================================== */
/* Helpers                                                            */
/* ================================================================== */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const uid = () => Math.random().toString(36).slice(2, 10);

function formatNum(n: number, lang: Lang): string {
  return (isFinite(n) ? n : 0).toLocaleString(lang === "ar" ? "ar-OM" : "en-OM", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function seedSpendings(): Spending[] {
  const now = new Date();
  const at = (daysAgo: number, h: number, m: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  const rows: Omit<Spending, "id">[] = [
    { amount: 0.5, category: "transport", note: "Bus to campus", date: at(0, 8, 20) },
    { amount: 2.4, category: "food", note: "Lunch — chicken shawarma", date: at(0, 13, 5) },
    { amount: 3.9, category: "groceries", note: "Weekly essentials", date: at(0, 18, 40) },
    { amount: 1.2, category: "leisure", note: "Coffee with friends", date: at(0, 20, 15) },
    { amount: 4.9, category: "subscription", note: "Streaming", date: at(1, 9, 0) },
    { amount: 1.8, category: "food", note: "Snacks", date: at(1, 16, 30) },
    { amount: 0.8, category: "transport", note: "Taxi share", date: at(1, 22, 10) },
    { amount: 6.7, category: "groceries", note: "Supermarket run", date: at(2, 12, 0) },
    { amount: 5.0, category: "leisure", note: "Cinema ticket", date: at(3, 19, 30) },
  ];
  return rows.map((r) => ({ ...r, id: uid() }));
}

function defaultData(): AppData {
  return {
    onboarded: false,
    lang: "en",
    theme: "light",
    income: 300,
    weeklyBudget: 40,
    savingsPct: 15,
    spendings: seedSpendings(),
    boosts: [],
  };
}

const STORAGE_KEY = "spendly.v2";

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    return { ...defaultData(), ...JSON.parse(raw) };
  } catch {
    return defaultData();
  }
}
function saveData(d: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    /* storage blocked (e.g. sandbox) — run from memory */
  }
}

/** All the budget math, including one-time income boosts. */
function useDerived(d: AppData) {
  return useMemo(() => {
    const baseSpendable = d.weeklyBudget * (1 - d.savingsPct / 100);
    const baseSaved = d.weeklyBudget * (d.savingsPct / 100);

    let extraSpendable = 0;
    let extraSaved = 0;
    d.boosts.forEach((b) => {
      const saved = b.amount * (b.savePct / 100);
      const spend = b.amount - saved;
      extraSaved += saved;
      extraSpendable += b.mode === "spread" ? spend / 4 : spend;
    });

    const spendableWeekly = baseSpendable + extraSpendable;
    const weeklySaved = baseSaved + extraSaved;
    const dailyLimit = spendableWeekly / 7;

    const catBudget = {} as Record<CategoryId, number>;
    CATEGORY_META.forEach((c) => (catBudget[c.id] = spendableWeekly * c.share));

    const now = new Date();
    const todayKey = now.toDateString();
    const weekAgo = now.getTime() - 7 * 864e5;

    let spentToday = 0;
    const spentByCat = {} as Record<CategoryId, number>;
    CATEGORY_META.forEach((c) => (spentByCat[c.id] = 0));
    d.spendings.forEach((s) => {
      const t = new Date(s.date);
      if (t.toDateString() === todayKey) spentToday += s.amount;
      if (t.getTime() >= weekAgo) spentByCat[s.category] += s.amount;
    });

    return { spendableWeekly, dailyLimit, weeklySaved, extraSpendable, catBudget, spentToday, spentByCat };
  }, [d.weeklyBudget, d.savingsPct, d.spendings, d.boosts]);
}

/* ================================================================== */
/* App context                                                        */
/* ================================================================== */

interface Ctx {
  d: AppData;
  t: (k: string) => string;
  catName: (id: CategoryId) => string;
  set: (patch: Partial<AppData>) => void;
  addSpending: (s: Omit<Spending, "id">) => void;
  updateSpending: (id: string, patch: Partial<Spending>) => void;
  deleteSpending: (id: string) => void;
  addBoost: (b: Omit<IncomeBoost, "id">) => void;
  go: (s: Screen) => void;
  screen: Screen;
}
const AppCtx = createContext<Ctx>(null as unknown as Ctx);
const useApp = () => useContext(AppCtx);

/* ================================================================== */
/* Currency sign + amount                                             */
/* ================================================================== */

/**
 * Official Omani rial sign (Central Bank of Oman artwork), inlined as SVG so it
 * renders on every platform, inherits text color via currentColor and scales
 * with the text via em. Native aspect ratio ~1.79:1.
 */
function RialSign({ style }: { style?: CSSProperties }) {
  return (
    <svg
      className="rial"
      viewBox="0 0 741.36 415.06"
      fill="currentColor"
      role="img"
      aria-label="Omani rial"
      style={style}
    >
      <path d="M259.9,219.89c-.63-49.2,11.44-95.41,35.76-137.75C331.7,19.4,371.24-.36,439.78,34.99c10.67,5.5,53.6,35.43,57.81,44.54,5.03,10.87-27.48,103.87-29.11,122.3-34.69-37.51-99.37-98.66-154.85-69.62-45.05,23.58-12.02,62.54,11.46,87.68h406.25l-39.14,70.23-289.2-2c-1.11,4.66.87,3.3,2.53,4.6,12.44,9.72,80.97,31.54,94.75,31.54l172.05,1.99-39.49,71.25H10.03l39.24-71.24h272.14l-37.11-36.13H69.33l39.23-70.23h151.33Z" />
    </svg>
  );
}

/** Formatted amount: rial sign (always preceding the value) + number. */
function Money({ value }: { value: number }) {
  const { d } = useApp();
  return (
    <span className="money">
      <RialSign /> <span className="mono">{formatNum(value, d.lang)}</span>
    </span>
  );
}

/* ================================================================== */
/* Small building blocks                                              */
/* ================================================================== */

function Ring({
  progress,
  size = 220,
  stroke = 18,
  color,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = clamp(progress, 0, 1);
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .7s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

function CategoryBar({ id, spent, budget }: { id: CategoryId; spent: number; budget: number }) {
  const { catName } = useApp();
  const meta = CATEGORY_META.find((c) => c.id === id)!;
  const Icon = CAT_ICON[id];
  const ratio = budget > 0 ? spent / budget : 0;
  const over = spent > budget && budget > 0;
  return (
    <div className="cat-row">
      <div className="cat-icon" style={{ background: meta.tint, color: meta.color }}>
        <Icon size={18} />
      </div>
      <div className="cat-main">
        <div className="cat-top">
          <span className="cat-name">{catName(id)}</span>
          <span className="cat-amount">
            <b style={{ color: over ? "var(--bad)" : "var(--text)" }}>
              <Money value={spent} />
            </b>
            <span className="cat-of">
              {" / "}
              <Money value={budget} />
            </span>
          </span>
        </div>
        <div className="bar-track">
          <div
            className="bar-fill"
            style={{ width: `${clamp(ratio, 0, 1) * 100}%`, background: over ? "var(--bad)" : meta.color }}
          />
        </div>
      </div>
    </div>
  );
}

function NumberPad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const press = (k: string) => {
    if (k === "del") return onChange(value.slice(0, -1));
    if (k === ".") {
      if (value.includes(".")) return;
      return onChange(value === "" ? "0." : value + ".");
    }
    if (value.includes(".") && value.split(".")[1].length >= 3) return;
    onChange(value === "0" ? k : value + k);
  };
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"];
  return (
    <div className="keypad" role="group" aria-label="Number pad">
      {keys.map((k) => (
        <button key={k} type="button" className="key" onClick={() => press(k)}>
          {k === "del" ? <ChevronLeft size={22} className="rtl-flip" /> : k}
        </button>
      ))}
    </div>
  );
}

function Slider({
  value,
  min,
  max,
  onChange,
  color = "var(--primary)",
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="slider"
      style={{ background: `linear-gradient(90deg, ${color} ${pct}%, var(--ring-track) ${pct}%)` }}
    />
  );
}

/* Flags — simple SVG so they render everywhere */
function FlagUK({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.66} viewBox="0 0 60 40" className="flag">
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0 L60 40 M60 0 L0 40" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0 V40 M0 20 H60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0 V40 M0 20 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}
function FlagOman({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.66} viewBox="0 0 60 40" className="flag">
      <rect width="60" height="13.33" y="0" fill="#fff" />
      <rect width="60" height="13.33" y="13.33" fill="#D51E26" />
      <rect width="60" height="13.34" y="26.66" fill="#00844A" />
      <rect width="20" height="40" fill="#D51E26" />
      <g fill="#fff" transform="translate(10 9) scale(.9)">
        <rect x="-1.5" y="-2" width="3" height="10" rx="1" />
        <path d="M-5 6 q5 4 10 0 v3 q-5 3 -10 0 z" />
        <path d="M-6 2 q6 -6 12 0" fill="none" stroke="#fff" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

/* Bottom sheet */
function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function TopBar({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="topbar">
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <ChevronLeft size={22} className="rtl-flip" />
        </button>
      ) : (
        <span style={{ width: 40 }} />
      )}
      <h2 className="topbar-title">{title}</h2>
      <span style={{ width: 40 }} />
    </div>
  );
}

function Progress({ index, total }: { index: number; total: number }) {
  return (
    <div className="progress-dots">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={"dot" + (i <= index ? " on" : "")} />
      ))}
    </div>
  );
}

/* Guide illustrations, one per numbered step */
function Illo({ kind }: { kind: number }) {
  const P = "var(--primary)";
  if (kind === 0)
    return (
      <svg viewBox="0 0 200 140" className="illo">
        <rect x="58" y="18" width="72" height="104" rx="12" fill="var(--bg-elev)" stroke="var(--line)" />
        <rect x="70" y="34" width="48" height="6" rx="3" fill="var(--line)" />
        <rect x="70" y="50" width="36" height="6" rx="3" fill="var(--line)" />
        <rect x="70" y="66" width="44" height="6" rx="3" fill="var(--line)" />
        <path d="M70 92 h48" stroke="var(--line)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="146" cy="100" r="26" fill={P} />
        <g stroke="#fff" strokeWidth="3" fill="none">
          <rect x="136" y="92" width="20" height="14" rx="3" />
          <circle cx="146" cy="99" r="4" />
        </g>
      </svg>
    );
  if (kind === 1)
    return (
      <svg viewBox="0 0 200 140" className="illo">
        <circle cx="100" cy="70" r="46" fill="none" stroke="var(--ring-track)" strokeWidth="14" />
        <circle
          cx="100"
          cy="70"
          r="46"
          fill="none"
          stroke={P}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 46}
          strokeDashoffset={2 * Math.PI * 46 * 0.32}
          transform="rotate(-90 100 70)"
        />
        <text x="100" y="76" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text)">
          68%
        </text>
      </svg>
    );
  if (kind === 2)
    return (
      <svg viewBox="0 0 200 140" className="illo">
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <rect x="30" y={26 + i * 26} width="140" height="10" rx="5" fill="var(--ring-track)" />
            <rect
              x="30"
              y={26 + i * 26}
              width={[110, 70, 130, 50][i]}
              height="10"
              rx="5"
              fill={["#FF7043", "#42A5F5", "#AB47BC", "#66BB6A"][i]}
            />
          </g>
        ))}
      </svg>
    );
  if (kind === 3)
    return (
      <svg viewBox="0 0 200 140" className="illo">
        <g fill={P}>
          <ellipse cx="70" cy="96" rx="30" ry="10" opacity=".3" />
          <rect x="42" y="70" width="56" height="22" rx="6" />
          <rect x="48" y="54" width="44" height="20" rx="6" opacity=".8" />
          <rect x="54" y="40" width="32" height="18" rx="6" opacity=".6" />
        </g>
        <path d="M112 70 h34" stroke={P} strokeWidth="6" strokeLinecap="round" />
        <path d="M138 60 l12 10 l-12 10" fill="none" stroke={P} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="168" cy="70" r="14" fill="none" stroke={P} strokeWidth="5" />
        <path d="M168 63 v14 M161 70 h14" stroke={P} strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 200 140" className="illo">
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="34" y={30 + i * 28} width="112" height="20" rx="8" fill="var(--bg-elev)" stroke="var(--line)" />
          <circle cx="48" cy={40 + i * 28} r="5" fill={["#FF7043", "#42A5F5", "#66BB6A"][i]} />
          <rect x="60" y={37 + i * 28} width="50" height="6" rx="3" fill="var(--line)" />
        </g>
      ))}
      <circle cx="158" cy="98" r="20" fill={P} />
      <path d="M151 101 l4 4 l10 -10" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M150 96 l9 -9" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Numbered, manually-navigated guide deck. Used both during statement
 * processing and from the Guide tab. Never auto-advances.
 */
function GuideDeck({ onFinish, finishLabel }: { onFinish?: () => void; finishLabel?: string }) {
  const { t } = useApp();
  const [i, setI] = useState(0);
  const last = i === GUIDE_TOTAL - 1;
  return (
    <div className="guide-deck">
      <div className="guide-badge">
        <span className="guide-num">{i + 1}</span>
        {t("step")} {i + 1} {t("of")} {GUIDE_TOTAL}
      </div>
      <Illo kind={i} />
      <h3 className="guide-title">
        {i + 1}. {t(`g${i + 1}t`)}
      </h3>
      <p className="guide-desc">{t(`g${i + 1}d`)}</p>

      <div className="progress-dots">
        {Array.from({ length: GUIDE_TOTAL }).map((_, k) => (
          <button
            key={k}
            className={"dot" + (k === i ? " on" : "")}
            aria-label={`${t("step")} ${k + 1}`}
            onClick={() => setI(k)}
          />
        ))}
      </div>

      <div className="guide-nav">
        <button className="btn btn-ghost" disabled={i === 0} onClick={() => setI((v) => Math.max(0, v - 1))}>
          <ChevronLeft size={18} className="rtl-flip" /> {t("back")}
        </button>
        {last && onFinish ? (
          <button className="btn btn-primary flex1" onClick={onFinish}>
            {finishLabel} <ArrowRight size={18} className="rtl-flip" />
          </button>
        ) : (
          <button
            className="btn btn-primary flex1"
            disabled={last}
            onClick={() => setI((v) => Math.min(GUIDE_TOTAL - 1, v + 1))}
          >
            {t("next")} <ChevronRight size={18} className="rtl-flip" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Onboarding screens                                                 */
/* ================================================================== */

function LanguageScreen() {
  const { set, go } = useApp();
  const pick = (lang: Lang) => {
    set({ lang });
    go("income");
  };
  return (
    <div className="screen center-screen">
      <div className="brand">
        <div className="brand-mark">
          <Wallet size={26} />
        </div>
        <h1 className="brand-name">Spendly</h1>
        <p className="brand-tag">Spend smart. Save without thinking.</p>
      </div>
      <h2 className="lang-heading">
        Choose your language <span className="muted">/ اختر لغتك</span>
      </h2>
      <div className="lang-grid">
        <button className="lang-card" onClick={() => pick("en")}>
          <FlagUK />
          <span className="lang-title">English</span>
          <span className="lang-sub">Continue in English</span>
        </button>
        <button className="lang-card" onClick={() => pick("ar")}>
          <FlagOman />
          <span className="lang-title">العربية</span>
          <span className="lang-sub">المتابعة بالعربية</span>
        </button>
      </div>
    </div>
  );
}

function AmountScreen({ which }: { which: "income" | "budget" }) {
  const { t, d, set, go } = useApp();
  const initial = which === "income" ? d.income : d.weeklyBudget;
  const [val, setVal] = useState<string>(initial ? String(initial) : "");
  const num = Number(val || 0);
  const ok = num > 0;
  const submit = () => {
    if (!ok) return;
    if (which === "income") set({ income: num });
    else set({ weeklyBudget: num });
    go(which === "income" ? "budget" : "savings");
  };
  return (
    <div className="screen">
      <Progress index={which === "income" ? 0 : 1} total={5} />
      <div className="amount-head">
        <h2 className="q-title">{t(which === "income" ? "incomeTitle" : "budgetTitle")}</h2>
        <p className="q-sub">{t(which === "income" ? "incomeSub" : "budgetSub")}</p>
      </div>

      <div className="amount-display">
        <span className="amount-symbol">
          <RialSign />
        </span>
        <span className={"amount-value" + (val ? "" : " placeholder")}>{val || "0.000"}</span>
        <span className="amount-period">{t(which === "income" ? "perMonth" : "perWeek")}</span>
      </div>

      {/* Hidden native field so mobile users also get the numeric keyboard */}
      <input
        className="visually-hidden"
        inputMode="decimal"
        value={val}
        onChange={(e) => setVal(e.target.value.replace(/[^0-9.]/g, ""))}
        aria-hidden
        tabIndex={-1}
      />

      <NumberPad value={val} onChange={setVal} />

      <button className={"btn btn-primary btn-wide" + (ok ? "" : " disabled")} onClick={submit} disabled={!ok}>
        {t("continue")} <ArrowRight size={18} className="rtl-flip" />
      </button>
    </div>
  );
}

function SavingsScreen() {
  const { t, d, set, go } = useApp();
  const [pct, setPct] = useState(d.savingsPct);
  const spendableWeekly = d.weeklyBudget * (1 - pct / 100);
  const daily = spendableWeekly / 7;
  const saved = d.weeklyBudget * (pct / 100);
  return (
    <div className="screen">
      <Progress index={2} total={5} />
      <div className="amount-head">
        <h2 className="q-title">{t("savingsTitle")}</h2>
        <p className="q-sub">{t("savingsSub")}</p>
      </div>

      <div className="savings-value">
        <PiggyBank size={22} />
        <span>{pct}%</span>
        <span className="muted small">{t("savingsRate")}</span>
      </div>

      <div className="slider-block">
        <Slider value={pct} min={0} max={50} onChange={setPct} />
        <div className="slider-ends">
          <span>0%</span>
          <span>50%</span>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-label">{t("dailyToSpend")}</span>
          <span className="stat-num" style={{ color: "var(--primary)" }}>
            <Money value={daily} />
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">{t("savedWeekly")}</span>
          <span className="stat-num" style={{ color: "var(--accent)" }}>
            <Money value={saved} />
          </span>
        </div>
      </div>

      <button
        className="btn btn-primary btn-wide"
        onClick={() => {
          set({ savingsPct: pct });
          go("upload");
        }}
      >
        {t("continue")} <ArrowRight size={18} className="rtl-flip" />
      </button>
    </div>
  );
}

function UploadScreen() {
  const { t, go } = useApp();
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="screen">
      <Progress index={3} total={5} />
      <div className="amount-head">
        <h2 className="q-title">{t("uploadTitle")}</h2>
        <p className="q-sub">{t("uploadSub")}</p>
      </div>

      <button className="dropzone" onClick={() => inputRef.current?.click()}>
        <div className="dz-icon">
          <Upload size={26} />
        </div>
        {fileName ? (
          <>
            <span className="dz-file">
              <FileText size={16} /> {fileName}
            </span>
            <span className="dz-ready">
              <Check size={14} /> {t("statementSelected")}
            </span>
          </>
        ) : (
          <>
            <span className="dz-main">{t("chooseFile")}</span>
            <span className="dz-sub">{t("noFile")}</span>
          </>
        )}
      </button>
      {/* BACKEND: upload this file to your parsing endpoint. */}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.csv"
        className="visually-hidden"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "statement.pdf")}
      />

      <button
        className={"btn btn-primary btn-wide" + (fileName ? "" : " disabled")}
        disabled={!fileName}
        onClick={() => go("processing")}
      >
        {t("analyze")} <ArrowRight size={18} className="rtl-flip" />
      </button>
    </div>
  );
}

/**
 * BACKEND: replace this simulated feed with real progress events
 * (poll your job status or subscribe to a websocket). Return the active
 * step index and a `done` flag.
 */
function useStatementProcessing(active: boolean) {
  const stepKeys = ["procUpload", "procRead", "procCategorize", "procForecast", "procDone"];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) return;
    setIdx(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setIdx(i);
      if (i >= stepKeys.length - 1) clearInterval(id);
    }, 1500);
    return () => clearInterval(id);
  }, [active]);
  return { stepKeys, idx, done: idx >= stepKeys.length - 1 };
}

function ProcessingScreen() {
  const { t, go } = useApp();
  const { stepKeys, idx, done } = useStatementProcessing(true);
  const progress = idx / (stepKeys.length - 1);

  return (
    <div className="screen scroll">
      <h2 className="q-title" style={{ marginBottom: 4 }}>
        {t("processingTitle")}
      </h2>
      <p className="q-sub">{t("whileYouWait")}</p>

      {/* Live backend status — kept visible above the guide on mobile */}
      <div className="status-card">
        <div className="status-head">
          <span className="live">
            <Radio size={13} /> {t("liveFeed")}
          </span>
          <span className="muted small">{Math.round(progress * 100)}%</span>
        </div>
        <div className="status-progress">
          <div className="status-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="status-steps">
          {stepKeys.map((s, i) => {
            const state = i < idx ? "done" : i === idx ? "active" : "todo";
            return (
              <div key={s} className={"status-row " + state}>
                <span className="status-dot">
                  {state === "done" ? <Check size={13} /> : state === "active" ? <span className="spin" /> : null}
                </span>
                <span className="status-text">{t(s)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Numbered, manually-navigated guide */}
      <GuideDeck onFinish={done ? () => go("forecast") : undefined} finishLabel={t("continue")} />

      <button
        className={"btn btn-primary btn-wide" + (done ? "" : " disabled")}
        disabled={!done}
        onClick={() => go("forecast")}
      >
        {done ? t("continue") : t("procForecast")} {done && <ArrowRight size={18} className="rtl-flip" />}
      </button>
    </div>
  );
}

function ForecastScreen() {
  const { t, d, catName, set, go } = useApp();
  const der = useDerived(d);

  const rows = CATEGORY_META.map((c) => {
    const budget = der.catBudget[c.id];
    return { id: c.id, color: c.color, tint: c.tint, budget, projected: budget * c.forecastFactor };
  });
  const totalProjected = rows.reduce((a, r) => a + r.projected, 0);
  const ratio = der.spendableWeekly > 0 ? totalProjected / der.spendableWeekly : 0;
  const score = Math.round(clamp((2 - ratio) * 100, 0, 100));

  let ratingKey = "onTrack";
  let ratingColor = "var(--good)";
  let msg = "onTrackMsg";
  if (ratio > 1.12) {
    ratingKey = "over";
    ratingColor = "var(--bad)";
    msg = "overMsg";
  } else if (ratio > 1.0) {
    ratingKey = "watch";
    ratingColor = "var(--warn)";
    msg = "watchMsg";
  }

  return (
    <div className="screen scroll">
      <div className="amount-head">
        <h2 className="q-title">{t("forecastTitle")}</h2>
        <p className="q-sub">{t("forecastSub")}</p>
      </div>

      <div className="rating-card" style={{ borderColor: ratingColor }}>
        <Ring progress={score / 100} size={120} stroke={12} color={ratingColor}>
          <div className="rating-score">
            <b>{score}</b>
            <span>/100</span>
          </div>
        </Ring>
        <div className="rating-body">
          <span className="rating-label" style={{ color: ratingColor }}>
            <TrendingUp size={16} /> {t(ratingKey)}
          </span>
          <p className="rating-msg">{t(msg)}</p>
        </div>
      </div>

      <div className="forecast-list card">
        {rows.map((r) => {
          const Icon = CAT_ICON[r.id];
          const over = r.projected > r.budget;
          return (
            <div className="cat-row" key={r.id}>
              <div className="cat-icon" style={{ background: r.tint, color: r.color }}>
                <Icon size={18} />
              </div>
              <div className="cat-main">
                <div className="cat-top">
                  <span className="cat-name">{catName(r.id)}</span>
                  <span className="cat-amount">
                    <b style={{ color: over ? "var(--bad)" : "var(--text)" }}>
                      <Money value={r.projected} />
                    </b>
                    <span className="cat-of">
                      {" / "}
                      <Money value={r.budget} />
                    </span>
                  </span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${clamp(r.projected / r.budget, 0, 1) * 100}%`,
                      background: over ? "var(--bad)" : r.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="btn btn-primary btn-wide"
        onClick={() => {
          set({ onboarded: true });
          go("home");
        }}
      >
        <Sparkles size={18} /> {t("seeApp")}
      </button>
    </div>
  );
}

/* ================================================================== */
/* Add / edit spending sheet                                          */
/* ================================================================== */

function EntrySheet({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: Spending | null }) {
  const { t, catName, addSpending, updateSpending, deleteSpending } = useApp();
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState<CategoryId>("food");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(editing ? String(editing.amount) : "");
      setCat(editing ? editing.category : "food");
      setNote(editing ? editing.note : "");
    }
  }, [open, editing]);

  const num = Number(amount || 0);
  const save = () => {
    if (num <= 0) return;
    if (editing) updateSpending(editing.id, { amount: num, category: cat, note });
    else addSpending({ amount: num, category: cat, note, date: new Date().toISOString() });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="sheet-handle" />
      <div className="sheet-head">
        <h3>{editing ? t("editSpending") : t("addSpending")}</h3>
        <button className="icon-btn" onClick={onClose} aria-label={t("cancel")}>
          <X size={20} />
        </button>
      </div>

      <label className="field-label">{t("amount")}</label>
      <div className="amount-input">
        <span className="rial-inline">
          <RialSign />
        </span>
        <input
          inputMode="decimal"
          value={amount}
          placeholder="0.000"
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          autoFocus
        />
      </div>

      <label className="field-label">{t("category")}</label>
      <div className="chip-row">
        {CATEGORY_META.map((c) => {
          const Icon = CAT_ICON[c.id];
          const on = cat === c.id;
          return (
            <button
              key={c.id}
              className={"chip" + (on ? " on" : "")}
              style={on ? { background: c.tint, color: c.color, borderColor: c.color } : {}}
              onClick={() => setCat(c.id)}
            >
              <Icon size={15} /> {catName(c.id)}
            </button>
          );
        })}
      </div>

      <label className="field-label">{t("note")}</label>
      <input className="text-input" value={note} placeholder={t("notePlaceholder")} onChange={(e) => setNote(e.target.value)} />

      <div className="sheet-actions">
        {editing && (
          <button
            className="btn btn-danger"
            onClick={() => {
              deleteSpending(editing.id);
              onClose();
            }}
          >
            <Trash2 size={16} /> {t("delete")}
          </button>
        )}
        <button className={"btn btn-primary flex1" + (num > 0 ? "" : " disabled")} disabled={num <= 0} onClick={save}>
          <Check size={16} /> {t("save")}
        </button>
      </div>
    </Sheet>
  );
}

/* ================================================================== */
/* Extra (one-time) income sheet                                      */
/* ================================================================== */

function BoostSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, addBoost } = useApp();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"week" | "spread">("week");
  const [savePct, setSavePct] = useState(30);

  useEffect(() => {
    if (open) {
      setAmount("");
      setMode("week");
      setSavePct(30);
    }
  }, [open]);

  const num = Number(amount || 0);
  const toSave = num * (savePct / 100);
  const toSpend = num - toSave;

  const add = () => {
    if (num <= 0) return;
    addBoost({ amount: num, mode, savePct, date: new Date().toISOString() });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="sheet-handle" />
      <div className="sheet-head">
        <h3>{t("boostTitle")}</h3>
        <button className="icon-btn" onClick={onClose} aria-label={t("cancel")}>
          <X size={20} />
        </button>
      </div>

      <label className="field-label">{t("boostAmount")}</label>
      <div className="amount-input">
        <span className="rial-inline">
          <RialSign />
        </span>
        <input
          inputMode="decimal"
          value={amount}
          placeholder="0.000"
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          autoFocus
        />
      </div>

      <label className="field-label">{t("boostUse")}</label>
      <div className="choice-col">
        <button className={"choice-card" + (mode === "week" ? " on" : "")} onClick={() => setMode("week")}>
          <span className="choice-radio">{mode === "week" && <Check size={13} />}</span>
          <span className="choice-main">
            <span className="choice-title">{t("boostThisWeek")}</span>
            <span className="choice-sub">{t("boostThisWeekSub")}</span>
          </span>
        </button>
        <button className={"choice-card" + (mode === "spread" ? " on" : "")} onClick={() => setMode("spread")}>
          <span className="choice-radio">{mode === "spread" && <Check size={13} />}</span>
          <span className="choice-main">
            <span className="choice-title">{t("boostSpread")}</span>
            <span className="choice-sub">{t("boostSpreadSub")}</span>
          </span>
        </button>
      </div>

      <label className="field-label">
        {t("boostSave")} — {savePct}%
      </label>
      <Slider value={savePct} min={0} max={100} onChange={setSavePct} color="var(--accent)" />

      <div className="split-preview">
        <div className="split-item">
          <span className="split-label">{t("boostToSpend")}</span>
          <span className="split-num" style={{ color: "var(--primary)" }}>
            <Money value={toSpend} />
          </span>
        </div>
        <div className="split-item">
          <span className="split-label">{t("boostToSave")}</span>
          <span className="split-num" style={{ color: "var(--accent)" }}>
            <Money value={toSave} />
          </span>
        </div>
      </div>

      <div className="sheet-actions">
        <button className={"btn btn-primary flex1" + (num > 0 ? "" : " disabled")} disabled={num <= 0} onClick={add}>
          <BadgePlus size={16} /> {t("boostAdd")}
        </button>
      </div>
    </Sheet>
  );
}

/* ================================================================== */
/* Home                                                               */
/* ================================================================== */

function Home({
  onScan,
  onGallery,
  onIncome,
}: {
  onScan: () => void;
  onGallery: () => void;
  onIncome: () => void;
}) {
  const { t, d } = useApp();
  const der = useDerived(d);
  const remaining = der.dailyLimit - der.spentToday;
  const progress = der.dailyLimit > 0 ? der.spentToday / der.dailyLimit : 0;
  const over = remaining < 0;
  const ringColor = over ? "var(--bad)" : "var(--primary)";

  return (
    <div className="home">
      <div className="home-greeting">
        <div className="greeting-hi">{t("greeting")} 👋</div>
        <div className="greeting-date">
          {new Date().toLocaleDateString(d.lang === "ar" ? "ar-OM" : "en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
      </div>

      {/* Daily ring — the single most important number, front and center */}
      <div className="card daily-card">
        <Ring progress={progress} color={ringColor} size={210} stroke={20}>
          <div className="daily-center">
            <span className="daily-spent" style={{ color: ringColor }}>
              <Money value={der.spentToday} />
            </span>
            <span className="daily-of">
              {t("of")} <Money value={der.dailyLimit} />
            </span>
            <span className="daily-tag">{t("dailyLimit")}</span>
          </div>
        </Ring>
        <div className={"daily-remaining" + (over ? " neg" : "")}>
          <Money value={Math.abs(remaining)} /> {over ? t("over_") : t("remaining")}
        </div>
        <div className="daily-pills">
          <span className="pill">
            <PiggyBank size={13} /> {t("savedThisWeek")}: <Money value={der.weeklySaved} />
          </span>
          {der.extraSpendable > 0 && (
            <span className="pill accent">
              <Sparkles size={13} /> {t("boosted")} +<Money value={der.extraSpendable} />
            </span>
          )}
        </div>
      </div>

      {/* Quick actions — big, obvious tap targets */}
      <div className="section-head">
        <h3>{t("quickActions")}</h3>
      </div>
      <div className="quick-actions">
        <button className="qa-card" onClick={onScan}>
          <span className="qa-icon" style={{ background: "var(--primary)" }}>
            <Camera size={20} />
          </span>
          {t("scanReceipt")}
        </button>
        <button className="qa-card" onClick={onGallery}>
          <span className="qa-icon" style={{ background: "var(--accent)" }}>
            <ImageIcon size={20} />
          </span>
          {t("fromGallery")}
        </button>
        <button className="qa-card" onClick={onIncome}>
          <span className="qa-icon" style={{ background: "#2E9E6B" }}>
            <BadgePlus size={20} />
          </span>
          {t("extraIncome")}
        </button>
      </div>

      {/* Categories — Cronometer-style data bars */}
      <div className="section-head">
        <h3>{t("categories")}</h3>
        <span className="muted small">{t("thisWeek")}</span>
      </div>
      <div className="card cat-card">
        {CATEGORY_META.map((c) => (
          <CategoryBar key={c.id} id={c.id} spent={der.spentByCat[c.id]} budget={der.catBudget[c.id]} />
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Edit list                                                          */
/* ================================================================== */

function EditList({ onEdit }: { onEdit: (s: Spending) => void }) {
  const { t, d, catName } = useApp();

  const groups = useMemo(() => {
    const map = new Map<string, Spending[]>();
    [...d.spendings]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date)) // newest first
      .forEach((s) => {
        const key = new Date(s.date).toDateString();
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(s);
      });
    return Array.from(map.entries()); // today first, then descending
  }, [d.spendings]);

  const label = (dateStr: string) => {
    const dd = new Date(dateStr);
    const today = new Date().toDateString();
    const yest = new Date(Date.now() - 864e5).toDateString();
    if (dd.toDateString() === today) return t("todayLabel");
    if (dd.toDateString() === yest) return t("yesterdayLabel");
    return dd.toLocaleDateString(d.lang === "ar" ? "ar-OM" : "en-GB", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });
  };

  if (d.spendings.length === 0) return <div className="empty">{t("noEntries")}</div>;

  return (
    <div className="edit-list">
      {groups.map(([dateStr, items]) => {
        const dayTotal = items.reduce((a, s) => a + s.amount, 0);
        return (
          <div className="day-group" key={dateStr}>
            <div className="day-header">
              <span>{label(dateStr)}</span>
              <span className="muted">
                <Money value={dayTotal} />
              </span>
            </div>
            <div className="card entries">
              {items.map((s) => {
                const meta = CATEGORY_META.find((c) => c.id === s.category)!;
                const Icon = CAT_ICON[s.category];
                return (
                  <button className="entry" key={s.id} onClick={() => onEdit(s)}>
                    <span className="cat-icon" style={{ background: meta.tint, color: meta.color }}>
                      <Icon size={16} />
                    </span>
                    <span className="entry-main">
                      <span className="entry-note">{s.note || catName(s.category)}</span>
                      <span className="entry-meta">
                        {catName(s.category)} ·{" "}
                        {new Date(s.date).toLocaleTimeString(d.lang === "ar" ? "ar-OM" : "en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                    <span className="entry-amount">
                      <Money value={s.amount} />
                    </span>
                    <ChevronRight size={16} className="entry-chev rtl-flip" />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/* Settings                                                           */
/* ================================================================== */

function SettingsScreen() {
  const { t, d, set } = useApp();
  return (
    <div className="settings">
      <div className="set-group">
        <div className="set-label">{t("language")}</div>
        <div className="seg">
          <button className={"seg-btn" + (d.lang === "en" ? " on" : "")} onClick={() => set({ lang: "en" })}>
            <FlagUK size={22} /> English
          </button>
          <button className={"seg-btn" + (d.lang === "ar" ? " on" : "")} onClick={() => set({ lang: "ar" })}>
            <FlagOman size={22} /> العربية
          </button>
        </div>
      </div>

      <div className="set-group">
        <div className="set-label">{t("appearance")}</div>
        <div className="seg">
          <button className={"seg-btn" + (d.theme === "light" ? " on" : "")} onClick={() => set({ theme: "light" })}>
            <Sun size={18} /> {t("light")}
          </button>
          <button className={"seg-btn" + (d.theme === "dark" ? " on" : "")} onClick={() => set({ theme: "dark" })}>
            <Moon size={18} /> {t("dark")}
          </button>
        </div>
      </div>

      <div className="set-group">
        <div className="set-label">{t("data")}</div>
        <button
          className="btn btn-ghost btn-wide danger-ghost"
          onClick={() => {
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {}
            set({ ...defaultData() });
          }}
        >
          <RotateCcw size={16} /> {t("resetOnboarding")}
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Main shell (home / edit / settings / guide + nav + FAB)            */
/* ================================================================== */

function MainShell() {
  const { t, screen, go } = useApp();
  const [entryOpen, setEntryOpen] = useState(false);
  const [boostOpen, setBoostOpen] = useState(false);
  const [editing, setEditing] = useState<Spending | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const openAdd = () => {
    setEditing(null);
    setEntryOpen(true);
  };
  const openEdit = (s: Spending) => {
    setEditing(s);
    setEntryOpen(true);
  };
  // BACKEND: send captured image to your receipt-OCR endpoint, then prefill.
  const onCapture = () => openAdd();

  const title =
    screen === "edit"
      ? t("editTitle")
      : screen === "settings"
      ? t("settingsTitle")
      : screen === "guide"
      ? t("guideTitle")
      : "";

  return (
    <div className="shell">
      {screen !== "home" && <TopBar title={title} onBack={() => go("home")} />}

      <div className="shell-body">
        {screen === "home" && (
          <Home
            onScan={() => cameraRef.current?.click()}
            onGallery={() => galleryRef.current?.click()}
            onIncome={() => setBoostOpen(true)}
          />
        )}
        {screen === "edit" && <EditList onEdit={openEdit} />}
        {screen === "settings" && <SettingsScreen />}
        {screen === "guide" && (
          <div className="guide-standalone">
            <GuideDeck />
          </div>
        )}
      </div>

      {/* Capture inputs */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="visually-hidden" onChange={onCapture} />
      <input ref={galleryRef} type="file" accept="image/*" className="visually-hidden" onChange={onCapture} />

      {/* Bottom navigation with center manual-add FAB */}
      <nav className="bottom-nav">
        <button className={"nav-item" + (screen === "home" ? " active" : "")} onClick={() => go("home")}>
          <HomeIcon size={22} />
          <span>{t("navHome")}</span>
        </button>
        <button className={"nav-item" + (screen === "edit" ? " active" : "")} onClick={() => go("edit")}>
          <Pencil size={22} />
          <span>{t("navSpendings")}</span>
        </button>

        <button className="fab" onClick={openAdd} aria-label={t("addSpending")}>
          <Plus size={26} />
        </button>

        <button className={"nav-item" + (screen === "guide" ? " active" : "")} onClick={() => go("guide")}>
          <BookOpen size={22} />
          <span>{t("navGuide")}</span>
        </button>
        <button className={"nav-item" + (screen === "settings" ? " active" : "")} onClick={() => go("settings")}>
          <SettingsIcon size={22} />
          <span>{t("navSettings")}</span>
        </button>
      </nav>

      <EntrySheet open={entryOpen} onClose={() => setEntryOpen(false)} editing={editing} />
      <BoostSheet open={boostOpen} onClose={() => setBoostOpen(false)} />
    </div>
  );
}

/* ================================================================== */
/* Root                                                               */
/* ================================================================== */

export default function App() {
  const [d, setD] = useState<AppData>(() => loadData());
  const [screen, setScreen] = useState<Screen>(() => (loadData().onboarded ? "home" : "language"));

  useEffect(() => saveData(d), [d]);

  const set = (patch: Partial<AppData>) => setD((prev) => ({ ...prev, ...patch }));
  const go = (s: Screen) => setScreen(s);

  const t = useMemo(() => {
    const dict = d.lang === "ar" ? AR : EN;
    return (k: string) => dict[k] ?? k;
  }, [d.lang]);
  const catName = (id: CategoryId) => CATEGORY_NAMES[d.lang][id];

  const addSpending = (s: Omit<Spending, "id">) =>
    setD((prev) => ({ ...prev, spendings: [{ ...s, id: uid() }, ...prev.spendings] }));
  const updateSpending = (id: string, patch: Partial<Spending>) =>
    setD((prev) => ({ ...prev, spendings: prev.spendings.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const deleteSpending = (id: string) =>
    setD((prev) => ({ ...prev, spendings: prev.spendings.filter((x) => x.id !== id) }));
  const addBoost = (b: Omit<IncomeBoost, "id">) =>
    setD((prev) => ({ ...prev, boosts: [{ ...b, id: uid() }, ...prev.boosts] }));

  // If a reset clears onboarding while on a main screen, return to language.
  useEffect(() => {
    const mains: Screen[] = ["home", "edit", "settings", "guide"];
    if (!d.onboarded && mains.includes(screen)) setScreen("language");
  }, [d.onboarded, screen]);

  const ctx: Ctx = { d, t, catName, set, addSpending, updateSpending, deleteSpending, addBoost, go, screen };
  const isMain = ["home", "edit", "settings", "guide"].includes(screen);

  return (
    <AppCtx.Provider value={ctx}>
      <style>{CSS}</style>
      <div className="tracker-app" data-theme={d.theme} dir={d.lang === "ar" ? "rtl" : "ltr"}>
        <div className="tracker-shell">
          {screen === "language" && <LanguageScreen />}
          {screen === "income" && <AmountScreen which="income" />}
          {screen === "budget" && <AmountScreen which="budget" />}
          {screen === "savings" && <SavingsScreen />}
          {screen === "upload" && <UploadScreen />}
          {screen === "processing" && <ProcessingScreen />}
          {screen === "forecast" && <ForecastScreen />}
          {isMain && <MainShell />}
        </div>
      </div>
    </AppCtx.Provider>
  );
}

/* ================================================================== */
/* Styles                                                             */
/* ================================================================== */

const CSS = `
.tracker-app{
  --bg:#EEF2F6; --bg-elev:#FFFFFF; --text:#141922; --muted:#6B7683; --line:#E4E9F0;
  --primary:#00A389; --primary-weak:#E0F5EF; --accent:#1A73E8;
  --good:#2E9E6B; --warn:#E8A13A; --bad:#E1553F;
  --ring-track:#E6EBF1; --shadow:0 6px 22px rgba(20,30,45,.08);
  font-family:'Google Sans',system-ui,-apple-system,'Segoe UI',Roboto,'Noto Kufi Arabic','Helvetica Neue',Arial,sans-serif;
  color:var(--text); background:var(--bg); min-height:100vh; -webkit-font-smoothing:antialiased;
}
.tracker-app[data-theme='dark']{
  --bg:#0E1116; --bg-elev:#191E25; --text:#E8ECF2; --muted:#93A0AE; --line:#262D36;
  --primary:#22C5A6; --primary-weak:#0F2E29; --accent:#5B9DF9;
  --good:#35C285; --warn:#F0B24A; --bad:#F0705A;
  --ring-track:#262D36; --shadow:0 6px 22px rgba(0,0,0,.45);
}
.tracker-app *{box-sizing:border-box;}
.tracker-shell{max-width:460px;margin:0 auto;min-height:100vh;background:var(--bg);position:relative;overflow:hidden;}
.tracker-app button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;}
.tracker-app :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:8px;}
.muted{color:var(--muted);} .small{font-size:12.5px;}
.tracker-app[dir='rtl'] .rtl-flip{transform:scaleX(-1);}
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;}

/* currency sign */
.money{white-space:nowrap;display:inline;}
.money .mono{font-variant-numeric:tabular-nums;}
.rial{height:.8em;width:auto;display:inline-block;vertical-align:-0.08em;flex:none;}
.rial-inline{display:inline-flex;align-items:center;color:var(--muted);}
.rial-inline .rial{height:20px;}

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:15.5px;
  padding:14px 18px;border-radius:16px;transition:transform .12s ease, box-shadow .12s ease, background .15s;}
.btn:active{transform:scale(.98);}
.btn-primary{background:var(--primary);color:#fff;box-shadow:0 8px 18px -6px color-mix(in srgb,var(--primary) 55%, transparent);}
.btn-ghost{background:var(--bg-elev);color:var(--text);border:1.5px solid var(--line);}
.btn-danger{background:transparent;color:var(--bad);border:1.5px solid color-mix(in srgb,var(--bad) 40%, transparent);}
.danger-ghost{color:var(--bad);border-color:color-mix(in srgb,var(--bad) 35%, transparent);}
.btn-wide{width:100%;}
.btn.disabled,.btn:disabled{opacity:.45;pointer-events:none;box-shadow:none;}
.flex1{flex:1;}
.icon-btn{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:var(--text);}
.icon-btn:hover{background:var(--line);}
.card{background:var(--bg-elev);border:1px solid var(--line);border-radius:22px;box-shadow:var(--shadow);}

/* screen scaffolding */
.screen{padding:26px 22px 30px;min-height:100vh;display:flex;flex-direction:column;}
.screen.scroll{overflow-y:auto;}
.center-screen{justify-content:center;align-items:center;text-align:center;}

/* brand / language */
.brand{display:flex;flex-direction:column;align-items:center;margin-bottom:34px;}
.brand-mark{width:60px;height:60px;border-radius:20px;background:var(--primary);color:#fff;display:grid;place-items:center;box-shadow:0 12px 26px -8px color-mix(in srgb,var(--primary) 60%,transparent);}
.brand-name{font-size:28px;font-weight:800;margin:14px 0 4px;letter-spacing:-.5px;}
.brand-tag{color:var(--muted);font-size:14.5px;max-width:250px;}
.lang-heading{font-size:16px;font-weight:600;margin-bottom:20px;}
.lang-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;width:100%;}
.lang-card{background:var(--bg-elev);border:1.5px solid var(--line);border-radius:22px;padding:22px 12px;display:flex;flex-direction:column;align-items:center;gap:10px;transition:transform .14s, border-color .14s;box-shadow:var(--shadow);}
.lang-card:hover{transform:translateY(-3px);border-color:var(--primary);}
.flag{border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,.15);}
.lang-title{font-weight:700;font-size:16px;}
.lang-sub{font-size:12px;color:var(--muted);}

/* progress dots */
.progress-dots{display:flex;gap:7px;justify-content:center;margin-bottom:22px;}
.dot{width:8px;height:8px;border-radius:99px;background:var(--ring-track);transition:width .2s, background .2s;cursor:pointer;border:none;padding:0;}
.dot.on{width:22px;background:var(--primary);}

/* question head */
.amount-head{margin-bottom:14px;}
.q-title{font-size:22px;font-weight:800;letter-spacing:-.4px;line-height:1.25;}
.q-sub{color:var(--muted);font-size:14px;margin-top:6px;line-height:1.4;}

/* amount + keypad */
.amount-display{display:flex;align-items:center;justify-content:center;gap:8px;margin:26px 0 8px;flex-wrap:wrap;}
.amount-symbol{color:var(--muted);display:inline-flex;align-items:center;}
.amount-symbol .rial{height:26px;}
.amount-value{font-size:46px;font-weight:800;letter-spacing:-1px;font-variant-numeric:tabular-nums;line-height:1;}
.amount-value.placeholder{color:var(--muted);opacity:.5;}
.amount-period{color:var(--muted);font-size:14px;}
.keypad{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0 auto;}
.key{height:60px;border-radius:18px;background:var(--bg-elev);border:1px solid var(--line);font-size:22px;font-weight:600;display:grid;place-items:center;transition:background .12s, transform .1s;box-shadow:var(--shadow);}
.key:active{transform:scale(.96);background:var(--primary-weak);}
.btn-wide{margin-top:18px;}

/* savings */
.savings-value{display:flex;align-items:center;justify-content:center;gap:10px;margin:30px 0 10px;color:var(--primary);}
.savings-value span:nth-child(2){font-size:42px;font-weight:800;letter-spacing:-1px;color:var(--text);}
.slider-block{margin:10px 0 22px;}
.slider{-webkit-appearance:none;appearance:none;width:100%;height:10px;border-radius:99px;outline:none;}
.slider::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:28px;border-radius:50%;background:#fff;border:4px solid var(--primary);box-shadow:0 3px 10px rgba(0,0,0,.2);cursor:pointer;}
.slider::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:#fff;border:4px solid var(--primary);cursor:pointer;}
.slider-ends{display:flex;justify-content:space-between;color:var(--muted);font-size:12px;margin-top:8px;}
.stat-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px;}
.stat-card{background:var(--bg-elev);border:1px solid var(--line);border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:6px;box-shadow:var(--shadow);}
.stat-label{font-size:12.5px;color:var(--muted);}
.stat-num{font-size:20px;font-weight:800;}

/* upload */
.dropzone{width:100%;border:2px dashed var(--line);border-radius:22px;padding:34px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;background:var(--bg-elev);transition:border-color .15s;margin:22px 0 auto;}
.dropzone:hover{border-color:var(--primary);}
.dz-icon{width:56px;height:56px;border-radius:18px;background:var(--primary-weak);color:var(--primary);display:grid;place-items:center;}
.dz-main{font-weight:700;font-size:16px;} .dz-sub{color:var(--muted);font-size:13px;}
.dz-file{display:flex;align-items:center;gap:6px;font-weight:600;}
.dz-ready{display:flex;align-items:center;gap:5px;color:var(--good);font-size:13px;font-weight:600;}

/* processing status */
.status-card{background:var(--bg-elev);border:1px solid var(--line);border-radius:20px;padding:16px 18px;box-shadow:var(--shadow);margin:18px 0 16px;}
.status-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.live{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.4px;}
.status-progress{height:6px;border-radius:99px;background:var(--ring-track);overflow:hidden;margin-bottom:8px;}
.status-progress-fill{height:100%;background:var(--primary);border-radius:99px;transition:width .5s ease;}
.status-steps{display:flex;flex-direction:column;}
.status-row{display:flex;align-items:center;gap:12px;padding:7px 0;color:var(--muted);font-size:14px;transition:color .2s;}
.status-row .status-dot{width:22px;height:22px;border-radius:50%;border:2px solid var(--ring-track);display:grid;place-items:center;flex:none;}
.status-row.done{color:var(--text);} .status-row.done .status-dot{background:var(--good);border-color:var(--good);color:#fff;}
.status-row.active{color:var(--text);font-weight:600;} .status-row.active .status-dot{border-color:var(--primary);}
.spin{width:10px;height:10px;border-radius:50%;border:2px solid var(--primary);border-top-color:transparent;animation:sp .7s linear infinite;}
@keyframes sp{to{transform:rotate(360deg);}}

/* guide deck */
.guide-deck{background:var(--bg-elev);border:1px solid var(--line);border-radius:22px;padding:20px;text-align:center;box-shadow:var(--shadow);}
.guide-standalone{padding-top:6px;}
.guide-badge{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:var(--muted);background:var(--bg);border:1px solid var(--line);padding:5px 12px 5px 5px;border-radius:99px;margin-bottom:12px;}
.guide-num{width:22px;height:22px;border-radius:50%;background:var(--primary);color:#fff;display:grid;place-items:center;font-size:12px;}
.illo{width:100%;max-width:230px;height:auto;margin:0 auto 6px;display:block;}
.guide-title{font-size:18px;font-weight:800;margin-top:8px;}
.guide-desc{color:var(--muted);font-size:14px;line-height:1.55;margin-top:8px;max-width:340px;margin-left:auto;margin-right:auto;}
.guide-deck .progress-dots{margin:16px 0 16px;}
.guide-nav{display:flex;gap:12px;}

/* forecast */
.rating-card{display:flex;align-items:center;gap:18px;background:var(--bg-elev);border:2px solid var(--line);border-radius:22px;padding:18px;margin-bottom:16px;box-shadow:var(--shadow);}
.rating-score{display:flex;flex-direction:column;line-height:1;}
.rating-score b{font-size:26px;font-weight:800;} .rating-score span{font-size:11px;color:var(--muted);}
.rating-label{display:flex;align-items:center;gap:6px;font-weight:800;font-size:15px;}
.rating-msg{color:var(--muted);font-size:13.5px;line-height:1.45;margin-top:6px;}
.forecast-list{padding:14px 16px;margin-bottom:18px;}

/* category rows */
.cat-row{display:flex;align-items:center;gap:12px;padding:11px 0;}
.cat-icon{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;flex:none;}
.cat-main{flex:1;min-width:0;}
.cat-top{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:7px;}
.cat-name{font-weight:600;font-size:14.5px;}
.cat-amount{font-size:13px;white-space:nowrap;}
.cat-of{color:var(--muted);}
.bar-track{height:8px;background:var(--ring-track);border-radius:99px;overflow:hidden;}
.bar-fill{height:100%;border-radius:99px;transition:width .6s cubic-bezier(.2,.8,.2,1);}

/* ring */
.ring-wrap{position:relative;display:grid;place-items:center;}
.ring-center{position:absolute;inset:0;display:grid;place-items:center;}

/* shell */
.shell{min-height:100vh;display:flex;flex-direction:column;padding-bottom:86px;}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:14px;position:sticky;top:0;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(8px);z-index:5;}
.topbar-title{font-size:18px;font-weight:800;}
.shell-body{flex:1;padding:6px 18px 20px;overflow-y:auto;}

/* home */
.home-greeting{margin:6px 2px 16px;}
.greeting-hi{font-size:20px;font-weight:800;}
.greeting-date{color:var(--muted);font-size:13px;margin-top:2px;}
.daily-card{padding:26px 20px 20px;display:flex;flex-direction:column;align-items:center;margin-bottom:22px;}
.daily-center{display:flex;flex-direction:column;align-items:center;line-height:1.1;}
.daily-spent{font-size:29px;font-weight:800;letter-spacing:-.5px;}
.daily-of{color:var(--muted);font-size:13px;margin-top:4px;}
.daily-tag{margin-top:8px;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--primary);background:var(--primary-weak);padding:4px 10px;border-radius:99px;}
.daily-remaining{margin-top:16px;font-weight:700;font-size:15px;color:var(--good);display:flex;gap:5px;align-items:center;}
.daily-remaining.neg{color:var(--bad);}
.daily-pills{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:14px;}
.pill{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--muted);background:var(--bg);border:1px solid var(--line);padding:6px 11px;border-radius:99px;}
.pill.accent{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 35%,transparent);}
.section-head{display:flex;justify-content:space-between;align-items:center;margin:2px 4px 10px;}
.section-head h3{font-size:16px;font-weight:800;}

/* quick actions */
.quick-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:24px;}
.qa-card{background:var(--bg-elev);border:1px solid var(--line);border-radius:18px;padding:16px 8px;display:flex;flex-direction:column;align-items:center;gap:9px;font-size:12.5px;font-weight:600;box-shadow:var(--shadow);transition:transform .12s;text-align:center;line-height:1.2;}
.qa-card:active{transform:scale(.96);}
.qa-icon{width:44px;height:44px;border-radius:14px;color:#fff;display:grid;place-items:center;}
.cat-card{padding:8px 18px;}

/* edit list */
.edit-list{display:flex;flex-direction:column;gap:20px;}
.day-header{display:flex;justify-content:space-between;font-weight:700;font-size:14px;margin:0 4px 8px;}
.entries{padding:4px 14px;}
.entry{width:100%;display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:1px solid var(--line);text-align:start;}
.entry:last-child{border-bottom:none;}
.entry-main{flex:1;display:flex;flex-direction:column;min-width:0;}
.entry-note{font-weight:600;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.entry-meta{color:var(--muted);font-size:12px;margin-top:2px;}
.entry-amount{font-weight:700;font-size:14px;}
.entry-chev{color:var(--muted);flex:none;}
.empty{text-align:center;color:var(--muted);padding:60px 30px;font-size:14.5px;line-height:1.5;}

/* settings */
.settings{display:flex;flex-direction:column;gap:24px;padding-top:8px;}
.set-group{display:flex;flex-direction:column;gap:10px;}
.set-label{font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin:0 2px;}
.seg{display:flex;gap:10px;}
.seg-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:16px;background:var(--bg-elev);border:1.5px solid var(--line);font-weight:600;transition:border-color .14s, background .14s;}
.seg-btn.on{border-color:var(--primary);background:var(--primary-weak);color:var(--primary);}

/* bottom nav + fab */
.bottom-nav{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:100%;max-width:460px;height:74px;background:var(--bg-elev);border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-around;z-index:20;padding-bottom:env(safe-area-inset-bottom);}
.nav-item{display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--muted);font-size:10.5px;font-weight:600;flex:1;padding-top:6px;}
.nav-item.active{color:var(--primary);}
.fab{width:60px;height:60px;border-radius:20px;background:var(--primary);color:#fff;display:grid;place-items:center;margin-top:-24px;flex:none;box-shadow:0 12px 24px -6px color-mix(in srgb,var(--primary) 60%,transparent);transition:transform .16s;}
.fab:active{transform:scale(.94);}

/* sheet */
.sheet-backdrop{position:fixed;inset:0;z-index:40;background:color-mix(in srgb,#000 42%,transparent);display:flex;align-items:flex-end;justify-content:center;}
.sheet{width:100%;max-width:460px;background:var(--bg-elev);border-radius:26px 26px 0 0;padding:10px 20px 26px;animation:up .22s cubic-bezier(.2,.8,.2,1);max-height:92vh;overflow-y:auto;}
@keyframes up{from{transform:translateY(40px);opacity:.6;}to{transform:translateY(0);opacity:1;}}
.sheet-handle{width:40px;height:5px;border-radius:99px;background:var(--line);margin:6px auto 12px;}
.sheet-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;}
.sheet-head h3{font-size:18px;font-weight:800;}
.field-label{display:block;font-size:12.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin:16px 2px 8px;}
.amount-input{display:flex;align-items:center;gap:8px;background:var(--bg);border:1.5px solid var(--line);border-radius:16px;padding:14px 16px;}
.amount-input input{flex:1;border:none;background:none;font-size:24px;font-weight:800;color:var(--text);outline:none;font-variant-numeric:tabular-nums;width:100%;}
.text-input{width:100%;background:var(--bg);border:1.5px solid var(--line);border-radius:16px;padding:14px 16px;font-size:15px;color:var(--text);outline:none;}
.text-input:focus,.amount-input:focus-within{border-color:var(--primary);}
.chip-row{display:flex;flex-wrap:wrap;gap:8px;}
.chip{display:flex;align-items:center;gap:6px;padding:9px 13px;border-radius:99px;background:var(--bg);border:1.5px solid var(--line);font-size:13.5px;font-weight:600;color:var(--muted);transition:.14s;}
.chip.on{color:var(--text);}
.sheet-actions{display:flex;gap:12px;margin-top:22px;}

/* choice cards (income boost) */
.choice-col{display:flex;flex-direction:column;gap:10px;}
.choice-card{display:flex;align-items:center;gap:12px;padding:14px;border-radius:16px;background:var(--bg);border:1.5px solid var(--line);text-align:start;transition:border-color .14s, background .14s;}
.choice-card.on{border-color:var(--primary);background:var(--primary-weak);}
.choice-radio{width:22px;height:22px;border-radius:50%;border:2px solid var(--muted);display:grid;place-items:center;flex:none;color:#fff;}
.choice-card.on .choice-radio{background:var(--primary);border-color:var(--primary);}
.choice-main{display:flex;flex-direction:column;}
.choice-title{font-weight:700;font-size:14.5px;}
.choice-sub{color:var(--muted);font-size:12.5px;margin-top:2px;}
.split-preview{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;}
.split-item{background:var(--bg);border:1px solid var(--line);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:5px;}
.split-label{font-size:12px;color:var(--muted);}
.split-num{font-size:17px;font-weight:800;}

@media (prefers-reduced-motion: reduce){
  .tracker-app *{animation-duration:.001ms !important;transition-duration:.001ms !important;}
}
`;
