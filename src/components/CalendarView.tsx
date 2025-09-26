import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import {
  Box,
  Button,
  Modal,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useMemo, useState } from 'react';
import { useAppointments } from '../context/AppointmentsContext';
import { Appointment, CalendarEvent } from '../types';
import { updateAppointment } from '../utils';
import EventDetailsModal from './EventDetailsModal';
import AppointmentDetailsModal from './AppointmentModal';
import { format } from 'date-fns';

const CalendarView = () => {
  const { appointments, addAppointment, setAppointments, deleteAppointment } =
    useAppointments();

  const [popupEvent, setPopupEvent] = useState<CalendarEvent | null>(null);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [activeAppointment, setActiveAppointment] =
    useState<Appointment | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTargetEvent, setDeleteTargetEvent] =
    useState<CalendarEvent | null>(null);
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
    key: number;
  }>({ open: false, message: '', severity: 'success', key: 0 });

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' = 'success'
  ) => {
    setSnackbarState({ open: true, message, severity, key: Date.now() });
  };

  const handleSnackbarClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') return;
    setSnackbarState((s) => ({ ...s, open: false }));
  };

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
      showSnackbar('Invalid event data', 'error');
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
      showSnackbar('Appointment time updated', 'success');
    } else {
      showSnackbar('Invalid event data', 'error');
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
      showSnackbar('Appointment time updated', 'success');
    } else {
      showSnackbar('Invalid event data', 'error');
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
          slotDuration="00:15:00"
          // slotLabelInterval="00:15:00"
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
          }}
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
            // Close details and open confirm dialog with current event as target
            if (popupEvent) {
              setDeleteTargetEvent(popupEvent);
            }
            setPopupEvent(null);
            setConfirmDeleteOpen(true);
          }}
          onRequestEdit={(id) => {
            // Find the appointment by id and open the modal prefilled
            const appt = appointments.find((a) => a.id === id);
            if (!appt) {
              console.warn('Appointment not found for editing:', id);
              showSnackbar('Appointment not found', 'error');
              return;
            }
            setActiveAppointment(appt);
            setPopupEvent(null);
            setAppointmentModalOpen(true);
          }}
        />
      </Modal>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete appointment?</DialogTitle>
        <DialogContent>
          {deleteTargetEvent && (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                {deleteTargetEvent.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'gray' }}>
                {(() => {
                  const startDate = new Date(deleteTargetEvent.start);
                  const endDate = new Date(deleteTargetEvent.end);
                  const sameDay =
                    format(startDate, 'yyyy-MM-dd') ===
                    format(endDate, 'yyyy-MM-dd');
                  if (sameDay) {
                    return `${format(
                      startDate,
                      'EEEE, MMMM d'
                    )} \u2022 ${format(startDate, 'p')} \u2013 ${format(
                      endDate,
                      'p'
                    )}`;
                  }
                  return `${format(startDate, 'EEE, MMM d, p')} \u2013 ${format(
                    endDate,
                    'EEE, MMM d, p'
                  )}`;
                })()}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmDeleteOpen(false);
              setDeleteTargetEvent(null);
            }}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deleteTargetEvent?.id) {
                deleteAppointment(deleteTargetEvent.id);
                showSnackbar('Appointment deleted', 'success');
              } else {
                showSnackbar('Invalid event data', 'error');
              }
              setConfirmDeleteOpen(false);
              setDeleteTargetEvent(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <AppointmentDetailsModal
        open={appointmentModalOpen}
        onClose={() => {
          setAppointmentModalOpen(false);
          setActiveAppointment(null);
        }}
        activeAppointment={activeAppointment}
        setActiveAppointment={setActiveAppointment}
        onSave={(appointment) => {
          // If the id exists in store, update; otherwise create
          const exists = appointments.some((a) => a.id === appointment.id);
          if (exists && appointment.id) {
            setAppointments((prev) =>
              updateAppointment(prev, appointment.id, appointment)
            );
            showSnackbar('Appointment updated', 'success');
          } else {
            addAppointment(appointment);
            showSnackbar('Appointment created', 'success');
          }
        }}
      />

      <Snackbar
        key={snackbarState.key}
        open={snackbarState.open}
        autoHideDuration={1000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarState.severity}
          variant="filled"
          sx={{
            width: { xs: '90vw', sm: 360 },
            textAlign: 'center',
            justifyContent: 'center',
          }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CalendarView;
