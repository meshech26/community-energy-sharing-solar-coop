/**
 * Formats a Date object or timestamp into a friendly, readable string.
 * Example outputs: "Today, 3:15 PM", "Yesterday, 10:30 AM", "Aug 29, 12:45 PM"
 */
export const formatAlertDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
  const formattedTime = date.toLocaleTimeString(undefined, timeOptions);

  if (isToday) {
    return `Today, ${formattedTime}`;
  } else if (isYesterday) {
    return `Yesterday, ${formattedTime}`;
  } else {
    const dateOptions = { month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString(undefined, dateOptions);
    return `${formattedDate}, ${formattedTime}`;
  }
};
