'use client';
export default function ErrorBoundary({reset}:{error:Error,reset:()=>void}){return <main className="page-content"><section className="panel empty-state"><h1>Let’s find the path again.</h1><p>Something interrupted this page. Your saved learning progress is still in your account.</p><button className="primary" onClick={reset}>Try again</button></section></main>}
