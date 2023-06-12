export function copyToClipboard(text: string): void {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.zIndex = '-1000';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

export function download(data: string, name: string): void {
  const encodedUri = encodeURI(data);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', name);
  document.body.appendChild(link);
  link.click();
}

export const flattenObject = (obj: any, prefix = '') => {
  const flattened: any = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];

    // FB Timestamp
    if (value?.nanoseconds > 0 && value?.seconds > 0) {
      flattened[prefix + key] = new Date(value.seconds * 1000);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, prefix + key + '.'));
    } else if (Array.isArray(value)) {
      flattened[prefix + key] = value.join(',');
    } else {
      flattened[prefix + key] = value;
    }
  });

  return flattened;
};
