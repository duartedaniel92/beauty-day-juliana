function toGoogleCalendarDate(iso: string): string {
  const date = new Date(iso);
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

interface AddToGoogleCalendarProps {
  title: string;
  startISO: string;
  endISO: string;
}

export function AddToGoogleCalendar({
  title,
  startISO,
  endISO,
}: AddToGoogleCalendarProps) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGoogleCalendarDate(startISO)}/${toGoogleCalendarDate(endISO)}`,
    location: "Beauty Day Juliana",
  });

  return (
    <a
      href={`https://calendar.google.com/calendar/render?${params.toString()}`}
      target="_blank"
      rel="noopener noreferrer"
      className="w-fit rounded-sm border border-clay px-6 py-3 font-sans text-sm font-medium text-clay transition-colors hover:bg-clay hover:text-cream"
    >
      Adicionar ao Google Calendar
    </a>
  );
}
