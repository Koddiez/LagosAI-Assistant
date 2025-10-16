export const themes = [
  {
    name: 'light',
    label: 'Light',
    icon: '☀️',
  },
  {
    name: 'dark',
    label: 'Dark',
    icon: '🌙',
  },
  {
    name: 'system',
    label: 'System',
    icon: '💻',
  },
];

export type Theme = (typeof themes)[number]['name'];
