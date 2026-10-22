import type { EnvironmentVariable } from '@/modules/environment-variable/environment-variable.type';
import { toast } from 'sonner';

function escapeEnvValue(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function variablesToEnvFormat(
  variables: EnvironmentVariable[],
  opts?: { maskValues?: boolean; revealedKeys?: Set<string> }
): string {
  return variables
    .map(v => {
      const mask = opts?.maskValues && !opts?.revealedKeys?.has(v.key);
      const val = mask ? '••••••••••••' : (v.value ?? '');
      return `${v.key}="${escapeEnvValue(val)}"`;
    })
    .join('\n');
}

export function exportAsEnv(variables: EnvironmentVariable[], slug: string) {
  const content = variables
    .map(v => `${v.key}="${escapeEnvValue(v.value ?? '')}"`)
    .join('\n');
  downloadFile(content, `${slug}.env`, 'text/plain;charset=utf-8');
  toast.success(`Exported ${variables.length} variables as ${slug}.env`);
}

export function exportAsJson(variables: EnvironmentVariable[], slug: string) {
  const obj = Object.fromEntries(variables.map(v => [v.key, v.value ?? '']));
  const content = JSON.stringify(obj, null, 2);
  downloadFile(content, `${slug}.json`, 'application/json;charset=utf-8');
  toast.success(`Exported ${variables.length} variables as ${slug}.json`);
}

export function slugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
