import { useCallback, useMemo, useState } from "react";
import BorderedIcon from "@/components/ui/BorderedIcon";
import FormField from "./FormField";
import { submitForm } from "@/lib/forms";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field, value) {
  if (field.required) {
    if (field.fieldType === "checkbox") {
      if (!Array.isArray(value) || value.length === 0)
        return "Selecteer minimaal één optie";
    } else if (!value || (typeof value === "string" && !value.trim())) {
      return field.fieldType === "select"
        ? "Maak een keuze"
        : "Dit veld is verplicht";
    }
  }

  if (field.fieldType === "email" && value && !EMAIL_REGEX.test(value)) {
    return "Controleer je emailadres";
  }

  return null;
}

function validateAllFields(fields, values) {
  const errors = {};
  let hasErrors = false;
  for (const field of fields) {
    const error = validateField(field, values[field.name]);
    if (error) {
      errors[field.name] = error;
      hasErrors = true;
    }
  }
  return { errors, hasErrors };
}

function AsteriskSvg() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1142.2 1080">
      <path
        d="M123.3 898.3 379.8 1080l192.1-312.1 193.2 311 255.5-182.2-238.9-280.2 360.5-88.1-101.8-304.9L704 364.4 727.7 0 412.8.6 437.6 365 101.3 225.7 0 530.6l361.1 87z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function FormSection({ data }) {
  const {
    title,
    subtitle,
    ctaText = "Verzenden",
    successTitle = "Bedankt!",
    successMessage = "",
    formName = "contact",
    formFields = [],
  } = data || {};

  const fields = formFields;

  const [values, setValues] = useState(() => {
    const initial = {};
    for (const field of fields) {
      initial[field.name] = field.fieldType === "checkbox" ? [] : "";
    }
    return initial;
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [touched, setTouched] = useState({});
  const [pending, setPending] = useState(false);

  const hasErrors = useMemo(
    () => Object.values(errors).some(Boolean),
    [errors],
  );

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
    setSubmitError(false);
  }, []);

  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const field = fields.find((f) => f.name === name);
      if (field) {
        const error = validateField(field, values[name]);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [fields, values],
  );

  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      if (pending) return;

      const { errors: newErrors, hasErrors: invalid } = validateAllFields(
        fields,
        values,
      );
      setErrors(newErrors);

      const allTouched = {};
      for (const field of fields) allTouched[field.name] = true;
      setTouched(allTouched);

      if (invalid) return;

      const payload = {};
      for (const field of fields) {
        const val = values[field.name];
        payload[field.name] = Array.isArray(val) ? val.join(", ") : val || "";
      }

      setPending(true);
      const result = await submitForm(formName, payload);
      setPending(false);

      if (result.ok) {
        setSubmitted(true);
        setSubmitError(false);
      } else {
        setSubmitError(true);
      }
    },
    [fields, values, formName, pending],
  );

  const cleanTitle = useMemo(
    () => title?.replace(/<\/?p>/g, "") || "",
    [title],
  );

  if (submitted) {
    return (
      <section className="form-section inner-width">
        <div className="form-section__success">
          <div className="form-section__success-icon" aria-hidden>
            <svg viewBox="0 0 48 48" fill="none">
              <path
                d="M10 24L20 34L38 14"
                stroke="currentColor"
                strokeWidth="2.5"
              />
            </svg>
          </div>
          <h3>{successTitle}</h3>
          {successMessage && (
            <p
              dangerouslySetInnerHTML={{
                __html: successMessage.replace(/<\/?p>/g, ""),
              }}
            />
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="form-section inner-width">
      {cleanTitle && (
        <div className="form-section__title-wrap">
          <div className="form-section__asterisk" aria-hidden>
            <AsteriskSvg />
          </div>
          <h3 dangerouslySetInnerHTML={{ __html: cleanTitle }} />
          {subtitle && <p className="form-section__subtitle">{subtitle}</p>}
        </div>
      )}

      <form className="form-section__grid" onSubmit={handleSubmit} noValidate>
        {fields.map((field) => (
          <FormField
            key={field.name}
            field={field}
            value={values[field.name]}
            error={touched[field.name] ? errors[field.name] : null}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        ))}
      </form>

      <div className="form-section__footer">
        <div className="form-section__error-area">
          {(submitError || hasErrors) && (
            <div className="form-section__general-error">
              <span className="form-section__error-badge">!</span>
              Sorry, er ging iets mis. Controleer je informatie.
            </div>
          )}
        </div>
        <BorderedIcon
          icon="arrow"
          text={pending ? "Bezig..." : ctaText}
          onClick={handleSubmit}
          disabled={hasErrors || pending}
          animateOnScroll={false}
          disableSplitText
        />
      </div>
    </section>
  );
}
