import React from 'react';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

const Table = ({ 
  headers, 
  data, 
  renderRow, 
  emptyMessage = 'No data available',
  size = 'medium'
}) => {
  return (
    <TableContainer component={Paper}>
      <MuiTable size={size}>
        <TableHead>
          <TableRow>
            {headers.map((header, index) => (
              <TableCell key={index}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length > 0 ? (
            data.map((row, index) => renderRow(row, index))
          ) : (
            <TableRow>
              <TableCell colSpan={headers.length} align="center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
};

export default Table; 