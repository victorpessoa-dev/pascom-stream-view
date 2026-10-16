import Link from "next/link";
import styles from "./offline.module.css";

export default function OfflinePage() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="offline-title">
        <div className={styles.icon} aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M3 3l18 18M8.7 8.7A7 7 0 0 1 19 14m-3.2 3.2A5 5 0 0 0 17 14m-4.2 4.2A2 2 0 0 0 13 14M3.6 10.6A11 11 0 0 1 6 9" />
          </svg>
        </div>
        <p className={styles.eyebrow}>Conexão</p>
        <h1 id="offline-title">Você está sem internet.</h1>
        <p className={styles.description}>
          Verifique sua rede e tente novamente. Páginas ou dados ainda não
          salvos podem não carregar.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href="/offline">
            Tentar novamente
          </Link>
          <Link className={styles.secondaryAction} href="/">
            Página inicial
          </Link>
        </div>
      </section>
    </main>
  );
}
