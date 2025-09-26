import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import CalendarView from './components/CalendarView';

const App: React.FC = () => {
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
      </Box>
      <CalendarView />
    </Container>
  );
};

export default App;
