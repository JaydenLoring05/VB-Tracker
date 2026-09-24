/**
 * First focusable element on every page: lets keyboard and screen reader users
 * jump past repeated navigation. Each page's <main> carries id="main-content".
 */
export function SkipLink() {
  return (
    <a className="skip-link" href="#main-content">
      Skip to main content
    </a>
  );
}
