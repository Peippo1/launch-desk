import { addNote, archiveCompany, createCompany, importCompanies, updateCompany } from "@/app/actions";
import { readable, targetTiers, watchStatuses } from "@/lib/catalog";
import { getCompanies, getCompanyFacets } from "@/lib/repositories";

export const dynamic = "force-dynamic";

type CompanySearchParams = {
  imported?: string;
  errors?: string;
  tier?: string;
  status?: string;
  sector?: string;
  region?: string;
};

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<CompanySearchParams> }) {
  const params = await searchParams;
  const tier = targetTiers.find((value) => value === params.tier);
  const status = watchStatuses.find((value) => value === params.status);
  const [companies, facets] = await Promise.all([getCompanies({ targetTier: tier, watchStatus: status, sector: params.sector, region: params.region }), getCompanyFacets()]);
  const { sectors, regions } = facets;

  return <>
    <header className="topbar">
      <div>
        <p className="eyebrow">Target 50</p>
        <h1>Companies</h1>
        <p className="subtle">Maintain the companies worth watching.</p>
      </div>
    </header>

    {params.imported ? <p className="notice">Imported {params.imported} companies. {params.errors ? `${params.errors} rows need review.` : ""}</p> : null}

    <div className="two-column">
      <section className="panel">
        <div className="section-heading"><h2>Add company</h2></div>
        <CompanyForm action={createCompany} submitLabel="Save company" />
      </section>

      <section className="panel">
        <div className="section-heading"><h2>Import Target 50</h2></div>
        <p className="subtle">CSV headers: name, websiteUrl, careersUrl, stage, sectors, hiringRegions, targetTier, watchStatus, rationale. Use | inside multi-value cells.</p>
        <form action={importCompanies}>
          <textarea name="csv" className="csv-input" required placeholder="name,websiteUrl,targetTier&#10;Example AI,https://example.com,A" />
          <button className="secondary-action" type="submit">Import CSV</button>
        </form>
      </section>
    </div>

    <section className="panel">
      <form className="filter-bar">
        <select name="tier" defaultValue={params.tier ?? ""} aria-label="Filter by target tier">
          <option value="">All tiers</option>
          {targetTiers.map((targetTier) => <option value={targetTier} key={targetTier}>{readable(targetTier)}</option>)}
        </select>
        <select name="status" defaultValue={params.status ?? ""} aria-label="Filter by watch status">
          <option value="">All statuses</option>
          {watchStatuses.map((watchStatus) => <option value={watchStatus} key={watchStatus}>{readable(watchStatus)}</option>)}
        </select>
        <select name="sector" defaultValue={params.sector ?? ""} aria-label="Filter by sector">
          <option value="">All sectors</option>
          {sectors.map((sector) => <option value={sector} key={sector}>{sector}</option>)}
        </select>
        <select name="region" defaultValue={params.region ?? ""} aria-label="Filter by region">
          <option value="">All regions</option>
          {regions.map((region) => <option value={region} key={region}>{region}</option>)}
        </select>
        <button className="secondary-action" type="submit">Filter</button>
      </form>
    </section>

    <section className="panel table-panel">
      <div className="section-heading"><h2>Watchlist</h2><span className="quiet">{companies.length} companies</span></div>
      <div className="company-list">
        {companies.map((company) => (
          <article className="company-item" key={company.id}>
            <CompanyForm action={updateCompany} company={company} submitLabel="Update" />
            <div className="company-actions">
              <form action={archiveCompany}>
                <input type="hidden" name="id" value={company.id} />
                <button className="icon-button" type="submit">Archive</button>
              </form>
              <form action={addNote} className="note-form">
                <input type="hidden" name="scope" value="COMPANY" />
                <input type="hidden" name="entityId" value={company.id} />
                <textarea name="body" placeholder="Add company note" required />
                <button className="secondary-action" type="submit">Add note</button>
              </form>
              {company.notes[0] ? <p className="subtle">Latest note: {company.notes[0].body}</p> : null}
            </div>
          </article>
        ))}
        {!companies.length ? <p className="empty-state">No companies match these filters.</p> : null}
      </div>
    </section>
  </>;
}

function CompanyForm({ action, company, submitLabel }: { action: (form: FormData) => Promise<void>; company?: { id: string; name: string; websiteUrl: string | null; careersUrl: string | null; stage: string | null; targetTier: string; watchStatus: string; sectors: string[]; hiringRegions: string[]; rationale: string | null }; submitLabel: string }) {
  return (
    <form action={action} className="form-grid">
      {company ? <input type="hidden" name="id" value={company.id} /> : null}
      <label>Name<input name="name" required defaultValue={company?.name} /></label>
      <label>Website<input name="websiteUrl" type="url" placeholder="https://" defaultValue={company?.websiteUrl ?? ""} /></label>
      <label>Careers URL<input name="careersUrl" type="url" placeholder="https://" defaultValue={company?.careersUrl ?? ""} /></label>
      <label>Stage<input name="stage" placeholder="Series B, public, consultancy" defaultValue={company?.stage ?? ""} /></label>
      <label>Target tier<select name="targetTier" defaultValue={company?.targetTier ?? "B"}>{targetTiers.map((tier) => <option value={tier} key={tier}>{readable(tier)}</option>)}</select></label>
      <label>Watch status<select name="watchStatus" defaultValue={company?.watchStatus ?? "ACTIVE"}>{watchStatuses.map((status) => <option value={status} key={status}>{readable(status)}</option>)}</select></label>
      <label>Sectors<textarea name="sectors" placeholder="AI observability, enterprise AI" defaultValue={company?.sectors.join(", ") ?? ""} /></label>
      <label>Hiring regions<textarea name="hiringRegions" placeholder="UK, EMEA" defaultValue={company?.hiringRegions.join(", ") ?? ""} /></label>
      <label className="full">Why target<textarea name="rationale" defaultValue={company?.rationale ?? ""} /></label>
      <button className="primary-action" type="submit">{submitLabel}</button>
    </form>
  );
}
