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
    action?: React.ReactNode;
  }>({ open: false, message: '', severity: 'success', key: 0 });

  // Draft mode state
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [originalAppointments, setOriginalAppointments] = useState<
    Appointment[]
  >([]);
  const [modifiedEventIds, setModifiedEventIds] = useState<Set<string>>(
    new Set()
  );

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

  // Draft mode handlers
  const handleReset = async () => {
    setIsDraftMode(false);
    setModifiedEventIds(new Set());
    setOriginalAppointments([]);

    // Reload appointments from API
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      const dateRange = getCalendarDateRange(calendar.view);
      await fetchAppointments(dateRange);
    }
    showSnackbar('Changes reset successfully', 'success');
  };

  const handleSave = async () => {
    try {
      // Get all modified appointments
      const modifiedAppointments = appointments.filter((appointment) =>
        modifiedEventIds.has(appointment.id)
      );

      // Call update API for each modified appointment
      const updatePromises = modifiedAppointments.map((appointment) =>
        updateBooking(appointment)
      );

      const results = await Promise.all(updatePromises);

      // Check if all updates were successful
      const allSuccessful = results.every((result) => result.success);

      if (allSuccessful) {
        setIsDraftMode(false);
        setModifiedEventIds(new Set());
        setOriginalAppointments([]);
        showSnackbar('All changes saved successfully', 'success');

        // Refresh calendar data from API
        if (calendarRef.current) {
          const calendar = calendarRef.current.getApi();
          const dateRange = getCalendarDateRange(calendar.view);
          await fetchAppointments(dateRange);
        }
      } else {
        showSnackbar('Some changes failed to save', 'error');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      showSnackbar('Failed to save changes', 'error');
    }
  };

  const enterDraftMode = () => {
    setIsDraftMode(true);
    setOriginalAppointments([...appointments]);
    setModifiedEventIds(new Set());
    setPopupEvent(null); // Close the event modal

    // Show persistent snackbar with agreement button
    setSnackbarState({
      open: true,
      message: 'Draft mode enabled - changes will be saved locally',
      severity: 'success',
      key: Date.now(),
      action: (
        <Button
          color="inherit"
          size="small"
          onClick={() => setSnackbarState((prev) => ({ ...prev, open: false }))}
        >
          Got it
        </Button>
      ),
    });
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
      // Use backend conflicts data
      const conflicts = info.event.extendedProps.conflicts;
      if (conflicts && conflicts.length > 0) {
        // Generate explanation based on backend conflict data
        const firstConflict = conflicts[0];
        const errorMapping = {
          SolutionResourceDoubleBooked:
            'Same resource booked for overlapping errands in the solution',
          EachErrandResourceHaveAServiceProvidedByParentErrand:
            'Each resource assigned to an errand must have a service provided by the parent errand',
          ServicingResourceCapacityMatchesCustomerResourcesCapacity:
            'The capacity of the servicing resource must match the capacity of the customer resource',
          ResourceAvailableForErrand:
            'Resource must be available for the errand according to its availability calendar',
        };
        conflictExplanation =
          errorMapping[firstConflict.evaluationCriteria] ||
          `Conflict detected: ${firstConflict.evaluationCriteria}`;
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

      if (isDraftMode) {
        // In draft mode, update locally and mark as modified
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === id ? updatedAppointment : apt))
        );
        setModifiedEventIds((prev) => new Set([...prev, id]));
        showSnackbar('Appointment time updated (draft)', 'success');
      } else {
        // Normal mode - call API to update
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

      if (isDraftMode) {
        // In draft mode, update locally and mark as modified
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === id ? updatedAppointment : apt))
        );
        setModifiedEventIds((prev) => new Set([...prev, id]));
        showSnackbar('Appointment time updated (draft)', 'success');
      } else {
        // Normal mode - call API to update
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

    // Generate conflict explanation from backend conflicts data
    let conflictExplanation = '';
    if (
      conflictingAppointment.conflicts &&
      conflictingAppointment.conflicts.length > 0
    ) {
      const firstConflict = conflictingAppointment.conflicts[0];
      const errorMapping = {
        SolutionResourceDoubleBooked:
          'Same resource booked for overlapping errands in the solution',
        EachErrandResourceHaveAServiceProvidedByParentErrand:
          'Each resource assigned to an errand must have a service provided by the parent errand',
        ServicingResourceCapacityMatchesCustomerResourcesCapacity:
          'The capacity of the servicing resource must match the capacity of the customer resource',
        ResourceAvailableForErrand:
          'Resource must be available for the errand according to its availability calendar',
      };
      conflictExplanation =
        errorMapping[firstConflict.evaluationCriteria] ||
        `Conflict detected: ${firstConflict.evaluationCriteria}`;
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
        conflicts: conflictingAppointment.conflicts,
      },
    };
    setPopupEvent(popupEventData);
  };

  const events = useMemo(
    () =>
      appointments.map((appointment) =>
        appointmentToCalendarEvent(appointment, appointments, modifiedEventIds)
      ),
    [appointments, modifiedEventIds]
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
            right: isDraftMode
              ? 'resetButton,saveButton timeGridWeek,timeGridDay'
              : 'timeGridWeek,timeGridDay',
          }}
          customButtons={{
            schedulerTitle: {
              text: 'Scheduler',
              click: function () {
                // No action - just a label
              },
            },
            resetButton: {
              text: 'Reset',
              click: handleReset,
            },
            saveButton: {
              text: 'Save',
              click: handleSave,
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
          enterDraftMode();
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

          if (isDraftMode) {
            // In draft mode, update locally and mark as modified
            if (exists && appointment.id) {
              setAppointments((prev) =>
                prev.map((apt) =>
                  apt.id === appointment.id ? appointment : apt
                )
              );
              setModifiedEventIds((prev) => new Set([...prev, appointment.id]));
              showSnackbar('Appointment updated (draft)', 'success');
            } else {
              // Create new appointment in draft mode
              const newAppointment = {
                ...appointment,
                id: `draft-${Date.now()}`,
              };
              setAppointments((prev) => [...prev, newAppointment]);
              setModifiedEventIds(
                (prev) => new Set([...prev, newAppointment.id])
              );
              showSnackbar('Appointment created (draft)', 'success');
            }
          } else {
            // Normal mode - call API
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
          }
        }}
      />

      <Snackbar
        key={snackbarState.key}
        open={snackbarState.open}
        autoHideDuration={snackbarState.action ? null : 1000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={snackbarState.action ? undefined : handleSnackbarClose}
          severity={snackbarState.severity}
          variant="filled"
          action={snackbarState.action}
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
