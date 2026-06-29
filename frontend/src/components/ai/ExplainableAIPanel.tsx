"use client";

import React from "react";

interface FeatureContribution {
  feature: string;
  value: number;
  contribution: number; // -1 to 1, negative = reduces risk, positive = increases risk
  description: string;
}

interface ExplainableAIProps {
  riskScore: number;
  riskLabel: string;
  features: FeatureContribution[];
  modelVersion?: string;
}

/**
 * Visualizes which behavioral features contributed to the risk score.
 * Helps clinicians understand the AI's reasoning.
 */
const ExplainableAIPanel: React.FC<ExplainableAIProps> = ({
  riskScore,
  riskLabel,
  features,
  modelVersion,
}) => {
  const getContributionColor = (contribution: number) => {
    if (contribution > 0.3) return "bg-error/20 border-error/40 text-error";
    if (contribution > 0) return "bg-amber-500/10 border-amber-500/30 text-amber-600";
    if (contribution > -0.3) return "bg-success/10 border-success/30 text-success";
    return "bg-primary/10 border-primary/30 text-primary";
  };

  const getContributionIcon = (contribution: number) => {
    if (contribution > 0.3) return "trending_up";
    if (contribution > 0) return "trending_up";
    if (contribution > -0.3) return "trending_down";
    return "trending_down";
  };

  const getBarWidth = (value: number) => {
    return `${Math.min(100, Math.max(0, value))}%`;
  };

  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">
              psychology
            </span>
            AI Analysis Explanation
          </h3>
          <p className="text-xs text-on-surface-muted mt-1">
            Understanding how the model reached this assessment
          </p>
        </div>
        {modelVersion && (
          <span className="text-xs text-on-surface-muted bg-surface-container-high px-2 py-1 rounded">
            {modelVersion}
          </span>
        )}
      </div>

      {/* Overall Risk Score */}
      <div className="mb-5 p-4 rounded-xl bg-surface-container">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-on-surface-variant">Overall Risk Score</span>
          <span className={`text-sm font-bold ${
            riskLabel === "high" ? "text-error" :
            riskLabel === "moderate" ? "text-amber-600" :
            "text-success"
          }`}>
            {riskScore.toFixed(0)}% - {riskLabel.charAt(0).toUpperCase() + riskLabel.slice(1)}
          </span>
        </div>
        <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              riskScore >= 65 ? "bg-error" :
              riskScore >= 35 ? "bg-amber-500" :
              "bg-success"
            }`}
            style={{ width: `${riskScore}%` }}
            role="progressbar"
            aria-valuenow={riskScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Risk score"
          />
        </div>
      </div>

      {/* Feature Contributions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-on-surface-variant">Feature Contributions</h4>
        {features.map((feature, index) => (
          <div key={index} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">
                  {getContributionIcon(feature.contribution)}
                </span>
                <span className="text-sm text-on-surface">{feature.feature}</span>
              </div>
              <span className="text-xs text-on-surface-muted">
                {feature.value.toFixed(0)}%
              </span>
            </div>
            
            {/* Feature value bar */}
            <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-1.5">
              <div
                className={`h-full rounded-full transition-all ${
                  feature.contribution > 0 ? "bg-error/60" : "bg-success/60"
                }`}
                style={{ width: getBarWidth(feature.value) }}
              />
            </div>
            
            {/* Contribution indicator */}
            <div className={`text-xs p-2 rounded-lg border ${getContributionColor(feature.contribution)}`}>
              {feature.description}
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-outline-variant/10">
        <p className="text-xs text-on-surface-muted italic">
          <span className="material-symbols-outlined text-xs align-middle mr-1" aria-hidden="true">info</span>
          This AI analysis is a screening tool only. Results should be reviewed by a qualified healthcare professional.
        </p>
      </div>
    </div>
  );
};

export default ExplainableAIPanel;
