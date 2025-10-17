import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import CalendarView from './components/CalendarView';

const App: React.FC = () => {
  return (
    <Box
      sx={{
        backgroundColor: '#f8f9fa',
        minHeight: '100vh',
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          maxWidth: '1600px',
          py: 3,
        }}
      >
        <CalendarView />
      </Container>
    </Box>
  );
};

export default App;
