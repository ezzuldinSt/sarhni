"use client";

import { useState, useEffect, useMemo } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0: weak, 1: fair, 2: good, 3: strong, 4: very strong
  label: string;
  color: string;
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

interface PasswordInputProps {
  name?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Simple password strength calculator
function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;

  let score: 0 | 1 | 2 | 3 | 4 = 0;
  let label = "";
  let color = "";

  if (password.length === 0) {
    score = 0;
    label = "";
    color = "";
  } else if (metRequirements <= 1) {
    score = 0;
    label = "Weak";
    color = "bg-danger";
  } else if (metRequirements === 2) {
    score = 1;
    label = "Fair";
    color = "bg-warning";
  } else if (metRequirements === 3) {
    score = 2;
    label = "Good";
    color = "bg-leather-pop";
  } else if (metRequirements === 4) {
    score = 3;
    label = "Strong";
    color = "bg-success";
  } else {
    score = 4;
    label = "Very Strong";
    color = "bg-success";
  }

  return { score, label, color, requirements };
}

export function PasswordInput({
  name = "password",
  required = false,
  placeholder = "••••••",
  className = "",
  value,
  onChange,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState("");
  const passwordValue = value ?? internalValue;

  const strength = useMemo(
    () => calculatePasswordStrength(passwordValue),
    [passwordValue]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          name={name}
          type={showPassword ? "text" : "password"}
          required={required}
          value={passwordValue}
          onChange={handleChange}
          className={`w-full bg-leather-900 rounded-xl p-3 pr-12 text-leather-accent placeholder:text-leather-600 focus:ring-2 focus:ring-leather-pop focus:ring-offset-2 focus:ring-offset-leather-900 outline-none transition-all duration-200 ${className}`}
          placeholder={placeholder}
          aria-describedby="password-strength password-requirements"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-leather-500 hover:text-leather-accent transition-colors -mr-2 -mt-2 min-h-touch min-w-touch flex items-center justify-center"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {/* Strength indicator */}
      {passwordValue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-leather-500">Password strength:</span>
            <span
              className={`text-xs font-bold ${strength.label === "Weak" ? "text-danger" : strength.label === "Fair" ? "text-warning" : strength.label === "Good" ? "text-leather-pop" : "text-success"}`}
              aria-live="polite"
            >
              {strength.label}
            </span>
          </div>

          {/* Strength bar */}
          <div className="flex gap-1 h-1.5">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`flex-1 rounded-full transition-colors duration-300 ${
                  level <= strength.score
                    ? strength.color
                    : "bg-leather-700"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      )}

      {/* Requirements checklist - always show but dimmed when not typing */}
      <div
        id="password-requirements"
        className={`grid grid-cols-2 gap-x-4 gap-y-1 text-xs pt-2 transition-opacity duration-200 ${
          passwordValue.length === 0 ? "opacity-40" : "opacity-100"
        }`}
        aria-label="Password requirements"
      >
        <RequirementItem
          met={strength.requirements.length}
          text="At least 8 characters"
        />
        <RequirementItem met={strength.requirements.lowercase} text="Lowercase letter" />
        <RequirementItem met={strength.requirements.uppercase} text="Uppercase letter" />
        <RequirementItem met={strength.requirements.number} text="Number" />
        <RequirementItem met={strength.requirements.special} text="Special character" />
      </div>
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 ${met ? "text-success" : "text-leather-600"}`}>
      {met ? <Check size={12} /> : <X size={12} />}
      <span>{text}</span>
    </div>
  );
}
