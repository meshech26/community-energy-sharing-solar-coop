describe('Energy Quantity Selection Logic', () => {
  const maxQuantity = 20;

  function handleQuantityChange(text, max = maxQuantity) {
    if (text === '') {
      return '';
    }

    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    if (cleaned.length > 1 && cleaned.startsWith('0') && cleaned[1] !== '.') {
      cleaned = cleaned.replace(/^0+/, '') || '0';
    }

    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > max) {
      return String(max);
    }
    return cleaned;
  }

  function handleBlur(quantityText, max = maxQuantity) {
    if (!quantityText || quantityText.trim() === '') {
      return String(Math.min(1, max));
    }
    const num = parseFloat(quantityText);
    if (isNaN(num) || num < 1) {
      return String(Math.min(1, max));
    }
    if (num > max) {
      return String(max);
    }
    return String(num);
  }

  function handleIncrease(quantityText, max = maxQuantity) {
    const current = parseFloat(quantityText) || 0;
    if (current < max) {
      return String(Math.min(max, Number((current + 1).toFixed(2))));
    }
    return quantityText;
  }

  function handleDecrease(quantityText) {
    const current = parseFloat(quantityText) || 0;
    if (current > 1) {
      return String(Math.max(1, Number((current - 1).toFixed(2))));
    }
    return quantityText;
  }

  function getProgressPercentage(quantityText, max = maxQuantity) {
    const num = parseFloat(quantityText) || 0;
    return max > 0 ? Math.min(100, Math.max(0, (num / max) * 100)) : 0;
  }

  test('allows typing integer quantity within max limit', () => {
    expect(handleQuantityChange('10')).toBe('10');
    expect(handleQuantityChange('15')).toBe('15');
    expect(handleQuantityChange('20')).toBe('20');
  });

  test('caps typed quantity at max available quantity', () => {
    expect(handleQuantityChange('25')).toBe('20');
    expect(handleQuantityChange('100')).toBe('20');
  });

  test('handles backspacing and empty text input gracefully', () => {
    expect(handleQuantityChange('')).toBe('');
    expect(handleBlur('')).toBe('1');
  });

  test('replaces leading zero when typing regular digits', () => {
    expect(handleQuantityChange('05')).toBe('5');
    expect(handleQuantityChange('0.5')).toBe('0.5');
  });

  test('allows decimals with single decimal point', () => {
    expect(handleQuantityChange('5.5')).toBe('5.5');
    expect(handleQuantityChange('5.5.5')).toBe('5.55');
  });

  test('stepping with + and - buttons updates count correctly', () => {
    let qty = '6';
    qty = handleIncrease(qty);
    expect(qty).toBe('7');

    qty = handleDecrease(qty);
    expect(qty).toBe('6');

    // Decrease cannot go below 1
    qty = '1';
    expect(handleDecrease(qty)).toBe('1');

    // Increase cannot exceed max (20)
    qty = '20';
    expect(handleIncrease(qty)).toBe('20');
  });

  test('progress bar updates according to quantity', () => {
    expect(getProgressPercentage('6')).toBe(30);
    expect(getProgressPercentage('10')).toBe(50);
    expect(getProgressPercentage('20')).toBe(100);
    expect(getProgressPercentage('0')).toBe(0);
  });

  test('blur restores minimum valid quantity if invalid input entered', () => {
    expect(handleBlur('0')).toBe('1');
    expect(handleBlur('-5')).toBe('1');
    expect(handleBlur('abc')).toBe('1');
    expect(handleBlur('15')).toBe('15');
    expect(handleBlur('30')).toBe('20');
  });
});
