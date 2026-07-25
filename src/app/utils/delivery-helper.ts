function getColombianHolidays(year: number): Set<string> {
  const holidays = new Set<string>();

  // 1. Festivos Fijos (No se trasladan)
  holidays.add(`${year}-01-01`); // Año Nuevo
  holidays.add(`${year}-05-01`); // Día del Trabajo
  holidays.add(`${year}-07-20`); // Independencia
  holidays.add(`${year}-08-07`); // Batalla de Boyacá
  holidays.add(`${year}-12-08`); // Inmaculada Concepción
  holidays.add(`${year}-12-25`); // Navidad

  // Helper para mover al siguiente lunes (Ley Emiliani)
  const getNextMondayStr = (month: number, day: number): string => {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Dom, 1 = Lun, ...
    if (dayOfWeek === 1) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    date.setDate(date.getDate() + daysToAdd);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 2. Festivos con fecha fija pero que se mueven al siguiente lunes
  holidays.add(getNextMondayStr(1, 6));   // Reyes Magos (6 Ene)
  holidays.add(getNextMondayStr(3, 19));  // San José (19 Mar)
  holidays.add(getNextMondayStr(6, 29));  // San Pedro y San Pablo (29 Jun)
  holidays.add(getNextMondayStr(7, 9));   // Virgen de Chiquinquirá (9 Jul - Nuevo Festivo Ley 2578)
  holidays.add(getNextMondayStr(8, 15));  // Asunción de la Virgen (15 Ago)
  holidays.add(getNextMondayStr(10, 12)); // Día de la Raza (12 Oct)
  holidays.add(getNextMondayStr(11, 1));  // Todos los Santos (1 Nov)
  holidays.add(getNextMondayStr(11, 11)); // Independencia de Cartagena (11 Nov)

  // 3. Festivos basados en la Pascua (Algoritmo Butcher-Oudin para el Domingo de Resurrección)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const L = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * L) / 451);
  const month = Math.floor((h + L - 7 * m + 114) / 31);
  const day = ((h + L - 7 * m + 114) % 31) + 1;
  
  const easter = new Date(year, month - 1, day);

  const addDaysStr = (baseDate: Date, days: number): string => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + days);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  holidays.add(addDaysStr(easter, -3)); // Jueves Santo
  holidays.add(addDaysStr(easter, -2)); // Viernes Santo
  holidays.add(addDaysStr(easter, 43)); // Ascensión
  holidays.add(addDaysStr(easter, 64)); // Corpus Christi
  holidays.add(addDaysStr(easter, 71)); // Sagrado Corazón

  return holidays;
}

export const COLOMBIAN_HOLIDAYS: string[] = [];

/**
 * Retorna true si la fecha corresponde a un fin de semana o festivo en Colombia
 */
export function isWeekendOrHoliday(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return true; // Domingo o Sábado

  const y = date.getFullYear();
  const holidays = getColombianHolidays(y);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;
  return holidays.has(dateStr);
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
