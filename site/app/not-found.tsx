import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-content">
      <section className="panel empty-state">
        <h1>This path doesn’t go anywhere yet.</h1>
        <p>Let’s return to your Swedish learning space.</p>
        <Link className="primary" href="/">Back to Stigen</Link>
      </section>
    </main>
  );
}
