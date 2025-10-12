const chinaId18Pattern = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
const chinaId15Pattern = /^[1-9]\d{14}$/;
const phonePattern = /^1\d{10}$/;
const passportPattern = /^[a-zA-Z0-9]{5,20}$/;
const hmtPattern = /^[a-zA-Z0-9]{5,20}$/;

type FieldErrorMap<T extends Record<string, unknown>> = {
  [K in keyof T]: string | null | undefined;
};

export function mergeFieldErrors<T extends Record<string, unknown>>(errors: FieldErrorMap<T>) {
  return Object.keys(errors).reduce<Record<string, string>>((acc, key) => {
    const value = errors[key];
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

export function validatePhone(value: string) {
  const normalized = value.trim();
  if (!normalized) return '请输入手机号';
  return phonePattern.test(normalized) ? null : '手机号格式不正确';
}

export function validateName(value: string) {
  const normalized = value.trim();
  if (!normalized) return '请输入姓名';
  const len = normalized.length;
  if (len < 2 || len > 20) return '姓名需为 2-20 个字符';
  return null;
}

export function validateIdNumber(value: string) {
  const normalized = value.trim();
  if (!normalized) return '请输入证件号';
  if (normalized.length <= 6) return '证件号格式不正确';
  if (chinaId18Pattern.test(normalized)) return null;
  if (chinaId15Pattern.test(normalized)) return null;
  if (passportPattern.test(normalized)) return null;
  if (hmtPattern.test(normalized)) return null;
  return '证件号格式不正确';
}

export function validateAmount(value: string) {
  const normalized = value.trim();
  if (!normalized) return '请输入金额';
  const amount = Number(normalized);
  if (Number.isNaN(amount)) return '金额格式不正确';
  if (amount < 0) return '金额需大于等于 0';
  const decimalPart = normalized.split('.')[1];
  if (decimalPart && decimalPart.length > 2) {
    return '金额最多保留两位小数';
  }
  return null;
}
