import React, { useState } from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import CalendarView from './components/CalendarView';
import AppointmentDetailsModal from './components/AppointmentModal';
import { Appointment } from './types/appointment';
import { useAppointments } from './context/AppointmentsContext';

const App: React.FC = () => {
  const { addAppointment } = useAppointments();
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
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
        {/* TODO translate */}
        <Typography variant="h4">Scheduler MVP</Typography>
        <Button
          variant="contained"
          onClick={() => setAppointmentModalOpen(true)}
        >
          {/* TODO translate */}
          New Appointment
        </Button>
      </Box>

      <CalendarView
        activeAppointment={activeAppointment}
        setActiveAppointment={setActiveAppointment}
        setModalOpen={setAppointmentModalOpen}
      />

      <AppointmentDetailsModal
        open={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        activeAppointment={activeAppointment}
        setActiveAppointment={setActiveAppointment}
        onSave={(appointment) => {
          const appointmentWithId = {
            ...appointment,
            id: appointment.id || crypto.randomUUID(), // Generate a unique ID if not provided
          };
          addAppointment(appointmentWithId); // Save the appointment
        }}
      />
    </Container>
  );
};

export default App;
