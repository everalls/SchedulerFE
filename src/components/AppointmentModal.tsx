import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Autocomplete,
} from '@mui/material';
import { Appointment } from '../types';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

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
  // Mock data arrays
  const clientOptions = [
    'John Smith',
    'Sarah Davis',
    'Michael Johnson',
    'Emily Wilson',
    'David Brown',
    'Lisa Anderson',
    'Robert Taylor',
    'Jennifer Martinez',
    'Christopher Lee',
    'Amanda Garcia',
    'James Wilson',
    'Maria Rodriguez',
    'Kevin Thompson',
    'Rachel Green',
    'Daniel Kim',
    'Jessica White',
    'Matthew Davis',
    'Ashley Brown',
    'Ryan Miller',
    'Nicole Taylor',
  ];

  const serviceOptions = [
    'Massage Therapy',
    'Deep Tissue Massage',
    'Swedish Massage',
    'Physiotherapy',
    'Sports Therapy',
    'Chiropractic',
    'Consultation',
    'Follow-up Visit',
    'Initial Assessment',
    'Rehabilitation',
    'Pain Management',
    'Wellness Check',
    'Therapeutic Exercise',
    'Manual Therapy',
  ];

  const providerOptions = [
    'Dr. Sarah Johnson',
    'Dr. Michael Chen',
    'Dr. Emily Rodriguez',
    'Dr. David Thompson',
    'Dr. Lisa Wang',
    'Dr. James Wilson',
    'Dr. Maria Garcia',
    'Dr. Robert Kim',
    'Dr. Jennifer Lee',
    'Dr. Christopher Brown',
    'Dr. Amanda Davis',
    'Dr. Kevin Martinez',
    'Dr. Rachel Taylor',
  ];

  const roomOptions = [
    'Room 101',
    'Room 102',
    'Room 103',
    'Room 201',
    'Room 202',
    'Room 203',
    'Conference Room A',
    'Conference Room B',
    'Room 301',
    'Room 302',
    'Room 303',
    'Private Suite 1',
    'Private Suite 2',
    'Therapy Room 1',
    'Therapy Room 2',
  ];
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
      });
    }
  }, [open, activeAppointment, setActiveAppointment]);

  const handleChange = (field: keyof Appointment, value: string) => {
    if (activeAppointment) {
      setActiveAppointment({ ...activeAppointment, [field]: value });
    }
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
            options={clientOptions}
            value={activeAppointment?.clientName || null}
            onChange={(event, newValue) =>
              handleChange('clientName', newValue || '')
            }
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
            options={serviceOptions}
            value={activeAppointment?.service || null}
            onChange={(event, newValue) =>
              handleChange('service', newValue || '')
            }
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
            options={providerOptions}
            value={activeAppointment?.provider || null}
            onChange={(event, newValue) =>
              handleChange('provider', newValue || '')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Provider"
                required
                error={!activeAppointment?.provider}
                helperText={
                  !activeAppointment?.provider ? 'Provider is required' : ''
                }
              />
            )}
            ListboxProps={{
              style: { maxHeight: '200px' },
            }}
          />
          <Autocomplete
            options={roomOptions}
            value={activeAppointment?.room || null}
            onChange={(event, newValue) => handleChange('room', newValue || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Room"
                required
                error={!activeAppointment?.room}
                helperText={!activeAppointment?.room ? 'Room is required' : ''}
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
