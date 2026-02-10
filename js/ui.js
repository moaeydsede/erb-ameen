export function icon(name){
  // Minimal inline SVG icons
  const icons = {
    menu: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    logout:`<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M10 7V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 12H3m0 0 3-3M3 12l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    user:`<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M20 21a8 8 0 0 0-16 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" stroke-width="2"/></svg>`,
    money:`<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M3 7h18v10H3V7Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7 12h.01M17 12h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" stroke-width="2"/></svg>`,
    doc:`<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M7 3h8l4 4v14H7V3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 3v5h5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    settings:`<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a8.3 8.3 0 0 0 .1-2l2-1.5-2-3.5-2.4.6a8 8 0 0 0-1.7-1l-.4-2.4h-4l-.4 2.4a8 8 0 0 0-1.7 1L4.5 8l-2 3.5 2 1.5a8.3 8.3 0 0 0 .1 2l-2 1.5 2 3.5 2.4-.6a8 8 0 0 0 1.7 1l.4 2.4h4l.4-2.4a8 8 0 0 0 1.7-1l2.4.6 2-3.5-2-1.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
    chart:`<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M4 20V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 18h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 16v-5m4 5V8m4 8v-3m4 3V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  };
  return icons[name] || icons.doc;
}
