export function roundUpToQuarter(date = new Date()) {
  const d = new Date(date);
  const m = d.getMinutes();
  const add = (15 - (m % 15)) % 15;
  d.setMinutes(m + add, 0, 0);
  return d;
}

export function toHHMM(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function buildQuarterHours(start = "00:00", end = "23:45") {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const out: string[] = [];
  let h = sh, m = sm;
  while (h < eh || (h === eh && m <= em)) {
    out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 15; 
    if (m === 60) { 
      m = 0; 
      h += 1; 
    }
  }
  return out;
}

export function getSixOptions(base = new Date()) {
  const today = new Date(base);
  const list: { label: string; date: Date }[] = [];

  const add = (d: Date, label?: string) => list.push({ 
    label: label ?? d.toLocaleDateString(undefined, { weekday: "long" }), 
    date: d 
  });

  // Today + Tomorrow
  add(today, "Today");
  const tomorrow = new Date(today); 
  tomorrow.setDate(tomorrow.getDate() + 1);
  add(tomorrow, "Tomorrow");

  // Custom skip pattern to emulate your examples
  const weekday = today.getDay(); // 0=Sun,...,3=Wed,5=Fri
  const increments = (weekday === 3) ? [2,3,4,5]        // Wed: +2=Fri,... +5=Mon
                    : (weekday === 5) ? [2,3,4,5]        // Fri: +2=Sun,... +5=Wed
                    : [2,3,4,5];                         // default

  increments.forEach(n => {
    const d = new Date(today); 
    d.setDate(d.getDate() + n);
    add(d);
  });

  return list.slice(0, 6);
}

export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
}

export function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
}

export function formatTimeForDisplay(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}