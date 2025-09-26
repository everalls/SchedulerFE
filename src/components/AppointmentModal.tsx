import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
} from '@mui/material';
import { Appointment } from '../types';

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

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Appointment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Client Name"
            value={activeAppointment?.clientName || ''}
            onChange={(e) => handleChange('clientName', e.target.value)}
            fullWidth
            required
            error={!activeAppointment?.clientName}
            helperText={
              !activeAppointment?.clientName ? 'Client Name is required' : ''
            }
          />
          <TextField
            label="Service"
            value={activeAppointment?.service || ''}
            onChange={(e) => handleChange('service', e.target.value)}
            select
            fullWidth
            required
            error={!activeAppointment?.service}
            helperText={
              !activeAppointment?.service ? 'Service is required' : ''
            }
          >
            <MenuItem value="Massage">Massage</MenuItem>
            <MenuItem value="Physiotherapy">Physiotherapy</MenuItem>
            <MenuItem value="Consultation">Consultation</MenuItem>
          </TextField>
          <TextField
            label="Provider"
            value={activeAppointment?.provider || ''}
            onChange={(e) => handleChange('provider', e.target.value)}
            fullWidth
            required
            error={!activeAppointment?.provider}
            helperText={
              !activeAppointment?.provider ? 'Provider is required' : ''
            }
          />
          <TextField
            label="Room"
            value={activeAppointment?.room || ''}
            onChange={(e) => handleChange('room', e.target.value)}
            fullWidth
            required
            error={!activeAppointment?.room}
            helperText={!activeAppointment?.room ? 'Room is required' : ''}
          />
          <TextField
            label="Start Time"
            type="datetime-local"
            value={
              activeAppointment?.startTime
                ? formatDateTime(activeAppointment.startTime)
                : ''
            }
            onChange={(e) => handleChange('startTime', e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            error={!activeAppointment?.startTime}
            helperText={
              !activeAppointment?.startTime ? 'Start Time is required' : ''
            }
          />
          <TextField
            label="End Time"
            type="datetime-local"
            value={
              activeAppointment?.endTime
                ? formatDateTime(activeAppointment.endTime)
                : ''
            }
            onChange={(e) => handleChange('endTime', e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
            error={!activeAppointment?.endTime}
            helperText={
              !activeAppointment?.endTime ? 'End Time is required' : ''
            }
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
