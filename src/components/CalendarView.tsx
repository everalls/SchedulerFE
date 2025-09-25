import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Paper, Modal, Box, Typography, IconButton, Toolbar } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMemo } from 'react';
import { useAppointments } from '../context/AppointmentsContext';
import { Appointment, CalendarEvent } from '../types';

interface CalendarViewProps {
  setModalOpen: (open: boolean) => void;
  activeAppointment: Appointment | null;
  setActiveAppointment: (appointment: Appointment | null) => void;
}

const CalendarView = (props: CalendarViewProps) => {
  const { setModalOpen, activeAppointment, setActiveAppointment } = props;
  const { appointments, deleteAppointment, setAppointments } =
    useAppointments();

  const [isPopupOpen, setPopupOpen] = React.useState(false);
  const [popupEvent, setPopupEvent] = React.useState<CalendarEvent | null>(null);

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
            return <span>{eventInfo.event.title || 'No Title'}</span>;
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

      <Modal open={isPopupOpen} onClose={handleClosePopup}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography variant="h6">Event Details</Typography>
            <Box>
              <IconButton>
                <EditIcon />
              </IconButton>
              <IconButton>
                <DeleteIcon />
              </IconButton>
            </Box>
          </Toolbar>
          {popupEvent && (
            <Box mt={2}>
              <Typography variant="body1">
                <strong>Time:</strong> {popupEvent.start} - {popupEvent.end}
              </Typography>
              <Typography variant="body1">
                <strong>Room:</strong> {popupEvent.extendedProps.room || 'N/A'}
              </Typography>
            </Box>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default CalendarView;
