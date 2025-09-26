import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Box, Button, Modal, Paper } from '@mui/material';
import { useMemo, useState } from 'react';
import { useAppointments } from '../context/AppointmentsContext';
import { Appointment, CalendarEvent } from '../types';
import { updateAppointment } from '../utils';
import EventDetailsModal from './EventDetailsModal';
import AppointmentDetailsModal from './AppointmentModal';

const CalendarView = () => {
  const { appointments, addAppointment, setAppointments } = useAppointments();

  const [popupEvent, setPopupEvent] = useState<CalendarEvent | null>(null);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [activeAppointment, setActiveAppointment] =
    useState<Appointment | null>(null);

  const handleDateSelect = (selectionInfo: {
    startStr: string;
    endStr: string;
  }) => {
    setActiveAppointment({
      id: '',
      clientName: '',
      service: '',
      provider: '',
      room: '',
      startTime: selectionInfo.startStr,
      endTime: selectionInfo.endStr,
    });
    setAppointmentModalOpen(true);
  };

  const handleEventClick = (info: any) => {
    info.jsEvent.preventDefault(); // Prevent default browser context menu
    if (!info.event.id) {
      console.error('Event ID is missing! Ensure events have unique IDs.');
      return;
    }

    setPopupEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start?.toISOString() || '',
      end: info.event.end?.toISOString() || '',
      extendedProps: info.event.extendedProps,
    });
  };

  const handleClosePopup = () => {
    setPopupEvent(null);
  };

  const handleEventDrop = (info: any) => {
    const { id } = info.event;
    const updatedStart = info.event.start?.toISOString();
    const updatedEnd = info.event.end?.toISOString();

    if (id && updatedStart && updatedEnd) {
      setAppointments((prev) =>
        updateAppointment(prev, id, {
          startTime: updatedStart,
          endTime: updatedEnd,
        })
      );
    }
  };

  const handleEventResize = (info: any) => {
    const { id } = info.event;
    const updatedStart = info.event.start?.toISOString();
    const updatedEnd = info.event.end?.toISOString();

    if (id && updatedStart && updatedEnd) {
      setAppointments((prev) =>
        updateAppointment(prev, id, {
          startTime: updatedStart,
          endTime: updatedEnd,
        })
      );
    }
  };

  const events: CalendarEvent[] = useMemo(
    () =>
      appointments.map((appointment) => ({
        id: appointment.id,
        title: `${appointment.clientName} - ${appointment.service}`,
        start: appointment.startTime,
        end: appointment.endTime,
        extendedProps: {
          clientName: appointment.clientName,
          provider: appointment.provider,
          room: appointment.room,
          service: appointment.service, // Added service property
        },
      })),
    [appointments]
  );

  return (
    <>
      <Box
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
        mt={2}
        mb={1}
      >
        <Button
          variant="contained"
          onClick={() => {
            setActiveAppointment({
              id: '',
              clientName: '',
              service: '',
              provider: '',
              room: '',
              startTime: '',
              endTime: '',
            });
            setAppointmentModalOpen(true);
          }}
        >
          New Appointment
        </Button>
      </Box>
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
          eventContent={(eventInfo) => {
            return (
              // TODO: Make it nicer, not just a simple span
              <span>{eventInfo.event.title || 'No Title'}</span>
            );
          }}
          height="80vh"
          selectable
          editable // Enable drag-and-drop and resizing
          select={handleDateSelect}
          eventClick={handleEventClick} // Add right-click handler
          eventDrop={handleEventDrop} // Handle event drag-and-drop
          eventResize={handleEventResize} // Handle event resizing
        />
      </Paper>

      <Modal
        open={Boolean(popupEvent)}
        onClose={handleClosePopup}
        slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.4)' } } }}
      >
        <EventDetailsModal
          popupEvent={popupEvent}
          handleClosePopup={handleClosePopup}
          onRequestDelete={() => {
            // No-op delete behavior for now: just close the details modal
            handleClosePopup();
          }}
        />
      </Modal>

      <AppointmentDetailsModal
        open={appointmentModalOpen}
        onClose={() => {
          setAppointmentModalOpen(false);
          setActiveAppointment(null);
        }}
        activeAppointment={activeAppointment}
        setActiveAppointment={setActiveAppointment}
        onSave={(appointment) => {
          addAppointment(appointment);
        }}
      />
    </>
  );
};

export default CalendarView;
