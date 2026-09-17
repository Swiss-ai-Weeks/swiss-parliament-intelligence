import { ArrowRight, CaretRight, CheckCircle, House, MagnifyingGlass, WarningCircle } from "@phosphor-icons/react";

export function NavItem({ icon: Icon, children, active, onClick, quiet }) {
  return <button type="button" aria-current={active ? "page" : undefined} className={`nav-item ${active ? "active" : ""} ${quiet ? "quiet" : ""}`} onClick={onClick}>
    <Icon size={20} weight={active ? "fill" : "regular"} /><span>{children}</span>
  </button>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return <header className="page-header"><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{actions && <div className="page-actions">{actions}</div>}</header>;
}

export function StatusPill({ children, tone = "teal" }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

export function LoadingState({ label = "Loading parliamentary intelligence…" }) {
  return <section className="async-state loading-state" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden="true" /><div><strong>{label}</strong><p>Preparing source-linked results.</p></div></section>;
}

export function ErrorState({ title = "We couldn't load this view", message = "The parliamentary service is temporarily unavailable.", onRetry }) {
  return <section className="async-state error-state" role="alert"><WarningCircle size={26} /><div><strong>{title}</strong><p>{message}</p>{onRetry && <button className="secondary-action" onClick={onRetry}><ArrowRight /> Try again</button>}</div></section>;
}

export function EmptyState({ title = "Nothing here yet", message = "When matching parliamentary information is available, it will appear here.", actionLabel, onAction }) {
  return <section className="async-state empty-state"><MagnifyingGlass size={26} /><div><strong>{title}</strong><p>{message}</p>{onAction && <button className="primary-action" onClick={onAction}>{actionLabel || "Explore Parliament"} <ArrowRight /></button>}</div></section>;
}

export function NotFoundState({ onHome }) {
  return <section className="async-state empty-state"><CaretRight size={26} /><div><strong>Page not found</strong><p>This workspace destination does not exist.</p><button className="primary-action" onClick={onHome}><House /> Return to dashboard</button></div></section>;
}
