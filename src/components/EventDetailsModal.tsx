import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { CalendarEvent } from '../types';

interface EventDetailsModalProps {
  popupEvent: CalendarEvent | null;
  handleClosePopup: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  popupEvent,
  handleClosePopup,
}) => {
  if (!popupEvent) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 2,
        borderRadius: 2,
      }}
    >
      {/* Icons row */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 0.5,
          mb: 1,
        }}
      >
        <IconButton size="small" sx={{ p: '4px' }}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" sx={{ p: '4px' }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={handleClosePopup} sx={{ p: '4px' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Header */}
      <Typography
        variant="h6"
        sx={{
          fontSize: '1.1rem',
          fontWeight: 'bold',
          mb: 1,
          wordWrap: 'break-word',
          textAlign: 'left',
        }}
      >
        {popupEvent.title || 'No Title'}
      </Typography>

      {/* Event details */}
      <Box>
        {/* Dates */}
        <Typography
          variant="body2"
          sx={{ fontSize: '0.85rem', color: 'gray', mb: 1 }}
        >
          {popupEvent.start &&
            popupEvent.end &&
            (() => {
              const sameDay =
                format(new Date(popupEvent.start), 'yyyy-MM-dd') ===
                format(new Date(popupEvent.end), 'yyyy-MM-dd');

              if (sameDay) {
                return `${format(
                  new Date(popupEvent.start),
                  'EEEE, MMMM d'
                )} ${format(new Date(popupEvent.start), 'p')} – ${format(
                  new Date(popupEvent.end),
                  'p'
                )}`;
              } else {
                return `${format(
                  new Date(popupEvent.start),
                  'EEEE, MMMM d, p'
                )} – ${format(new Date(popupEvent.end), 'EEEE, MMMM d, p')}`;
              }
            })()}
        </Typography>

        {/* Room */}
        <Typography
          variant="body2"
          sx={{ fontSize: '0.85rem', color: 'gray', mb: 1 }}
        >
          <strong>Room:</strong> {popupEvent.extendedProps.room || 'N/A'}
        </Typography>

        {/* Provider */}
        <Typography
          variant="body2"
          sx={{ fontSize: '0.85rem', color: 'gray', mb: 1 }}
        >
          <strong>Provider:</strong>{' '}
          {popupEvent.extendedProps.provider || 'N/A'}
        </Typography>
      </Box>
    </Box>
  );
};

export default EventDetailsModal;
