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
  CircularProgress,
} from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useAppointments } from '../context/AppointmentsContext';
import { Appointment } from '../types';
import { updateAppointment } from '../utils';
import EventDetailsModal from './EventDetailsModal';
import AppointmentDetailsModal from './AppointmentModal';
import { format } from 'date-fns';
import { appointmentToCalendarEvent } from '../transformers';
import { getCalendarDateRange } from '../services/api';

const CalendarView = () => {
  const { 
    appointments, 
    addAppointment, 
    setAppointments, 
    deleteAppointment,
    isLoading,
    error,
    fetchAppointments,
    clearError
  } = useAppointments();

  const [popupEvent, setPopupEvent] = useState<any | null>(null);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [activeAppointment, setActiveAppointment] =
    useState<Appointment | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState<any | null>(null);
  const [snackbarState, setSnackbarState] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
    key: number;
  }>({ open: false, message: '', severity: 'success', key: 0 });

  const calendarRef = useRef<FullCalendar>(null);

  // Handle calendar date range changes
  const handleDatesSet = async (dateInfo: any) => {
    console.log('Calendar dates changed:', dateInfo);
    const dateRange = getCalendarDateRange(dateInfo.view);
    await fetchAppointments(dateRange);
  };

  // Initial data fetch when component mounts
  useEffect(() => {
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      const dateRange = getCalendarDateRange(calendar.view);
      fetchAppointments(dateRange);
    }
  }, []);

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

  const events = useMemo(
    () => appointments.map(appointmentToCalendarEvent),
    [appointments]
  );

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={2}
        mb={1}
      >
        <Box display="flex" alignItems="center" gap={2}>
          {isLoading && (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading appointments...
              </Typography>
            </Box>
          )}
        </Box>
        
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

      {error && (
        <Alert 
          severity="error" 
          onClose={clearError}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, position: 'relative' }}>
        {isLoading && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bgcolor="rgba(255, 255, 255, 0.8)"
            zIndex={1000}
          >
            <CircularProgress />
          </Box>
        )}
        
        <FullCalendar
          ref={calendarRef}
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
          datesSet={handleDatesSet} // Handle date range changes
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
