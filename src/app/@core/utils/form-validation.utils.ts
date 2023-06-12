import { ValidatorFn, Validators } from '@angular/forms';

export function getUrlValidator(): ValidatorFn {
  return Validators.pattern('(https?://)([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?');
}
