/**
 * PERFORMANCE: Inline SVG icons to replace lucide-react
 *
 * This reduces bundle size by ~60KB and improves FCP.
 * Only the most commonly used icons are included here.
 *
 * SECURITY: All SVG paths are hardcoded strings from lucide icons.
 * No user-generated content is used, so dangerouslySetInnerHTML is safe here.
 */

export type IconName =
  | "lock"
  | "heart"
  | "shield"
  | "share2"
  | "messageCircle"
  | "pin"
  | "pin-filled"
  | "trash2"
  | "edit3"
  | "send"
  | "inbox"
  | "mail"
  | "sparkles"
  | "arrowRight"
  | "check"
  | "x"
  | "loader2"
  | "search"
  | "user"
  | "flag"
  | "menu"
  | "x-circle"
  | "trending-up"
  | "message-square"
  | "log-out"
  | "log-in"
  | "plus"
  | "minus"
  | "chevron-down"
  | "chevron-up"
  | "chevron-left"
  | "chevron-right"
  | "crown"
  | "home"
  | "settings"
  | "layout-dashboard"
  | "copy"
  | "link";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  fill?: "none" | "currentColor";
}

// SVG path data for each icon (from lucide icon library)
const iconPaths: Record<IconName, string> = {
  lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  share2: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
  messageCircle: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  pin: '<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>',
  "pin-filled": '<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" fill="currentColor"/>',
  trash2: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  edit3: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  sparkles: '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z"/><path d="M19 5l.5 1.5L21 7l-1.5.5L19 9l-.5-1.5L17 7l1.5-.5L19 5z"/>',
  arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  loader2: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  "x-circle": '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  "trending-up": '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  "message-square": '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  "log-in": '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  "chevron-down": '<polyline points="6 9 12 15 18 9"/>',
  "chevron-up": '<polyline points="18 15 12 9 6 15"/>',
  "chevron-left": '<polyline points="15 18 9 12 15 6"/>',
  "chevron-right": '<polyline points="9 18 15 12 9 6"/>',
  crown: '<path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  "layout-dashboard": '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
};

/**
 * Optimized icon component using inline SVGs
 * Falls back to null for unknown icons (prevents crashes)
 */
export function Icon({ name, size = 16, className = "", fill = "none" }: IconProps) {
  const pathData = iconPaths[name];
  if (!pathData) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: pathData }}
    />
  );
}

/**
 * Shorthand components for commonly used icons
 * These provide a familiar API matching lucide-react
 */
export const Lock = (props: Omit<IconProps, "name">) => <Icon name="lock" {...props} />;
export const Heart = (props: Omit<IconProps, "name">) => <Icon name="heart" {...props} />;
export const Shield = (props: Omit<IconProps, "name">) => <Icon name="shield" {...props} />;
export const Share2 = (props: Omit<IconProps, "name">) => <Icon name="share2" {...props} />;
export const MessageCircle = (props: Omit<IconProps, "name">) => <Icon name="messageCircle" {...props} />;
export const Pin = (props: Omit<IconProps, "name">) => <Icon name="pin" {...props} />;
export const Trash2 = (props: Omit<IconProps, "name">) => <Icon name="trash2" {...props} />;
export const Edit3 = (props: Omit<IconProps, "name">) => <Icon name="edit3" {...props} />;
export const Send = (props: Omit<IconProps, "name">) => <Icon name="send" {...props} />;
export const Inbox = (props: Omit<IconProps, "name">) => <Icon name="inbox" {...props} />;
export const Mail = (props: Omit<IconProps, "name">) => <Icon name="mail" {...props} />;
export const Sparkles = (props: Omit<IconProps, "name">) => <Icon name="sparkles" {...props} />;
export const ArrowRight = (props: Omit<IconProps, "name">) => <Icon name="arrowRight" {...props} />;
export const Check = (props: Omit<IconProps, "name">) => <Icon name="check" {...props} />;
export const X = (props: Omit<IconProps, "name">) => <Icon name="x" {...props} />;
export const Loader2 = (props: Omit<IconProps, "name">) => <Icon name="loader2" {...props} className={`animate-spin-fast will-spin ${props.className || ""}`} />;
export const Search = (props: Omit<IconProps, "name">) => <Icon name="search" {...props} />;
export const User = (props: Omit<IconProps, "name">) => <Icon name="user" {...props} />;
export const Flag = (props: Omit<IconProps, "name">) => <Icon name="flag" {...props} />;
export const Menu = (props: Omit<IconProps, "name">) => <Icon name="menu" {...props} />;
export const XCircle = (props: Omit<IconProps, "name">) => <Icon name="x-circle" {...props} />;
export const TrendingUp = (props: Omit<IconProps, "name">) => <Icon name="trending-up" {...props} />;
export const MessageSquare = (props: Omit<IconProps, "name">) => <Icon name="message-square" {...props} />;
export const LogOut = (props: Omit<IconProps, "name">) => <Icon name="log-out" {...props} />;
export const LogIn = (props: Omit<IconProps, "name">) => <Icon name="log-in" {...props} />;
export const Plus = (props: Omit<IconProps, "name">) => <Icon name="plus" {...props} />;
export const Minus = (props: Omit<IconProps, "name">) => <Icon name="minus" {...props} />;
export const ChevronDown = (props: Omit<IconProps, "name">) => <Icon name="chevron-down" {...props} />;
export const ChevronUp = (props: Omit<IconProps, "name">) => <Icon name="chevron-up" {...props} />;
export const ChevronLeft = (props: Omit<IconProps, "name">) => <Icon name="chevron-left" {...props} />;
export const ChevronRight = (props: Omit<IconProps, "name">) => <Icon name="chevron-right" {...props} />;
export const Crown = (props: Omit<IconProps, "name">) => <Icon name="crown" {...props} />;
export const Home = (props: Omit<IconProps, "name">) => <Icon name="home" {...props} />;
export const Settings = (props: Omit<IconProps, "name">) => <Icon name="settings" {...props} />;
export const LayoutDashboard = (props: Omit<IconProps, "name">) => <Icon name="layout-dashboard" {...props} />;
export const Copy = (props: Omit<IconProps, "name">) => <Icon name="copy" {...props} />;
export const LinkIcon = (props: Omit<IconProps, "name">) => <Icon name="link" {...props} />;
