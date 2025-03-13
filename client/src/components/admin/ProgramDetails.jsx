import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const ProgramDetails = () => {
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchProgramDetails();
  }, [id]);

  const fetchProgramDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/programs/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProgram(response.data);
      fetchStatistics();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error fetching program details');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/admin/programs/${id}/statistics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStatistics(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleOpenDialog = async (type) => {
    setDialogType(type);
    setSelectedItems([]);
    
    try {
      const token = localStorage.getItem('token');
      let endpoint;
      switch (type) {
        case 'courses':
          endpoint = 'courses';
          break;
        case 'lecturers':
          endpoint = 'users?role=lecturer';
          break;
        case 'students':
          endpoint = 'users?role=student';
          break;
        default:
          return;
      }

      const response = await axios.get(`http://localhost:5000/api/admin/${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAvailableItems(response.data);
      setOpenDialog(true);
    } catch (err) {
      setError(err.response?.data?.msg || `Error fetching available ${type}`);
    }
  };

  const handleAssign = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/admin/programs/${id}/${dialogType}`,
        { [`${dialogType.slice(0, -1)}Ids`]: selectedItems },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      fetchProgramDetails();
      setOpenDialog(false);
    } catch (err) {
      setError(err.response?.data?.msg || `Error assigning ${dialogType}`);
    }
  };

  const handleUpdateStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/admin/programs/${id}/update-statistics`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      fetchStatistics();
    } catch (err) {
      setError(err.response?.data?.msg || 'Error updating statistics');
    }
  };

  if (loading && !program) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!program) {
    return <Typography>Program not found</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4">{program.name}</Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {program.code} - {program.facultyId?.name} - {program.departmentId?.name}
            </Typography>
            <Typography sx={{ mt: 2 }}>{program.description}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Program Statistics</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Total Students" 
                      secondary={statistics?.totalStudents || 0} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Total Lecturers" 
                      secondary={statistics?.totalLecturers || 0} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Total Courses" 
                      secondary={statistics?.totalCourses || 0} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Average GPA" 
                      secondary={statistics?.averageGPA?.toFixed(2) || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Graduation Rate" 
                      secondary={`${statistics?.graduationRate?.toFixed(1) || 0}%`} 
                    />
                  </ListItem>
                </List>
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={handleUpdateStatistics}
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  Update Statistics
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Courses" />
        <Tab label="Lecturers" />
        <Tab label="Students" />
      </Tabs>

      {/* Courses Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => handleOpenDialog('courses')}
          >
            Assign Courses
          </Button>
        </Box>
        <List>
          {program.courses?.map(course => (
            <ListItem key={course._id} divider>
              <ListItemText
                primary={course.name}
                secondary={`${course.code} - ${course.credits} credits`}
              />
              <Chip label={`${course.credits} credits`} sx={{ mr: 1 }} />
            </ListItem>
          ))}
        </List>
      </TabPanel>

      {/* Lecturers Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => handleOpenDialog('lecturers')}
          >
            Assign Lecturers
          </Button>
        </Box>
        <List>
          {program.lecturers?.map(lecturer => (
            <ListItem key={lecturer._id} divider>
              <ListItemText
                primary={lecturer.name}
                secondary={lecturer.email}
              />
            </ListItem>
          ))}
        </List>
      </TabPanel>

      {/* Students Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => handleOpenDialog('students')}
          >
            Enroll Students
          </Button>
        </Box>
        <List>
          {program.students?.map(student => (
            <ListItem key={student._id} divider>
              <ListItemText
                primary={student.name}
                secondary={student.email}
              />
            </ListItem>
          ))}
        </List>
      </TabPanel>

      {/* Assignment Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {`Assign ${dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}`}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select {dialogType}</InputLabel>
            <Select
              multiple
              value={selectedItems}
              onChange={(e) => setSelectedItems(e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={availableItems.find(item => item._id === value)?.name}
                    />
                  ))}
                </Box>
              )}
            >
              {availableItems.map((item) => (
                <MenuItem key={item._id} value={item._id}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAssign} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default ProgramDetails; 