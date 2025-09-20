import React, { useState } from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import CalendarView from './components/CalendarView';
import AppointmentDetailsModal from './components/AppointmentModal';
import { Appointment } from './types/appointment';

const App: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activeAppointment, setActiveAppointment] =
    useState<Appointment | null>(null);

  return (
    <Container>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={2}
        mb={2}
      >
        <Typography variant="h4">Scheduler MVP</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          New Appointment
        </Button>
      </Box>

      <CalendarView />

      <AppointmentDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        activeAppointment={activeAppointment}
        setActiveAppointment={setActiveAppointment}
      />
    </Container>
  );
};

export default App;
