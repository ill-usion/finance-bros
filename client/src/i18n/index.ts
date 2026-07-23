import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const en = {
  appName: "MEEZAN",
  tagline: "Spend in balance.",
  choose_language: "Choose your language",
  english: "English",
  arabic: "العربية",
  continue: "Continue",
  back: "Back",
  done: "Done",
  next: "Next",
  skip: "Skip",

  // onboarding
  income_q: "What's your monthly income?",
  income_hint: "We use this to shape your budget.",
  budget_q: "What's your weekly budget?",
  budget_hint: "What you plan to spend each week.",
  savings_q: "How much do you want to save?",
  savings_hint: "Set a slice of your budget aside.",
  daily_spend: "Daily spend",
  saved_weekly: "Saved weekly",
  statement_q: "Add your bank statement",
  statement_hint: "PDF or image. We read it to understand your habits.",
  choose_file: "Choose file",
  analyzing: "Reading your statement…",
  status_parsing: "Reading transactions",
  status_forecasting: "Forecasting next week",
  status_reviewing: "Reviewing your habits",
  status_done: "All set",
  analysis_ready: "Analysis ready",

  // guide
  guide_title: "How MEEZAN works",
  guide_1_t: "Your daily limit",
  guide_1_b: "The scale shows what you can spend today against what you've already spent.",
  guide_2_t: "Log in a tap",
  guide_2_b: "Snap a receipt, pick one from your gallery, or add a spend by hand.",
  guide_3_t: "Watch categories",
  guide_3_b: "Food, transport, leisure and more — see where each rial goes.",
  guide_4_t: "Extra income",
  guide_4_b: "Got a one-off boost? Fold it into this week or save part of it.",
  step: "Step",
  of: "of",

  // forecast / rating
  forecast_title: "Your week ahead",
  forecast_hint: "Predicted spend by category, based on your statement.",
  your_score: "Your score",
  no_forecast: "Not enough history yet to forecast — log a few weeks and it'll appear.",

  // home
  today: "Today",
  spent_of: "spent of",
  daily_limit: "daily limit",
  over_by: "Over by",
  left_today: "left today",
  categories: "Categories",
  of_budget: "of budget",
  add_receipt: "Scan receipt",
  add_gallery: "From gallery",
  add_manual: "Add spend",
  extra_income: "Extra income",
  edit_spendings: "Edit spending",
  home: "Home",
  settings: "Settings",
  user_guide: "User guide",
  adjust_budget: "Adjust budget",
  advisor: "Advisor",

  // financial advisor / chat
  advisor_title: "Financial Advisor",
  this_week: "This week",
  chat_placeholder: "Ask about your budget…",
  chat_empty: "Ask me anything about your spending, budget, or savings goal.",
  chat_send: "Send",
  chat_error: "Something went wrong. Please try again.",

  // manual add
  amount: "Amount",
  category: "Category",
  what_for: "What was it for?",
  save: "Save",
  cat_Food: "Food",
  cat_Transportation: "Transport",
  cat_Leisure: "Leisure",
  cat_Subscription: "Subscription",
  cat_Groceries: "Groceries",
  cat_Other: "Other",

  // extra income
  extra_income_title: "Add extra income",
  how_apply: "How should we use it?",
  apply_week: "Boost this week's budget",
  apply_month: "Spread over 4 weeks",
  apply_save: "Save all of it",
  save_portion: "How much to save?",

  // adjust budget
  monthly_income: "Monthly income",
  weekly_budget: "Weekly budget",
  savings_pct: "Savings %",
  commit_when: "Apply the change…",
  commit_week: "This week only",
  commit_4weeks: "Next 4 weeks",
  commit_month: "From next month",
  apply: "Apply",

  // settings
  language: "Language",
  theme: "Appearance",
  light: "Light",
  dark: "Dark",
  reset: "Reset all data",
  reset_confirm: "This clears everything. Continue?",

  // edit list
  no_spendings: "Nothing logged yet. Add your first spend from the home screen.",
  delete: "Delete",
  edit: "Edit",
};

