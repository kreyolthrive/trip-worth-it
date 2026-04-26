import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3l1.6 4.1L18 8.7l-4.4 1.6L12 14.4l-1.6-4.1L6 8.7l4.4-1.6L12 3z" />
      <path d="M5 16l.8 2.1L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.9L5 16z" />
      <path d="M19 14l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
    </BaseIcon>
  );
}

export function GaugeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.8 16a8 8 0 1114.4 0" />
      <path d="M12 12l3.7-2.7" />
      <circle cx="12" cy="12" r="1" />
      <path d="M8 18h8" />
    </BaseIcon>
  );
}

export function DollarIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3v18" />
      <path d="M16 7.5a3.5 3.5 0 00-3.5-2h-1A3.5 3.5 0 008 9c0 1.9 1.6 3 3.5 3h1A3.5 3.5 0 0116 15.5 3.5 3.5 0 0112.5 19h-1A3.5 3.5 0 018 15.5" />
    </BaseIcon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </BaseIcon>
  );
}

export function RouteIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 6h4a4 4 0 014 4v4" />
      <path d="M16 18h-4a4 4 0 01-4-4v-1" />
    </BaseIcon>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
    </BaseIcon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 15.4a3.4 3.4 0 100-6.8 3.4 3.4 0 000 6.8z" />
      <path d="M19.4 13.3l1.2-1.3-1.2-1.3-1.8.2a6.4 6.4 0 00-.8-1.8l1.1-1.4-1.8-1-1.1 1.4a6.4 6.4 0 00-1.9-.3L12 4l-1.1 1.8a6.4 6.4 0 00-1.9.3L8 4.7l-1.8 1L7.3 7a6.4 6.4 0 00-.8 1.8l-1.8-.2L3.5 10l1.2 1.3 1.8-.2c.2.6.4 1.2.8 1.8l-1.1 1.4 1.8 1 1.1-1.4c.6.2 1.2.3 1.9.3l1.1 1.8 1.1-1.8c.7 0 1.3-.1 1.9-.3l1.1 1.4 1.8-1-1.1-1.4c.3-.6.6-1.2.8-1.8l1.8.2z" />
    </BaseIcon>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
      <path d="M4.5 7l7.5 6L19.5 7" />
    </BaseIcon>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 12a8 8 0 108-8" />
      <path d="M4 4v4h4" />
      <path d="M12 8v4l2.5 1.5" />
    </BaseIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20 6L9 17l-5-5" />
    </BaseIcon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3l9 16H3l9-16z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </BaseIcon>
  );
}
