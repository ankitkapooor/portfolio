import Link from "next/link";
import { SAMPLE_COMPANY_NAME, SAMPLE_DISCLAIMER } from "@/domain/analysis/sample";

export default function Home() {
  return (
    <>
      <header className="masthead">
        <div className="masthead-inner">
          <Link href="/" className="wordmark">
            Priced <span>In</span>
          </Link>
          <div className="masthead-meta">
            <span>Educational strategy analysis</span>
            <span>Not investment advice</span>
            <span>No live market data</span>
          </div>
        </div>
      </header>

      <main className="page stack landing">
        <section>
          <p className="eyebrow">Reverse discounted cash flow</p>
          <h1>What has to be true?</h1>
          <p className="lede">
            A valuation is a claim about the future. This workbench turns that claim into arithmetic: import a
            company&rsquo;s statements, review every normalized figure against its source, then explore which
            combinations of growth and operating margin would be consistent with a value you choose.
          </p>
          <div className="row">
            <Link href="/workspace/expectations" className="button button-primary">
              Explore the sample company
            </Link>
            <Link href="/workspace/import" className="button">
              Analyze a company
            </Link>
          </div>
          <p className="note">
            A share price is optional. If you would rather not use one, supply an enterprise-value target directly and
            the per-share output is simply omitted.
          </p>
        </section>

        <section className="grid-2">
          <article className="card">
            <p className="eyebrow">The sample</p>
            <h2>{SAMPLE_COMPANY_NAME}</h2>
            <p className="badge badge-assumed">Fictional company</p>
            <p className="note">{SAMPLE_DISCLAIMER}</p>
            <p className="note">
              Four synthetic fiscal years of income statement, balance sheet and cash-flow data, already loaded so the
              whole model works without an upload.
            </p>
          </article>

          <article className="card">
            <p className="eyebrow">Your own data</p>
            <h2>Bring a public company</h2>
            <p className="note">
              Download the long-form CSV template, fill it from filings you already trust, and import it. Every value
              keeps its original amount, unit, period and source locator so you can check the model against the page it
              came from.
            </p>
            <p className="note">
              No account, no upload to a server: analyses stay in this browser until you delete them.
            </p>
          </article>
        </section>

        <section className="card">
          <h2>What this tool does, and what it refuses to do</h2>
          <div className="grid-2">
            <div>
              <h3>It does</h3>
              <ul className="tight">
                <li>Keep reported facts, normalization, assumptions and derived outputs visibly separate.</li>
                <li>Show a five-year unlevered free-cash-flow model with every formula written out.</li>
                <li>Map the growth and margin combinations consistent with a target, and say plainly that many are.</li>
                <li>Translate a forecast into the customers or units it would require, when you supply the drivers.</li>
                <li>Test one AI initiative with capacity, realized savings, costs and timing kept apart.</li>
                <li>Try to break your own thesis and report honestly when it cannot.</li>
              </ul>
            </div>
            <div>
              <h3>It does not</h3>
              <ul className="tight">
                <li>Quote live prices or claim to know the market&rsquo;s single forecast.</li>
                <li>Fill in a missing statement line, or read a blank cell as a zero.</li>
                <li>Use a language model anywhere in the arithmetic.</li>
                <li>Recommend a trade, or execute one.</li>
                <li>Claim professional finance review has taken place. It has not.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="card">
          <p className="eyebrow">Release scope</p>
          <h2>This is P0A</h2>
          <p className="note">
            Synthetic sample company, CSV template and import, source-mapped review, the five-year FCFF model,
            expectations map, operating bridge, one AI initiative overlay, Break My Thesis, scenario comparison and
            Markdown, CSV and JSON export. All of it works without any API credential.
          </p>
          <p className="note">
            Server-side SEC retrieval and native-text PDF extraction are P0B and are <strong>not</strong> implemented
            here. Earnings-call claim extraction and provider-connected market quotes are P1 and are not implemented
            either. Where those paths would appear, the app says so rather than pretending.
          </p>
        </section>
      </main>
    </>
  );
}
