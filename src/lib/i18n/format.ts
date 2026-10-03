// Простая подстановка {token} в строки словаря. Не принимает функции в
// словаре (их нельзя передать из Server в Client Component как пропс) —
// шаблоны остаются обычными строками, форматирование делает сам компонент.
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}
