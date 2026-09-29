import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Modal from '../AccessibleModal';

import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const validDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

const atStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const sameDay = (left, right) => left && right && left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();

export default function ProposalDateTimeField({ disabled = false, label, minimumDate, onChange, value }) {
  const { width, fontScale } = useWindowDimensions();
  const calendarWidth = Math.max(308 * fontScale, Math.min(width - 72, 420));
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(validDate(value) || new Date());
  const [month, setMonth] = useState(new Date(draft.getFullYear(), draft.getMonth(), 1));
  const minimum = validDate(minimumDate);

  useEffect(() => {
    const nextValue = validDate(value);
    if (nextValue) {
      setDraft(nextValue);
      setMonth(new Date(nextValue.getFullYear(), nextValue.getMonth(), 1));
    }
  }, [value]);

  const open = () => {
    const nextValue = validDate(value) || minimum || new Date();
    setDraft(nextValue);
    setMonth(new Date(nextValue.getFullYear(), nextValue.getMonth(), 1));
    setIsOpen(true);
  };
  const selectDay = (day) => setDraft((current) => new Date(month.getFullYear(), month.getMonth(), day, current.getHours(), current.getMinutes()));
  const changeHour = (amount) => setDraft((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate(), (current.getHours() + amount + 24) % 24, current.getMinutes()));
  const setMinute = (minute) => setDraft((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate(), current.getHours(), minute));
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => index - firstDay + 1);
  const displayValue = validDate(value);
  const hour = draft.getHours();
  const displayHour = hour % 12 || 12;

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityLabel={`Choose ${label}`} accessibilityRole="button" accessibilityState={{ disabled, expanded: isOpen }} accessibilityValue={{ text: displayValue ? displayValue.toLocaleString() : 'No date selected' }} disabled={disabled} onPress={open} style={({ pressed }) => [styles.field, disabled && styles.fieldDisabled, pressed && styles.fieldPressed]}>
        <Text style={[styles.value, !displayValue && styles.placeholder]}>{displayValue ? displayValue.toLocaleString(undefined, { day: 'numeric', hour: 'numeric', minute: '2-digit', month: 'short', year: 'numeric' }).replace(',', ' ·') : 'Choose date and time'}</Text>
        <MaterialCommunityIcons accessible={false} color="#14633F" name="calendar-clock" size={21} />
      </Pressable>
      <Modal accessibilityLabel={label} animationType="fade" onRequestClose={() => setIsOpen(false)} transparent visible={isOpen}>
        <View style={styles.backdrop}>
          <View accessibilityViewIsModal style={styles.modal}>
            <ScrollView testID="date-picker-scroll" contentContainerStyle={styles.modalContent}>
            <Text accessibilityRole="header" style={styles.modalTitle}>{label}</Text>
            <View style={styles.monthRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} style={styles.iconButton}><MaterialCommunityIcons accessible={false} color="#14633F" name="chevron-left" size={24} /></Pressable>
              <Text style={styles.monthTitle}>{monthNames[month.getMonth()]} {month.getFullYear()}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} style={styles.iconButton}><MaterialCommunityIcons accessible={false} color="#14633F" name="chevron-right" size={24} /></Pressable>
            </View>
            <ScrollView testID="date-calendar-scroll" horizontal><View style={{ width: calendarWidth }}>
            <View style={styles.week}>{dayNames.map((name) => <Text key={name} style={styles.weekday}>{name}</Text>)}</View>
            <View style={styles.days}>{cells.map((day, index) => {
              const date = day > 0 && day <= dayCount ? new Date(month.getFullYear(), month.getMonth(), day) : null;
              const unavailable = !date || (minimum && atStartOfDay(date) < atStartOfDay(minimum));
              if (!date) return <View key={`blank-${index}`} style={styles.day} />;
              return <Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(unavailable), selected: Boolean(sameDay(date, draft)) }} accessibilityLabel={`Select ${date.toDateString()}`} disabled={unavailable} key={`${day}-${index}`} onPress={() => selectDay(day)} style={[styles.day, sameDay(date, draft) && styles.daySelected]}><Text style={[styles.dayText, unavailable && styles.dayUnavailable, sameDay(date, draft) && styles.dayTextSelected]}>{day}</Text></Pressable>;
            })}</View>
            </View></ScrollView>
            <Text style={styles.timeHeading}>Time</Text>
            <View style={styles.timeRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Earlier hour" onPress={() => changeHour(-1)} style={styles.timeButton}><MaterialCommunityIcons accessible={false} color="#14633F" name="minus" size={20} /></Pressable>
              <Text accessibilityLiveRegion="polite" style={styles.timeValue}>{displayHour}:{String(draft.getMinutes()).padStart(2, '0')} {hour >= 12 ? 'PM' : 'AM'}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Later hour" onPress={() => changeHour(1)} style={styles.timeButton}><MaterialCommunityIcons accessible={false} color="#14633F" name="plus" size={20} /></Pressable>
            </View>
            <View style={styles.minuteRow}>{[0, 15, 30, 45].map((minute) => <Pressable accessibilityRole="button" accessibilityState={{ selected: draft.getMinutes() === minute }} accessibilityLabel={`Set minutes to ${String(minute).padStart(2, '0')}`} key={minute} onPress={() => setMinute(minute)} style={[styles.minute, draft.getMinutes() === minute && styles.minuteSelected]}><Text style={[styles.minuteText, draft.getMinutes() === minute && styles.minuteTextSelected]}>{String(minute).padStart(2, '0')}</Text></Pressable>)}</View>
            <Text style={styles.selection}>Selected: {draft.toLocaleString(undefined, { day: 'numeric', hour: 'numeric', minute: '2-digit', month: 'short', year: 'numeric' }).replace(',', ' ·')}</Text>
            <View style={styles.actions}><SecondaryButton onPress={() => setIsOpen(false)}>Cancel</SecondaryButton><PrimaryButton onPress={() => { onChange(draft.toISOString()); setIsOpen(false); }}>Confirm</PrimaryButton></View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { marginBottom: 18 },
  label: { color: '#29352F', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  field: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#D8E3DB', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 54, paddingHorizontal: 14, paddingVertical: 12 },
  fieldDisabled: { backgroundColor: '#F4F6F4' }, fieldPressed: { backgroundColor: '#F2F8F4' }, value: { color: '#29352F', flex: 1, fontSize: 15, marginRight: 10 }, placeholder: { color: '#627168' },
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(20, 40, 29, 0.42)', flex: 1, justifyContent: 'center', padding: 16 },
  modal: { backgroundColor: '#FFFFFF', borderRadius: 18, maxWidth: 460, maxHeight: '100%', width: '100%' }, modalContent: { padding: 20 }, modalTitle: { color: '#173322', fontSize: 19, fontWeight: '800', marginBottom: 16 },
  monthRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, iconButton: { alignItems: 'center', borderRadius: 20, minHeight: 44, justifyContent: 'center', minWidth: 44 }, monthTitle: { color: '#173322', fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center' },
  week: { flexDirection: 'row', marginTop: 12 }, weekday: { color: '#6A776E', flex: 1, fontSize: 11, fontWeight: '700', textAlign: 'center' }, days: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }, day: { alignItems: 'center', minHeight: 44, paddingVertical: 8, justifyContent: 'center', width: '14.2857%' }, daySelected: { backgroundColor: '#16764C', borderRadius: 19 }, dayText: { color: '#29352F', fontSize: 14, fontWeight: '700' }, dayUnavailable: { color: '#C2CAC5' }, dayTextSelected: { color: '#FFFFFF' },
  timeHeading: { color: '#173322', fontSize: 15, fontWeight: '800', marginTop: 16 }, timeRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 9, gap: 8 }, timeButton: { alignItems: 'center', borderColor: '#BFD5C6', borderRadius: 18, borderWidth: 1, minHeight: 44, justifyContent: 'center', minWidth: 44 }, timeValue: { color: '#173322', fontSize: 19, fontWeight: '800', flexShrink: 1, textAlign: 'center' },
  minuteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }, minute: { borderColor: '#D8E3DB', borderRadius: 10, borderWidth: 1, minWidth: 48, minHeight: 44, justifyContent: 'center', padding: 8 }, minuteSelected: { backgroundColor: '#EAF5EC', borderColor: '#16764C' }, minuteText: { color: '#526158', fontSize: 13, fontWeight: '800', textAlign: 'center' }, minuteTextSelected: { color: '#14633F' }, selection: { color: '#627168', fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: 'center' }, actions: { gap: 10, marginTop: 18 },
});
