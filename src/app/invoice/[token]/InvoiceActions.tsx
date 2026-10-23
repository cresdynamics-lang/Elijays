"use client";

export function InvoiceActions({
  token,
  paid,
}: {
  token: string;
  paid: boolean;
}) {
  return (
    <div className="no-print mt-8 flex flex-wrap gap-3">
      <button type="button" onClick={() => window.print()} className="btn-gold">
        Print {paid ? "receipt" : "invoice"}
      </button>
      <a href={`/api/invoice/${token}`} className="btn-ghost" target="_blank" rel="noreferrer">
        Open PDF
      </a>
      {!paid ? (
        <a href={`/pay/${token}`} className="btn-ghost">
          Pay now
        </a>
      ) : null}
    </div>
  );
}
