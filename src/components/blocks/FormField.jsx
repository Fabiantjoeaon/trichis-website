import { useCallback } from "react";
import { t } from "@/lib/i18n";

const ERROR_COLOR = "#E74C3C";

function TextInput({ name, value, onChange, onBlur, hasError, placeholder }) {
  return (
    <input
      className={`form-field__input${hasError ? " is-error" : ""}${value ? " has-value" : ""}`}
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
    />
  );
}

function EmailInput({ name, value, onChange, onBlur, hasError, placeholder }) {
  return (
    <input
      className={`form-field__input${hasError ? " is-error" : ""}${value ? " has-value" : ""}`}
      type="email"
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
    />
  );
}

function LongTextInput({ name, value, onChange, onBlur, hasError, placeholder }) {
  return (
    <textarea
      className={`form-field__input form-field__textarea${hasError ? " is-error" : ""}${value ? " has-value" : ""}`}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      rows={5}
      placeholder={placeholder}
    />
  );
}

function SelectInput({
  name,
  value,
  onChange,
  onBlur,
  hasError,
  options = "",
  placeholder,
}) {
  const parsedOptions =
    typeof options === "string"
      ? options
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean)
      : Array.isArray(options)
        ? options
        : [];

  return (
    <div className={`form-field__select-wrap${hasError ? " is-error" : ""}`}>
      <select
        className={`form-field__input form-field__select${hasError ? " is-error" : ""}${value ? " has-value" : ""}${!value ? " is-empty" : ""}`}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
      >
        <option value="" disabled hidden>
          {placeholder || t("form.selectPlaceholder")}
        </option>
        {parsedOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <span className="form-field__chevron" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
    </div>
  );
}

function CheckboxGroup({
  name,
  label,
  value = [],
  onChange,
  hasError,
  required,
  options = "",
}) {
  const parsedOptions =
    typeof options === "string"
      ? options
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean)
      : Array.isArray(options)
        ? options
        : [];

  const selected = Array.isArray(value) ? value : [];

  const handleToggle = useCallback(
    (opt) => {
      const next = selected.includes(opt)
        ? selected.filter((v) => v !== opt)
        : [...selected, opt];
      onChange({ target: { name, value: next } });
    },
    [name, onChange, selected],
  );

  return (
    <div>
      <label
        className={`form-field__label${hasError ? " is-error" : ""}`}
        style={hasError ? { color: ERROR_COLOR } : undefined}
      >
        {label}
        {required && "*"}
      </label>
      <div className="form-field__checkbox-list">
        {parsedOptions.map((opt) => {
          const checked = selected.includes(opt);
          return (
            <button
              type="button"
              key={opt}
              className="form-field__checkbox"
              onClick={(e) => {
                e.preventDefault();
                handleToggle(opt);
              }}
            >
              <span
                className={`form-field__checkbox-box${checked ? " is-checked" : ""}${hasError ? " is-error" : ""}`}
              >
                {checked && (
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 12L10 17L19 7"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </span>
              <span className="form-field__checkbox-label">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FormField({ field, value, error, onChange, onBlur }) {
  const { label, name, fieldType, required, options, placeholder, width } =
    field;

  if (fieldType === "checkbox") {
    return (
      <div
        className={`form-field form-field--${width === "half" ? "half" : "full"}`}
      >
        <CheckboxGroup
          name={name}
          label={label}
          value={value}
          onChange={onChange}
          hasError={!!error}
          required={required}
          options={options}
        />
        {error && <span className="form-field__error">{error}</span>}
      </div>
    );
  }

  const inputProps = {
    name,
    value: value || "",
    onChange,
    onBlur,
    hasError: !!error,
    options,
    placeholder: placeholder || "",
  };

  return (
    <div
      className={`form-field form-field--${width === "half" ? "half" : "full"}`}
    >
      <label
        className={`form-field__label${error ? " is-error" : ""}`}
        style={error ? { color: ERROR_COLOR } : undefined}
      >
        {label}
        {required && "*"}
      </label>
      {fieldType === "text" && <TextInput {...inputProps} />}
      {fieldType === "email" && <EmailInput {...inputProps} />}
      {fieldType === "longtext" && <LongTextInput {...inputProps} />}
      {fieldType === "select" && <SelectInput {...inputProps} />}
      {error && <span className="form-field__error">{error}</span>}
    </div>
  );
}
