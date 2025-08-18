import { AbstractControl, ValidationErrors } from '@angular/forms';

export function max7DaysValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (!control.value) return null;

  const selected = new Date(control.value);
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 6);

  return selected <= today || selected > maxDate ? { max7Days: true } : null;
}
