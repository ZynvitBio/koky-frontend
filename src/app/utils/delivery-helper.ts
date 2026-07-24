// Lista de feriados de Colombia (formato YYYY-MM-DD)
export const COLOMBIAN_HOLIDAYS = [
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
  '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29',
  '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02',
  '2026-11-16', '2026-12-08', '2026-12-25',
  // 2027
  '2027-01-01', '2027-01-11', '2027-03-22', '2027-03-25', '2027-03-26',
  '2027-05-01', '2027-05-10', '2027-05-31', '2027-06-07', '2027-06-21',
  '2027-07-05', '2027-07-20', '2027-08-07', '2027-08-16', '2027-10-18',
  '2027-11-01', '2027-11-15', '2027-12-08', '2027-12-25'
];

/**
 * Retorna true si la fecha corresponde a un fin de semana o festivo en Colombia
 */
export function isWeekendOrHoliday(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return true; // Domingo o Sábado

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  return COLOMBIAN_HOLIDAYS.includes(dateStr);
}

/**
 * Calcula dinámicamente el mensaje del banner de anuncios basado en la fecha y hora de Bogotá.
 */
export function getDynamicAnnouncementText(): string {
  if (typeof window === 'undefined') {
    return 'Pedidos antes de las 4:00 PM se entregan mañana en Bogotá'; // Fallback para SSR
  }

  // Obtener fecha y hora actual en Bogotá de forma segura
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(new Date());
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')!.value);
  const hour = parseInt(parts.find(p => p.type === 'hour')!.value);

  const bogotaNow = new Date(year, month, day, hour);
  const dayOfWeek = bogotaNow.getDay(); 

  // Nombres de días en español
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  // Ventana del fin de semana largo (Jueves 4:00 PM al Domingo 4:00 PM)
  const isWeekendWindow = 
    (dayOfWeek === 4 && hour >= 16) || 
    (dayOfWeek === 5) ||               
    (dayOfWeek === 6) ||               
    (dayOfWeek === 0 && hour < 16);    

  if (isWeekendWindow) {
    // Para pedidos del fin de semana, el día estimado de entrega base es el lunes
    let targetDate = new Date(bogotaNow);
    // Calcular cuántos días sumar para llegar al lunes
    const daysToAdd = dayOfWeek === 4 ? 4 : (dayOfWeek === 5 ? 3 : (dayOfWeek === 6 ? 2 : 1));
    targetDate.setDate(bogotaNow.getDate() + daysToAdd);

    // Si el lunes es festivo, corre la fecha al martes, etc.
    while (isWeekendOrHoliday(targetDate)) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    const deliveryDayName = dayNames[targetDate.getDay()];
    return `Pedidos antes del domingo a las 4:00 PM se entregan el ${deliveryDayName} en Bogotá`;
  }

  // Caso Domingo después de las 4:00 PM (la entrega base es el martes)
  if (dayOfWeek === 0 && hour >= 16) {
    let targetDate = new Date(bogotaNow);
    targetDate.setDate(bogotaNow.getDate() + 2);
    while (isWeekendOrHoliday(targetDate)) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    const deliveryDayName = dayNames[targetDate.getDay()];
    return `Pedidos antes del lunes a las 4:00 PM se entregan el ${deliveryDayName} en Bogotá`;
  }

  // Caso estándar de lunes a jueves (antes de las 4 PM de jueves)
  const beforeCutoff = hour < 16;
  let targetDate = new Date(bogotaNow);

  if (beforeCutoff) {
    targetDate.setDate(targetDate.getDate() + 1); // Entrega estimada mañana
  } else {
    targetDate.setDate(targetDate.getDate() + 2); // Entrega estimada pasado mañana
  }

  // Saltar fines de semana y festivos
  while (isWeekendOrHoliday(targetDate)) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  // Calcular diferencia en días naturales para saber si cae "mañana"
  const todayReset = new Date(bogotaNow.getFullYear(), bogotaNow.getMonth(), bogotaNow.getDate());
  const targetReset = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const diffDays = Math.ceil(Math.abs(targetReset.getTime() - todayReset.getTime()) / (1000 * 60 * 60 * 24));

  const deliveryDayName = dayNames[targetDate.getDay()];

  if (beforeCutoff) {
    if (diffDays === 1) {
      return `Pedidos antes de las 4:00 PM se entregan mañana (${deliveryDayName}) en Bogotá`;
    } else {
      return `Pedidos antes de las 4:00 PM se entregan el ${deliveryDayName} en Bogotá`;
    }
  } else {
    return `Pedidos antes de las 4:00 PM de mañana se entregan el ${deliveryDayName} en Bogotá`;
  }
}

/**
 * Retorna el nombre del día de entrega estimado de forma amigable (ej: "mañana (viernes)" o "el lunes")
 */
export function getEstimatedDeliveryDayName(createdAtDate: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(createdAtDate);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
  const day = parseInt(parts.find(p => p.type === 'day')!.value);
  const hour = parseInt(parts.find(p => p.type === 'hour')!.value);

  const bogotaDate = new Date(year, month, day, hour);
  const dayOfWeek = bogotaDate.getDay();

  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  let targetDate = new Date(bogotaDate);

  const isWeekendWindow = 
    (dayOfWeek === 4 && hour >= 16) || 
    (dayOfWeek === 5) ||               
    (dayOfWeek === 6) ||               
    (dayOfWeek === 0 && hour < 16);    

  if (isWeekendWindow) {
    const daysToAdd = dayOfWeek === 4 ? 4 : (dayOfWeek === 5 ? 3 : (dayOfWeek === 6 ? 2 : 1));
    targetDate.setDate(bogotaDate.getDate() + daysToAdd);
  } else if (dayOfWeek === 0 && hour >= 16) {
    targetDate.setDate(bogotaDate.getDate() + 2);
  } else {
    if (hour < 16) {
      targetDate.setDate(bogotaDate.getDate() + 1);
    } else {
      targetDate.setDate(bogotaDate.getDate() + 2);
    }
  }

  while (isWeekendOrHoliday(targetDate)) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const todayReset = new Date(bogotaDate.getFullYear(), bogotaDate.getMonth(), bogotaDate.getDate());
  const targetReset = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const diffDays = Math.ceil(Math.abs(targetReset.getTime() - todayReset.getTime()) / (1000 * 60 * 60 * 24));

  const deliveryDayName = dayNames[targetDate.getDay()];
  if (diffDays === 1) {
    return `mañana (${deliveryDayName})`;
  } else {
    return `el ${deliveryDayName}`;
  }
}
