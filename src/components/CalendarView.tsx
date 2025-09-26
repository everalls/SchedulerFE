import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Modal, Paper } from '@mui/material';
import { useMemo, useState } from 'react';
import { useAppointments } from '../context/AppointmentsContext';
import { Appointment, CalendarEvent } from '../types';
import { updateAppointment } from '../utils';
import EventDetailsModal from './EventDetailsModal';

interface CalendarViewProps {
  setModalOpen: (open: boolean) => void;
  activeAppointment: Appointment | null;
  setActiveAppointment: (appointment: Appointment | null) => void;
}

const CalendarView = (props: CalendarViewProps) => {
  const { setModalOpen, activeAppointment, setActiveAppointment } = props;
  const { appointments, deleteAppointment, setAppointments } =
    useAppointments();

  const [isPopupOpen, setPopupOpen] = useState(false);
  const [popupEvent, setPopupEvent] = useState<CalendarEvent | null>(null);

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
    setModalOpen(true);
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
    setPopupOpen(true);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
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
        />
      </Modal>
    </>
  );
};

export default CalendarView;
