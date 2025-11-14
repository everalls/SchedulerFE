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
  Popper,
} from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useAppointments } from '../context/AppointmentsContext';
import { Appointment, BackendLocation, BackendWorker } from '../types';
import { updateAppointment } from '../utils';
import EventDetailsModal from './EventDetailsModal';
import AppointmentDetailsModal from './AppointmentModal';
import EventTooltip from './EventTooltip';
import { format } from 'date-fns';
import {
  appointmentToCalendarEvent,
  backendToAppointment,
} from '../transformers';
import {
  getCalendarDateRange,
  createBooking,
  updateBooking,
  deleteBooking,
  evaluateBookings,
  optimizeBookings,
} from '../services/api';

const CONFLICT_MESSAGES: Record<string, string> = {
  EachErrandResourceHaveAServiceProvidedByParentErrand:
    'Resource is not configured for the requested service.',
  ServicingResourceCapacityMatchesCustomerResourcesCapacity:
    "Resource capacity does not meet this appointment's needs.",
  ResourceAvailableForErrand:
    'Resource is not available during the requested time.',
};

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

  // Tooltip state
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLElement | null>(null);
  const [tooltipAppointment, setTooltipAppointment] =
    useState<Appointment | null>(null);
  const [tooltipConflictExplanation, setTooltipConflictExplanation] =
    useState<string>('');
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Cleanup timeout on unmount
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
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

  const enterDraftMode = async () => {
    setPopupEvent(null); // Close the event modal

    // Show loading message
    showSnackbar('Optimizing bookings...', 'success');

    try {
      // Get current date range
      const dateRange = calendarRef.current
        ? getCalendarDateRange(calendarRef.current.getApi().view)
        : null;

      if (!dateRange) {
        showSnackbar('Unable to get calendar date range', 'error');
        return;
      }

      // Call optimize API
      const result = await optimizeBookings(dateRange.from, dateRange.to);

      if (result.success && result.optimizedEvents) {
        // Convert backend events to appointments
        const optimizedAppointments = result.optimizedEvents.map((be) =>
          backendToAppointment(be)
        );

        // Compare optimized appointments with existing ones to find changed events
        const changedEventIds = new Set<string>();

        optimizedAppointments.forEach((optimizedApt) => {
          const existingApt = appointments.find(
            (a) => a.id === optimizedApt.id
          );

          if (!existingApt) {
            // New appointment
            console.log('New appointment detected:', optimizedApt.id);
            changedEventIds.add(optimizedApt.id);
          } else {
            // Check if any fields changed
            const hasChanged =
              existingApt.startTime !== optimizedApt.startTime ||
              existingApt.endTime !== optimizedApt.endTime ||
              existingApt.provider !== optimizedApt.provider ||
              existingApt.room !== optimizedApt.room ||
              existingApt.service !== optimizedApt.service ||
              existingApt.clientName !== optimizedApt.clientName;

            if (hasChanged) {
              console.log('Changed appointment:', optimizedApt.id, {
                startTime: existingApt.startTime !== optimizedApt.startTime,
                endTime: existingApt.endTime !== optimizedApt.endTime,
                provider: existingApt.provider !== optimizedApt.provider,
                room: existingApt.room !== optimizedApt.room,
                service: existingApt.service !== optimizedApt.service,
                clientName: existingApt.clientName !== optimizedApt.clientName,
              });
              changedEventIds.add(optimizedApt.id);
            }
          }
        });

        console.log('Total appointments:', optimizedAppointments.length);
        console.log(
          'Changed appointments:',
          changedEventIds.size,
          Array.from(changedEventIds)
        );

        // Enter draft mode with optimized appointments
        setIsDraftMode(true);
        setOriginalAppointments([...appointments]);
        setAppointments(optimizedAppointments);
        setModifiedEventIds(changedEventIds);

        // Show persistent snackbar with optimization result
        const isValid = result.isValid ?? false;
        const baseMessage = isValid
          ? 'Optimization complete! Changes are shown in draft mode and saved locally only. Review and click "Save" to apply, or "Reset" to discard.'
          : 'Optimization complete with some issues remaining. Changes are shown in draft mode and saved locally only. Please review and click "Save" to apply, or "Reset" to discard.';

        setSnackbarState({
          open: true,
          message: baseMessage,
          severity: isValid ? 'success' : 'success',
          key: Date.now(),
          action: (
            <Button
              color="inherit"
              size="small"
              onClick={() =>
                setSnackbarState((prev) => ({ ...prev, open: false }))
              }
            >
              Got it
            </Button>
          ),
        });
      } else {
        showSnackbar(result.error || 'Failed to optimize bookings', 'error');
      }
    } catch (error) {
      console.error('Error optimizing bookings:', error);
      showSnackbar('Failed to optimize bookings', 'error');
    }
  };

  // Function to call evaluate API and update conflicts
  const callEvaluateAPI = async (updatedAppointments?: Appointment[]) => {
    if (!isDraftMode) return; // Only call in draft mode

    try {
      // Use provided appointments or current state
      const appointmentsToEvaluate = updatedAppointments || appointments;

      // Filter out draft appointments (those with "draft-" prefix)
      const validAppointments = appointmentsToEvaluate.filter(
        (apt) => !apt.id.startsWith('draft-')
      );

      if (validAppointments.length === 0) return; // No valid appointments to evaluate

      const result = await evaluateBookings(validAppointments);

      if (result.success && result.conflicts) {
        // Map conflicts back to appointments by bookingId
        const conflictsByBookingId = new Map<number, any[]>();

        result.conflicts.forEach((conflict) => {
          conflict.results.forEach((result) => {
            if (!conflictsByBookingId.has(result.bookingId)) {
              conflictsByBookingId.set(result.bookingId, []);
            }
            conflictsByBookingId.get(result.bookingId)!.push({
              evaluationCriteria: conflict.evaluationCriteria,
              results: [result],
            });
          });
        });

        // Update appointments with conflicts
        setAppointments((prev) =>
          prev.map((appointment) => {
            const appointmentId = parseInt(appointment.id);
            const conflicts = conflictsByBookingId.get(appointmentId) || [];
            return {
              ...appointment,
              conflicts: conflicts,
            };
          })
        );
      }
    } catch (error) {
      console.error('Error evaluating bookings:', error);
    }
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
      providerLocked: false,
      roomLocked: false,
    });
    setAppointmentModalOpen(true);
  };

  const { locationMap, workerMap, appointmentMap } = useMemo(() => {
    const locationAccumulator = new Map<number, BackendLocation>();
    const workerAccumulator = new Map<number, BackendWorker>();
    const appointmentAccumulator = new Map<number, Appointment>();

    appointments.forEach((appt) => {
      const numericId = Number.parseInt(appt.id, 10);
      if (!Number.isNaN(numericId)) {
        appointmentAccumulator.set(numericId, appt);
      }

      appt.locationsDetails?.forEach((location) => {
        if (
          location &&
          typeof location.id === 'number' &&
          !locationAccumulator.has(location.id)
        ) {
          locationAccumulator.set(location.id, location);
        }
      });

      appt.workersDetails?.forEach((worker) => {
        if (
          worker &&
          typeof worker.id === 'number' &&
          !workerAccumulator.has(worker.id)
        ) {
          workerAccumulator.set(worker.id, worker);
        }
      });
    });

    return {
      locationMap: locationAccumulator,
      workerMap: workerAccumulator,
      appointmentMap: appointmentAccumulator,
    };
  }, [appointments]);

  const buildConflictExplanation = (
    conflicts: Appointment['conflicts'],
    currentAppointment?: Appointment
  ): string => {
    if (!conflicts || conflicts.length === 0) {
      return '';
    }

    const messages: string[] = [];

    conflicts.forEach((conflict) => {
      const baseMessage =
        CONFLICT_MESSAGES[conflict.evaluationCriteria] ||
        `Conflict detected: ${conflict.evaluationCriteria}`;
      const detailFragments: string[] = [];

      conflict.results.forEach((result) => {
        switch (conflict.evaluationCriteria) {
          case 'EachErrandResourceHaveAServiceProvidedByParentErrand': {
            const requiredService =
              currentAppointment?.service || 'the scheduled service';

            if (result.locations && result.locations.length > 0) {
              result.locations.forEach((locationId) => {
                const location = locationMap.get(locationId);
                if (location) {
                  detailFragments.push(
                    `Room "${location.name}" cannot provide ${requiredService}.`
                  );
                } else {
                  detailFragments.push(
                    `Room ${locationId} cannot provide ${requiredService}.`
                  );
                }
              });
            }

            if (result.workers && result.workers.length > 0) {
              result.workers.forEach((workerId) => {
                const worker = workerMap.get(workerId);
                if (worker) {
                  detailFragments.push(
                    `Provider "${worker.name}" cannot provide ${requiredService}.`
                  );
                } else {
                  detailFragments.push(
                    `Provider ${workerId} cannot provide ${requiredService}.`
                  );
                }
              });
            }

            break;
          }

          case 'SolutionResourceDoubleBooked': {
            const conflictingAppointments =
              result.conflictsWithIds?.map((id) => appointmentMap.get(id)) ||
              [];
            const namedConflicts = conflictingAppointments.filter(
              (appt): appt is Appointment => Boolean(appt)
            );

            const conflictSummary =
              namedConflicts.length > 0
                ? namedConflicts
                    .map((appt) => {
                      const start = appt.startTime
                        ? format(new Date(appt.startTime), 'MMM d p')
                        : '';
                      const end = appt.endTime
                        ? format(new Date(appt.endTime), 'MMM d p')
                        : '';
                      const timeRange =
                        start && end ? ` (${start} - ${end})` : '';
                      return `${appt.clientName} - ${appt.service}${timeRange}`;
                    })
                    .join(', ')
                : result.conflictsWithIds && result.conflictsWithIds.length > 0
                ? result.conflictsWithIds
                    .map((id) => `booking #${id}`)
                    .join(', ')
                : '';

            if (result.workers && result.workers.length > 0) {
              result.workers.forEach((workerId) => {
                const worker = workerMap.get(workerId);
                const workerName = worker?.name ?? `ID ${workerId}`;

                if (conflictSummary) {
                  detailFragments.push(
                    `Provider "${workerName}" already has ${conflictSummary}.`
                  );
                } else {
                  detailFragments.push(
                    `Provider "${workerName}" already has another booking at this time.`
                  );
                }
              });
            }

            if (result.locations && result.locations.length > 0) {
              result.locations.forEach((locationId) => {
                const location = locationMap.get(locationId);
                const locationName = location?.name || `Location ${locationId}`;

                if (conflictSummary) {
                  detailFragments.push(
                    `Room "${locationName}" is already booked for ${conflictSummary}.`
                  );
                } else {
                  detailFragments.push(
                    `Room "${locationName}" is already booked at this time.`
                  );
                }
              });
            }

            break;
          }

          default: {
            if (result.locations && result.locations.length > 0) {
              result.locations.forEach((locationId) => {
                const location = locationMap.get(locationId);
                if (location) {
                  detailFragments.push(
                    `Room "${location.name}" is involved in this conflict.`
                  );
                } else {
                  detailFragments.push(
                    `Room ${locationId} is involved in this conflict.`
                  );
                }
              });
            }

            if (result.workers && result.workers.length > 0) {
              result.workers.forEach((workerId) => {
                const worker = workerMap.get(workerId);
                if (worker) {
                  detailFragments.push(
                    `Provider "${worker.name}" is involved in this conflict.`
                  );
                } else {
                  detailFragments.push(
                    `Provider ${workerId} is involved in this conflict.`
                  );
                }
              });
            }

            break;
          }
        }
      });

      if (detailFragments.length > 0) {
        // For SolutionResourceDoubleBooked, skip the base message and only show details
        if (conflict.evaluationCriteria === 'SolutionResourceDoubleBooked') {
          messages.push(detailFragments.join(' '));
        } else {
          messages.push(`${baseMessage} ${detailFragments.join(' ')}`);
        }
      } else {
        // For SolutionResourceDoubleBooked with no details, skip entirely
        // (shouldn't normally happen, but handle gracefully)
        if (conflict.evaluationCriteria !== 'SolutionResourceDoubleBooked') {
          messages.push(baseMessage);
        }
      }
    });

    return messages.join('\n');
  };

  const handleEventMouseEnter = (info: any, jsEvent: MouseEvent) => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    const appointment = appointments.find((a) => a.id === info.event.id);
    if (!appointment) return;

    const eventEl = info.el;
    if (!eventEl) return;

    // Small delay before showing tooltip
    tooltipTimeoutRef.current = setTimeout(() => {
      // Build conflict explanation if needed
      let conflictExplanation = '';
      if (appointment.conflicts && appointment.conflicts.length > 0) {
        conflictExplanation = buildConflictExplanation(
          appointment.conflicts,
          appointment
        );
      }

      setTooltipAppointment(appointment);
      setTooltipConflictExplanation(conflictExplanation);
      setTooltipAnchor(eventEl as HTMLElement);
    }, 300); // 300ms delay
  };

  const handleEventMouseLeave = () => {
    // Clear timeout if tooltip hasn't shown yet
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }

    setTooltipAnchor(null);
    setTooltipAppointment(null);
    setTooltipConflictExplanation('');
  };

  const handleEventDidMount = (info: any) => {
    const eventEl = info.el;
    if (!eventEl) return;

    // Attach mouse enter/leave handlers
    eventEl.addEventListener('mouseenter', (e: MouseEvent) => {
      handleEventMouseEnter(info, e);
    });
    eventEl.addEventListener('mouseleave', () => {
      handleEventMouseLeave();
    });
  };

  const handleEventClick = (info: any) => {
    // Hide tooltip when clicking on event
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setTooltipAnchor(null);
    setTooltipAppointment(null);
    setTooltipConflictExplanation('');

    info.jsEvent.preventDefault(); // Prevent default browser context menu
    if (!info.event.id) {
      console.error('Event ID is missing! Ensure events have unique IDs.');
      showSnackbar('Invalid event data', 'error');
      return;
    }

    // Check if this is a conflicting event and generate explanation if needed
    let conflictExplanation = '';
    if (info.event.extendedProps.isConflicting) {
      const currentAppointment = appointments.find(
        (appointment) => appointment.id === info.event.id
      );
      const conflicts = info.event.extendedProps.conflicts;
      if (conflicts && conflicts.length > 0) {
        conflictExplanation = buildConflictExplanation(
          conflicts,
          currentAppointment
        );
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
        const updatedAppointments = appointments.map((apt) =>
          apt.id === id ? updatedAppointment : apt
        );
        setAppointments(updatedAppointments);
        setModifiedEventIds((prev) => new Set([...prev, id]));
        showSnackbar('Appointment time updated (draft)', 'success');
        setTimeout(() => callEvaluateAPI(updatedAppointments), 100);
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
        const updatedAppointments = appointments.map((apt) =>
          apt.id === id ? updatedAppointment : apt
        );
        setAppointments(updatedAppointments);
        setModifiedEventIds((prev) => new Set([...prev, id]));
        showSnackbar('Appointment time updated (draft)', 'success');
        setTimeout(() => callEvaluateAPI(updatedAppointments), 100);
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
    const conflictExplanation = buildConflictExplanation(
      conflictingAppointment.conflicts,
      conflictingAppointment
    );

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
        providerLocked: conflictingAppointment.providerLocked ?? false,
        roomLocked: conflictingAppointment.roomLocked ?? false,
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
            center: isDraftMode ? 'title draftIndicator' : 'title',
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
            draftIndicator: {
              text: '!',
              click: function () {
                // No action - just a visual indicator
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
          eventDidMount={handleEventDidMount} // Attach hover handlers for tooltip
        />
      </Paper>

      {/* Event Tooltip */}
      <Popper
        open={Boolean(tooltipAnchor && tooltipAppointment)}
        anchorEl={tooltipAnchor}
        placement="top"
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
        ]}
        sx={{ zIndex: 1300, pointerEvents: 'none' }}
      >
        {tooltipAppointment && (
          <EventTooltip
            clientName={tooltipAppointment.clientName}
            service={tooltipAppointment.service}
            provider={tooltipAppointment.provider}
            room={tooltipAppointment.room}
            startTime={tooltipAppointment.startTime}
            endTime={tooltipAppointment.endTime}
            providerLocked={tooltipAppointment.providerLocked}
            roomLocked={tooltipAppointment.roomLocked}
            conflicts={tooltipAppointment.conflicts}
            conflictExplanation={tooltipConflictExplanation}
          />
        )}
      </Popper>

      <EventDetailsModal
        open={Boolean(popupEvent)}
        popupEvent={popupEvent}
        handleClosePopup={handleClosePopup}
        showConflictInfo={popupEvent?.extendedProps?.isConflicting || false}
        conflictExplanation={
          popupEvent?.extendedProps?.conflictExplanation || ''
        }
        onResolveConflict={async () => {
          await enterDraftMode();
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
              const updatedAppointments = appointments.map((apt) =>
                apt.id === appointment.id ? appointment : apt
              );
              setAppointments(updatedAppointments);
              setModifiedEventIds((prev) => new Set([...prev, appointment.id]));
              showSnackbar('Appointment updated (draft)', 'success');
              setTimeout(() => callEvaluateAPI(updatedAppointments), 100);
            } else {
              // Create new appointment in draft mode
              const newAppointment = {
                ...appointment,
                id: `draft-${Date.now()}`,
              };
              const updatedAppointments = [...appointments, newAppointment];
              setAppointments(updatedAppointments);
              setModifiedEventIds(
                (prev) => new Set([...prev, newAppointment.id])
              );
              showSnackbar('Appointment created (draft)', 'success');
              setTimeout(() => callEvaluateAPI(updatedAppointments), 100);
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
            width: { xs: '90vw', sm: '600px', md: '700px' },
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
