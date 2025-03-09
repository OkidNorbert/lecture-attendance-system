import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { LocationOn } from '@mui/icons-material';

const AttendanceMap = ({ sessionLocation, attendees, radius }) => {
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Attendance Locations
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" color="primary">
              <LocationOn /> Session Location
            </Typography>
            <Typography>
              Latitude: {sessionLocation?.latitude}
              <br />
              Longitude: {sessionLocation?.longitude}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Attendee Check-in Locations:
          </Typography>
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {attendees
              .filter(a => a.location)
              .map((attendee, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: '1px solid #eee',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <Typography variant="body2">
                    <strong>{attendee.studentId.name}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lat: {attendee.location.latitude}
                    <br />
                    Long: {attendee.location.longitude}
                  </Typography>
                </Box>
              ))}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AttendanceMap; 