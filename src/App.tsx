import React, { useState } from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import CalendarView from './components/CalendarView';
import NewAppointmentModal from './components/AppointmentModal';

const App: React.FC = () => {
  const [open, setOpen] = useState(false);

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

      <NewAppointmentModal open={open} onClose={() => setOpen(false)} />
    </Container>
  );
};

export default App;
