import type { ChangeEvent } from "react";
import "./Input.css";

type InputProps = {
  label?: string;
  placeholder?: string;
  type?: "text" | "email" | "password";
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};

function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  disabled = false,
}: InputProps) {
  return (
    <div className="input-container">
      {label && <label className="input-label">{label}</label>}

      <input
        className="input"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

export default Input;