import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { CONFLICT_COLORS } from '../utils';

// Error code mapping for conflict explanations
const CONFLICT_ERROR_MAPPING = {
  SolutionResourceDoubleBooked:
    'Same resource booked for overlapping errands in the solution',
  EachErrandResourceHaveAServiceProvidedByParentErrand:
    'Each resource assigned to an errand must have a service provided by the parent errand',
  ServicingResourceCapacityMatchesCustomerResourcesCapacity:
    'The capacity of the servicing resource must match the capacity of the customer resource',
  ResourceAvailableForErrand:
    'Resource must be available for the errand according to its availability calendar',
} as const;
// Inline view model used by CalendarView when opening the popup
type CalendarPopupEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    clientName: string;
    provider: string;
    room: string;
    service: string;
    conflicts?: any[];
  };
};

interface EventDetailsModalProps {
  open: boolean;
  popupEvent: CalendarPopupEvent | null;
  handleClosePopup: () => void;
  onRequestDelete?: (id: string) => void;
  onRequestEdit?: (id: string) => void;
  showConflictInfo?: boolean;
  conflictExplanation?: string;
  onResolveConflict?: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  open,
  popupEvent,
  handleClosePopup,
  onRequestDelete,
  onRequestEdit,
  showConflictInfo = false,
  conflictExplanation = '',
  onResolveConflict,
}) => {
  if (!popupEvent) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClosePopup}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogContent sx={{ p: 2 }}>
        {/* Icons row - always at top right */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 0.5,
            mb: 1,
          }}
        >
          <IconButton
            size="small"
            sx={{ p: '4px' }}
            onClick={() => onRequestEdit?.(popupEvent.id)}
          >
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

        {/* Conflict info section */}
        {showConflictInfo && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              backgroundColor: '#ffebee',
              borderRadius: 1,
              border: `1px solid ${CONFLICT_COLORS.CONFLICT}`,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1,
              }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  backgroundColor: CONFLICT_COLORS.CONFLICT,
                  color: CONFLICT_COLORS.ICON_COLOR,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  fontFamily: 'Roboto, sans-serif',
                  border: '1px solid #ffffff',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
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
                  flex: 1,
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
                mb: 1,
                lineHeight: 1.3,
                whiteSpace: 'pre-line',
              }}
            >
              {conflictExplanation}
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={onResolveConflict}
              sx={{
                backgroundColor: CONFLICT_COLORS.CONFLICT,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5,
                minWidth: 'auto',
                '&:hover': {
                  backgroundColor: '#b71c1c',
                },
              }}
            >
              Optimize
            </Button>
          </Box>
        )}

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
              (() => {
                const startDate = new Date(popupEvent.start);
                if (!popupEvent.end) {
                  // Show only start when end is missing
                  return `${format(startDate, 'EEEE, MMMM d')} \u2022 ${format(
                    startDate,
                    'p'
                  )}`;
                }
                const endDate = new Date(popupEvent.end);
                const sameDay =
                  format(startDate, 'yyyy-MM-dd') ===
                  format(endDate, 'yyyy-MM-dd');
                if (sameDay) {
                  return `${format(startDate, 'EEEE, MMMM d')} \u2022 ${format(
                    startDate,
                    'p'
                  )} \u2013 ${format(endDate, 'p')}`;
                }
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
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsModal;
