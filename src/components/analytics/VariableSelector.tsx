"use client";

interface VariableSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function VariableSelector({ value, onChange }: VariableSelectorProps) {
  const options = [
    { key: "capsule.sbsPercent", label: "SBS % (Capsule)" },
    { key: "capsule.oilPercent", label: "Oil % (Capsule)" },
    { key: "capsule.sulfurPercent", label: "Sulfur % (Capsule)" },
    { key: "capsule.fillerPercent", label: "Filler/Aerosil % (Capsule)" },
    { key: "pma.capsuleDosagePercent", label: "Capsule Dosage % (PMA)" },
    { key: "pma.mixingTemperature", label: "Mixing Temperature (°C)" },
    { key: "bitumenOrigin.penetration", label: "Bitumen Penetration" },
    { key: "bitumenOrigin.softeningPoint", label: "Bitumen Softening Point" },
  ];

  return (
    <div>
      <label className="text-sm font-medium">Variable (X-Axis)</label>
      <select
        className="mt-1 w-full rounded-md border p-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
