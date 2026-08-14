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
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  // Buscar dinámicamente el próximo día de entrega disponible
  let deliveryDate = new Date(bogotaNow);
  deliveryDate.setDate(bogotaNow.getDate() + 1);

  while (true) {
    if (!isWeekendOrHoliday(deliveryDate)) {
      const cutoffDate = new Date(deliveryDate);
      cutoffDate.setDate(deliveryDate.getDate() - 1);
      cutoffDate.setHours(16, 0, 0, 0); // Corte a las 4:00 PM del día anterior

      if (bogotaNow.getTime() < cutoffDate.getTime()) {
        break;
      }
    }
    deliveryDate.setDate(deliveryDate.getDate() + 1);
  }

  const cutoffDate = new Date(deliveryDate);
  cutoffDate.setDate(deliveryDate.getDate() - 1);

  const isToday = cutoffDate.getDate() === bogotaNow.getDate() &&
                  cutoffDate.getMonth() === bogotaNow.getMonth() &&
                  cutoffDate.getFullYear() === bogotaNow.getFullYear();

  const isTomorrow = (() => {
    const tom = new Date(bogotaNow);
    tom.setDate(bogotaNow.getDate() + 1);
    return cutoffDate.getDate() === tom.getDate() &&
           cutoffDate.getMonth() === tom.getMonth() &&
           cutoffDate.getFullYear() === tom.getFullYear();
  })();

  const deliveryDayName = dayNames[deliveryDate.getDay()];
  const cutoffDayName = dayNames[cutoffDate.getDay()];

  if (isToday) {
    // Si la entrega es mañana (diferencia de 1 día natural)
    const diffTime = Math.abs(deliveryDate.getTime() - bogotaNow.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      return `Pedidos antes de las 4:00 PM se entregan mañana (${deliveryDayName}) en Bogotá`;
    } else {
      return `Pedidos antes de las 4:00 PM se entregan el ${deliveryDayName} en Bogotá`;
    }
  } else if (isTomorrow) {
    return `Pedidos antes de las 4:00 PM de mañana se entregan el ${deliveryDayName} en Bogotá`;
  } else {
    return `Pedidos antes del ${cutoffDayName} a las 4:00 PM se entregan el ${deliveryDayName} en Bogotá`;
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
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  let targetDate = new Date(bogotaDate);
  targetDate.setDate(bogotaDate.getDate() + 1);

  while (true) {
    if (!isWeekendOrHoliday(targetDate)) {
      const cutoffDate = new Date(targetDate);
      cutoffDate.setDate(targetDate.getDate() - 1);
      cutoffDate.setHours(16, 0, 0, 0);

      if (bogotaDate.getTime() < cutoffDate.getTime()) {
        break;
      }
    }
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
