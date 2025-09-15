import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAppointments } from '../context/AppointmentsContext';
import { Paper } from '@mui/material';

const CalendarView: React.FC = () => {
  const { appointments } = useAppointments();

  const events = appointments.map((appt) => ({
    id: appt.id,
    title: `${appt.clientName} - ${appt.service}`,
    start: appt.time,
    extendedProps: {
      provider: appt.provider,
      room: appt.room,
    },
  }));

  return (
    <Paper sx={{ p: 2 }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        height="80vh"
      />
    </Paper>
  );
};

export default CalendarView;