export const ar: typeof en = {
  appName: "ميزان",
  tagline: "أنفق بتوازن.",
  choose_language: "اختر لغتك",
  english: "English",
  arabic: "العربية",
  continue: "متابعة",
  back: "رجوع",
  done: "تم",
  next: "التالي",
  skip: "تخطٍّ",

  income_q: "كم دخلك الشهري؟",
  income_hint: "نستخدمه لتشكيل ميزانيتك.",
  budget_q: "كم ميزانيتك الأسبوعية؟",
  budget_hint: "ما تنوي إنفاقه كل أسبوع.",
  savings_q: "كم تريد أن تدّخر؟",
  savings_hint: "خصّص جزءًا من ميزانيتك للادخار.",
  daily_spend: "الإنفاق اليومي",
  saved_weekly: "المدّخر أسبوعيًا",
  statement_q: "أضف كشف حسابك البنكي",
  statement_hint: "ملف PDF أو صورة. نقرؤه لفهم عاداتك.",
  choose_file: "اختر ملفًا",
  analyzing: "نقرأ كشف حسابك…",
  status_parsing: "قراءة المعاملات",
  status_forecasting: "توقّع الأسبوع القادم",
  status_reviewing: "مراجعة عاداتك",
  status_done: "جاهز",
  analysis_ready: "التحليل جاهز",

  guide_title: "كيف يعمل ميزان",
  guide_1_t: "حدّك اليومي",
  guide_1_b: "يُظهر الميزان ما يمكنك إنفاقه اليوم مقابل ما أنفقته بالفعل.",
  guide_2_t: "سجّل بلمسة",
  guide_2_b: "صوّر إيصالًا، أو اختر صورة من معرضك، أو أضف مصروفًا يدويًا.",
  guide_3_t: "راقب الفئات",
  guide_3_b: "طعام، مواصلات، ترفيه وغيرها — شاهد أين يذهب كل ريال.",
  guide_4_t: "دخل إضافي",
  guide_4_b: "حصلت على مبلغ إضافي؟ أضِفه لهذا الأسبوع أو ادّخر جزءًا منه.",
  step: "خطوة",
  of: "من",

  forecast_title: "أسبوعك القادم",
  forecast_hint: "الإنفاق المتوقّع حسب الفئة، بناءً على كشفك.",
  your_score: "تقييمك",
  no_forecast: "لا يوجد سجل كافٍ للتوقّع بعد — سجّل بضعة أسابيع وسيظهر.",

  today: "اليوم",
  spent_of: "أُنفق من",
  daily_limit: "الحد اليومي",
  over_by: "تجاوزت بـ",
  left_today: "متبقٍّ اليوم",
  categories: "الفئات",
  of_budget: "من الميزانية",
  add_receipt: "مسح إيصال",
  add_gallery: "من المعرض",
  add_manual: "أضف مصروفًا",
  extra_income: "دخل إضافي",
  edit_spendings: "تعديل المصروفات",
  home: "الرئيسية",
  settings: "الإعدادات",
  user_guide: "دليل الاستخدام",
  adjust_budget: "تعديل الميزانية",
  advisor: "المستشار",

  advisor_title: "المستشار المالي",
  this_week: "هذا الأسبوع",
  chat_placeholder: "اسأل عن ميزانيتك…",
  chat_empty: "اسألني أي شيء عن إنفاقك، ميزانيتك، أو هدف ادخارك.",
  chat_send: "إرسال",
  chat_error: "حدث خطأ ما. حاول مرة أخرى.",

  amount: "المبلغ",
  category: "الفئة",
  what_for: "على ماذا؟",
  save: "حفظ",
  cat_Food: "طعام",
  cat_Transportation: "مواصلات",
  cat_Leisure: "ترفيه",
  cat_Subscription: "اشتراك",
  cat_Groceries: "بقالة",
  cat_Other: "أخرى",

  extra_income_title: "إضافة دخل إضافي",
  how_apply: "كيف نستخدمه؟",
  apply_week: "زيادة ميزانية هذا الأسبوع",
  apply_month: "توزيعه على 4 أسابيع",
  apply_save: "ادّخاره بالكامل",
  save_portion: "كم تريد أن تدّخر؟",

  monthly_income: "الدخل الشهري",
  weekly_budget: "الميزانية الأسبوعية",
  savings_pct: "نسبة الادخار %",
  commit_when: "طبّق التغيير…",
  commit_week: "هذا الأسبوع فقط",
  commit_4weeks: "الأسابيع الأربعة القادمة",
  commit_month: "من الشهر القادم",
  apply: "تطبيق",

  language: "اللغة",
  theme: "المظهر",
  light: "فاتح",
  dark: "داكن",
  reset: "مسح كل البيانات",
  reset_confirm: "سيؤدي هذا إلى مسح كل شيء. هل تريد المتابعة؟",

  no_spendings: "لا شيء مسجّل بعد. أضف أول مصروف من الشاشة الرئيسية.",
  delete: "حذف",
  edit: "تعديل",
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function applyDirection(lang: "en" | "ar") {
  const dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

export default i18n;
