import React, { useState } from 'react';
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
import { useAppointments } from '../context/AppointmentsContext';
import { Appointment } from '../types/appointment';

interface Props {
  open: boolean;
  onClose: () => void;
}

const NewAppointmentModal: React.FC<Props> = ({ open, onClose }) => {
  const { addAppointment } = useAppointments();
  const [form, setForm] = useState<Omit<Appointment, 'id'>>({
    clientName: '',
    service: '',
    provider: '',
    room: '',
    time: '',
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (
      !form.clientName ||
      !form.service ||
      !form.provider ||
      !form.room ||
      !form.time
    ) {
      return;
    }
    const newAppt: Appointment = {
      id: Date.now().toString(),
      ...form,
    };
    addAppointment(newAppt);
    onClose();
    setForm({ clientName: '', service: '', provider: '', room: '', time: '' });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Appointment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Client Name"
            value={form.clientName}
            onChange={(e) => handleChange('clientName', e.target.value)}
            fullWidth
          />
          <TextField
            label="Service"
            value={form.service}
            onChange={(e) => handleChange('service', e.target.value)}
            select
            fullWidth
          >
            <MenuItem value="Massage">Massage</MenuItem>
            <MenuItem value="Physiotherapy">Physiotherapy</MenuItem>
            <MenuItem value="Consultation">Consultation</MenuItem>
          </TextField>
          <TextField
            label="Provider"
            value={form.provider}
            onChange={(e) => handleChange('provider', e.target.value)}
            fullWidth
          />
          <TextField
            label="Room"
            value={form.room}
            onChange={(e) => handleChange('room', e.target.value)}
            fullWidth
          />
          <TextField
            label="Date & Time"
            type="datetime-local"
            value={form.time}
            onChange={(e) => handleChange('time', e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewAppointmentModal;
