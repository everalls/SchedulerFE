import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAppointments } from '../context/AppointmentsContext';
import { Paper } from '@mui/material';
import AppointmentDetailsModal from './AppointmentModal';
import { Appointment } from '../types/appointment';

const CalendarView: React.FC = () => {
  const { appointments, addAppointment } = useAppointments();
  const [activeAppointment, setActiveAppointment] =
    React.useState<Appointment | null>(null); // Fixed type
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleDateSelect = (selectionInfo: {
    startStr: string;
    endStr: string;
  }) => {
    // Fixed type
    setActiveAppointment({
      id: '',
      clientName: '',
      service: '',
      provider: '',
      room: '',
      startTime: selectionInfo.startStr,
      endTime: selectionInfo.endStr,
    });
    setModalOpen(true);
  };

  const handleSave = (appointment: Appointment) => {
    // Fixed type
    addAppointment(appointment);
    setModalOpen(false);
  };

  const events = appointments.map((appt) => ({
    id: appt.id,
    title: `${appt.clientName} - ${appt.service}`,
    start: appt.startTime,
    end: appt.endTime,
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
        selectable
        select={handleDateSelect}
      />
      <AppointmentDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        activeAppointment={activeAppointment}
        setActiveAppointment={setActiveAppointment}
        onSave={handleSave}
      />
    </Paper>
  );
};

export default CalendarView;
