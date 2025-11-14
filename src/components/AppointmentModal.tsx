import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Autocomplete,
  Tooltip,
  Box,
  IconButton,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import {
  Appointment,
  BackendClient,
  BackendLocation,
  BackendService,
  BackendWorker,
} from '../types';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  fetchClients,
  fetchLocations,
  fetchServices,
  fetchWorkers,
} from '../services/api';

interface Props {
  open: boolean;
  onClose: () => void;
  activeAppointment: Appointment | null;
  setActiveAppointment: React.Dispatch<
    React.SetStateAction<Appointment | null>
  >;
  onSave: (appointment: Appointment) => void; // New prop for save function
}

const AppointmentDetailsModal: React.FC<Props> = ({
  open,
  onClose,
  activeAppointment,
  setActiveAppointment,
  onSave, // New prop for save function
}) => {
  // State for API data
  const [clients, setClients] = useState<BackendClient[]>([]);
  const [services, setServices] = useState<BackendService[]>([]);
  const [providers, setProviders] = useState<BackendWorker[]>([]);
  const [rooms, setRooms] = useState<BackendLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch API data when modal opens
  useEffect(() => {
    if (open) {
      setIsLoading(true);
      Promise.all([
        fetchClients(),
        fetchServices(),
        fetchWorkers(),
        fetchLocations(),
      ])
        .then(([clientsData, servicesData, providersData, roomsData]) => {
          setClients(clientsData);
          setServices(servicesData);
          setProviders(providersData);
          setRooms(roomsData);
        })
        .catch((error) => {
          console.error('Error fetching form data:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open]);

  React.useEffect(() => {
    if (open && !activeAppointment) {
      setActiveAppointment({
        id: '',
        clientName: '',
        service: '',
        provider: '',
        room: '',
        startTime: '',
        endTime: '',
        providerLocked: false,
        roomLocked: false,
      });
    }
  }, [open, activeAppointment, setActiveAppointment]);

  const handleChange = (field: keyof Appointment, value: string | number) => {
    setActiveAppointment((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleLockChange = (
    lockField: 'providerLocked' | 'roomLocked',
    value: boolean
  ) => {
    setActiveAppointment((prev) =>
      prev ? { ...prev, [lockField]: value } : prev
    );
  };

  const handleObjectChange = (
    field: 'clientName' | 'service' | 'provider' | 'room',
    object: any
  ) => {
    setActiveAppointment((prev) => {
      if (!prev) return prev;

      if (!object) {
        const cleared: Partial<Appointment> = {};
        switch (field) {
          case 'clientName':
            cleared.clientName = '';
            cleared.clientId = undefined;
            break;
          case 'service':
            cleared.service = '';
            cleared.serviceId = undefined;
            break;
          case 'provider':
            cleared.provider = '';
            cleared.providerId = undefined;
            cleared.providerLocked = false;
            break;
          case 'room':
            cleared.room = '';
            cleared.roomId = undefined;
            cleared.roomLocked = false;
            break;
        }
        return { ...prev, ...cleared } as Appointment;
      }

      const updated: Partial<Appointment> = {};

      switch (field) {
        case 'clientName':
          updated.clientName = object.name ?? '';
          updated.clientId = object.id;
          break;
        case 'service':
          updated.service = object.name ?? '';
          updated.serviceId = object.id;
          break;
        case 'provider':
          updated.provider = object.name ?? '';
          updated.providerId = object.id;
          updated.providerLocked =
            typeof object.isLocked === 'boolean'
              ? object.isLocked
              : prev.providerId === object.id
              ? prev.providerLocked ?? false
              : false;
          break;
        case 'room':
          updated.room = object.name ?? '';
          updated.roomId = object.id;
          updated.roomLocked =
            typeof object.isLocked === 'boolean'
              ? object.isLocked
              : prev.roomId === object.id
              ? prev.roomLocked ?? false
              : false;
          break;
      }

      return { ...prev, ...updated } as Appointment;
    });
  };

  const handleSave = () => {
    console.log('Saving appointment:', activeAppointment);
    if (activeAppointment) {
      onSave(activeAppointment); // Delegate save logic to parent
      onClose();
      setActiveAppointment(null);
    }
  };

  const isFormValid =
    activeAppointment?.clientName &&
    activeAppointment?.service &&
    activeAppointment?.provider &&
    activeAppointment?.room &&
    activeAppointment?.startTime &&
    activeAppointment?.endTime;

  const parseToDate = (value: string | null | undefined) =>
    value ? new Date(value) : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {activeAppointment?.id ? 'Edit Appointment' : 'New Appointment'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Autocomplete
            options={clients}
            getOptionLabel={(option) => option.name}
            value={
              clients.find((c) => c.id === activeAppointment?.clientId) ||
              clients.find((c) => c.name === activeAppointment?.clientName) ||
              null
            }
            onChange={(event, newValue) =>
              handleObjectChange('clientName', newValue)
            }
            loading={isLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Client Name"
                required
                error={!activeAppointment?.clientName}
                helperText={
                  !activeAppointment?.clientName
                    ? 'Client Name is required'
                    : ''
                }
              />
            )}
            ListboxProps={{
              style: { maxHeight: '200px' },
            }}
          />
          <Autocomplete
            options={services}
            getOptionLabel={(option) => option.name}
            value={
              services.find((s) => s.id === activeAppointment?.serviceId) ||
              services.find((s) => s.name === activeAppointment?.service) ||
              null
            }
            onChange={(event, newValue) =>
              handleObjectChange('service', newValue)
            }
            loading={isLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Service"
                required
                error={!activeAppointment?.service}
                helperText={
                  !activeAppointment?.service ? 'Service is required' : ''
                }
              />
            )}
            ListboxProps={{
              style: { maxHeight: '200px' },
            }}
          />
          <Autocomplete
            options={providers}
            getOptionLabel={(option) => option.name}
            value={
              providers.find((p) => p.id === activeAppointment?.providerId) ||
              providers.find((p) => p.name === activeAppointment?.provider) ||
              null
            }
            onChange={(event, newValue) =>
              handleObjectChange('provider', newValue)
            }
            loading={isLoading}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Provider"
                required
                error={!activeAppointment?.provider}
                helperText={
                  !activeAppointment?.provider ? 'Provider is required' : ''
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <Tooltip
                        title={
                          activeAppointment?.providerLocked
                            ? 'Provider is locked'
                            : 'Provider is unlocked'
                        }
                        arrow
                      >
                        <IconButton
                          size="small"
                          sx={{
                            color: activeAppointment?.providerLocked
                              ? 'error.main'
                              : 'success.main',
                            '&:hover': {
                              backgroundColor: 'transparent',
                              color: activeAppointment?.providerLocked
                                ? 'error.dark'
                                : 'success.dark',
                            },
                          }}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={(event) => {
                            event.preventDefault();
                            if (!activeAppointment?.providerId) {
                              return;
                            }
                            handleLockChange(
                              'providerLocked',
                              !activeAppointment?.providerLocked
                            );
                          }}
                          aria-label={
                            activeAppointment?.providerLocked
                              ? 'Provider is locked'
                              : 'Provider is unlocked'
                          }
                        >
                          {activeAppointment?.providerLocked ? (
                            <LockOutlinedIcon fontSize="small" />
                          ) : (
                            <LockOpenOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      {params.InputProps.endAdornment}
                    </Box>
                  ),
                }}
              />
            )}
            ListboxProps={{
              style: { maxHeight: '200px' },
            }}
          />
          <Autocomplete
            options={rooms}
            getOptionLabel={(option) => option.name}
            value={
              rooms.find((r) => r.id === activeAppointment?.roomId) ||
              rooms.find((r) => r.name === activeAppointment?.room) ||
              null
            }
            onChange={(event, newValue) => handleObjectChange('room', newValue)}
            loading={isLoading}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Room"
                required
                error={!activeAppointment?.room}
                helperText={!activeAppointment?.room ? 'Room is required' : ''}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <Tooltip
                        title={
                          activeAppointment?.roomLocked
                            ? 'Room is locked'
                            : 'Room is unlocked'
                        }
                        arrow
                      >
                        <IconButton
                          size="small"
                          sx={{
                            color: activeAppointment?.roomLocked
                              ? 'error.main'
                              : 'success.main',
                            '&:hover': {
                              backgroundColor: 'transparent',
                              color: activeAppointment?.roomLocked
                                ? 'error.dark'
                                : 'success.dark',
                            },
                          }}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={(event) => {
                            event.preventDefault();
                            if (!activeAppointment?.roomId) {
                              return;
                            }
                            handleLockChange(
                              'roomLocked',
                              !activeAppointment?.roomLocked
                            );
                          }}
                          aria-label={
                            activeAppointment?.roomLocked
                              ? 'Room is locked'
                              : 'Room is unlocked'
                          }
                        >
                          {activeAppointment?.roomLocked ? (
                            <LockOutlinedIcon fontSize="small" />
                          ) : (
                            <LockOpenOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      {params.InputProps.endAdornment}
                    </Box>
                  ),
                }}
              />
            )}
            ListboxProps={{
              style: { maxHeight: '200px' },
            }}
          />
          <DateTimePicker
            label="Start Time"
            value={parseToDate(activeAppointment?.startTime)}
            onChange={(newValue) =>
              handleChange('startTime', newValue ? newValue.toISOString() : '')
            }
            minutesStep={15}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                error: !activeAppointment?.startTime,
                helperText: !activeAppointment?.startTime
                  ? 'Start Time is required'
                  : '',
              },
            }}
          />

          <DateTimePicker
            label="End Time"
            value={parseToDate(activeAppointment?.endTime)}
            onChange={(newValue) =>
              handleChange('endTime', newValue ? newValue.toISOString() : '')
            }
            minutesStep={15}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                error: !activeAppointment?.endTime,
                helperText: !activeAppointment?.endTime
                  ? 'End Time is required'
                  : '',
              },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isFormValid}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentDetailsModal;
