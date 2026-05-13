import React from "react";
import { Plus, Minus } from "lucide-react";
import { PriceTierCardProps, QuantityStepperProps } from "./types";
import { useTranslation } from "react-i18next";

export function PriceTierCard({ tier, index, active, onClick }: PriceTierCardProps) {
  const { t } = useTranslation("common");
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "14px 10px", borderRadius: 9, cursor: "pointer",
        border: active ? "2.5px solid #0077b6" : "1.5px solid #0077b6",
        background: active ? "#0077b6" : "#0077b6",
        transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
        transform: active ? "translateY(-3px)" : "none",
        boxShadow: active ? "0 8px 24px rgba(245,158,11,0.18)" : "0 2px 8px rgba(0,0,0,0.04)",
        textAlign: "center", outline: "none",
      }}
    >
      
      <div style={{ fontSize: 22, fontWeight: 900, color: active ? "#ffffff" : "#1e293b", lineHeight: 1.1 }}>
        ฿{tier.price.toLocaleString()}
      </div>
      {active && (
        <div style={{ marginTop: 5, fontSize: 10, fontWeight: 700, color: "#ffffff", letterSpacing: "0.08em" }}>
          ✓ {t("product.selected")}
        </div>
      )}
    </button>
  );
}

export function QuantityStepper({ value, min = 1, onChange }: QuantityStepperProps) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      background: "#e0f7ff", borderRadius: 9,
      overflow: "hidden", border: "1.5px solid #0077b6",
    }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{
          width: 44, height: 44, display: "flex", alignItems: "center",
          justifyContent: "center", border: "none", background: "transparent",
          cursor: "pointer", color: "#6b7280", transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#e0f7ff"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <Minus size={15} />
      </button>
      <span style={{ minWidth: 48, textAlign: "center", fontWeight: 800, fontSize: 16, color: "#111827" }}>
        {value}
      </span>
      <button
        onClick={() => onChange(value + 1)}
        style={{
          width: 44, height: 44, display: "flex", alignItems: "center",
          justifyContent: "center", border: "none", background: "transparent",
          cursor: "pointer", color: "#111827", transition: "background 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#0077b6"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}