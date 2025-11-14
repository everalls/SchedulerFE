import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { format } from 'date-fns';
import { CONFLICT_COLORS } from '../utils';

interface EventTooltipProps {
  clientName: string;
  service: string;
  provider: string;
  room: string;
  startTime: string;
  endTime: string;
  providerLocked?: boolean;
  roomLocked?: boolean;
  conflicts?: any[];
  conflictExplanation?: string;
}

const EventTooltip: React.FC<EventTooltipProps> = ({
  clientName,
  service,
  provider,
  room,
  startTime,
  endTime,
  providerLocked = false,
  roomLocked = false,
  conflicts,
  conflictExplanation,
}) => {
  const hasConflicts = conflicts && conflicts.length > 0;
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const sameDay =
    format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');

  const timeDisplay = sameDay
    ? `${format(startDate, 'EEEE, MMMM d')} • ${format(
        startDate,
        'p'
      )} – ${format(endDate, 'p')}`
    : `${format(startDate, 'EEE, MMM d, p')} – ${format(
        endDate,
        'EEE, MMM d, p'
      )}`;

  return (
    <Paper
      elevation={8}
      sx={{
        p: 1.5,
        minWidth: 280,
        maxWidth: 350,
        fontFamily: 'Roboto, sans-serif',
        borderRadius: 2,
        border: hasConflicts ? `1px solid ${CONFLICT_COLORS.CONFLICT}` : 'none',
      }}
    >
      {/* Title */}
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 600,
          fontSize: '0.95rem',
          color: '#3c4043',
          mb: 1,
          fontFamily: 'Roboto, sans-serif',
        }}
      >
        {clientName} - {service}
      </Typography>

      {/* Time */}
      <Typography
        variant="body2"
        sx={{
          fontSize: '0.8rem',
          color: '#70757a',
          mb: 1.5,
          fontFamily: 'Roboto, sans-serif',
        }}
      >
        {timeDisplay}
      </Typography>

      {/* Details */}
      <Box sx={{ mb: hasConflicts ? 1.5 : 0 }}>
        {/* Provider */}
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.8rem',
            color: '#5f6368',
            mb: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontFamily: 'Roboto, sans-serif',
          }}
        >
          <strong style={{ color: '#3c4043' }}>Provider:</strong> {provider}
          {providerLocked && (
            <LockIcon
              sx={{
                fontSize: '0.85rem',
                color: '#d32f2f',
                ml: 0.25,
              }}
            />
          )}
        </Typography>

        {/* Room */}
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.8rem',
            color: '#5f6368',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontFamily: 'Roboto, sans-serif',
          }}
        >
          <strong style={{ color: '#3c4043' }}>Room:</strong> {room}
          {roomLocked && (
            <LockIcon
              sx={{
                fontSize: '0.85rem',
                color: '#d32f2f',
                ml: 0.25,
              }}
            />
          )}
        </Typography>
      </Box>

      {/* Conflicts */}
      {hasConflicts && conflictExplanation && (
        <Box
          sx={{
            mt: 1.5,
            pt: 1.5,
            borderTop: `1px solid ${CONFLICT_COLORS.CONFLICT}`,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              mb: 1,
            }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                backgroundColor: CONFLICT_COLORS.CONFLICT,
                color: CONFLICT_COLORS.ICON_COLOR,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'Roboto, sans-serif',
              }}
            >
              !
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: CONFLICT_COLORS.CONFLICT,
                fontWeight: 500,
                fontSize: '0.8rem',
                fontFamily: 'Roboto, sans-serif',
              }}
            >
              Conflict detected
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: CONFLICT_COLORS.CONFLICT,
              fontSize: '0.75rem',
              lineHeight: 1.4,
              whiteSpace: 'pre-line',
              fontFamily: 'Roboto, sans-serif',
            }}
          >
            {conflictExplanation}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default EventTooltip;
