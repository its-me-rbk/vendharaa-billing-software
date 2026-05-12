import { twMerge } from "tailwind-merge";

function clsx(...args) {
  return args.flat().filter(Boolean).join(' ');
}

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Legacy theme class names — kept for backward compatibility with copied settings panels
export const inputClass = "pro-input";
export const selectClass = "pro-input";
export const dropdownClass = "pro-input justify-between flex items-center";
export const primaryBtnClass = "btn-primary";
export const subtleBtnClass = "btn-secondary";
export const ghostBtnClass = "btn-ghost";
export const dangerBtnClass = "btn-danger";
export const cardClass = "card-pro";
export const customerCardClass = "card-pro";
export const headerTitleClass = "text-sm font-bold text-slate-800 uppercase tracking-wider";
export const pageTitleClass = "page-title";
export const headerSubtitleClass = "text-xs text-slate-500";

export function brandSizeClass(name) {
  if (!name) return "text-2xl";
  const len = name.trim().length;
  if (len > 30) return "text-sm";
  if (len > 24) return "text-base";
  if (len > 18) return "text-lg";
  return "text-2xl";
}

export function licenseSizeClass(license) {
  if (!license) return "text-sm";
  const len = license.trim().length;
  if (len > 30) return "text-xs";
  if (len > 20) return "text-[12px]";
  if (len > 12) return "text-sm";
  return "text-sm";
}

export function brandBoostClass(license) {
  if (!license) return "";
  const len = license.trim().length;
  if (len > 30) return "text-3xl";
  if (len > 20) return "text-2xl";
  return "";
}

export default {
  inputClass, selectClass, primaryBtnClass, subtleBtnClass, cardClass,
  customerCardClass, dropdownClass, headerTitleClass, headerSubtitleClass,
  ghostBtnClass, dangerBtnClass,
};
