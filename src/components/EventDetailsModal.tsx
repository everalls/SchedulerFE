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
  onRequestDelete?: (id: string) => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  popupEvent,
  handleClosePopup,
  onRequestDelete,
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
        <IconButton
          size="small"
          sx={{ p: '4px' }}
          onClick={() => onRequestDelete?.(popupEvent.id)}
        >
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
        <Typography
          variant="body2"
          sx={{ fontSize: '0.85rem', color: 'gray', mb: 1 }}
        >
          {popupEvent.start &&
            popupEvent.end &&
            (() => {
              const startDate = new Date(popupEvent.start);
              const endDate = new Date(popupEvent.end);
              const sameDay =
                format(startDate, 'yyyy-MM-dd') ===
                format(endDate, 'yyyy-MM-dd');

              if (sameDay) {
                // Friday, September 26 • 9:00 AM – 10:00 AM
                return `${format(startDate, 'EEEE, MMMM d')} \u2022 ${format(
                  startDate,
                  'p'
                )} \u2013 ${format(endDate, 'p')}`;
              }
              // Fri, Sep 26, 9:00 AM – Sat, Sep 27, 10:00 AM
              return `${format(startDate, 'EEE, MMM d, p')} \u2013 ${format(
                endDate,
                'EEE, MMM d, p'
              )}`;
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
