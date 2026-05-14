import React, { useMemo } from "react";

import { buildAuthenticAiLabViewModel } from "./aiLabViewModel";
import "./authentic-ai-lab.css";

interface AuthenticAiLabScreenProps {
  readonly onBack?: () => void;
}

const AuthenticAiLabScreen: React.FC<AuthenticAiLabScreenProps> = ({ onBack }) => {
  const viewModel = useMemo(() => buildAuthenticAiLabViewModel(), []);
  const backToSetup = () => {
    if (onBack) {
      onBack();
      return;
    }
    window.location.assign("/");
  };

  return (
    <main className="gwent-authentic gwent-authentic--ai-lab" data-testid="authentic-ai-lab">
      <div className="authentic-ai-lab">
        <header className="authentic-ai-lab__topbar">
          <button type="button" className="authentic-button authentic-button--ghost" onClick={backToSetup}>
            ← back
          </button>
          <div className="authentic-ai-lab__title">
            <span>{viewModel.eyebrow}</span>
            <h1>{viewModel.title}</h1>
          </div>
          <a className="authentic-ai-lab__setup-link" href="/">
            setup →
          </a>
        </header>

        <section className="authentic-ai-lab__grid" aria-label="AI Lab status">
          <section className="authentic-ai-lab__panel authentic-ai-lab__panel--wide">
            <div className="authentic-ai-lab__panel-heading">
              <span>benchmark suite</span>
              <strong data-testid="authentic-ai-lab-suite-id">{viewModel.benchmarkSuite.id}</strong>
            </div>
            <p>{viewModel.benchmarkSuite.summary}</p>
            <dl className="authentic-ai-lab__stats">
              {viewModel.benchmarkSuite.stats.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
              <div>
                <dt>status</dt>
                <dd>{viewModel.benchmarkSuite.status}</dd>
              </div>
            </dl>
            <div className="authentic-ai-lab__disabled-row">
              <button
                type="button"
                className="authentic-button authentic-button--secondary"
                data-testid="authentic-ai-lab-suite-run-benchmark"
                disabled
                aria-describedby="authentic-ai-lab-suite-run-benchmark-reason"
              >
                run benchmark
              </button>
              <small id="authentic-ai-lab-suite-run-benchmark-reason">
                Browser execution is deferred; this route does not run simulations.
              </small>
            </div>
          </section>

          <section className="authentic-ai-lab__panel">
            <div className="authentic-ai-lab__panel-heading">
              <span>policy registry</span>
              <strong>baselines</strong>
            </div>
            <div className="authentic-ai-lab__list" data-testid="authentic-ai-lab-policies">
              {viewModel.policies.map((policy) => (
                <article key={policy.id} className="authentic-ai-lab__row">
                  <div>
                    <strong>{policy.label}</strong>
                    <span>{policy.role}</span>
                  </div>
                  <em>{policy.status}</em>
                  <p>{policy.description}</p>
                  {policy.latestPhase ? (
                    <dl className="authentic-ai-lab__policy-meta">
                      <div>
                        <dt>latest phase</dt>
                        <dd data-testid={`authentic-ai-lab-policy-${policy.id}-latest-phase`}>{policy.latestPhase}</dd>
                      </div>
                      {policy.latestSpecPath ? (
                        <div>
                          <dt>spec</dt>
                          <dd>
                            <a href={`/${policy.latestSpecPath}`}>{policy.latestSpecPath}</a>
                          </dd>
                        </div>
                      ) : null}
                      {policy.latestReportPath ? (
                        <div>
                          <dt>report</dt>
                          <dd>
                            <a href={`/${policy.latestReportPath}`}>{policy.latestReportPath}</a>
                          </dd>
                        </div>
                      ) : null}
                      {policy.latestPolicyDocPath ? (
                        <div>
                          <dt>policy doc</dt>
                          <dd>
                            <a href={`/${policy.latestPolicyDocPath}`}>{policy.latestPolicyDocPath}</a>
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                  {policy.latestBenchmarkSummaries.length > 0 ? (
                    <dl className="authentic-ai-lab__policy-benchmarks">
                      {policy.latestBenchmarkSummaries.map((summary) => (
                        <div key={summary.suiteId}>
                          <dt>{summary.label}</dt>
                          <dd>{summary.result}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  {policy.capabilities.length > 0 ? (
                    <ul className="authentic-ai-lab__policy-capabilities">
                      {policy.capabilities.map((capability) => (
                        <li key={capability}>{capability}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
            <p className="authentic-ai-lab__note">Product difficulty tiers are not implemented.</p>
          </section>

          <section className="authentic-ai-lab__panel">
            <div className="authentic-ai-lab__panel-heading">
              <span>evaluation ladder</span>
              <strong>Batch B order</strong>
            </div>
            <ol className="authentic-ai-lab__ladder" data-testid="authentic-ai-lab-ladder">
              {viewModel.evaluationLayers.map((layer) => (
                <li key={layer.label} data-status={layer.status}>
                  <div>
                    <strong>{layer.label}</strong>
                    <em>{layer.status}</em>
                  </div>
                  <p>{layer.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="authentic-ai-lab__panel">
            <div className="authentic-ai-lab__panel-heading">
              <span>research decisions</span>
              <strong>references</strong>
            </div>
            <div className="authentic-ai-lab__references" data-testid="authentic-ai-lab-references">
              {viewModel.researchReferences.map((reference) => (
                <a key={reference.path} href={`/${reference.path}`} className="authentic-ai-lab__reference">
                  <strong>{reference.label}</strong>
                  <code>{reference.path}</code>
                  <span>{reference.description}</span>
                </a>
              ))}
            </div>
          </section>

          <section className="authentic-ai-lab__panel">
            <div className="authentic-ai-lab__panel-heading">
              <span>future actions</span>
              <strong>disabled</strong>
            </div>
            <div className="authentic-ai-lab__actions" data-testid="authentic-ai-lab-future-actions">
              {viewModel.futureActions.map((action) => {
                const reasonId = `authentic-ai-lab-action-${action.id}-reason`;
                return (
                  <div key={action.id} className="authentic-ai-lab__action">
                    <button
                      type="button"
                      className="authentic-button authentic-button--secondary"
                      data-testid={`authentic-ai-lab-action-${action.id}`}
                      disabled={action.disabled}
                      aria-describedby={reasonId}
                    >
                      {action.label}
                    </button>
                    <small id={reasonId}>{action.reason}</small>
                  </div>
                );
              })}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
};

export default AuthenticAiLabScreen;
