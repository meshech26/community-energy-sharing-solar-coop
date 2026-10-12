describe('Date and Time Picker Logic for Create Listing', () => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const parseDateString = (str) => {
    if (!str) return new Date();
    const parts = str.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const formatDateString = (d) => {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  const parseTimeString = (timeStr) => {
    if (!timeStr) return { hour: '09', minute: '00', period: 'AM' };
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let h = parseInt(match[1], 10);
      let m = match[2];
      let p = match[3].toUpperCase();
      return {
        hour: String(h).padStart(2, '0'),
        minute: m,
        period: p,
      };
    }
    return { hour: '09', minute: '00', period: 'AM' };
  };

  const getCalendarDays = (year, month) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false, isPrev: true });
    }

    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }

    const remainder = days.length % 7;
    if (remainder !== 0) {
      const daysNeeded = 7 - remainder;
      for (let i = 1; i <= daysNeeded; i++) {
        days.push({ day: i, isCurrentMonth: false, isNext: true });
      }
    }
    return days;
  };

  test('parses and formats MM/DD/YYYY dates accurately', () => {
    const d = parseDateString('08/29/2026');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7); // August is 0-indexed 7
    expect(d.getDate()).toBe(29);
    expect(formatDateString(d)).toBe('08/29/2026');
  });

  test('generates complete calendar grid divisible by 7 for August 2026', () => {
    const days = getCalendarDays(2026, 7);
    expect(days.length % 7).toBe(0);
    const currentMonthDays = days.filter(d => d.isCurrentMonth);
    expect(currentMonthDays.length).toBe(31);
    expect(currentMonthDays[0].day).toBe(1);
    expect(currentMonthDays[30].day).toBe(31);
  });

  test('parses standard 12-hour times with AM/PM', () => {
    const t1 = parseTimeString('09:00 AM');
    expect(t1.hour).toBe('09');
    expect(t1.minute).toBe('00');
    expect(t1.period).toBe('AM');

    const t2 = parseTimeString('5:30 PM');
    expect(t2.hour).toBe('05');
    expect(t2.minute).toBe('30');
    expect(t2.period).toBe('PM');
  });

  test('updates time components cleanly', () => {
    const active = parseTimeString('09:00 AM');
    const updated = { ...active, hour: '11', minute: '30', period: 'PM' };
    const formatted = `${updated.hour}:${updated.minute} ${updated.period}`;
    expect(formatted).toBe('11:30 PM');
  });
});
