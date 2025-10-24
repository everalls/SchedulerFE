import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import '../styles/calendar.css';
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
import {
  getCalendarDateRange,
  createBooking,
  updateBooking,
  deleteBooking,
} from '../services/api';

const CalendarView = () => {
  const {
    appointments,
    addAppointment,
    setAppointments,
    deleteAppointment,
    isLoading,
    error,
    fetchAppointments,
    clearError,
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

    // Check if this is a conflicting event and generate explanation if needed
    let conflictExplanation = '';
    if (info.event.extendedProps.isConflicting) {
      // Find the conflicting appointment
      const conflictingAppointment = appointments.find(
        (a) => a.id === info.event.id
      );
      if (conflictingAppointment) {
        // Find conflicting appointments using the same logic as handleConflictIconClick
        const conflictingWith = appointments.filter((otherAppointment) => {
          if (otherAppointment.id === info.event.id) return false;

          // Check time overlap and resource conflict
          const start1 = new Date(conflictingAppointment.startTime).getTime();
          const end1 = new Date(conflictingAppointment.endTime).getTime();
          const start2 = new Date(otherAppointment.startTime).getTime();
          const end2 = new Date(otherAppointment.endTime).getTime();

          const hasTimeOverlap = start1 < end2 && start2 < end1;
          const hasResourceConflict =
            conflictingAppointment.provider === otherAppointment.provider ||
            conflictingAppointment.room === otherAppointment.room;

          return hasTimeOverlap && hasResourceConflict;
        });

        if (conflictingWith.length > 0) {
          const firstConflict = conflictingWith[0];
          const sharedResources = [];

          // Check which specific resources are conflicting
          if (
            conflictingAppointment.provider === firstConflict.provider &&
            conflictingAppointment.provider
          ) {
            sharedResources.push(
              `provider "${conflictingAppointment.provider}"`
            );
          }
          if (
            conflictingAppointment.room === firstConflict.room &&
            conflictingAppointment.room
          ) {
            sharedResources.push(`room "${conflictingAppointment.room}"`);
          }

          if (sharedResources.length > 0) {
            conflictExplanation = `Same time slot with ${sharedResources.join(
              ' and '
            )}`;
          } else {
            conflictExplanation = 'Same time slot with another appointment';
          }
        }
      }
    }

    setPopupEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.start ? info.event.start.toISOString() : '',
      end: info.event.end ? info.event.end.toISOString() : '',
      extendedProps: {
        ...info.event.extendedProps,
        conflictExplanation: conflictExplanation, // Add the generated explanation
      },
    });
  };

  const handleClosePopup = () => {
    setPopupEvent(null);
  };

  const handleEventDrop = async (info: any) => {
    const { id } = info.event;
    const updatedStart = info.event.start?.toISOString();
    const updatedEnd = info.event.end?.toISOString();

    if (id && updatedStart && updatedEnd) {
      // Find the appointment to get all its data
      const appointment = appointments.find((a) => a.id === id);
      if (!appointment) {
        showSnackbar('Appointment not found', 'error');
        info.revert(); // Revert the drag if appointment not found
        return;
      }

      // Update appointment with new times
      const updatedAppointment = {
        ...appointment,
        startTime: updatedStart,
        endTime: updatedEnd,
      };

      // Call API to update
      const result = await updateBooking(updatedAppointment);
      if (result.success) {
        showSnackbar('Appointment time updated', 'success');

        // Refresh calendar data from API
        if (calendarRef.current) {
          const calendar = calendarRef.current.getApi();
          const dateRange = getCalendarDateRange(calendar.view);
          await fetchAppointments(dateRange);
        }
      } else {
        showSnackbar(result.error || 'Failed to update appointment', 'error');
        info.revert(); // Revert the drag if API call failed
      }
    } else {
      showSnackbar('Invalid event data', 'error');
      info.revert();
    }
  };

  const handleEventResize = async (info: any) => {
    const { id } = info.event;
    const updatedStart = info.event.start?.toISOString();
    const updatedEnd = info.event.end?.toISOString();

    if (id && updatedStart && updatedEnd) {
      // Find the appointment to get all its data
      const appointment = appointments.find((a) => a.id === id);
      if (!appointment) {
        showSnackbar('Appointment not found', 'error');
        info.revert(); // Revert the resize if appointment not found
        return;
      }

      // Update appointment with new times
      const updatedAppointment = {
        ...appointment,
        startTime: updatedStart,
        endTime: updatedEnd,
      };

      // Call API to update
      const result = await updateBooking(updatedAppointment);
      if (result.success) {
        showSnackbar('Appointment time updated', 'success');

        // Refresh calendar data from API
        if (calendarRef.current) {
          const calendar = calendarRef.current.getApi();
          const dateRange = getCalendarDateRange(calendar.view);
          await fetchAppointments(dateRange);
        }
      } else {
        showSnackbar(result.error || 'Failed to update appointment', 'error');
        info.revert(); // Revert the resize if API call failed
      }
    } else {
      showSnackbar('Invalid event data', 'error');
      info.revert();
    }
  };

  const handleConflictIconClick = (eventId: string) => {
    // Find the conflicting appointment
    const conflictingAppointment = appointments.find((a) => a.id === eventId);
    if (!conflictingAppointment) return;

    // Find conflicting appointments using the existing utility functions
    const conflictingWith = appointments.filter((otherAppointment) => {
      if (otherAppointment.id === eventId) return false;

      // Check time overlap and resource conflict using utility functions
      const start1 = new Date(conflictingAppointment.startTime).getTime();
      const end1 = new Date(conflictingAppointment.endTime).getTime();
      const start2 = new Date(otherAppointment.startTime).getTime();
      const end2 = new Date(otherAppointment.endTime).getTime();

      const hasTimeOverlap = start1 < end2 && start2 < end1;
      const hasResourceConflict =
        conflictingAppointment.provider === otherAppointment.provider ||
        conflictingAppointment.room === otherAppointment.room;

      return hasTimeOverlap && hasResourceConflict;
    });

    // Generate conflict explanation
    let conflictExplanation = '';
    if (conflictingWith.length > 0) {
      const firstConflict = conflictingWith[0];
      const sharedResources = [];

      // Check which specific resources are conflicting
      if (
        conflictingAppointment.provider === firstConflict.provider &&
        conflictingAppointment.provider
      ) {
        sharedResources.push(`provider "${conflictingAppointment.provider}"`);
      }
      if (
        conflictingAppointment.room === firstConflict.room &&
        conflictingAppointment.room
      ) {
        sharedResources.push(`room "${conflictingAppointment.room}"`);
      }

      if (sharedResources.length > 0) {
        conflictExplanation = `Same time slot with ${sharedResources.join(
          ' and '
        )}`;
      } else {
        conflictExplanation = 'Same time slot with another appointment';
      }
    }

    // Set the popup event to show the modal with conflict info
    const popupEventData = {
      id: conflictingAppointment.id,
      title: `${conflictingAppointment.clientName} - ${conflictingAppointment.service}`,
      start: conflictingAppointment.startTime,
      end: conflictingAppointment.endTime,
      extendedProps: {
        clientName: conflictingAppointment.clientName,
        provider: conflictingAppointment.provider,
        room: conflictingAppointment.room,
        service: conflictingAppointment.service,
        isConflicting: true,
        conflictExplanation: conflictExplanation,
      },
    };
    setPopupEvent(popupEventData);
  };

  const events = useMemo(
    () =>
      appointments.map((appointment) =>
        appointmentToCalendarEvent(appointment, appointments)
      ),
    [appointments]
  );

  return (
    <>
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 3,
          position: 'relative',
          border: '1px solid #dadce0',
          borderRadius: '8px',
          backgroundColor: '#fff',
        }}
      >
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
          slotDuration="01:00:00"
          snapDuration="00:15:00"
          scrollTime="08:00:00"
          scrollTimeReset={false}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          expandRows={true}
          allDaySlot={false}
          slotLabelInterval="01:00:00"
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
          }}
          headerToolbar={{
            left: 'schedulerTitle prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay',
          }}
          customButtons={{
            schedulerTitle: {
              text: 'Scheduler',
              click: function () {
                // No action - just a label
              },
            },
          }}
          events={events}
          eventContent={(eventInfo) => {
            const isConflicting = eventInfo.event.extendedProps.isConflicting;
            return (
              <>
                <span className="fc-event-title">
                  {eventInfo.event.title || 'No Title'}
                </span>
                {isConflicting && (
                  <div
                    className="fc-conflict-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConflictIconClick(eventInfo.event.id);
                    }}
                  >
                    !
                  </div>
                )}
              </>
            );
          }}
          height="calc(100vh - 100px)"
          selectable
          editable={true} // Enable drag-and-drop and resizing
          eventResize={handleEventResize} // Handle event resizing
          eventStartEditable={true} // Enable resizing from start
          eventDurationEditable={true} // Enable resizing from end
          select={handleDateSelect}
          eventClick={handleEventClick} // Add right-click handler
          eventDrop={handleEventDrop} // Handle event drag-and-drop
          datesSet={handleDatesSet} // Handle date range changes
        />
      </Paper>

      <EventDetailsModal
        open={Boolean(popupEvent)}
        popupEvent={popupEvent}
        handleClosePopup={handleClosePopup}
        showConflictInfo={popupEvent?.extendedProps?.isConflicting || false}
        conflictExplanation={
          popupEvent?.extendedProps?.conflictExplanation || ''
        }
        onResolveConflict={() => {
          showSnackbar('Conflict resolution feature coming soon!', 'success');
        }}
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
            onClick={async () => {
              if (deleteTargetEvent?.id) {
                // Call API to delete
                const result = await deleteBooking(deleteTargetEvent.id);
                if (result.success) {
                  showSnackbar('Appointment deleted successfully', 'success');

                  // Refresh calendar data from API
                  if (calendarRef.current) {
                    const calendar = calendarRef.current.getApi();
                    const dateRange = getCalendarDateRange(calendar.view);
                    await fetchAppointments(dateRange);
                  }
                } else {
                  showSnackbar(
                    result.error || 'Failed to delete appointment',
                    'error'
                  );
                }
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
        onSave={async (appointment) => {
          // If the id exists in store, update; otherwise create
          const exists = appointments.some((a) => a.id === appointment.id);

          if (exists && appointment.id) {
            // Update existing booking
            const result = await updateBooking(appointment);
            if (result.success) {
              showSnackbar('Appointment updated successfully', 'success');

              // Refresh calendar data from API
              if (calendarRef.current) {
                const calendar = calendarRef.current.getApi();
                const dateRange = getCalendarDateRange(calendar.view);
                await fetchAppointments(dateRange);
              }
            } else {
              showSnackbar(
                result.error || 'Failed to update appointment',
                'error'
              );
            }
          } else {
            // Create new booking
            const result = await createBooking(appointment);
            if (result.success) {
              showSnackbar('Appointment created successfully', 'success');

              // Refresh calendar data from API
              if (calendarRef.current) {
                const calendar = calendarRef.current.getApi();
                const dateRange = getCalendarDateRange(calendar.view);
                await fetchAppointments(dateRange);
              }
            } else {
              showSnackbar(
                result.error || 'Failed to create appointment',
                'error'
              );
            }
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
