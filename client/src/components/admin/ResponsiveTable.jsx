import React from 'react';
import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Divider,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components for responsive tables
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  overflow: 'auto',
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  '&::-webkit-scrollbar': {
    height: 8,
    width: 8,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
  },
  [theme.breakpoints.down('sm')]: {
    maxHeight: '60vh',
  },
  '@media (orientation: landscape) and (max-height: 600px)': {
    maxHeight: '35vh',
  },
  '@media (min-width: 1600px)': { // TV and large screens
    borderRadius: theme.shape.borderRadius * 1.5,
    '&::-webkit-scrollbar': {
      height: 12,
      width: 12,
    },
  }
}));

const StyledTableHeaderCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    fontSize: '0.8rem',
  },
  '@media (min-width: 1600px)': { // TV and large screens
    padding: theme.spacing(2),
    fontSize: '1.1rem',
  }
}));

const StyledTableBodyCell = styled(TableCell)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    fontSize: '0.8rem',
  },
  '@media (min-width: 1600px)': { // TV and large screens
    padding: theme.spacing(2),
    fontSize: '1rem',
  }
}));

// Responsive table component
const ResponsiveTable = ({ 
  columns, 
  data, 
  loading = false, 
  emptyMessage = 'No data available',
  maxHeight,
  stickyHeader = true,
  size = 'medium',
  onRowClick,
  selectedId,
  renderMobileCard
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTV = useMediaQuery('(min-width: 1600px)');
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 600px)');

  // If we're on mobile and a mobile card renderer was provided, use cards
  const shouldUseCards = (isMobile || isLandscape) && renderMobileCard;

  // If we're displaying a table
  if (!shouldUseCards) {
    return (
      <StyledTableContainer 
        component={Paper}
        sx={{ maxHeight: maxHeight }}
      >
        <Table 
          stickyHeader={stickyHeader} 
          size={isMobile || isLandscape ? 'small' : isTV ? 'medium' : size}
          sx={{ minWidth: 650 }}
        >
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <StyledTableHeaderCell 
                  key={index}
                  align={column.align || 'left'}
                  width={column.width}
                  sx={column.headerSx}
                >
                  {column.header}
                </StyledTableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <StyledTableBodyCell colSpan={columns.length} align="center">
                  Loading...
                </StyledTableBodyCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <StyledTableBodyCell colSpan={columns.length} align="center">
                  {emptyMessage}
                </StyledTableBodyCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex}
                  hover={!!onRowClick}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  selected={selectedId && row.id === selectedId}
                  sx={{
                    cursor: onRowClick ? 'pointer' : 'default',
                    '&.Mui-selected': {
                      backgroundColor: `${theme.palette.primary.light}20`, 
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: `${theme.palette.primary.light}30`, 
                    }
                  }}
                >
                  {columns.map((column, colIndex) => (
                    <StyledTableBodyCell 
                      key={colIndex}
                      align={column.align || 'left'}
                      sx={column.bodySx}
                    >
                      {column.render ? column.render(row) : row[column.field]}
                    </StyledTableBodyCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
    );
  }

  // Mobile card view
  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      {loading ? (
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            Loading...
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            {emptyMessage}
          </CardContent>
        </Card>
      ) : (
        data.map((row, index) => (
          <Card 
            key={index}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            sx={{
              cursor: onRowClick ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              backgroundColor: selectedId && row.id === selectedId ? `${theme.palette.primary.light}20` : 'white',
              '&:hover': {
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                transform: onRowClick ? 'translateY(-2px)' : 'none',
              }
            }}
          >
            {renderMobileCard(row)}
          </Card>
        ))
      )}
    </Stack>
  );
};

export default ResponsiveTable; 